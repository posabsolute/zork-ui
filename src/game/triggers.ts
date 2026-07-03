/*
 * triggers.ts — the declarative table wiring the game's OUTPUT TEXT (and the
 * player's typed command) to scene flags. This is the "observe, never
 * interfere" seam: we only read what the Z-machine printed and set flags the
 * pixel scenes render from.
 *
 * Each entry is one interaction. Conditions:
 *   cmd    — regex the typed command must match
 *   out    — regex the fresh output must match
 *   out2   — second output regex (both must match — "subject AND event" pairs)
 *   here   — required current-room id (string) or pattern (regex)
 *   needOk — output must NOT read as a refusal (can't / won't / closed / …)
 * Effects: `set` writes literal flags; `act` covers the few dynamic cases
 * (current-room flags, parsed values, the thief overlay).
 */
import { roomState as realRoomState, setRoomFlag as realSetRoomFlag, flashThief as realFlashThief } from "../ui/roomScenes.ts";

export interface TriggerIO {
  roomState: Record<string, Record<string, boolean | number | string[]>>;
  setRoomFlag: (room: string, key: string, val: boolean | number | string[]) => void;
  flashThief: () => void;
}
interface TriggerCtx extends TriggerIO { cmd: string; fresh: string; here?: string; ok: boolean; }
interface Trigger {
  note: string;
  cmd?: RegExp;
  out?: RegExp;
  out2?: RegExp;
  here?: string | RegExp;
  needOk?: boolean;
  set?: [string, string, boolean | number][];
  act?: (c: TriggerCtx) => void;
}

