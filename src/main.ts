import "./style.css";
import { bootZork } from "./engine/zvm.ts";
import { RoomState } from "./engine/roomState.ts";
import { Viewport } from "./render/viewport.ts";
import { Compass } from "./ui/compass.ts";
import { startTitleScene } from "./ui/titleScene.ts";
import { Scene2D } from "./ui/scene2d.ts";
import { getRoomScene, darknessScene, roomState, setRoomFlag, flashThief } from "./ui/roomScenes.ts";
import { ambience } from "./audio/ambience.ts";
import { GameMap } from "./ui/map.ts";

const output = document.getElementById("output") as HTMLElement;
const input = document.getElementById("input") as HTMLInputElement;
const canvas = document.getElementById("gl") as HTMLCanvasElement;

// --- Multiple players: each save slot keeps its own game + map in localStorage.
// Player "1" keeps the legacy (unslotted) keys so existing saves are preserved.
const SLOT = localStorage.getItem("zork1:slot") || "1";
const SAVE_KEY = SLOT === "1" ? "zork1:quetzal" : `zork1:quetzal:${SLOT}`;
const MAP_KEY = SLOT === "1" ? "zork1:map" : `zork1:map:${SLOT}`;
function buildPlayers() {
  const host = document.getElementById("players"); if (!host) return;
  const slots: string[] = JSON.parse(localStorage.getItem("zork1:slots") || '["1"]');
  host.innerHTML = `<span class="pl-label">PLAYER</span>`;
  for (const s of slots) {
    const b = document.createElement("button");
    b.className = "pl-btn" + (s === SLOT ? " on" : ""); b.textContent = s;
    b.onclick = () => { if (s !== SLOT) { localStorage.setItem("zork1:slot", s); location.reload(); } };
    host.appendChild(b);
  }
  const add = document.createElement("button");
  add.className = "pl-btn pl-add"; add.textContent = "+"; add.title = "new player";
  add.onclick = () => {
    const next = String(Math.max(0, ...slots.map(Number)) + 1);
    slots.push(next); localStorage.setItem("zork1:slots", JSON.stringify(slots));
    localStorage.setItem("zork1:slot", next); location.reload();
  };
  host.appendChild(add);
  // ambient sound toggle — ON by default (any first gesture unlocks the audio)
  const snd = document.createElement("button");
  const SND_KEY = SLOT === "1" ? "zork1:sound" : `zork1:sound:${SLOT}`;
  const on = localStorage.getItem(SND_KEY) !== "0";
  snd.className = "pl-btn pl-snd" + (on ? " on" : ""); snd.title = "ambient sound";
  const paint = (v: boolean) => { snd.classList.toggle("on", v); snd.textContent = v ? "♪ ON" : "♪ OFF"; };
  paint(on);
  snd.onclick = () => {
    const now = !ambience.enabled;
    ambience.toggle(now); paint(now);
    try { localStorage.setItem(SND_KEY, now ? "1" : "0"); } catch { /* quota */ }
  };
  host.appendChild(snd);
  if (on) { // arm on the first gesture of the session (browser autoplay rules)
    const arm = () => { ambience.toggle(true); paint(true); window.removeEventListener("pointerdown", arm); window.removeEventListener("keydown", arm); };
    window.addEventListener("pointerdown", arm); window.addEventListener("keydown", arm);
  }
}
buildPlayers();

// The viewport/compass come up immediately behind the welcome screen; the actual
// Z-machine does NOT boot until the player presses ENTER on the title — so the
// game never auto-starts.
const viewport = new Viewport(canvas);
const scene2d = new Scene2D(document.getElementById("scene2d") as HTMLCanvasElement);
const compass = new Compass(document.getElementById("viewport") as HTMLElement);
const rooms = new RoomState();
const roomsLoaded = rooms.load();

let latestStatus = "";
let gameRef: any = null;
let gameMap: GameMap | null = null;
// Darkness is read authoritatively from what the game actually prints (the
// interpreter's own light check), not a fragile attribute heuristic.
let darkNow = false;
let lastOutLen = 0;
// Per-room interactive states, persisted per player (survives death/restart).
const ROOMS_KEY = SLOT === "1" ? "zork1:rooms" : `zork1:rooms:${SLOT}`;
try { const saved = JSON.parse(localStorage.getItem(ROOMS_KEY) || "{}"); for (const r in saved) for (const k in saved[r]) setRoomFlag(r, k, saved[r][k]); } catch { /* ignore */ }
let lastCmd = "";

