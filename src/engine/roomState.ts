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
      for (const fn of this.listeners) fn(change);
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

    const objs = room.objects.map((id) => "  " + (this.objects[id]?.name ?? id.toLowerCase()));

    const lines: string[] = [];
    lines.push(`── ${room.name} ──`);
    lines.push("");
    lines.push("EXITS:");
    lines.push(exits.length ? exits.join("\n") : "  (none obvious)");
    lines.push("");
    lines.push("YOU MIGHT SEE HERE:");
    lines.push(objs.length ? objs.join("\n") : "  (nothing notable)");
    lines.push("");
    lines.push("USEFUL COMMANDS:");
    lines.push("  look (l), examine <thing>, search");
    lines.push("  take <thing>, drop <thing>, inventory (i)");
    lines.push("  open / close <thing>, read <thing>");
    lines.push("  turn on / off <thing>, move <thing>");
    lines.push("  attack <foe> with <weapon>");
    lines.push("  save, restore, score, again (g)");
    lines.push("");
    lines.push("(type a direction to travel. HELP is a guide — it doesn't take a turn.)");
    return lines.join("\n");
  }

  private resolveContents(objNum: number): string[] {
    // Map live child object numbers to ZIL ids where we can (by static room data).
    // Without a number→id map for props we fall back to the room's static objects.
    const room = this.currentId ? this.rooms[this.currentId] : null;
    return room ? room.objects.slice() : [];
  }
}
