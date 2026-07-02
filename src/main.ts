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
  // MAP toggle — small screens only (CSS hides it on desktop, where the map is docked)
  const map = document.createElement("button");
  map.className = "pl-btn pl-map"; map.textContent = "MAP"; map.title = "toggle map";
  map.onclick = (e) => {
    e.stopPropagation(); // don't let the global click handler summon the keyboard
    const open = document.body.classList.toggle("map-open");
    map.textContent = open ? "CLOSE" : "MAP";
  };
  host.appendChild(map);
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
  // MAINTENANCE-ROOM: the blue button bursts a pipe; the flood climbs turn by turn
  if (/leak has occurred in a pipe|water appears to burst/i.test(fresh)) { setRoomFlag("MAINTENANCE-ROOM", "leak", true); setRoomFlag("MAINTENANCE-ROOM", "waterLevel", 1); }
  const wl = fresh.match(/water level here is now up to your\s+(ankles?|shins?|knees?|hips?|waist|chest|neck)/i);
  if (wl) setRoomFlag("MAINTENANCE-ROOM", "waterLevel", ["ankle", "shin", "knee", "hip", "waist", "chest", "neck"].indexOf(wl[1].toLowerCase().replace(/s$/, "")) + 1);
  if (/stop(?:ped)?\s+the\s+leak|leak\s+(?:has been|is)\s+(?:fixed|repaired)/i.test(fresh)) setRoomFlag("MAINTENANCE-ROOM", "leak", false); // gunk applied — the water stops rising
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