// Read what the player just did and update the relevant ROOM's state, so its
// scene reflects it. Returns true if anything changed (to trigger a re-render).
function detectInteractions(cmd: string, fresh: string): boolean {
  if (!cmd) return false;
  const ok = !/\b(can't|cannot|closed|won't|isn't|don't|nothing|no\b)/i.test(fresh);
  const here = currentRoom?.id as string | undefined;
  const was = JSON.stringify(roomState);
  // LIVING-ROOM: rug / trap door / trophy case / treasures
  if (/^(?:move|push|lift|slide)\s+(?:the\s+)?(?:oriental\s+)?rug\b/.test(cmd) && /trap\s*door|moved|reveal/i.test(fresh)) setRoomFlag("LIVING-ROOM", "rugMoved", true);
  if (/^open\s+(?:the\s+)?trap\s*door\b/.test(cmd) && ok) setRoomFlag("LIVING-ROOM", "trapOpen", true);
  if (/^close\s+(?:the\s+)?trap\s*door\b/.test(cmd)) setRoomFlag("LIVING-ROOM", "trapOpen", false);
  if (/^open\s+(?:the\s+)?(?:trophy\s+)?case\b/.test(cmd) && /open/i.test(fresh)) setRoomFlag("LIVING-ROOM", "caseOpen", true);
  if (/^close\s+(?:the\s+)?(?:trophy\s+)?case\b/.test(cmd)) setRoomFlag("LIVING-ROOM", "caseOpen", false);
  const pm = cmd.match(/^(?:put|place)\s+(.+?)\s+(?:in|into)\s+(?:the\s+)?(?:trophy\s+)?case\b/);
  if (pm && /\bdone\b/i.test(fresh) && ok) { const tn = pm[1].replace(/^(?:the|a|an)\s+/, "").trim(); const tr = roomState["LIVING-ROOM"].treasures as string[]; if (tn && !tr.includes(tn)) tr.push(tn); }
  // WEST-OF-HOUSE: mailbox
  if (/^open\s+(?:the\s+)?(?:small\s+)?mailbox\b/.test(cmd) && /open/i.test(fresh)) setRoomFlag("WEST-OF-HOUSE", "mailboxOpen", true);
  if (/^close\s+(?:the\s+)?mailbox\b/.test(cmd)) setRoomFlag("WEST-OF-HOUSE", "mailboxOpen", false);
  // window — belongs to whichever room you're in (Kitchen or Behind House)
  if (here && /^open\s+(?:the\s+)?window\b/.test(cmd) && /open|allow entry/i.test(fresh)) setRoomFlag(here, "windowOpen", true);
  if (here && /^close\s+(?:the\s+)?window\b/.test(cmd)) setRoomFlag(here, "windowOpen", false);
  // CYCLOPS-ROOM / TROLL-ROOM / GRATING-ROOM / DAM-ROOM (driven by the output)
  if (/cyclops/i.test(fresh) && /(flee|runs|run from|crashes|breaks?\s+(?:down\s+)?(?:through|the wall)|rush)/i.test(fresh)) setRoomFlag("CYCLOPS-ROOM", "cyclopsGone", true);
  if (/troll/i.test(fresh) && /(dies|is dead|expire|slain|breathes his|disappear|defeated|killed)/i.test(fresh)) setRoomFlag("TROLL-ROOM", "trollDead", true);
  if (/grating/i.test(fresh) && /(opens|is open|swings? (?:up|open))/i.test(fresh)) setRoomFlag("GRATING-ROOM", "gratingOpen", true);
  if (/^close\s+(?:the\s+)?grating\b/.test(cmd)) setRoomFlag("GRATING-ROOM", "gratingOpen", false);
  if (/sluice gates open|gates open and water/i.test(fresh)) setRoomFlag("DAM-ROOM", "gatesOpen", true);
  if (/sluice gates? (?:close|are closed)|gates close/i.test(fresh)) setRoomFlag("DAM-ROOM", "gatesOpen", false);
  // EGYPT-ROOM: the gold coffin
  if (/^open\s+(?:the\s+)?(?:gold(?:en)?\s+)?coffin\b/.test(cmd) && /open/i.test(fresh)) setRoomFlag("EGYPT-ROOM", "coffinOpen", true);
  if (/^close\s+(?:the\s+)?coffin\b/.test(cmd)) setRoomFlag("EGYPT-ROOM", "coffinOpen", false);
  // RESERVOIR: drains when the dam gates are open (the water level falls)
  if (/water level/i.test(fresh) && /(fall|drop|lower|empty|recede)/i.test(fresh)) setRoomFlag("RESERVOIR", "drained", true);
  if ((/water level/i.test(fresh) && /(ris|fill)/i.test(fresh)) || /reservoir.*(fills|full again)/i.test(fresh)) setRoomFlag("RESERVOIR", "drained", false);
  // MIRROR rooms: break the mirror (in whichever mirror room you're in)
  if (here && /MIRROR-ROOM/.test(here) && /^(?:break|smash|hit|strike)\s+(?:the\s+)?mirror\b/.test(cmd) && /(shatter|breaks|smash|pieces|fragment)/i.test(fresh)) setRoomFlag(here, "broken", true);
  // DOME-ROOM: tie the rope to the railing
  if (/^tie\s+(?:the\s+)?rope\s+to\s+(?:the\s+)?railing\b/.test(cmd) && /(tie|attach|fasten|drop|secure)/i.test(fresh)) setRoomFlag("DOME-ROOM", "ropeTied", true);
  // GRATING-CLEARING: rake the leaves off the grating
  if (/^(?:move|push|rake)\s+(?:the\s+)?(?:pile of\s+)?leaves\b/.test(cmd) && /(grating|reveal|move)/i.test(fresh)) setRoomFlag("GRATING-CLEARING", "leavesMoved", true);
  // ENTRANCE-TO-HADES: exorcise the spirits
  if (/(spirits|ghosts)/i.test(fresh) && /(flee|scatter|banish|depart|vanish|recoil|driven|exorc)/i.test(fresh)) setRoomFlag("ENTRANCE-TO-HADES", "spiritsGone", true);
  // TORCH-ROOM: take the torch off its pedestal
  if (here === "TORCH-ROOM" && /^(?:take|get|grab|pick up)\s+(?:the\s+)?torch\b/.test(cmd) && /taken/i.test(fresh)) setRoomFlag("TORCH-ROOM", "torchTaken", true);
  if (here === "TORCH-ROOM" && /^(?:drop|put)\s+(?:down\s+)?(?:the\s+)?torch\b/.test(cmd)) setRoomFlag("TORCH-ROOM", "torchTaken", false);
  // SANDY-CAVE: dig in the sand (with the shovel) to uncover the scarab
  if (here === "SANDY-CAVE" && /^dig\b/.test(cmd) && /(scarab|hole|uncover|reveal|sand)/i.test(fresh)) setRoomFlag("SANDY-CAVE", "dug", true);
  // LOUD-ROOM: say "echo" to fix the deafening acoustics
  if (here === "LOUD-ROOM" && /^echo\b/.test(cmd) && /(acoustic|echo|change|silent|stops?)/i.test(fresh)) setRoomFlag("LOUD-ROOM", "echoFixed", true);
  // SHAFT-ROOM / LOWER-SHAFT: lower or raise the basket on the chain
  if (/^lower\s+(?:the\s+)?basket\b/.test(cmd) && ok) setRoomFlag("SHAFT-ROOM", "basketLowered", true);
  if (/^raise\s+(?:the\s+)?basket\b/.test(cmd) && ok) setRoomFlag("SHAFT-ROOM", "basketLowered", false);
  // CYCLOPS: fed and watered, he falls asleep (fleeing through the wall overrides)
  if (/cyclops/i.test(fresh) && /(asleep|falls? .*sleep|slumber|snor)/i.test(fresh)) setRoomFlag("CYCLOPS-ROOM", "cyclopsAsleep", true);
  if (/cyclops/i.test(fresh) && /(wakes|awakens|yawns and stares)/i.test(fresh)) setRoomFlag("CYCLOPS-ROOM", "cyclopsAsleep", false);
  // THE SCEPTRE: waved, the rainbow becomes solid (all three rainbow rooms read this key)
  if (/rainbow.*(solid|walkable)/i.test(fresh)) setRoomFlag("END-OF-RAINBOW", "rainbowSolid", true);
  if (/rainbow.*(run-of-the-mill|shimmer|insubstantial)/i.test(fresh)) setRoomFlag("END-OF-RAINBOW", "rainbowSolid", false);
  // THE MAGIC BOAT: pumped up at the dam base
  if (/(boat|plastic).*inflate|inflates|seaworthy/i.test(fresh) && /^(?:inflate|pump)/.test(cmd)) setRoomFlag("DAM-BASE", "boatInflated", true);
  if (/^deflate/.test(cmd) && /deflate/i.test(fresh)) setRoomFlag("DAM-BASE", "boatInflated", false);
  // THE THIEF: when he wanders through and robs you, show him striding through the room
  if (/seedy-looking individual|abstracted some valuables|(?:thief|individual).*(?:wandered|wanders) through|just wandered through the room/i.test(fresh)) flashThief();
  const changed = was !== JSON.stringify(roomState);
  if (changed) try { localStorage.setItem(ROOMS_KEY, JSON.stringify(roomState)); } catch { /* quota */ }
  return changed;
}

