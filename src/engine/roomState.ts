/*
 * roomState.ts — owns the parsed world (rooms.json / objects.json) and resolves
 * the live game's current room to a specific ZIL room id.
 *
 * Resolution strategy (robust against same-named rooms like the forests/mazes):
 *   1. Stable identity = the room object number from global 16. Cache id by number.
 *   2. First sighting of a number: resolve by following the exit graph from the
 *      previous room in the direction the player moved (exact), falling back to
 *      unique status-line name match, then to any same-named room.
 */
import { Introspector } from "./introspect.ts";

export interface Exit {
  dir: string;
  kind: "normal" | "conditional" | "blocked" | "routine";
  to?: string;
  cond?: string;
  state?: string;
  msg?: string;
  elseMsg?: string;
  per?: string;
}

export interface Room {
  id: string;
  name: string;
  exits: Record<string, Exit>;
  globals: string[];
  flags: string[];
  objects: string[];
  region: string;
  dark: boolean;
  value?: number;
  ldesc?: string;
  action?: string;
}

export interface GameObject {
  id: string;
  name: string;
  flags: string[];
  in?: string;
  fdesc?: string;
  synonyms?: string[];
}

export interface RoomChange {
  room: Room;
  objNum: number;
  isDark: boolean;
  /** ZIL ids of objects currently visible in the room (best-effort). */
  contents: string[];
  /** Direction the player moved to get here, if known. */
  enteredFrom?: string;
}

const DIR_WORDS: Record<string, string> = {
  n: "NORTH", north: "NORTH",
  s: "SOUTH", south: "SOUTH",
  e: "EAST", east: "EAST",
  w: "WEST", west: "WEST",
  ne: "NE", northeast: "NE",
  nw: "NW", northwest: "NW",
  se: "SE", southeast: "SE",
  sw: "SW", southwest: "SW",
  u: "UP", up: "UP",
  d: "DOWN", down: "DOWN",
  in: "IN", enter: "IN", inside: "IN",
  out: "OUT", exit: "OUT", outside: "OUT",
};

export function parseDirection(command: string): string | undefined {
  const words = command.trim().toLowerCase().split(/\s+/);
  for (const w of words) {
    if (DIR_WORDS[w]) return DIR_WORDS[w];
  }
  // "go north", "walk to the east" handled by the loop above.
  return undefined;
}

export class RoomState {
  rooms: Record<string, Room> = {};
  objects: Record<string, GameObject> = {};
  private byName: Map<string, string[]> = new Map();
  private numToId = new Map<number, string>();
  private listeners: ((c: RoomChange) => void)[] = [];

  currentId: string | null = null;
  private lastDir: string | undefined;
  private lastContents = "";
  private intro: Introspector | null = null;

  async load() {
    const [rooms, objects] = await Promise.all([
      fetch("./rooms.json").then((r) => r.json()),
      fetch("./objects.json").then((r) => r.json()),
    ]);
    this.rooms = rooms;
    this.objects = objects;
    for (const room of Object.values(this.rooms) as Room[]) {
      const key = room.name.toLowerCase();
      if (!this.byName.has(key)) this.byName.set(key, []);
      this.byName.get(key)!.push(room.id);
    }
  }

  attach(vm: any) {
    this.intro = new Introspector(vm);
  }

  onChange(fn: (c: RoomChange) => void) {
    this.listeners.push(fn);
  }

  /** Record the player's command so we can read its movement direction. */
  noteCommand(command: string) {
    this.lastDir = parseDirection(command);
  }