// Order matters and mirrors the game's own text; entries are evaluated top to
// bottom, every matching entry fires (a later match can override an earlier one).
const TRIGGERS: Trigger[] = [
  // LIVING-ROOM: rug / trap door / trophy case / treasures
  { note: "move the rug", cmd: /^(?:move|push|lift|slide)\s+(?:the\s+)?(?:oriental\s+)?rug\b/, out: /trap\s*door|moved|reveal/i, set: [["LIVING-ROOM", "rugMoved", true]] },
  { note: "open the trap door", cmd: /^open\s+(?:the\s+)?trap\s*door\b/, needOk: true, set: [["LIVING-ROOM", "trapOpen", true]] },
  { note: "close the trap door", cmd: /^close\s+(?:the\s+)?trap\s*door\b/, set: [["LIVING-ROOM", "trapOpen", false]] },
  { note: "open the trophy case", cmd: /^open\s+(?:the\s+)?(?:trophy\s+)?case\b/, out: /open/i, set: [["LIVING-ROOM", "caseOpen", true]] },
  { note: "close the trophy case", cmd: /^close\s+(?:the\s+)?(?:trophy\s+)?case\b/, set: [["LIVING-ROOM", "caseOpen", false]] },
  { note: "put a treasure in the case", act: (c) => {
    const pm = c.cmd.match(/^(?:put|place)\s+(.+?)\s+(?:in|into)\s+(?:the\s+)?(?:trophy\s+)?case\b/);
    if (pm && /\bdone\b/i.test(c.fresh) && c.ok) {
      const tn = pm[1].replace(/^(?:the|a|an)\s+/, "").trim();
      const tr = c.roomState["LIVING-ROOM"].treasures as string[];
      if (tn && !tr.includes(tn)) tr.push(tn);
    }
  } },
  // WEST-OF-HOUSE: mailbox
  { note: "open the mailbox", cmd: /^open\s+(?:the\s+)?(?:small\s+)?mailbox\b/, out: /open/i, set: [["WEST-OF-HOUSE", "mailboxOpen", true]] },
  { note: "close the mailbox", cmd: /^close\s+(?:the\s+)?mailbox\b/, set: [["WEST-OF-HOUSE", "mailboxOpen", false]] },
  // window — belongs to whichever room you're in (Kitchen or Behind House)
  { note: "open the window (current room)", act: (c) => { if (c.here && /^open\s+(?:the\s+)?window\b/.test(c.cmd) && /open|allow entry/i.test(c.fresh)) c.setRoomFlag(c.here, "windowOpen", true); } },
  { note: "close the window (current room)", act: (c) => { if (c.here && /^close\s+(?:the\s+)?window\b/.test(c.cmd)) c.setRoomFlag(c.here, "windowOpen", false); } },
  // CYCLOPS-ROOM / TROLL-ROOM / GRATING-ROOM / DAM-ROOM (driven by the output)
  { note: "cyclops flees through the wall", out: /cyclops/i, out2: /(flee|runs|run from|crashes|breaks?\s+(?:down\s+)?(?:through|the wall)|rush)/i, set: [["CYCLOPS-ROOM", "cyclopsGone", true]] },
  { note: "troll dies", out: /troll/i, out2: /(dies|is dead|expire|slain|breathes his|disappear|defeated|killed)/i, set: [["TROLL-ROOM", "trollDead", true]] },
  { note: "grating opens", out: /grating/i, out2: /(opens|is open|swings? (?:up|open))/i, set: [["GRATING-ROOM", "gratingOpen", true]] },
  { note: "close the grating", cmd: /^close\s+(?:the\s+)?grating\b/, set: [["GRATING-ROOM", "gratingOpen", false]] },
  { note: "dam gates open", out: /sluice gates open|gates open and water/i, set: [["DAM-ROOM", "gatesOpen", true]] },
  { note: "dam gates close", out: /sluice gates? (?:close|are closed)|gates close/i, set: [["DAM-ROOM", "gatesOpen", false]] },
  // EGYPT-ROOM: the gold coffin
  { note: "open the coffin", cmd: /^open\s+(?:the\s+)?(?:gold(?:en)?\s+)?coffin\b/, out: /open/i, set: [["EGYPT-ROOM", "coffinOpen", true]] },
  { note: "close the coffin", cmd: /^close\s+(?:the\s+)?coffin\b/, set: [["EGYPT-ROOM", "coffinOpen", false]] },
  // RESERVOIR: drains when the dam gates are open (the water level falls)
  { note: "reservoir drains", out: /water level/i, out2: /(fall|drop|lower|empty|recede)/i, set: [["RESERVOIR", "drained", true]] },
  { note: "reservoir refills", act: (c) => { if ((/water level/i.test(c.fresh) && /(ris|fill)/i.test(c.fresh)) || /reservoir.*(fills|full again)/i.test(c.fresh)) c.setRoomFlag("RESERVOIR", "drained", false); } },
  // MIRROR rooms: break the mirror (in whichever mirror room you're in)
  { note: "break the mirror (current room)", act: (c) => { if (c.here && /MIRROR-ROOM/.test(c.here) && /^(?:break|smash|hit|strike)\s+(?:the\s+)?mirror\b/.test(c.cmd) && /(shatter|breaks|smash|pieces|fragment)/i.test(c.fresh)) c.setRoomFlag(c.here, "broken", true); } },
  // DOME-ROOM: tie the rope to the railing
  { note: "tie the rope to the railing", cmd: /^tie\s+(?:the\s+)?rope\s+to\s+(?:the\s+)?railing\b/, out: /(tie|attach|fasten|drop|secure)/i, set: [["DOME-ROOM", "ropeTied", true]] },
  // GRATING-CLEARING: rake the leaves off the grating
  { note: "move the leaves", cmd: /^(?:move|push|rake)\s+(?:the\s+)?(?:pile of\s+)?leaves\b/, out: /(grating|reveal|move)/i, set: [["GRATING-CLEARING", "leavesMoved", true]] },
  // ENTRANCE-TO-HADES: exorcise the spirits
  { note: "spirits exorcised", out: /(spirits|ghosts)/i, out2: /(flee|scatter|banish|depart|vanish|recoil|driven|exorc)/i, set: [["ENTRANCE-TO-HADES", "spiritsGone", true]] },
  // TORCH-ROOM: take the torch off its pedestal
  { note: "take the torch", here: "TORCH-ROOM", cmd: /^(?:take|get|grab|pick up)\s+(?:the\s+)?torch\b/, out: /taken/i, set: [["TORCH-ROOM", "torchTaken", true]] },
  { note: "put the torch back", here: "TORCH-ROOM", cmd: /^(?:drop|put)\s+(?:down\s+)?(?:the\s+)?torch\b/, set: [["TORCH-ROOM", "torchTaken", false]] },
  // SANDY-CAVE: dig in the sand (with the shovel) to uncover the scarab
  { note: "dig up the scarab", here: "SANDY-CAVE", cmd: /^dig\b/, out: /(scarab|hole|uncover|reveal|sand)/i, set: [["SANDY-CAVE", "dug", true]] },
  // LOUD-ROOM: say "echo" to fix the deafening acoustics
  { note: "say echo", here: "LOUD-ROOM", cmd: /^echo\b/, out: /(acoustic|echo|change|silent|stops?)/i, set: [["LOUD-ROOM", "echoFixed", true]] },
  // SHAFT-ROOM / LOWER-SHAFT: lower or raise the basket on the chain
  { note: "lower the basket", cmd: /^lower\s+(?:the\s+)?basket\b/, needOk: true, set: [["SHAFT-ROOM", "basketLowered", true]] },
  { note: "raise the basket", cmd: /^raise\s+(?:the\s+)?basket\b/, needOk: true, set: [["SHAFT-ROOM", "basketLowered", false]] },
  // CYCLOPS: fed and watered, he falls asleep (fleeing through the wall overrides)
  { note: "cyclops falls asleep", out: /cyclops/i, out2: /(asleep|falls? .*sleep|slumber|snor)/i, set: [["CYCLOPS-ROOM", "cyclopsAsleep", true]] },
  { note: "cyclops wakes", out: /cyclops/i, out2: /(wakes|awakens|yawns and stares)/i, set: [["CYCLOPS-ROOM", "cyclopsAsleep", false]] },
  // THE SCEPTRE: waved, the rainbow becomes solid (all three rainbow rooms read this key)
  { note: "rainbow turns solid", out: /rainbow.*(solid|walkable)/i, set: [["END-OF-RAINBOW", "rainbowSolid", true]] },
  { note: "rainbow reverts", out: /rainbow.*(run-of-the-mill|shimmer|insubstantial)/i, set: [["END-OF-RAINBOW", "rainbowSolid", false]] },
  // THE MAGIC BOAT: pumped up at the dam base
  { note: "inflate the boat", cmd: /^(?:inflate|pump)/, out: /(boat|plastic).*inflate|inflates|seaworthy/i, set: [["DAM-BASE", "boatInflated", true]] },
  { note: "deflate the boat", cmd: /^deflate/, out: /deflate/i, set: [["DAM-BASE", "boatInflated", false]] },
  // MAINTENANCE-ROOM: the blue button bursts a pipe; the flood climbs turn by turn
  { note: "the pipe bursts", out: /leak has occurred in a pipe|water appears to burst/i, set: [["MAINTENANCE-ROOM", "leak", true], ["MAINTENANCE-ROOM", "waterLevel", 1]] },
  { note: "the water climbs", act: (c) => {
    const wl = c.fresh.match(/water level here is now up to your\s+(ankles?|shins?|knees?|hips?|waist|chest|neck)/i);
    if (wl) c.setRoomFlag("MAINTENANCE-ROOM", "waterLevel", ["ankle", "shin", "knee", "hip", "waist", "chest", "neck"].indexOf(wl[1].toLowerCase().replace(/s$/, "")) + 1);
  } },
  { note: "the leak is gunked", out: /stop(?:ped)?\s+the\s+leak|leak\s+(?:has been|is)\s+(?:fixed|repaired)/i, set: [["MAINTENANCE-ROOM", "leak", false]] },
  // THE THIEF: when he wanders through and robs you, show him striding through the room
  { note: "the thief passes through", act: (c) => { if (/seedy-looking individual|abstracted some valuables|(?:thief|individual).*(?:wandered|wanders) through|just wandered through the room/i.test(c.fresh)) c.flashThief(); } },
];

