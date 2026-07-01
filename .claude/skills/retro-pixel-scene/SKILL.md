---
name: retro-pixel-scene
description: Compose, render, or IMPROVE a retro PIXEL-ART scene (Daggerfall / Arena / SCUMM / Mark Ferrari look) on an HTML5 canvas — chunky dithered pixels, hue-shifted palette ramps, one key light, focal detail hierarchy. Use when building or refining a 2D illustration of a place (a room, a vista) that must read as an authentic 90s game scene rather than a vector drawing or a kid's sketch.
---

# Building a retro pixel-art scene

This is the validated style for zork-ui room scenes. It came after glowing
vector line-art and filled silhouettes were both rejected as "a kid's drawing."
The lesson: **for representational scenes, the medium has to be textured,
dithered pixels — not strokes.** The texture and the dither *are* the retro.

Reference era/technique: id/Bethesda first-person CRPGs (Daggerfall, Arena),
LucasArts SCUMM backgrounds (Monkey Island, Loom), Sierra VGA, and Mark
Ferrari's limited-palette dithered landscapes. NOT modern Slynyrd/Saint11
high-saturation sprite art — that reads as contemporary indie, not retro.

## The one non-negotiable: render small, upscale hard

Render the whole scene into a **tiny offscreen buffer** (~256px wide) and then
`drawImage` it to the visible canvas with `imageSmoothingEnabled = false`. Every
pixel becomes a chunky block. This single step is what makes it read as retro.
Never draw at full resolution and try to "look pixelly" — you must actually work
at low resolution.

```
pixelStage(ctx, w, h, 256, (p, pw, ph) => { /* draw here, in pixel space */ });
// see src/ui/roomScenes.ts: _pbuf offscreen canvas + nearest-neighbour upscale
```

Consequences that follow from this:
- **Integer coordinates only.** Snap every x/y/w/h to whole pixels. Sub-pixel
  positions blur the grid.
- **No soft blur, no `shadowBlur`, no additive neon glow.** That is the rejected
  vector look. Glow is faked with *dithered concentric value steps* in the
  buffer (`ditherGlow`), not a gaussian halo.
- **No hand anti-aliasing at this scale.** At 256px wide, embrace the
  stair-step. Clean diagonals come from CONSISTENT pixel runs (1:1, 2:1, 3:1
  steps), not from blending; an irregular run (2,1,3,1,2) reads as a jaggy.

## Value structure FIRST — the squint test

Before any colour or texture, the scene must work as **three value masses**:
dark, mid, light. Squint (or scale the screenshot to 32px): you should still
see the composition — sky mass vs ground mass vs subject silhouette, and ONE
brightest spot where the eye should land. If the squinted image is uniform mud,
no amount of texture will save it.

- Design the **silhouette of the landmark first** (the house, the dam, the
  sarcophagus). It must be identifiable from shape alone, in one second,
  before any interior detail. This is what 90s artists nailed with 16 colours.
- Reserve the **highest value AND highest contrast edge** for the focal point.
  Everything else stays within a compressed value band.
- Keep big masses BIG. A 256px scene supports roughly 3 depth layers
  (far / mid / near) — more layers than that and they merge into noise.

## Colour: hue-shifted ramps, not tints of one colour

- **Build each material as a short ramp (3-5 steps) that rotates hue**: shadows
  bend toward blue/violet, highlights bend toward yellow/orange. A stone ramp
  is not `#333→#999` grey; it's cool dark `[22,21,26]` → warm light
  `[68,66,74]`. Straight-line ramps (only value changes) are the #1 tell of
  programmer art.
- **Share ramps across materials** to unify the scene — the classic 90s move
  when you only had 16-32 colours. The wall's darkest step can be the floor's
  shadow and the prop's outline. Fewer total colours = more cohesion.
- **Never pure black or pure white** inside the scene. Darkest shadow keeps a
  hue (e.g. `#070708`, `#0a0202` in hades); brightest light stays under ~90%.
  Reserve near-black for the foreground framing element and cut exits.
- **Keep the palette small and committed** — a night scene is ~2 sky values, 2
  ground values, 1 moon, 1 treeline, a wall ramp (3-4 values), one warm accent.
  More hues = muddy and modern.
