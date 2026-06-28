# Zork I — Authentic Game, Amazing Retro Visuals

## Context

We are starting a **new, empty project** (`zork-ui`). Goal: play **Zork I exactly as the
original** — the parser, responses, and every interaction byte-for-byte authentic — but
**augmented with a beautiful retro 3D view of the room you're standing in**. The text game
drives play; the visuals support it.

Two things make this feasible and clean right now:

1. **Zork I is open source (MIT) as of Nov 2025** — Microsoft/Activision released the
   original ZIL source at `historicalsource/zork1`. No copyright gray area.
2. **The ZIL source encodes the entire map as data.** Every room declares its exits as
   `(NORTH TO NORTH-OF-HOUSE)`, plus description, contained objects, and flags (e.g.
   `RLANDBIT`, `ONBIT` for light). We can parse this into a room graph and **generate the
   3D spaces from the real game data** instead of hand-building ~110 rooms.

Design philosophy for the "best retro graphics ever" (grounded in Carmack / PS1-era
technique): you don't get the retro look from a weak engine — you get it from a **capable
engine deliberately constrained**. Use Three.js (real first-person 3D, so you can actually
"see the space"), then clamp it to the early-3D aesthetic: low internal render resolution,
vertex snapping, affine (non-perspective) texture mapping, ordered dithering + 15-bit color
quantization, and a CRT post-process (scanlines, phosphor glow, barrel curvature,
chromatic aberration). This is the "Dusk/Wrath" approach — modern tech, 1993 soul.

## Decisions (made, not open questions)

| Axis | Choice | Why |
|---|---|---|
| Game logic | **Authentic Z-machine** — run real story file in `ifvms.js` (ZVM) | Identical parser/responses; "stay true" is non-negotiable |
| Renderer | **Three.js**, retro-constrained pipeline | Real first-person 3D = truly "see the space"; retro comes from shaders, so we get *amazing AND retro*, and it scales to procedural rooms (incl. up/down stairs Zork uses heavily) |
| Room coverage | **Procedural from parsed ZIL (all rooms)**, hand-tune a few hero rooms later | Real data foundation; full coverage; no 110-room manual slog |
| Current-room signal | **Read player object's parent from Z-machine object tree** (spec layout), text-header as cross-check | Robust through darkness / repeat visits, interpreter-agnostic |
| Layout | **Viewport-dominant**: large 3D view, authentic terminal + input below | "See the space" is the star; text still drives play |

## Tech stack

- **Vite + TypeScript** app scaffold.
- **three** for the 3D viewport + a small custom post-processing chain (EffectComposer).
- **ifvms.js** (ZVM) as the Z-machine engine (npm `ifvms`), fed the Zork I story file.
- Custom DOM/canvas **terminal** (xterm.js optional; a lean custom one is fine and easier
  to CRT-style) for I/O.
