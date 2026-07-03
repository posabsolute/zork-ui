/*
 * clues.ts — the hint system, in the narrator's voice. Room-specific clues for
 * every treasure room and hard puzzle (falling back to a progression nudge),
 * all spoiler-light. Reads roomState flags and recorded contents only.
 */
import { roomState } from "../ui/roomScenes.ts";

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
  "GALLERY": () => roomStillHas("GALLERY", "PAINTING") ? "A gallery a hundred feet underground, and the security is just you, your conscience, and the dark. The painting would look better over your trophy case anyway." : null,
  "UP-A-TREE": () => roomStillHas("UP-A-TREE", "EGG") ? "The nest cradles a jewelled egg. Take it — but DON'T force it open; only one pair of hands in the Empire is deft enough, and they belong to someone who steals things." : null,
  "LOUD-ROOM": () => flagOn("LOUD-ROOM", "echoFixed") ? (roomStillHas("LOUD-ROOM", "BAR") ? "Now the bar is yours to take." : null) : "The room roars your words back at you. Answer it in kind — say the word the room itself keeps saying.",
  "TORCH-ROOM": () => roomStillHas("TORCH-ROOM", "TORCH") ? "An ivory torch, burning since before anyone can say — treasure in one hand, lantern-batteries saved with the other. The rare loot that pays for its own carrying." : null,
  "EGYPT-ROOM": () => roomStillHas("EGYPT-ROOM", "COFFIN") ? "The gold coffin is a treasure, and so is what rattles inside it. It's far too heavy for climbing — carry it out through the temple, and remember that prayers at the altar are answered." : null,
  "END-OF-RAINBOW": () => flagOn("END-OF-RAINBOW", "rainbowSolid") ? (roomStillHas("END-OF-RAINBOW", "POT-OF-GOLD") ? "The pot of gold sits at the rainbow's foot. Take it." : null) : "Every rainbow has a pot of gold — this one just needs convincing. A certain sceptre from a certain coffin, waved right here, works wonders.",
  "ARAGAIN-FALLS": () => "A rainbow with a beginning is a rainbow with an end — and things at the other end, if you could only walk there. Pharaohs were buried with the answer in their hands.",
  "ATLANTIS-ROOM": () => roomStillHas("ATLANTIS-ROOM", "TRIDENT") ? "Poseidon mislaid his trident in a drowned city a mile from any sea. Gods are careless like that. Finders keepers is the oldest law there is." : null,
  "RESERVOIR": () => flagOn("RESERVOIR", "drained") ? "The waters have fallen, and the mud is showing what it swallowed — a trunk of jewels, waiting all these years for someone with dry boots." : "A trunk of jewels lies drowned somewhere under all this water. Open the dam's gates and come back when the waters fall.",
  "LAND-OF-LIVING-DEAD": () => roomStillHas("LAND-OF-LIVING-DEAD", "SKULL") ? "A thousand skulls down here, and exactly one of them is worth anything — the crystal one. Take it, tread respectfully, and don't wonder too hard about how the owner lost it." : null,
  "BAT-ROOM": () => "The vampire bat will carry you off somewhere dreadful — unless you carry something that offends its nose. Garlic, say. The jade figurine is safe to take once the bat keeps its distance.",
  "GAS-ROOM": () => "SMELL that? One open flame — torch, candles, match — and they'll bury what's left of you in a matchbox. Carry only the lantern past here. The sapphire bracelet is the reward for caution.",
  "MACHINE-ROOM": () => "That machine looks like a giant dryer with a lid. Put a lump of coal inside, close it, and turn the switch — with a screwdriver, not fingers. Pressure makes diamonds.",
  "MAZE-5": () => "A skeleton, some keys, a bag of coins. The coins are treasure; the skeleton key opens a grating somewhere above your head. Disturb the bones at your peril.",
  "TREASURE-ROOM": () => "The thief's den — every treasure he's lifted ends up here, plus his silver chalice. He fights best against the armed and worst against the generous: things GIVEN to him occupy his hands. The nasty knife bites deepest.",
  "SANDY-CAVE": () => flagOn("SANDY-CAVE", "dug") ? null : "The sand is hiding something with wings and a shine. DIG WITH SHOVEL — and know when to stop digging; the sand takes greedy diggers.",
  "RIVER-4": () => "That red buoy bobbing past isn't just a channel marker. Take it aboard and open it once you're ashore — gently, it's carrying something precious.",
  // --- the harder puzzles along the way ---
  "CELLAR": () => "Hear the trap door slam? Someone down here doesn't like visitors using it. There are other ways back to the surface — find them, and one day the door will stay open.",
  "STUDIO": () => "An artist lived down here once, and the chimney was his front door. It still works — for the slim, the desperate, and the nearly empty-handed. Your lamp and one small thing; the flue keeps the rest.",
  "TROLL-ROOM": () => flagOn("TROLL-ROOM", "trollDead") ? null : "The troll respects exactly one form of diplomacy: ATTACK TROLL WITH SWORD, repeated with feeling.",
  "DOME-ROOM": () => flagOn("DOME-ROOM", "ropeTied") ? null : "A railing, a long drop, and no stairs — whoever built this dome expected visitors to bring their own way down. That coil of rope from the attic has been waiting its whole life for this railing.",
  "NORTH-TEMPLE": () => "Bell, book and candle — the oldest recipe there is for driving out evil. The temple keeps all three, and this room keeps the bell. Collect the set before you go knocking on Hades' gate.",
  "SOUTH-TEMPLE": () => "The altar offers candles, a black book, and one more thing it doesn't advertise: prayers here are answered, bodily. Worth remembering the day you're carrying something too heavy to climb with.",
  "ENTRANCE-TO-HADES": () => flagOn("ENTRANCE-TO-HADES", "spiritsGone") ? null : "The dead don't argue with swords — they argue with ceremony. Bell, book and candle, in the order the old rites name them, and don't dawdle between the verses.",
  "DAM-ROOM": () => "The great bolt turns with the wrench — but only after the dam's control bubble glows. Something in the maintenance room wakes it up. A yellow something.",
  "MAINTENANCE-ROOM": () => "Four buttons: one wakes the dam controls, one toggles the lights, and one bursts a pipe and floods the room to your neck. The YELLOW one is your friend. The blue one is not.",
  "DAM-BASE": () => flagOn("DAM-BASE", "boatInflated") ? "Board the boat and launch — but nothing sharp comes aboard, unless you like swimming in white water." : "That pile of plastic is a boat in denial. The hand pump from the reservoir's north side inflates it. Then: nothing sharp aboard.",
  "SHAFT-ROOM": () => "The miners left you a dumbwaiter: basket, chain, and a long dark drop. The crawl to the bottom is too tight for baggage — so your gear rides down in style while you go on hands and knees. Even the torch trusts the basket more than the crawl.",
  "TIMBER-ROOM": () => "The passage west is barely a rabbit hole — drop EVERYTHING here and crawl through empty-handed. Your gear can meet you below by basket.",
  "LOWER-SHAFT": () => "If you lowered the basket from the shaft room above, your gear is waiting in it here. The machine room nearby turns humble coal into something a jeweller would weep over.",
  "CYCLOPS-ROOM": () => (flagOn("CYCLOPS-ROOM", "cyclopsGone") || flagOn("CYCLOPS-ROOM", "cyclopsAsleep")) ? null : "The cyclops is hungry, which is a problem, since you're food. Feed him a hot lunch and something to wash it down... or speak the name of the hero his father taught him to fear.",
  "GRATING-ROOM": () => flagOn("GRATING-ROOM", "gratingOpen") ? null : "Daylight through the bars — that's the forest above, closer than it's been in miles. The lock wants a key, and the last person to carry one is lying in a maze nearby, not using it.",
  "GRATING-CLEARING": () => flagOn("GRATING-CLEARING", "leavesMoved") ? null : "Autumn buried something in this clearing that autumn didn't make. Move the leaves and see what the forest has been standing on.",
  "MIRROR-ROOM-1": () => "Most mirrors show you where you are. This one is more interested in where you aren't. Touch it.",
  "MIRROR-ROOM-2": () => "Most mirrors show you where you are. This one is more interested in where you aren't. Touch it.",
  "SLIDE-ROOM": () => "The slide is a fast, fun, strictly one-way trip down to the cellar. Don't ride it with unfinished business up here.",
  "SANDY-BEACH": () => "A shovel on a beach is an invitation. Take it — the sandy cave nearby has an itch that needs scratching.",
};

