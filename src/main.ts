import "./style.css";
import { bootZork } from "./engine/zvm.ts";
import { RoomState } from "./engine/roomState.ts";
import { Compass } from "./ui/compass.ts";
import { startTitleScene } from "./ui/titleScene.ts";
import { Scene2D } from "./ui/scene2d.ts";
import { getRoomScene, darknessScene, roomState, setRoomFlag, flashThief, sceneIds } from "./ui/roomScenes.ts";
import { ambience } from "./audio/ambience.ts";
import { GameMap } from "./ui/map.ts";
import { applyTriggers } from "./game/triggers.ts";
import { nextClue } from "./game/clues.ts";
import { SAVE_KEY, MAP_KEY, ROOMS_KEY, buildPlayers, setScoreTooltip } from "./game/players.ts";

const output = document.getElementById("output") as HTMLElement;
const input = document.getElementById("input") as HTMLInputElement;

// PWA: once loaded, the whole game plays offline (it's all client-side anyway)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => { /* offline is a bonus, not a requirement */ });
}

buildPlayers();

// The scene/compass come up immediately behind the welcome screen; the actual
// Z-machine does NOT boot until the player presses ENTER on the title — so the
// game never auto-starts.
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
try { const saved = JSON.parse(localStorage.getItem(ROOMS_KEY) || "{}"); for (const r in saved) for (const k in saved[r]) setRoomFlag(r, k, saved[r][k]); } catch { /* ignore */ }
let lastCmd = "";

