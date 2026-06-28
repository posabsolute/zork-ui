# Hero Rooms

Hand-authored scenes that override the procedural decor so the view matches the
game's prose and gives each iconic place a real moment. The registry in
`src/render/heroRooms.ts` (`HERO_ROOMS`) is the source of truth; this file mirrors
it. Hero specs may also define an `animate(objs, t)` hook for motion.

To hero a room: add an entry to `HERO_ROOMS` keyed by its ZIL room id (see
`public/rooms.json`), then tick it here.

**Progress: 22 / 110**

## Heroed
### House & surrounds
- [x] WEST-OF-HOUSE — open field, boarded door, white house east
- [x] NORTH-OF-HOUSE — open field, house south
- [x] SOUTH-OF-HOUSE — open field, house north
- [x] EAST-OF-HOUSE (Behind House) — house west, window ajar
- [x] LIVING-ROOM — trophy case, rug, trap door, beams
- [x] KITCHEN — table, chimney, window ajar, stairs up
- [x] ATTIC — table, coil of rope, knife, rafters

### Underground core
- [x] CELLAR — ramp up the west wall, trap door open above
- [x] TROLL-ROOM — the troll with his bloody axe ✦
- [x] ROUND-ROOM — circular hub, 8 radiating spokes
- [x] CYCLOPS-ROOM — looming cyclops, single eye *(animated blink)*
- [x] TREASURE-ROOM — the thief's hoard of jewels + chest

### Temple complex
- [x] EGYPT-ROOM — the gold coffin / sarcophagus
- [x] NORTH-TEMPLE — brass bell, prayer book, columns
- [x] SOUTH-TEMPLE (Altar) — altar + arch, *(animated candle flames)*
- [x] TORCH-ROOM — pedestal torch under a dome *(animated flame)*
- [x] ENTRANCE-TO-HADES — barred gate, *(animated spectral wisps)*
- [x] LAND-OF-LIVING-DEAD — wandering shades, glowing crystal skull

### Set-piece rooms
- [x] LOUD-ROOM — *(animated expanding sound ripples)*
- [x] DAM-ROOM — sloped dam wall, control panel + glowing bolt/bubble
- [x] ON-RAINBOW — multi-coloured rainbow bands *(animated shimmer)*
- [x] GAS-ROOM — drifting coal-gas vapours *(animated)*

## Next candidates
- [ ] DOME-ROOM — railing over the torch-room drop; tie the rope
- [ ] MIRROR-ROOM-1 / MIRROR-ROOM-2 — the teleport mirror
- [ ] GRATING-ROOM — grating up to the clearing
- [ ] UP-A-TREE — bird's nest + jewelled egg
- [ ] GALLERY — the painting; STUDIO — chimney up
- [ ] DAM-LOBBY / MAINTENANCE-ROOM — buttons, tool chests, the wrench
- [ ] RESERVOIR / RESERVOIR-N/S — drainable water *(animate)*
- [ ] RIVER-1..5 (Frigid River) — flowing current *(animate)*
- [ ] ARAGAIN-FALLS / END-OF-RAINBOW — the falls + pot of gold
- [ ] MACHINE-ROOM — the coal→diamond machine; SHAFT-ROOM — basket on the chain
- [ ] SLIDE-ROOM, BAT-ROOM, MAZE-* (skeleton), the coal MINE-* maze
- [ ] CANYON-VIEW / CANYON-BOTTOM — the great canyon vista
