// validate-ids.mjs — build-time guard for the seams where art meets game data.
// Every room id and object id that the UI layer hard-codes (scene registry,
// hasObj props, clue tables, flag triggers) must exist in the parsed game data,
// or the reference silently never fires. This makes that a build failure.
import { readFileSync, readdirSync } from "node:fs";

const rooms = JSON.parse(readFileSync("public/rooms.json", "utf8"));
const objects = JSON.parse(readFileSync("public/objects.json", "utf8"));
// ids that are real in the game but absent from objects.json (aliased at runtime
// in roomState.buildNameMap) — keep this list in sync with those aliases.
const OBJECT_ALIASES = new Set(["TUBE"]);

const src = {
  scenes: readdirSync("src/scenes").filter((f) => f.endsWith(".ts")).map((f) => readFileSync(`src/scenes/${f}`, "utf8")).join("\n"),
  main: readFileSync("src/main.ts", "utf8"),
  triggers: readFileSync("src/game/triggers.ts", "utf8"),
  clues: readFileSync("src/game/clues.ts", "utf8"),
};
const errors = [];
const checkRoom = (id, where) => { if (!(id in rooms)) errors.push(`unknown room "${id}" (${where})`); };
const checkObj = (id, where) => { if (!(id in objects) && !OBJECT_ALIASES.has(id)) errors.push(`unknown object "${id}" (${where})`); };

// hasObj("ROOM", "ID") / roomStillHas("ROOM", "ID") — scene props and clue gates
for (const [name, text] of Object.entries(src)) {
  for (const m of text.matchAll(/(?:hasObj|hasObjKnown|roomStillHas)\("([A-Z0-9-]+)",\s*"([A-Z0-9-]+)"\)/g)) {
    checkRoom(m[1], `${name}: ${m[0]}`);
    checkObj(m[2], `${name}: ${m[0]}`);
  }
  // rf / flagOn / setRoomFlag — room ids only (keys are free-form)
  for (const m of text.matchAll(/(?:rf|flagOn|setRoomFlag)\("([A-Z0-9-]+)"/g)) {
    checkRoom(m[1], `${name}: ${m[0]}...`);
  }
}
// the trigger table's set-tuples: [["ROOM", "flag", value], ...]
for (const m of src.triggers.matchAll(/\[\s*"([A-Z0-9-]+)",\s*"\w+",\s*(?:true|false|\d)/g)) {
  checkRoom(m[1], `trigger set: ${m[0]}`);
}
// the scene registry — every key must be a real room
for (const m of src.scenes.matchAll(/^  "([A-Z0-9-]+)": \(ctx/gm)) {
  checkRoom(m[1], `scene registry`);
}
// the clue table — every key must be a real room
const clueKeys = [...src.clues.matchAll(/^  "([A-Z0-9-]+)": \(\) =>/gm)];
if (clueKeys.length < 20) errors.push(`clue table scan found only ${clueKeys.length} entries — pattern or file moved?`);
for (const m of clueKeys) checkRoom(m[1], `clue table`);

if (errors.length) {
  console.error(`validate-ids: ${errors.length} bad reference(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("validate-ids: all room/object references check out.");
