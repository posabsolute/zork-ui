# Zork-UI — Visual Design Language

The 3D view is a **glowing vector world**: 1980 vector arcade (Battlezone, Tempest)
crossed with modern neon (Geometry Wars, Rez). Pure line-art, no textures, no
fake CRT filter. The game underneath is the authentic Zork I — the visuals never
change how it plays.

## Principles
1. **Line, light, and void.** Bright additive strokes on black. The dark is as
   important as the lines — keep real negative space, let the room breathe.
2. **Colour means something** (per-region palette, role-based):
   - *primary* — the architecture (walls, pillars, structure)
   - *accent* — exits and focal features (so doorways read instantly = wayfinding)
   - *detail* — quiet texture, dim
   - shared semantics across all rooms: **warm-white** = an object you can use,
     **orange** = fire/light, **cyan** = water
3. **The world reacts.** The floor is a Geometry-Wars reactive grid that warps and
   **ripples on every command**; the camera punches (FOV + bloom) on each action.
   The grid fades to black just outside the room — no hard edges.
4. **Indoors vs outdoors.** Indoor rooms are enclosed (ceiling + walls). Outdoor
   rooms are **open to the sky** — no ceiling/walls, cool blue stars, horizon grid.
5. **Motion = character (1–3 per room).** Every room has at least one moving
   element and never more than three, or it turns busy. Tag a line group with
   `userData.motion` (see `motion.ts`) — the viewport animates it.
   - `flame` flicker · `water` flow · `twinkle` stars · `glow` breathe · `wisp`
     drift · `drift` slow-rotate
6. **Bloom is the glow** (real phosphor bloom), restrained. No scanlines, no PS1
   jitter, no chromatic aberration.

## Pipeline (where things live)
- `reactiveGrid.ts` — warping, rippling, distance-faded floor
- `particles.ts` — stars (outdoor) / motes (indoor)
- `roomBuilder.ts` — room shell + portals + objects; calls decor or hero
- `decor.ts` — procedural per-region set-dressing (+ tags moving elements)
- `heroRooms.ts` — hand-authored iconic rooms (+ optional bespoke `animate`)
- `objectIcons.ts` — recognizable object silhouettes, placed on floor/walls
- `motion.ts` — generic per-object animation
- `config/regions.ts` — palettes (primary/accent/detail) + semantic colours

## Per-region intent (procedural rooms)
| Region | Mood / palette | Set pieces | Moving element |
|---|---|---|---|
| forest | open night field, green + blue sky | trees (warm canopies), tufts | **stars twinkle** |
| house | warm amber interior | table, chair, rug, window | **lamp flame** |
| cellar | ember gloom | stalactites, rubble, timber | **mineral vein glows** |
| dungeon | cold cyan stone | pillars, sconce, stalactites | **sconce flame** |
| maze | violet, disorienting | false openings, struts | **will-o'-wisp drifts** |
| temple | gold, sacred | colonnade, steps | **altar/arch glow** |
| river | cyan water | banks, reeds | **water flows** |
| hades | red, infernal | gate, skull, cracks | **flames** |
| mine | amber rock | timber frames, rails | **miner's lamp flame** |

## Hero-room intent (what each should *do*)
A hero room overrides procedural decor so the scene matches the prose and gives
the place its signature moment. Keep to the language above; 1–3 moving elements.

| Room | Signature experience | Motion |
|---|---|---|
| West/N/S/Behind House | open field, the white house facade on the correct side | stars |
| Living Room | trophy case (accent), oriental rug, **trap door** beneath | (add: lamp) |
| Kitchen | table, chimney, window ajar east, stairs up | (add: hearth) |
| Attic | cramped, table, coil of rope, rafters | (add: lantern) |
| Cellar | the ramp you fell down, **trap door open above** | light shaft |
| Troll Room | the troll, bloody axe | (add: axe glint) |
| Round Room | circular hub, 8 radiating spokes | (add: spoke pulse) |
| Cyclops Room | looming cyclops | **eye blink** |
| Treasure Room | thief's hoard, jewels, chest, the thief | (add: jewel shimmer) |
| Egyptian Room | the gold coffin | (add: gold glow) |
| N/S Temple | brass bell / altar + arch | **candle flames** |
| Torch Room | pedestal torch under a dome | **flame** |
| Entrance to Hades | barred gate of the underworld | **spectral wisps** |
| Land of Living Dead | wandering shades, crystal skull | (add: skull glow) |
| Loud Room | deafening | **expanding sound rings** |
| Dam Room | dam wall, control panel + bolt | (add: bubble pulse) |
| On the Rainbow | multi-colour rainbow bands | **shimmer** |
| Gas Room | reeking vapours (no flame!) | **drifting gas** |

## Queue — next hero rooms (keep the language + 1–3 motion)
- **Dome Room** — railing over the torch-room drop; rope to tie. Motion: torch glow below.
- **Mirror Room 1/2** — a great mirror; touch to teleport. Motion: mirror shimmer.
- **Grating Room** — grating to the clearing above; light leaks down. Motion: light shaft.
- **Up a Tree** — bird's nest with the jewelled egg. Motion: leaves sway.
- **Reservoir / N / S** — drainable water body. Motion: water (level shifts with state).
- **Frigid River 1–5** — the current carries the boat downstream. Motion: flowing water.
- **Aragain Falls / End of Rainbow** — the falls + pot of gold. Motion: falling water.
- **Dam Lobby / Maintenance Room** — guidebook/matches; coloured buttons + tool chests.
- **Machine Room** — the coal→diamond machine; lid + switch. Motion: machine hum/drift.
- **Shaft Room** — basket on a chain over a black shaft. Motion: chain sway.
- **Mine maze / Gas / Bat** — coal mine; the bat (garlic!). Motion: bat flap.