  /** Called once the turn settles; reads memory and emits a change if moved. */
  update(statusName: string) {
    if (!this.intro) return;
    const objNum = this.intro.currentRoom();
    if (!objNum) return;

    const id = this.resolve(objNum, statusName);
    if (!id) return;

    if (id !== this.currentId) {
      const prev = this.currentId;
      this.currentId = id;
      const room = this.rooms[id];
      const change: RoomChange = {
        room,
        objNum,
        isDark: this.computeDark(room),
        contents: this.resolveContents(objNum),
        enteredFrom: prev ? this.lastDir : undefined,
      };
      this.lastContents = change.contents.join("|");
      for (const fn of this.listeners) fn(change);
    } else {
      // Same room, but the turn may have moved things (take, drop, the thief).
      const room = this.rooms[id];
      const contents = this.resolveContents(objNum);
      const key = contents.join("|");
      if (room && key !== this.lastContents) {
        this.lastContents = key;
        const change: RoomChange = { room, objNum, isDark: this.computeDark(room), contents };
        for (const fn of this.listeners) fn(change);
      }
    }
    this.lastDir = undefined;
  }

  private resolve(objNum: number, statusName: string): string | null {
    const cached = this.numToId.get(objNum);
    if (cached) return cached;

    const name = (statusName || "").toLowerCase().trim();
    let chosen: string | null = null;

    // 1) Exact: follow the exit graph from the previous room.
    if (this.currentId && this.lastDir) {
      const exit = this.rooms[this.currentId].exits[this.lastDir];
      if (exit?.to && this.rooms[exit.to]) {
        const target = this.rooms[exit.to];
        if (!name || target.name.toLowerCase() === name) chosen = target.id;
      }
    }

    // 2) Unique name match.
    if (!chosen && name && this.byName.has(name)) {
      const ids = this.byName.get(name)!;
      if (ids.length === 1) chosen = ids[0];
      else {
        // Prefer a same-named room adjacent to the current one.
        const adj = ids.find(
          (rid) =>
            this.currentId &&
            Object.values(this.rooms[this.currentId].exits).some((e) => e.to === rid)
        );
        chosen = adj ?? ids[0];
      }
    }

    if (chosen) this.numToId.set(objNum, chosen);
    return chosen;
  }

  private computeDark(room: Room): boolean {
    if (!this.intro) return room.dark;
    // Lit if the room object has the lit attribute, or a lit object is carried.
    // The room object's "ONBIT" is reflected in rooms.json; for carried light we
    // check the live tree for any object flagged as a light source that's on.
    if (!room.dark) return false;
    // Look for a lit light source anywhere the player can see (carried/in room).
    // Heuristic: any object with ONBIT among room contents or player inventory.
    return !this.hasActiveLight(room);
  }

  private hasActiveLight(room: Room): boolean {
    if (!this.intro) return false;
    const objNum = this.intro.currentRoom();
    // Scan the room subtree for a lit object (attribute ONBIT ~ bit varies by game;
    // we approximate using the lamp/torch being present and on). Conservative:
    // treat presence of an on-flagged object as light. Exact bit handled later.
    const here = this.intro.childrenOf(objNum);
    // Player object is among room contents in Zork (ADVENTURER); include its items.
    let lit = false;
    for (const c of here) {
      // attribute 20 is commonly ONBIT in Zork v3 builds; cheap check both ways.
      if (this.intro.hasAttr(c, 20) || this.intro.hasAttr(c, 7)) lit = true;
      for (const cc of this.intro.childrenOf(c)) {
        if (this.intro.hasAttr(cc, 20) || this.intro.hasAttr(cc, 7)) lit = true;
      }
    }
    return lit;
  }