/** Run every trigger against this turn's command + output. Returns whether any
 *  flag changed (persistence is the caller's job). Pure over `io` for testing. */
export function applyTriggers(cmd: string, fresh: string, here: string | undefined, io?: TriggerIO): boolean {
  const eff: TriggerIO = io ?? { roomState: realRoomState, setRoomFlag: realSetRoomFlag, flashThief: realFlashThief };
  if (!cmd) return false;
  const ok = !/\b(can't|cannot|closed|won't|isn't|don't|nothing|no\b)/i.test(fresh);
  const was = JSON.stringify(eff.roomState);
  const ctx: TriggerCtx = { cmd, fresh, here, ok, ...eff };
  for (const t of TRIGGERS) {
    if (t.here !== undefined) {
      if (typeof t.here === "string" ? here !== t.here : !(here && t.here.test(here))) continue;
    }
    if (t.cmd && !t.cmd.test(cmd)) continue;
    if (t.out && !t.out.test(fresh)) continue;
    if (t.out2 && !t.out2.test(fresh)) continue;
    if (t.needOk && !ok) continue;
    if (t.set) for (const [room, key, val] of t.set) eff.setRoomFlag(room, key, val);
    if (t.act) t.act(ctx);
  }
  return was !== JSON.stringify(eff.roomState);
}