- **Build-time tools:** ZILF (C#/.NET tool) to compile `historicalsource/zork1` ZIL → `.z3`
  story file; a Node script to parse ZIL → `rooms.json`.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Three.js viewport (retro pipeline + CRT)     │  ← renders current room scene
├─────────────────────────────────────────────┤
│  Terminal: authentic Zork text + > input      │  ← ifvms ZVM I/O
└─────────────────────────────────────────────┘
        ▲                         ▲
        │ currentRoomId           │ text in/out
   RoomState  ◀── object-tree ──  ZVM engine (story file)
   (rooms.json: exits, objects, region, light)
```

Single source of truth for *gameplay* = the story file in ZVM. Single source of truth for
*space layout* = `rooms.json` parsed from ZIL. The bridge is `currentRoomId`, derived each
turn from the Z-machine object tree (player object → parent room → map object# to room name
via the names dumped during ZIL parse).

## Build phases

### Phase 0 — Scaffold & assets
- `npm create vite@latest` (vanilla-ts), add `three`, `ifvms`.
- Vendor the Zork I assets: clone `historicalsource/zork1`. Produce the story file via ZILF
  (canonical, MIT-clean) and **commit the built `.z3`** to `public/` for dev convenience;
  document the build command in `README`.
- Files: `package.json`, `vite.config.ts`, `index.html`, `README.md`.

### Phase 1 — Authentic game playable (text only)
- `src/engine/zvm.ts`: load story file, wire ZVM input/output, expose `send(command)` and
  an output stream.
- `src/ui/terminal.ts`: render output, capture `>` input, history. Verify the game is
  genuinely identical to original (opening text "West of House", `open mailbox`, `read leaflet`,
  `go north`, `enter house`, etc.).
- **Gate:** plays exactly like real Zork before any 3D work.

### Phase 2 — Map data from ZIL
- `tools/parse-zil.mjs`: parse `1dungeon.zil` (+ relevant `.zil`) ROOM objects → `rooms.json`:
  `{ id, name, desc, exits: {dir: {to, condition?}}, objects: [...], region, lightFlag }`.
  Region derived from area (above-ground, house interior, cellar, dungeon, river/coast, etc.)
  to drive palette/mood.
- `src/engine/roomState.ts`: load `rooms.json`; map Z-machine **object number → room id** so
  the live engine's current room resolves to a graph node.

### Phase 3 — Current-room introspection
- `src/engine/introspect.ts`: after each turn, read the player object's parent from ZVM's
  memory (object table base from header; standard Z-machine v3 object layout). Emit
  `onRoomChange(roomId)`. Fallback/cross-check: match printed room header line.
- **Gate:** moving in the text game logs the correct `currentRoomId` every time, including
  dark rooms and revisits.

### Phase 4 — Three.js room generation
- `src/render/roomBuilder.ts`: from a `rooms.json` node, build a scene: a box room sized by
  a heuristic, **doorway openings cut at walls matching real compass exits**, up/down exits as
  stair/hatch geometry, object billboards/sprites for items currently present (driven by live
  object-tree contents, not just static data), region-based palette/materials/lighting.
- `src/render/viewport.ts`: Three.js renderer, first-person camera, render to a **low-res
  target** then upscale. On `onRoomChange`, swap to that room's scene (camera placed facing
  the entry doorway). Light flag off + no light source = darkness (matches game).

### Phase 5 — Retro pipeline (the "amazing" part)
- `src/render/retro/` shader chunks:
  - **Vertex snap** (quantize clip-space x/y to a low grid) — PS1 jitter.
  - **Affine texture mapping** (`noperspective` UVs) — early-3D warping.
  - **Color quantization to 15-bit + Bayer ordered dithering** in fragment shader.
  - **CRT post** (EffectComposer pass): scanlines, phosphor bloom/glow, barrel curvature,
    chromatic aberration, vignette. Same CRT treatment applied to the terminal panel for a
    unified single-screen look.
- Tunable `retroConfig` (resolution scale, palette depth, dither strength, CRT intensity).

### Phase 6 — Polish
- Hand-tune ~6–10 hero rooms (West of House, Living Room, Cellar, Troll Room, etc.) with
  bespoke props/lighting over the procedural base.
- Subtle camera idle sway; doorway transition; ambient per-region audio (optional).

## Key files to create
- `tools/parse-zil.mjs` — ZIL → `rooms.json`
- `src/engine/zvm.ts`, `src/engine/roomState.ts`, `src/engine/introspect.ts`
- `src/ui/terminal.ts`
- `src/render/viewport.ts`, `src/render/roomBuilder.ts`, `src/render/retro/*`
- `public/zork1.z3`, `public/rooms.json`

## Reuse (don't reinvent)
- **Game engine:** `ifvms.js` ZVM — do NOT write a Z-machine.
- **Map data:** parse from `historicalsource/zork1` ZIL — do NOT hand-author room layout.
- **Retro shaders:** adapt established PS1/CRT shader techniques (vertex-snap, affine UVs,
  Bayer dither, CRT pass) rather than inventing from scratch.

## Risks / watch-items
- **ZILF build** needs .NET; if it's friction, fall back to a known-good prebuilt Zork I
  `.z3` (still MIT-sourced game) and keep the ZILF path documented.
- **Object-table introspection** depends on ZVM exposing its memory array; if blocked, the
  text-header parse is a workable fallback for current-room.
- **Procedural rooms won't be literal architecture** (no canonical Zork blueprints) — they're
  evocative, exit-accurate spaces, not floorplans. Hero rooms close the gap where it matters.

## Verification
- **Phase 1:** side-by-side a few commands vs a reference Zork transcript — output identical.
- **Phase 3:** scripted walk (`N`, `E`, `enter house`, `go down`…) logs correct room ids,
  including darkness.
- **Phase 4–5:** `npm run dev`, play through the opening (mailbox → house → cellar); confirm
  each move swaps to a room whose doorways match the available exits and whose mood matches
  the region. Screenshot the CRT/PS1 look.
- Use the Chrome MCP tools to drive the running app and capture screenshots for visual review.