// Room-specific clues for the treasure rooms and the harder puzzles. Each entry
// may return null when its puzzle is already solved / treasure taken, so the
// command falls back to the general progression nudge.
function roomStillHas(room: string, id: string): boolean {
  const v = roomState[room]?.objects;
  return !Array.isArray(v) || (v as string[]).includes(id);
}
function flagOn(room: string, key: string): boolean { return roomState[room]?.[key] === true; }
const MAZE_CLUE = () => "These twisty passages all look alike — drop an item in each room to tell them apart. Somewhere in here a luckless adventurer left his coins, his keys... and himself.";
const ROOM_CLUES: Record<string, () => string | null> = {
  // --- treasures ---
  "GALLERY": () => roomStillHas("GALLERY", "PAINTING") ? "That painting is one of the nineteen treasures. TAKE PAINTING — its true home is the trophy case." : null,
  "UP-A-TREE": () => roomStillHas("UP-A-TREE", "EGG") ? "The nest cradles a jewelled egg. Take it — but DON'T force it open; only one pair of hands in the Empire is deft enough, and they belong to someone who steals things." : null,
  "LOUD-ROOM": () => flagOn("LOUD-ROOM", "echoFixed") ? (roomStillHas("LOUD-ROOM", "BAR") ? "Now the bar is yours to take." : null) : "The room roars your words back at you. Answer it in kind — say the word the room itself keeps saying.",
  "TORCH-ROOM": () => roomStillHas("TORCH-ROOM", "TORCH") ? "The ivory torch is both treasure AND light — take it and save your lantern's batteries. (Getting down here needed a rope tied to the dome railing above.)" : null,
  "EGYPT-ROOM": () => roomStillHas("EGYPT-ROOM", "COFFIN") ? "The gold coffin is a treasure, and so is what rattles inside it. It's far too heavy for climbing — carry it out through the temple, and remember that prayers at the altar are answered." : null,
  "END-OF-RAINBOW": () => flagOn("END-OF-RAINBOW", "rainbowSolid") ? (roomStillHas("END-OF-RAINBOW", "POT-OF-GOLD") ? "The pot of gold sits at the rainbow's foot. Take it." : null) : "Every rainbow has a pot of gold — this one just needs convincing. A certain sceptre from a certain coffin, waved right here, works wonders.",
  "ARAGAIN-FALLS": () => "The rainbow springs from these falls. If you carry the sceptre from the coffin, wave it and see what firms up.",
  "ATLANTIS-ROOM": () => roomStillHas("ATLANTIS-ROOM", "TRIDENT") ? "The crystal trident of Poseidon, no less. Take it for the case." : null,
  "RESERVOIR": () => roomStillHas("RESERVOIR", "TRUNK") ? "A trunk of jewels lies drowned in the mud — it only surfaces when the reservoir drains. Open the dam's gates and come back when the waters fall." : null,
  "LAND-OF-LIVING-DEAD": () => roomStillHas("LAND-OF-LIVING-DEAD", "SKULL") ? "The crystal skull gleams among the bones — the hard part was getting past the spirits at the gate." : null,
  "BAT-ROOM": () => "The vampire bat will carry you off somewhere dreadful — unless you carry something that offends its nose. Garlic, say. The jade figurine is safe to take once the bat keeps its distance.",
  "GAS-ROOM": () => "SMELL that? One open flame — torch, candles, match — and they'll bury what's left of you in a matchbox. Carry only the lantern past here. The sapphire bracelet is the reward for caution.",
  "MACHINE-ROOM": () => "That machine looks like a giant dryer with a lid. Put a lump of coal inside, close it, and turn the switch — with a screwdriver, not fingers. Pressure makes diamonds.",
  "MAZE-5": () => "A skeleton, some keys, a bag of coins. The coins are treasure; the skeleton key opens a grating somewhere above your head. Disturb the bones at your peril.",
  "TREASURE-ROOM": () => "The thief's den — every treasure he's lifted ends up here, plus his silver chalice. He fights best against the armed and worst against the generous: things GIVEN to him occupy his hands. The nasty knife bites deepest.",
  "SANDY-CAVE": () => flagOn("SANDY-CAVE", "dug") ? null : "The sand is hiding something with wings and a shine. DIG WITH SHOVEL — and know when to stop digging; the sand takes greedy diggers.",
  "RIVER-4": () => "That red buoy bobbing past isn't just a channel marker. Take it aboard and open it once you're ashore — gently, it's carrying something precious.",
  // --- the harder puzzles along the way ---
  "CELLAR": () => "Hear the trap door slam? Someone down here doesn't like visitors using it. There are other ways back to the surface — find them, and one day the door will stay open.",
  "STUDIO": () => "That chimney is climbable — barely. It takes you up to the kitchen, but only with your hands nearly empty: the lamp and one small thing, no more.",
  "TROLL-ROOM": () => flagOn("TROLL-ROOM", "trollDead") ? null : "The troll respects exactly one form of diplomacy: ATTACK TROLL WITH SWORD, repeated with feeling.",
  "DOME-ROOM": () => flagOn("DOME-ROOM", "ropeTied") ? null : "A railing, a long drop, and that coil of rope from the attic. TIE ROPE TO RAILING and climb down into the dark below.",
  "NORTH-TEMPLE": () => "Take the brass bell. Bell, book and candle — an old recipe for driving out evil. You'll want all three ingredients before visiting the gates of Hades.",
  "SOUTH-TEMPLE": () => "Take the candles and the black book from the altar. And keep this place in mind: if you're ever carrying something too heavy to climb with, kneel here and PRAY.",
  "ENTRANCE-TO-HADES": () => flagOn("ENTRANCE-TO-HADES", "spiritsGone") ? null : "The spirits bar your way, but ceremony moves them: RING BELL, then light the candles (a match helps), then READ BOOK. In that order, and briskly.",
  "DAM-ROOM": () => "The great bolt turns with the wrench — but only after the dam's control bubble glows. Something in the maintenance room wakes it up. A yellow something.",
  "MAINTENANCE-ROOM": () => "Four buttons: one wakes the dam controls, one toggles the lights, and one bursts a pipe and floods the room to your neck. The YELLOW one is your friend. The blue one is not.",
  "DAM-BASE": () => flagOn("DAM-BASE", "boatInflated") ? "Board the boat and launch — but nothing sharp comes aboard, unless you like swimming in white water." : "That pile of plastic is a boat in denial. The hand pump from the reservoir's north side inflates it. Then: nothing sharp aboard.",
  "SHAFT-ROOM": () => "The chain and basket are a dumbwaiter for your gear. The crawl to the mine's bottom is too tight for baggage — LOAD the basket (torch included), LOWER BASKET, and travel light.",
  "TIMBER-ROOM": () => "The passage west is barely a rabbit hole — drop EVERYTHING here and crawl through empty-handed. Your gear can meet you below by basket.",
  "LOWER-SHAFT": () => "If you lowered the basket from the shaft room above, your gear is waiting in it here. The machine room nearby turns humble coal into something a jeweller would weep over.",
  "CYCLOPS-ROOM": () => (flagOn("CYCLOPS-ROOM", "cyclopsGone") || flagOn("CYCLOPS-ROOM", "cyclopsAsleep")) ? null : "The cyclops is hungry, which is a problem, since you're food. Feed him a hot lunch and something to wash it down... or speak the name of the hero his father taught him to fear.",
  "GRATING-ROOM": () => flagOn("GRATING-ROOM", "gratingOpen") ? null : "That grating opens onto daylight — if the leaves above are cleared and you hold a skeleton's key. UNLOCK GRATING WITH KEY, then open it.",
  "GRATING-CLEARING": () => flagOn("GRATING-CLEARING", "leavesMoved") ? null : "Something metallic hides under that pile of leaves. MOVE LEAVES.",
  "MIRROR-ROOM-1": () => "This mirror doesn't just reflect. TOUCH MIRROR and see where you end up.",
  "MIRROR-ROOM-2": () => "This mirror doesn't just reflect. TOUCH MIRROR and see where you end up.",
  "SLIDE-ROOM": () => "The slide is a fast, fun, strictly one-way trip down to the cellar. Don't ride it with unfinished business up here.",
  "SANDY-BEACH": () => "A shovel on a beach is an invitation. Take it — the sandy cave nearby has an itch that needs scratching.",
};

// A spoiler-light "what next?" nudge based on how far the player has gotten
// (which key rooms they've reached). Triggered by the hint/clue command.
function nextClue(): string {
  const here = currentRoom?.id as string | undefined;
  if (here) {
    const fn = ROOM_CLUES[here] ?? (/^MAZE-\d+$/.test(here) ? MAZE_CLUE : undefined);
    const c = fn?.();
    if (c) return "CLUE: " + c;
  }
  return nextClueGeneric();
}
function nextClueGeneric(): string {
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
