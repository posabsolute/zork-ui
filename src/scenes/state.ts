// scenes/state.ts — per-room interactive world state the pixel scenes render from.

// ── Interactive room states (PER ROOM) ───────────────────────────────────
// Rooms that have interactive elements the scene reflects, and their flags:
//   WEST-OF-HOUSE : mailboxOpen
//   EAST-OF-HOUSE : windowOpen          (the small window you climb through)
//   KITCHEN       : windowOpen
//   LIVING-ROOM   : rugMoved, trapOpen, caseOpen, treasures[]
//   TROLL-ROOM    : trollDead
//   CYCLOPS-ROOM  : cyclopsGone
//   GRATING-ROOM  : gratingOpen
//   DAM-ROOM      : gatesOpen
//   RESERVOIR     : drained
//   EGYPT-ROOM    : coffinOpen
//   MIRROR-ROOM-1/2 : broken          (break the mirror → it shatters)
//   DOME-ROOM     : ropeTied          (tie the rope to the railing → it hangs down)
//   GRATING-CLEARING : leavesMoved    (move the leaves → the grating is exposed)
//   ENTRANCE-TO-HADES : spiritsGone   (exorcise the evil spirits)
//   TORCH-ROOM    : torchTaken        (take the torch off the pedestal)
export type RoomFlags = { [k: string]: boolean | number | string[] };

export const roomState: Record<string, RoomFlags> = {
  "WEST-OF-HOUSE": { mailboxOpen: false },
  "EAST-OF-HOUSE": { windowOpen: false },
  "KITCHEN": { windowOpen: false },
  "LIVING-ROOM": { rugMoved: false, trapOpen: false, caseOpen: false, treasures: [] },
  "TROLL-ROOM": { trollDead: false },
  "CYCLOPS-ROOM": { cyclopsGone: false, cyclopsAsleep: false },
  "DAM-BASE": { boatInflated: false },
  "END-OF-RAINBOW": { rainbowSolid: false },
  "GRATING-ROOM": { gratingOpen: false },
  "DAM-ROOM": { gatesOpen: false },
  "RESERVOIR": { drained: false },
  "EGYPT-ROOM": { coffinOpen: false },
  "MIRROR-ROOM-1": { broken: false },
  "MIRROR-ROOM-2": { broken: false },
  "DOME-ROOM": { ropeTied: false },
  "GRATING-CLEARING": { leavesMoved: false },
  "ENTRANCE-TO-HADES": { spiritsGone: false },
  "TORCH-ROOM": { torchTaken: false },
  "SANDY-CAVE": { dug: false },
  "LOUD-ROOM": { echoFixed: false },
  "SHAFT-ROOM": { basketLowered: false }, // the basket on the chain (shared with LOWER-SHAFT)
  "MAINTENANCE-ROOM": { leak: false, waterLevel: 0 }, // the blue button bursts a pipe; the room floods
};

export function setRoomFlag(room: string, key: string, val: boolean | number | string[]) { (roomState[room] ||= {})[key] = val; }

export function rf(room: string, key: string): boolean { return roomState[room]?.[key] === true; }

export function treasuresOf(room: string): string[] { const v = roomState[room]?.treasures; return Array.isArray(v) ? v : []; }

// contents-driven props: a prop is drawn only while its object really is in the
// room. A room with no recorded contents yet defaults to PRESENT (first visit).
export function hasObj(room: string, id: string): boolean { const v = roomState[room]?.objects; return !Array.isArray(v) || (v as string[]).includes(id); }

// strict variant: the prop is drawn ONLY once the game has confirmed the object
// is really there (recorded contents include it). For surprises the player must
// not see early, like the pot of gold.
export function hasObjKnown(room: string, id: string): boolean { const v = roomState[room]?.objects; return Array.isArray(v) && (v as string[]).includes(id); }

// ── Shared world state ────────────────────────────────────────────────────
// A few flags are WRITTEN in one room but READ by several. These accessors are
// the only sanctioned way to read them across rooms, so the sharing is explicit
// and grep-able instead of tribal knowledge.
export const isRainbowSolid = () => rf("END-OF-RAINBOW", "rainbowSolid"); // read by End of Rainbow, Aragain Falls, On the Rainbow
export const isTrapOpen = () => rf("LIVING-ROOM", "trapOpen");            // read by the Living Room rug AND the Cellar ceiling
export const isBasketLowered = () => rf("SHAFT-ROOM", "basketLowered");   // read by the Shaft Room AND the Lower Shaft