// A spoiler-light "what next?" nudge based on how far the player has gotten
// (which key rooms they've reached). Triggered by the hint/clue command.
export function nextClue(here: string | undefined, visited: Set<string>): string {
  if (here) {
    const fn = ROOM_CLUES[here] ?? (/^MAZE-\d+$/.test(here) ? MAZE_CLUE : undefined);
    const c = fn?.();
    if (c) return "CLUE: " + c;
  }
  return nextClueGeneric(visited);
}
function nextClueGeneric(visited: Set<string>): string {
  const has = (id: string) => visited.has(id);
  const reachedSide = has("EAST-OF-HOUSE") || has("NORTH-OF-HOUSE") || has("SOUTH-OF-HOUSE");
  const steps: [boolean, string][] = [
    [!reachedSide && !has("KITCHEN"), "Start with the mail — every adventure begins with paperwork. As for the house: a boarded front door is a promise that there's another way in. Walk around and find it."],
    [reachedSide && !has("KITCHEN"), "Around the back of the house, one small window sits ajar — an inch of invitation. Push it the rest of the way open and climb through."],
    [has("KITCHEN") && !has("LIVING-ROOM"), "The kitchen has been picked over already. The living room, just west of here, has not."],
    [has("LIVING-ROOM") && !has("CELLAR"), "Everything an adventurer needs is in this one room: a lantern, an elvish sword, and — under that oriental rug — a door nobody wanted you to find. Light in hand, blade at hip, down you go."],
    [has("CELLAR") && !has("TROLL-ROOM"), "Keep the lamp burning — the dark down here has an appetite. Somewhere ahead a troll collects tolls for his passage, and he only takes payment in steel."],
    [has("TROLL-ROOM"), "The Empire holds nineteen treasures, and the trophy case upstairs keeps the score. Somewhere in the dark a thief is running the same errand, faster — and wherever your lamp doesn't reach, the grue is patient. The map quietly underlines every exit you haven't tried."],
  ];
  for (const [cond, msg] of steps) if (cond) return "CLUE: " + msg;
  return "CLUE: Lamp lit, eyes open. The treasures still out there won't announce themselves — but the map is underlining every exit you haven't taken.";
}