- Distance = lower contrast + cooler + lighter (atmospheric perspective). The
  far treeline is a near-flat dark silhouette; the foreground tree is
  near-black.

## Dithering: a transition tool, not a paint

- **Fake gradients with ordered (Bayer 4x4) dithering** (`dth`, `quant`), not
  smooth ramps. A sky gradient is two colours interleaved by a Bayer threshold.
- **Dither the TRANSITION band only** — the middle ~third where two ramp steps
  meet. A surface that is 100% dithered everywhere reads as static/noise
  ("dither soup"); a surface with zero dither reads as flat vector. Solid step
  → dithered band → solid step.
- **Texture in clusters of 2+ pixels**, never lone orphan pixels — a single
  stray pixel at 256px reads as a dead pixel, not texture.

## Detail is a spotlight, not a coat of paint

Distribute detail by importance, not evenly:
- The **focal subject** gets the fine detail: 2-3 identifying features (the
  sarcophagus gets a mummiform outline + pharaoh mask; the dam gets its gates
  + spillway; the machine gets dials + a lid).
- **Mid-ground** gets texture passes only (masonry courses, board lines).
- **Background** stays as near-flat dithered masses.
An evenly-detailed scene has no focal point; the eye bounces and reads "busy
but cheap." When improving an existing scene, often the fix is to REMOVE
texture from the edges, not add more to the middle.

Edge/outline discipline (sel-out): where a shape sits against a LIGHTER field,
darken its edge one ramp step; where light rakes across its top, lighten the
edge instead. Never a uniform black outline around everything — that's the
rejected drawing look.

## Built rooms = a perspective BOX, not noise