// Read what the player just did and update the relevant ROOM's state, so its
// scene reflects it. Returns true if anything changed (to trigger a re-render).
// The interaction wiring lives in src/game/triggers.ts as a declarative table;
// this wrapper adds the current room and persists any change.
function detectInteractions(cmd: string, fresh: string): boolean {
  const changed = applyTriggers(cmd, fresh, currentRoom?.id as string | undefined);
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

// Tap-to-move: the compass and the map's exit list dispatch zork-go — submit it
// through the real input so the engine (and the transcript) see a normal command.
window.addEventListener("zork-go", (e) => {
  const dir = (e as CustomEvent).detail;
  if (!gameRef || typeof dir !== "string") return;
  input.value = dir;
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
});

// The game's two biggest beats get a full-screen CRT moment instead of
// scrolling by in green: "**** You have died ****" and the 350-point win.
let momentShown = 0;
function bigMoment(kind: "died" | "won") {
  if (Date.now() - momentShown < 4000) return; // one at a time
  momentShown = Date.now();
  const d = document.createElement("div");
  d.className = "moment " + kind;
  d.innerHTML = kind === "died"
    ? `<div class="moment-text">YOU HAVE DIED</div><div class="moment-sub">the darkness takes you&hellip; for now</div><div class="moment-eyes"><span></span><span></span></div>`
    : `<div class="moment-text">YOU HAVE WON</div><div class="moment-sub">master adventurer of the great underground empire</div>`;
  document.body.appendChild(d);
  setTimeout(() => { d.classList.add("out"); setTimeout(() => d.remove(), 1200); }, kind === "died" ? 2800 : 5200);
}
if (import.meta.env.DEV) (window as any).__moment = bigMoment; // Dev: preview the death/victory beats

let currentRoom: any = null;
let shownDark = false;
// Pick what to render for a room: true darkness if unlit (grue territory), else
// the room's hand-composed pixel scene (every room has one, or composes one).
function applyScene(room: any, _enteredFrom?: string) {
  const scene = getRoomScene(room, rooms.objects);
  if (darkNow) scene2d.show(darknessScene);
  else scene2d.show(scene ?? darknessScene); // no scene should be impossible; fail dark, never blank
  shownDark = darkNow;
}

rooms.onChange((change) => {
  const sameRoom = currentRoom?.id === change.room.id;
  compass.update(change.room);
  gameMap?.discover(change);
  currentRoom = change.room;
  // record the room's real contents so scenes stop drawing props the player took
  setRoomFlag(change.room.id, "objects", (change.contents ?? []) as unknown as string[]);
  try { localStorage.setItem(ROOMS_KEY, JSON.stringify(roomState)); } catch { /* quota */ }
  ambience.setFlags(roomState); ambience.setRoom(change.room.id, darkNow);
  // A same-room emission is just a contents refresh (take/drop/theft) — the 2D
  // canvas reads roomState live; don't restart scene/viewport transitions for it.
  if (!sameRoom || shownDark !== darkNow) applyScene(change.room, change.enteredFrom);
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
      onStatus(left, right) {
        latestStatus = left;
        // score/moves ride the status line's right side — keep the player
        // button's hover tooltip current (never shown permanently; it detracts)
        const sc = right.match(/score:\s*(-?\d+)/i), mv = right.match(/moves:\s*(\d+)/i);
        if (sc) setScoreTooltip(Number(sc[1]), mv ? Number(mv[1]) : 0);
      },
      intercept(line, print) {
        const cmd = line.trim().toLowerCase();
        if (cmd === "help" || cmd === "?" || cmd === "commands" || cmd === "exits") {
          print(rooms.helpText());
          return true;
        }
        if (cmd === "hint" || cmd === "clue" || cmd === "hints" || cmd === "clues") {
          print(nextClue(currentRoom?.id, gameMap ? gameMap.visited() : new Set()));
          return true;
        }
        return false;
      },
      onCommand(line) {
        rooms.noteCommand(line);
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
        if (/\*{3,}\s*you have died\s*\*{3,}/i.test(fresh)) bigMoment("died");
        else if (/\*{3,}\s*you have won\s*\*{3,}/i.test(fresh)) bigMoment("won");
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
  (window as any).__zork = { rooms, game };
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
  (window as any).__trig = applyTriggers; // Dev/verification: run the trigger table against arbitrary I/O
  (window as any).__flag = setRoomFlag; // Dev: toggle room flags to verify both scene states
  (window as any).__mood = (id: string, dark = false) => { ambience.setFlags(roomState); ambience.setRoom(id, dark); }; // Dev: audition a room's soundscape
  // Dev/verification: deterministic pixel-hash of every registered scene at a
  // fixed t — refactors must leave every hash identical. Runs a default pass,
  // then a flag-variant pass, restoring all touched flags afterwards.
  if (import.meta.env.DEV) (window as any).__hashScenes = (t = 1.234) => {
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 230;
    const cx = cv.getContext("2d", { willReadFrequently: true })!;
    const hashAll = () => {
      const out: Record<string, number> = {};
      for (const id of sceneIds()) {
        cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.globalCompositeOperation = "source-over";
        cx.clearRect(0, 0, 512, 230);
        (getRoomScene(id, rooms.objects) as any)(cx, 512, 230, t);
        const d = cx.getImageData(0, 0, 512, 230).data;
        let h = 2166136261;
        for (let i = 0; i < d.length; i += 7) { h ^= d[i]; h = Math.imul(h, 16777619) >>> 0; }
        out[id] = h;
      }
      return out;
    };
    const VARIANTS: [string, string, boolean | number][] = [
      ["WEST-OF-HOUSE", "mailboxOpen", true], ["LIVING-ROOM", "rugMoved", true], ["LIVING-ROOM", "trapOpen", true],
      ["TROLL-ROOM", "trollDead", true], ["CYCLOPS-ROOM", "cyclopsAsleep", true], ["DAM-ROOM", "gatesOpen", true],
      ["RESERVOIR", "drained", true], ["END-OF-RAINBOW", "rainbowSolid", true], ["ENTRANCE-TO-HADES", "spiritsGone", true],
      ["MAINTENANCE-ROOM", "leak", true], ["MAINTENANCE-ROOM", "waterLevel", 4], ["DAM-BASE", "boatInflated", true],
      ["LOUD-ROOM", "echoFixed", true], ["SANDY-CAVE", "dug", true], ["DOME-ROOM", "ropeTied", true],
    ];
    const saved = VARIANTS.map(([r, k]) => [r, k, roomState[r]?.[k]] as const);
    const base = hashAll();
    for (const [r, k, v] of VARIANTS) setRoomFlag(r, k, v);
    const variant = hashAll();
    for (const [r, k, v] of saved) setRoomFlag(r, k, v as any);
    return { base, variant };
  };
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
  // On touch, wait for a deliberate tap on the terminal — auto-focusing here
  // would throw the keyboard over the opening scene.
  if (!matchMedia("(pointer: coarse)").matches) input.focus();
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
// no Enter key on a phone — the title button says what to actually do
if (matchMedia("(pointer: coarse)").matches) {
  const start = document.querySelector("#welcome .start");
  if (start) start.textContent = "TAP TO BEGIN";
}
welcome?.addEventListener("click", begin);

document.addEventListener("click", (e) => {
  if (!begun) return;
  // On touch screens, focusing pops the keyboard over half the game — only do
  // it for taps in the terminal. Mouse users keep the type-anywhere behavior.
  if (matchMedia("(pointer: coarse)").matches) {
    if ((e.target as HTMLElement | null)?.closest("#terminal")) input.focus();
  } else input.focus();
});

if (!welcome) begin(); // no title screen present — start directly
