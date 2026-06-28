/*
 * parse-zil.mjs — extract the Zork I world from the MIT-licensed ZIL source
 * into structured JSON the renderer can consume.
 *
 * Input : vendor/zork1/1dungeon.zil  (ROOM and OBJECT definitions)
 * Output: public/rooms.json, public/objects.json
 *
 * We parse facts (exits, flags, containment, descriptions), not prose — this is
 * a data extraction of the open-source game definition.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "vendor", "zork1", "1dungeon.zil");

const DIRS = new Set([
  "NORTH", "SOUTH", "EAST", "WEST",
  "NE", "NW", "SE", "SW",
  "UP", "DOWN", "IN", "OUT", "LAND",
]);

const text = readFileSync(SRC, "latin1");

// --- Top-level block extraction -------------------------------------------
// Each ROOM/OBJECT is a top-level <...> form. Walk the text tracking angle and
// paren depth while respecting "..." strings, so we capture whole blocks.
function extractBlocks(src, keyword) {
  const blocks = [];
  const needle = "<" + keyword + " ";
  let i = 0;
  while ((i = src.indexOf(needle, i)) !== -1) {
    let depth = 0;
    let j = i;
    let inStr = false;
    for (; j < src.length; j++) {
      const c = src[j];
      if (inStr) {
        if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "<") depth++;
      else if (c === ">") {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    blocks.push(src.slice(i, j));
    i = j;
  }
  return blocks;
}

// Split the inside of a block into top-level (KEY ...) property groups.
function propertyGroups(block) {
  // Strip leading "<KEYWORD NAME" and trailing ">".
  const inner = block.replace(/^<\w+\s+[\w?-]+/, "").replace(/>\s*$/, "");
  const groups = [];
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === "(") {
      let depth = 0;
      let j = i;
      let inStr = false;
      for (; j < inner.length; j++) {
        const c = inner[j];
        if (inStr) {
          if (c === '"') inStr = false;
          continue;
        }
        if (c === '"') inStr = true;
        else if (c === "(") depth++;
        else if (c === ")") {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
      }
      groups.push(inner.slice(i + 1, j - 1).trim());
      i = j;
    } else {
      i++;
    }
  }
  return groups;
}

function blockName(block) {
  const m = block.match(/^<\w+\s+([\w?-]+)/);
  return m ? m[1] : null;
}

function firstString(group) {
  const m = group.match(/"((?:[^"\\]|\\.)*)"/);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}

// --- Exit parsing ----------------------------------------------------------
function parseExit(dir, rest) {
  rest = rest.trim();
  // Blocked exit: (DIR "message")
  if (rest.startsWith('"')) {
    return { dir, kind: "blocked", msg: firstString(rest) };
  }
  // Routine exit: (DIR PER ROUTINE)
  if (/^PER\b/.test(rest)) {
    const m = rest.match(/^PER\s+([\w?-]+)/);
    return { dir, kind: "routine", per: m ? m[1] : null };
  }
  // Targeted exit: (DIR TO ROOM [IF ... [IS STATE]] [ELSE "msg"])
  if (/^TO\b/.test(rest)) {
    const m = rest.match(/^TO\s+([\w?-]+)/);
    const to = m ? m[1] : null;
    const exit = { dir, kind: "normal", to };
    const ifMatch = rest.match(/\bIF\s+([\w?-]+)(?:\s+IS\s+([\w?-]+))?/);
    if (ifMatch) {
      exit.kind = "conditional";
      exit.cond = ifMatch[1];
      if (ifMatch[2]) exit.state = ifMatch[2];
    }
    const elseMsg = rest.match(/\bELSE\s+"((?:[^"\\]|\\.)*)"/);
    if (elseMsg) exit.elseMsg = elseMsg[1].replace(/\s+/g, " ").trim();
    return exit;
  }
  return null;
}

// --- Region classification -------------------------------------------------
function classifyRegion(id, flags) {
  const n = id.toUpperCase();
  if (flags.includes("RWATERBIT") || /RIVER|STREAM|RESERVOIR|DAM|REservoir/i.test(n))
    return "river";
  if (/FOREST|CLEARING|PATH|TREE|MOUNTAIN|CANYON|FORE|GRATING-CLEAR|RAINBOW|ARAGAIN|ABOVE/.test(n))
    return "forest";
  if (/HOUSE|KITCHEN|LIVING-ROOM|ATTIC/.test(n)) return "house";
  if (/TEMPLE|ALTAR|EGYPT|TORCH|DOME|TREASURE/.test(n)) return "temple";
  if (/HADES|DEAD|ENTRANCE-TO-HADES/.test(n)) return "hades";
  if (/MINE|COAL|LADDER|MACHINE|DRAFTY|SHAFT|TIMBER|SQUEAK|GAS/.test(n)) return "mine";
  if (/MAZE|GRATING-ROOM/.test(n)) return "maze";
  if (/CELLAR|TROLL|CYCLOPS|STUDIO|GALLERY|CHASM|EAST-OF-CHASM|RUINS/.test(n))
    return "cellar";
  return "dungeon";
}

// --- Parse rooms -----------------------------------------------------------
const rooms = {};
for (const block of extractBlocks(text, "ROOM")) {
  const id = blockName(block);
  if (!id) continue;
  const room = {
    id,
    name: id,
    exits: {},
    globals: [],
    flags: [],
    objects: [],
  };
  for (const g of propertyGroups(block)) {
    const key = g.match(/^([\w?-]+)/)?.[1];
    if (!key) continue;
    const rest = g.slice(key.length).trim();
    if (key === "DESC") room.name = firstString(g) ?? id;
    else if (key === "LDESC") room.ldesc = firstString(g) ?? undefined;
    else if (key === "FLAGS") room.flags = rest.split(/\s+/).filter(Boolean);
    else if (key === "VALUE") room.value = parseInt(rest, 10) || 0;
    else if (key === "GLOBAL") room.globals = rest.split(/\s+/).filter(Boolean);
    else if (key === "ACTION") room.action = rest.split(/\s+/)[0];
    else if (DIRS.has(key)) {
      const exit = parseExit(key, rest);
      if (exit) room.exits[key] = exit;
    }
  }
  room.region = classifyRegion(id, room.flags);
  room.dark = !room.flags.includes("ONBIT"); // lit rooms have ONBIT
  rooms[id] = room;
}

// --- Parse objects ---------------------------------------------------------
const objects = {};
for (const block of extractBlocks(text, "OBJECT")) {
  const id = blockName(block);
  if (!id) continue;
  const obj = { id, name: id, flags: [] };
  for (const g of propertyGroups(block)) {
    const key = g.match(/^([\w?-]+)/)?.[1];
    if (!key) continue;
    const rest = g.slice(key.length).trim();
    if (key === "DESC") obj.name = firstString(g) ?? id;
    else if (key === "FDESC") obj.fdesc = firstString(g) ?? undefined;
    else if (key === "FLAGS") obj.flags = rest.split(/\s+/).filter(Boolean);
    else if (key === "IN") obj.in = rest.split(/\s+/)[0];
    else if (key === "SYNONYM") obj.synonyms = rest.split(/\s+/).filter(Boolean);
  }
  objects[id] = obj;
  // Attach object to its room for quick lookup.
  if (obj.in && rooms[obj.in]) rooms[obj.in].objects.push(id);
}

// --- Validate exit targets -------------------------------------------------
let danglingExits = 0;
for (const room of Object.values(rooms)) {
  for (const exit of Object.values(room.exits)) {
    if (exit.to && !rooms[exit.to] && !objects[exit.to]) danglingExits++;
  }
}

// --- Write -----------------------------------------------------------------
mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "rooms.json"), JSON.stringify(rooms, null, 0));
writeFileSync(join(ROOT, "public", "objects.json"), JSON.stringify(objects, null, 0));

const roomCount = Object.keys(rooms).length;
const objCount = Object.keys(objects).length;
const withExits = Object.values(rooms).filter((r) => Object.keys(r.exits).length).length;
console.log(`Parsed ${roomCount} rooms (${withExits} with exits), ${objCount} objects.`);
console.log(`Dangling exit targets: ${danglingExits}`);
console.log("Wrote public/rooms.json and public/objects.json");