  /** Augmented help for the current room: real exits, visible objects, verbs. */
  helpText(): string {
    const room = this.currentId ? this.rooms[this.currentId] : null;
    if (!room) return "No location yet — type LOOK to begin.";

    const order = [
      "NORTH", "SOUTH", "EAST", "WEST",
      "NE", "NW", "SE", "SW",
      "UP", "DOWN", "IN", "OUT",
    ];
    const abbr: Record<string, string> = {
      NORTH: "n", SOUTH: "s", EAST: "e", WEST: "w",
      NE: "ne", NW: "nw", SE: "se", SW: "sw",
      UP: "u", DOWN: "d", IN: "in", OUT: "out",
    };
    const exits: string[] = [];
    for (const d of order) {
      const e = room.exits[d];
      if (!e || e.kind === "blocked") continue;
      const note = e.kind === "conditional" ? " (sometimes)" : "";
      exits.push(`  ${d.toLowerCase()} (${abbr[d]})${note}`);
    }

    // Room contents are deliberately not listed — finding what a place holds
    // is the game. The clue command is the sanctioned nudge.
    const lines: string[] = [];
    lines.push(`── ${room.name} ──`);
    lines.push("");
    lines.push("EXITS:");
    lines.push(exits.length ? exits.join("\n") : "  (none obvious)");
    lines.push("");
    lines.push("USEFUL COMMANDS:");
    lines.push("  LOOKING    look (l), examine (x) <thing>, look in/under <thing>,");
    lines.push("             search <thing>, read <thing>");
    lines.push("  CARRYING   take <thing>, take all, drop <thing>, inventory (i),");
    lines.push("             put <thing> in/on <thing>, give <thing> to <someone>");
    lines.push("  DOING      open / close, lock / unlock <thing> with <key>,");
    lines.push("             move / push / lift <thing>, tie <rope> to <thing>,");
    lines.push("             turn on / off <lamp>, light <thing> with <match>,");
    lines.push("             dig with <shovel>, inflate <thing> with <pump>,");
    lines.push("             wave / touch / rub / ring / wind / knock / pray");
    lines.push("  FIGHTING   attack <foe> with <weapon>, throw <thing> at <foe>");
    lines.push("  BODY       eat / drink <thing>, smell, listen, wait (z), diagnose");
    lines.push("  GAME       save, restore, restart, score, again (g),");
    lines.push("             verbose / brief (how much rooms re-describe)");
    lines.push("  GUIDES     help (?) — this screen");
    lines.push("             hint / clue — a nudge for THIS room: every treasure");
    lines.push("             room and tough puzzle has its own clue");
    lines.push("");
    lines.push("(type a direction to travel. HELP and CLUE are guides — they don't take a turn.)");
    return lines.join("\n");
  }

  // Short-name → ZIL id, built once from objects.json (unique names only).
  private nameToId: Map<string, string> | null = null;
  private buildNameMap(): Map<string, string> {
    if (this.nameToId) return this.nameToId;
    const m = new Map<string, string>(), dup = new Set<string>();
    for (const o of Object.values(this.objects) as GameObject[]) {
      const k = o.name.toLowerCase();
      if (dup.has(k)) continue;
      if (m.has(k)) { m.delete(k); dup.add(k); } // ambiguous ("basket", "mirror") — skip
      else m.set(k, o.id);
    }
    m.set("tube", "TUBE"); // present in the game but absent from objects.json
    this.nameToId = m;
    return m;
  }

  private resolveContents(objNum: number): string[] {
    // Walk the LIVE object tree (room + everything nested in containers/surfaces)
    // and map each object's decoded short name to its ZIL id. This is what makes
    // scenes track reality: the sack ON the kitchen table is a grandchild of the
    // room, and taken/stolen items drop out of the tree.
    const room = this.currentId ? this.rooms[this.currentId] : null;
    const staticList = room ? room.objects.slice() : [];
    if (!this.intro) return staticList;
    try {
      const names = this.buildNameMap();
      const ids: string[] = [];
      const intro = this.intro;
      const walk = (num: number, depth: number) => {
        for (const n of intro.childrenOf(num)) {
          const short = intro.shortName(n).toLowerCase();
          if (short === "cretin" || short === "adventurer" || short === "you") continue; // the player + inventory is not room dressing
          const id = names.get(short);
          if (id && !ids.includes(id)) ids.push(id);
          if (depth > 0 && ids.length < 64) walk(n, depth - 1);
        }
      };
      walk(objNum, 3);
      // Fixed scenery (tables, doors, the mailbox…) stays from the static list;
      // anything TAKEBIT must earn its place from the live tree, so taken and
      // stolen items actually vanish from the scene.
      for (const s of staticList) {
        const takeable = this.objects[s]?.flags?.includes("TAKEBIT");
        if (!takeable && !ids.includes(s)) ids.push(s);
      }
      return ids;
    } catch {
      return staticList; // memory layout surprise — never blank the scene over it
    }
  }
}