A man-made interior (cellar, passage, temple, dam) must read as an enclosed
space, or it looks like a kid's drawing. Don't fill the frame with a flat
gradient + random noise (that's a natural cave at best). Instead build a
one-point-perspective box:
- **back wall** (an inset rectangle) + **floor**, **ceiling**, **left/right
  walls** as the four trapezoids around it, each a DIFFERENT value so the box
  reads 3D (lit wall brighter, shadowed wall darker, ceiling darkest, floor
  lit by the lamp). Classify each pixel into a plane (see `stoneRoom`).
- **oriented material, not dots**: masonry courses on walls (horizontal mortar
  lines, staggered verticals), a **flagstone grid on the floor in perspective**
  (depth lines widening toward the viewer, width lines fanning to the vanishing
  point). The perspective floor grid is what most sells the room.
- cut **exits into the planes** (a dark doorway in the back wall, a hole in the
  floor) rather than floating arches.
Reference: `stoneRoom()` / `builtRoom()` + `STONE_PALS` in roomScenes.ts (the
Cellar). Keep `caveBackdrop` for natural caves/mines only.

## Texture every surface — and texture follows FORM

Flat rectangles read as cheap/clip-art. Give each surface a cheap repeating
texture in pixel space, and orient it along the surface:
- clapboard wall = horizontal board-shadow line every 3rd row,
- shingled roof = stepped triangle filled row-by-row, every 3rd row darker,
- grass/dirt = clustered hash noise nudging between two adjacent ramp steps,
- water = banded values + flow-directed highlight streaks (never random noise),
- a curved surface (dome, barrel) = its texture lines curve with it.
A two-value alternation per row is enough; the dither does the rest. Texture
running against the form (vertical lines on a floor plane) breaks the 3D read.

## Respect the game — atmosphere is free, game elements are not

This is the most important rule and the easiest to break for the sake of a
pretty picture. **Ambient/atmospheric effects are creative licence;
game-meaningful elements must match the room's actual text.**

- ✅ Free to add: night/moonlight, fog, rain, wind, a forest's dappled daylight,
  haze, the general palette/mood. These set tone without asserting facts.
- ❌ Do NOT invent game-relevant elements: a **lit window implies an occupant /
  light source**; a fire, a lamp, an open door, a creature, an item — these are
  things a player reasons about. (Real example: the white house is *boarded up
  and empty* — a glowing warm window was wrong; it must be dark, moonlit only.)
- A **warm key light is only valid if the game gives you a real source** (your
  lit lantern underground, the torch room's torch, daylight). Otherwise the
  **moon is the key light** and the scene is cool.
- When in doubt, re-read the room's `ldesc` and object list; render what's
  actually there, lit the way the game implies.

## Interactive state — scenes are game UI, not paintings

Rooms have PER-ROOM flags in `roomState` (roomScenes.ts, with a comment block
listing every flag: `trapOpen`, `rugMoved`, `trollDead`, `gatesOpen`,
`drained`, `coffinOpen`, `ropeTied`, `leavesMoved`, `torchTaken`, …). Scene
functions read them via `rf(room, key)` / `treasuresOf(room)`; the game engine
sets them with `setRoomFlag`.

When improving a scene that has flags, you MUST:
1. Find every `rf(...)` call in that scene and keep BOTH branches rendering —
   the closed trap door AND the open hole, the troll AND the empty room.
2. Design the two states to be **visibly different at a glance** (the flag
   exists because the player changed the world — show it).
3. Verify both states in the screenshot pass: call
   `setRoomFlag('LIVING-ROOM','trapOpen',true)` from the browser console (or
   play the commands) and re-screenshot.
Breaking a flag branch is worse than an ugly scene — it lies to the player.

## Light, mood, composition

- **One key light.** Dark, moody, a single dominant light (usually the moon
  glow-pool, or your lantern underground) with everything else cooler and
  dimmer. Two competing light pools = no focal point.
- **Compose with a horizon**, subject off-centre (rule of thirds), and a dark
  foreground element (a near-black tree, a rock lip) framing/occluding an edge
  for depth.
- **Avoid tangents**: don't let two silhouettes kiss edge-to-edge (treeline
  grazing the roofline, moon touching a branch) — overlap clearly or separate
  clearly.
- **Vary it across sibling rooms** so they don't look identical: move the moon,
  change the building face, add/withhold the warm light, route a path
  differently, reseed the ridge. Drive these from the room's actual text.

## Always animate (cheaply, on the grid)

A still frame is dead, but keep motion pixel-honest. The master reference is
Mark Ferrari's **colour cycling**: animate by shifting WHICH pixels get the
highlight value over time, while the geometry stays put.
- stars: toggle a 1px pixel on/off by `|sin(t*2 + i)| > threshold` (twinkle),
- water/waterfall: fixed shape, highlight streaks whose phase scrolls along the
  flow direction (`waterfall()` is the reference),
- torch/lamp flame: cycle 2-3 flame values through a fixed cluster of pixels,
  and flutter the `ditherGlow` peak a few percent,
- rain: 1x2 pixel streaks falling on fixed x columns,
- sway: offset a foreground tree by `sin(t*ω)` (integer-rounded),
- creatures: 2-frame idle (the troll's chest, the thief's cloak) beats a
  static sprite.
One or two motions per scene. Everything moving = screensaver.

## Workflow (do this every time)

For a NEW scene:
1. Read the room's real description + object list; list its defining features
   (door? boarded? path direction? key props? which flags exist?).
2. Block the three value masses and the landmark silhouette. Squint-check.
3. Draw back-to-front: dithered sky/void + glow → far silhouettes → ground
   texture → mid subject → props/flag-driven elements → foreground frame →
   weather/animation.

For IMPROVING an existing scene:
1. Screenshot the current scene in the running app FIRST — diagnose against
   the checklist below before touching code (usually the fault is: no focal
   hierarchy, dither soup, straight-grey ramps, or a flat unrecognizable prop).
2. List the room's `roomState` flags and locate every `rf()` branch — these
   must survive the rework.
3. Rework, reusing the shared scapes/helpers (below) rather than forking them.
4. Re-screenshot BOTH flag states.

**Screenshot-verify in the running app before claiming it's done.** Judge:
- squints to 3 readable value masses with one focal? landmark identifiable by
  silhouette alone?
- chunky pixels? dithered transitions (not full-surface noise, not banded
  blur)? tight hue-shifted palette (no straight greys, no pure black/white)?
- textured surfaces oriented with their form? detail concentrated at focal?
- one key light? depth via 3 layers + dark foreground frame? no tangents?
- moving (subtly)? faithful to the description? both flag states work?

## Anti-patterns (what made earlier attempts fail)

- ❌ Glowing vector outlines / `S`/`F`/`neon` strokes (the legacy helpers at the
  top of roomScenes.ts) → rejected as childish. Never use them in scenes.
- ❌ Flat filled silhouettes with no texture → also read as a drawing.
- ❌ Rendering at full res + soft blur "glow" → not retro; render small instead.
- ❌ `imageSmoothingEnabled` left true → mushy, kills the whole effect.
- ❌ Sub-pixel/fractional coordinates → blurred grid.
- ❌ Straight grey/value-only ramps → programmer art; ramps must shift hue.
- ❌ Too many hues / saturated modern ramps → contemporary, not 90s.
- ❌ 100%-dithered surfaces ("dither soup") or stray single noise pixels →
  dither transitions only, cluster texture.
- ❌ Even detail everywhere → no focal point; detail is a spotlight.
- ❌ Moving water as per-pixel random `hash` → TV static. Water needs flow
  direction: dithered base + highlight streaks scrolling along the flow.
- ❌ A key prop as a glowing blob → recognizable silhouette + 2-3 identifying
  details. The glow alone is not the prop.
- ❌ A floor opening / crawlway as a flat black rectangle → recess it (lit stone
  lip + arches stepping back to black). (`hole()`/`tunnel()` are the reference.)
- ❌ **Inventing game elements for prettiness** (a lit window on an empty house,
  a fire that isn't there) → respect the description; atmosphere only.
- ❌ Reworking a scene and dropping an `rf()` flag branch → the world stops
  reacting to the player. Check both states.
- ❌ Declaring it done without a screenshot.

## Implementation reference (this project — current architecture)

`src/ui/roomScenes.ts` (~2400 lines), driven by `src/ui/scene2d.ts`'s rAF loop
calling a `SceneDraw(ctx, w, h, t)`.

- **Entry**: `getRoomScene(room, objects)` → looks up `SCENES[room.id]`
  (hand-built scenes) or falls back to `composeRoom()` (procedural: region +
  ldesc keywords pick a scape, then `drawProp` scatters the room's objects).
  A hand-built scene beats the fallback — promoting a room out of
  `composeRoom` into `SCENES` is the standard improvement path.
  `darknessScene` renders unlit rooms (pure black + grue eyes) — never
  fabricate light the player doesn't have.
- **Pixel core**: `pixelStage` (offscreen buffer + hard upscale), `dth`
  (Bayer 4x4), `quant`, `mix`, `hash`, `sp`, `fillDisc`, `ditherGlow`.
- **Shared scapes** (reuse, don't fork): `pixelBackdrop` (outdoor night: sky,
  moon, ridge, ground), `forestBackdrop`, `interiorBackdrop` (house rooms),
  `caveBackdrop` + `pickPal`/`litCave`/`lampPal`/`mazePal` (natural
  underground), `stoneRoom`/`builtRoom` + `STONE_PALS` (man-made interiors),
  `canyonBackdrop`, `riverBase`, `waterFill`, `waterfall`, `rainbowArc`.
- **Structures/exits**: `housePixel` (the colonial, per-face opts),
  `pixelPath`, `tunnel`, `darkArch`, `stairsUp`/`stairsDown`, `trapDoor`,
  `exitsBox`, `drawExitsCave` + `DIRPOS` (exit affordances from room data).
- **Props/creatures**: `drawProp` (name→sprite dispatch), `treasureGlint` +
  `TREASURE` regex, `trollSprite`, `thiefSprite`/`flashThief`, `creature`,
  `figureProp`, `mailboxPixel`, `fgTreePixel`, `pixelTree`, `rainPixel`.
- **Interactive state**: `roomState` (flag table with a comment listing every
  flag), `setRoomFlag`, `rf`, `treasuresOf` — see the Interactive state
  section above.
- **Legacy vector helpers** (`bg`, `S`, `F`, `neon`, `stars`, `moon`, …, lines
  ~11-343): title-screen era. Do not use for room scenes.
- Verified examples: WEST/NORTH/SOUTH/EAST-OF-HOUSE (one backdrop + one
  configurable house varied per room text), `cellarPixel` (built box),
  `waterfall` (flow animation), `livingRoomPixel` (flag-heavy interior).