function autosave() {
  if (!gameRef) return;
  try {
    const buf = gameRef.vm.save_file(gameRef.vm.pc, 1);
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    localStorage.setItem(SAVE_KEY, JSON.stringify(Array.from(u8)));
  } catch (e) {
    console.warn("autosave failed", e);
  }
}

let currentRoom: any = null;
let shownDark = false;
// Pick what to render for a room: true darkness if unlit (grue territory), else a
// hand-composed pixel scene, else the 3D viewport.
function applyScene(room: any, enteredFrom?: string) {
  const scene = getRoomScene(room, rooms.objects);
  if (darkNow) scene2d.show(darknessScene);
  else if (scene) scene2d.show(scene);
  else { scene2d.hide(); viewport.showRoom(room, enteredFrom); }
  shownDark = darkNow;
}

// A spoiler-light "what next?" nudge based on how far the player has gotten
// (which key rooms they've reached). Triggered by the hint/clue command.
function nextClue(): string {
  const v = gameMap ? gameMap.visited() : new Set<string>();
  const has = (id: string) => v.has(id);
  const reachedSide = has("EAST-OF-HOUSE") || has("NORTH-OF-HOUSE") || has("SOUTH-OF-HOUSE");
  const steps: [boolean, string][] = [
    [!reachedSide && !has("KITCHEN"), "Open the mailbox and read the leaflet. The front door is boarded — walk around the house (north or south) to look for another way in."],
    [reachedSide && !has("KITCHEN"), "Go behind the house (to the east). The small window there is slightly ajar — OPEN WINDOW, then go WEST to climb inside."],
    [has("KITCHEN") && !has("LIVING-ROOM"), "From the kitchen, go WEST into the living room."],
    [has("LIVING-ROOM") && !has("CELLAR"), "In the living room: TAKE LANTERN and TAKE SWORD, MOVE the RUG to uncover a trap door, OPEN the TRAP DOOR, TURN ON the LANTERN, then go DOWN."],
    [has("CELLAR") && !has("TROLL-ROOM"), "Keep the lamp lit and press on. A troll blocks the way ahead — be ready to ATTACK TROLL WITH SWORD."],
    [has("TROLL-ROOM"), "Your quest: find the 19 treasures of the Great Underground Empire and put each in the TROPHY CASE in the living room. Explore with the lamp lit, beware the thief and the lurking grue, and use the map to find unexplored exits."],
  ];
  for (const [cond, msg] of steps) if (cond) return "CLUE: " + msg;
  return "CLUE: Explore carefully with your lamp lit, gather treasures, and bring them back to the trophy case. Check the map for exits you haven't taken yet.";
}

