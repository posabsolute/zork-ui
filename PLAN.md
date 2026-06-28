# Zork I — Authentic Game, Amazing Retro Visuals

## Context
New project (`zork-ui`). Play Zork I exactly as the original (authentic Z-machine via
ifvms.js/ZVM running the now-MIT story file), augmented with a procedurally generated
PS1/Carmack-era first-person 3D view of the current room, built from the MIT-licensed ZIL
map data. Viewport-dominant layout: large 3D view above an authentic text terminal.

## Decisions (settled)
| Axis | Choice |
|---|---|
| Game logic | ifvms.js ZVM, real `.z3` story file — do NOT write a Z-machine |
| Renderer | Three.js, deliberately constrained to early-3D + CRT post |
| Room coverage | Procedural from parsed ZIL (all rooms); hand-tune hero rooms later |
| Current-room signal | Object-tree parent of ADVENTURER (primary), global-16 (check), header (fallback) |
| objNum↔id map | Parse generated `.zap` `.OBJECT` order — deterministic, disambiguates Forest/Maze |
| Layout | Viewport-dominant: 3D above, terminal + `>` input below |

## Confirmed technical facts
- ZVM exposes `vm.m` (whole image), `vm.ram` (live dynamic memory), and header pointers
  `vm.objects`, `vm.globals`, `vm.properties`, `vm.staticmem`, `vm.version`. Read live state
  from `vm.ram`.
- v3 object entry = 9 bytes (4 attr, parent, sibling, child, 2 prop-ptr); objects begin at
  `vm.objects + 62` (31 property-default words). Object N at base + (N-1)*9.
- current room = parent(ADVENTURER objNum); cross-check global-16 (`vm.ram.getUint16(vm.globals)`).
- Light = room attribute ONBIT set OR any object in player's inventory subtree has ONBIT.
- ZVM needs a Glk implementation — use a minimal custom Glk bridge (not full GlkOte).

## Build pipeline (assets)
1. Clone `historicalsource/zork1`.
2. ZILF: `Zilf <main>.zil` → `*.zap`; `Zapf <main>.zap` → `zork1.z3` (.NET).
3. Commit built `public/zork1.z3`; document build in README.
4. `tools/parse-zap.mjs`: parse `.OBJECT` directives → objNum→zilId map (all objects).
5. `tools/parse-zil.mjs`: parse `1dungeon.zil` → `rooms.json` + `objects.json`; join on zilId.
   FALLBACK if ZILF blocked: prebuilt MIT `.z3` + objNum map via runtime dump.

## File structure
public/zork1.z3, public/rooms.json, public/objects.json
tools/parse-zil.mjs, tools/parse-zap.mjs, tools/build-assets.sh
src/main.ts
src/engine/zvm.ts        — load story, lifecycle, run/resume
src/engine/glkBridge.ts  — minimal Glk: line/char input, main+status windows → events
src/engine/introspect.ts — read object tree & globals from vm.ram each turn
src/engine/roomState.ts  — rooms.json/objects.json, objNum→id, current room + contents + dark
src/ui/terminal.ts       — output render, `>` input, history, CRT-styled
src/render/viewport.ts   — renderer, low-res RT, first-person camera, scene swap, transitions
src/render/roomBuilder.ts— room box, exit doorways, stairs/hatch, prop sprites, region palette
src/render/sprites.ts    — objNum/zilId → sprite/material; darkness rendering
src/render/retro/*.glsl  — vertex-snap, affine UV, 15-bit+Bayer, CRT pass
src/config/retroConfig.ts, src/config/regions.ts

## Phases
- **P0 Scaffold:** Vite vanilla-ts; add `three`, `ifvms`; README; .gitignore.
- **P1 Authentic game (text):** zvm.ts + glkBridge.ts (main window out, line input, v3 status);
  terminal.ts (output, input, history). Save/restore/undo via Dialog shim → IndexedDB.
  GATE: byte-identical to real Zork.
- **P2 Map+object data:** parse-zap + parse-zil → rooms.json/objects.json with objNum joined.
  Handle exit grammar (TO / IF..ELSE / PER / blocked-msg). region grouping for palette.
- **P3 Live introspection:** introspect.ts reads vm.ram each turn → currentRoom, isDark,
  contents (child/sibling walk). Emit onRoomChange. GATE: scripted walk logs correct ids.
- **P4 Three.js rooms:** roomBuilder (box, doorways at real exits, stairs/hatch, prop sprites
  from live contents, region palette); viewport (low-res RT, first-person cam, scene swap,
  transitions, darkness). GATE: doorways match exits.
- **P5 Retro pipeline:** vertex-snap, affine UV, 15-bit+Bayer dither, CRT pass (scanlines,
  bloom, curvature, chromatic aberration, vignette); retroConfig tunables.
- **P6 Polish:** hand-tune ~6-10 hero rooms; idle sway; transitions; optional ambient audio.

## Reuse (don't reinvent)
- Engine: ifvms.js ZVM. Glk bridge: adapt minimal custom adapter.
- Map data: parse historicalsource ZIL + generated ZAP.
- Retro shaders: adapt established PS1/CRT techniques.

## Verification
- P1: side-by-side transcript identical; SAVE/RESTORE/UNDO/RESTART work.
- P3: scripted walk logs correct ids through darkness, revisits, maze.
- P4-5: dev play opening (mailbox→house→cellar→troll); doorways match exits; dark cellar black.
- Drive via Chrome MCP; screenshot CRT/PS1 look.
