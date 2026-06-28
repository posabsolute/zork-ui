# Hero Rooms

Hand-authored scenes that override the procedural decor so the view matches the
game's prose. The registry in `src/render/heroRooms.ts` (`HERO_ROOMS`) is the
source of truth; this file mirrors it for quick reference.

To hero a new room: add an entry to `HERO_ROOMS` keyed by its ZIL room id (see
`public/rooms.json` for ids), then add a line here.

## Heroed so far
- [x] **WEST-OF-HOUSE** — open field, boarded front door, white house to the east
- [x] **NORTH-OF-HOUSE** — open field, white house to the south (barred windows)
- [x] **SOUTH-OF-HOUSE** — open field, white house to the north (barred windows)
- [x] **EAST-OF-HOUSE** (Behind House) — open field, white house to the west, window ajar
- [x] **LIVING-ROOM** — trophy case, oriental rug, trap door beneath, beamed ceiling
- [x] **KITCHEN** — table, chimney, window ajar to the east, stairs up

## High-value candidates next
- [ ] **CELLAR** — where you fall in; dark, ramp, trap door above
- [ ] **TROLL-ROOM** — the troll with his axe
- [ ] **ATTIC** — dark, rope, table
- [ ] **FOREST-1 / FOREST-2 / FOREST-3** — dense forest variants
- [ ] **CLEARING** / **FOREST-PATH** — the grating clearing, up a tree
- [ ] **GALLERY** — painting
- [ ] **EGYPTIAN-ROOM / TEMPLE / ALTAR** — the temple complex
- [ ] **DAM / DAM-LOBBY / RESERVOIR** — the flood control dam
- [ ] **MAZE** rooms — deliberately disorienting
- [ ] **CYCLOPS-ROOM**, **TREASURE-ROOM** — the thief's lair