rooms.onChange((change) => {
  compass.update(change.room);
  gameMap?.discover(change);
  currentRoom = change.room;
  // record the room's real contents so scenes stop drawing props the player took
  setRoomFlag(change.room.id, "objects", (change.contents ?? []) as unknown as string[]);
  try { localStorage.setItem(ROOMS_KEY, JSON.stringify(roomState)); } catch { /* quota */ }
  ambience.setFlags(roomState); ambience.setRoom(change.room.id, darkNow);
  applyScene(change.room, change.enteredFrom);
});

async function startGame() {
  await roomsLoaded;
  gameMap = new GameMap(
    document.getElementById("mapPanel") as HTMLElement,
    rooms.rooms,
    rooms.objects,
    MAP_KEY,
  );
  (window as any).__map = gameMap; // Dev: inspect layout/nodes from the console

  const game = await bootZork({
    storyUrl: "./zork1.z3",
    output,
    input,
    hooks: {
      onStatus(left) {
        latestStatus = left;
      },
      intercept(line, print) {
        const cmd = line.trim().toLowerCase();
        if (cmd === "help" || cmd === "?" || cmd === "commands" || cmd === "exits") {
          print(rooms.helpText());
          return true;
        }
        if (cmd === "hint" || cmd === "clue" || cmd === "hints" || cmd === "clues") {
          print(nextClue());
          return true;
        }
        return false;
      },
      onCommand(line) {
        rooms.noteCommand(line);
        viewport.pulse(1);
        lastCmd = line.trim().toLowerCase();
      },
      onInputReady() {
        // Read this turn's fresh output; the game prints "pitch black / grue" when
        // the current room is unlit. This is the authoritative darkness signal.
        const txt = output.textContent || "";
        if (lastOutLen > txt.length) lastOutLen = 0; // output was cleared/trimmed
        const fresh = txt.slice(lastOutLen);
        lastOutLen = txt.length;
        if (fresh.trim()) darkNow = /pitch black|eaten by a grue|pitch dark|it is dark/i.test(fresh);
        const interacted = detectInteractions(lastCmd, fresh);
        rooms.update(latestStatus);
        // Re-render if light/dark flipped or an interactive element changed,
        // without a room change (onChange only fires when the room changes).
        if (currentRoom && (darkNow !== shownDark || interacted)) {
          ambience.setFlags(roomState); ambience.setRoom(currentRoom.id, darkNow);
          applyScene(currentRoom);
        }
        autosave();
      },
    },
  });

  gameRef = game;
  rooms.attach(game.vm);

  // Restore a saved game, if present.
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const u8 = Uint8Array.from(JSON.parse(saved));
      if (game.vm.restore_file(u8, 1)) {
        output.replaceChildren();
        lastOutLen = 0; // output was cleared — keep the darkness slice in sync
        // Silently re-render the current room. This injected "look" must NOT echo
        // into the transcript (the player didn't type it) — submitSilent skips the
        // echo. Fallback to a visible submit only if the engine isn't ready yet.
        if (!game.glkote.submitSilent("look")) {
          input.value = "look";
          input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        }
      }
    } catch (e) {
      console.warn("restore failed", e);
      localStorage.removeItem(SAVE_KEY);
    }
  }

  setTimeout(() => rooms.update(latestStatus), 0);
  (window as any).__zork = { viewport, rooms, game };
  // Dev: force-render any room's scene by id (for screenshot-verifying deep rooms
  // without having to reach them in-game). e.g. __scene("TROLL-ROOM")
  (window as any).__scene = (id: string) => {
    const room = rooms.rooms[id];
    if (!room) { console.warn("no such room:", id); return; }
    darkNow = false;
    const s = getRoomScene(room, rooms.objects);
    if (s) scene2d.show(s); else scene2d.hide();
  };
  (window as any).__thief = () => flashThief(); // Dev: trigger the thief's pass-through overlay
  (window as any).__flag = setRoomFlag; // Dev: toggle room flags to verify both scene states
  (window as any).__mood = (id: string, dark = false) => { ambience.setFlags(roomState); ambience.setRoom(id, dark); }; // Dev: audition a room's soundscape
}

// --- Title screen: only a REAL Enter/click begins the game -----------------
const welcome = document.getElementById("welcome");
const titleCanvas = document.getElementById("welcome-canvas") as HTMLCanvasElement | null;
const stopTitle = titleCanvas ? startTitleScene(titleCanvas) : () => {};
let begun = false;
function begin() {
  if (begun) return;
  begun = true;
  stopTitle();
  welcome?.classList.add("hidden");
  setTimeout(() => welcome?.remove(), 1100);
  input.focus();
  startGame().catch((err) => {
    console.error(err);
    output.appendChild(document.createTextNode("\n[boot error] " + err.message));
  });
}

window.addEventListener("keydown", (e) => {
  // isTrusted guards against synthetic events (e.g. the restore "look") starting it.
  if (!begun && e.isTrusted && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    begin();
  }
});
welcome?.addEventListener("click", begin);

document.addEventListener("click", () => {
  if (begun) input.focus();
});

if (!welcome) begin(); // no title screen present — start directly
