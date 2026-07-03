# CLAUDE.md — working on zork-ui

## The one law: observe, never interfere

The Z-machine runs the original `zork1.z3` untouched. Everything in this repo
is a READ-ONLY shell around it: we read Z-machine memory and output text, and
render/react. Never inject commands into the game, never patch game logic,
never fork rules. UI-only commands (`help`, `clue`) are intercepted before the
engine and don't consume a turn. If a feature seems to need changing the game,
it needs a different design.

## Architecture map

- `src/engine/` — Z-machine plumbing. `zvm.ts` boots ifvms; `glkoteWeb.ts` is
  the Glk I/O layer (input handling, status line); `introspect.ts` reads raw
  Z-machine memory (object tree, decoded v3 short names); `roomState.ts`
  resolves the current room and its LIVE contents (walks the object tree,
  skips the player, maps short names → ZIL ids via objects.json).
- `src/scenes/` — the pixel art. `index.ts` = registry (room id → scene fn) +
  `getRoomScene`; `kit.ts` = toolkit/backdrops/sprites shared across regions;
  `rooms-{house,forest,dungeon,maze,river,mine,temple}.ts` = per-region scene
  functions; `state.ts` = `roomState` flags, `rf`/`hasObj`, and the shared
  cross-room accessors (`isRainbowSolid`, `isTrapOpen`, `isBasketLowered` —
  use these, never raw rf, for another room's flag). `src/ui/roomScenes.ts`
  is only a compatibility shim.
- `src/game/` — `triggers.ts`: declarative table wiring game OUTPUT TEXT to
  scene flags (this is how the world reacts — add new interactions HERE);
  `clues.ts`: the room-aware hint system; `players.ts`: save slots + the
  slot-scoped localStorage keys.
- `src/ui/` — `map.ts` (Trizbort-style auto-map), `compass.ts` (tappable),
  `scene2d.ts` (the rAF loop), `titleScene.ts`.
- `src/audio/ambience.ts` — generative WebAudio, zero files, moods by
  room-family regex.
- `public/rooms.json` + `public/objects.json` — ground truth for every room
  and object id. `tools/validate-ids.mjs` (runs in `npm run build`) FAILS on
  any hard-coded id that isn't in this data. Trust it.

## Craft rules (scenes)

Read `.claude/skills/retro-pixel-scene/SKILL.md` before touching any scene —
it is the validated style (256px buffer, hard upscale, Bayer dither,
hue-shifted ramps, the masters' methods) and the anti-pattern list. The two
project-specific laws:
1. **Game fidelity**: atmosphere is free; game-meaningful elements must match
   the room's actual text (no invented lit windows, fires, creatures).
2. **Both flag branches must render.** Every `rf()`/`hasObj()` in a scene has
   two states the player can reach — verify both with screenshots.

Player-facing text (clues, help, flavor) is written in the narrator's voice:
wry, in-world, spoiler-light, no all-caps command lists. Example of the bar:
"Hear the trap door slam? Someone down here doesn't like visitors using it."

## Verification workflows (use them, they exist for a reason)

- Dev server: `npm run dev` → localhost:5174. Scene edits = full page reload
  (wait ~3s), then re-`begin` (click the title) before using hooks.
- Dev hooks (browser console): `__scene(id)` force-renders any room;
  `__flag(room, key, val)` toggles state; `__thief()`, `__moment("died"|"won")`,
  `__map`, `__mood(id, dark)`, `__trig(cmd, fresh, here, io?)`.
- **Screenshot-verify every scene change** (both flag states) before calling
  it done. This rule has caught something every single time.
- **Refactor oracle**: `__hashScenes()` (dev only) pixel-hashes all 110 scenes
  (default + 15-flag-variant passes). Capture a baseline JSON before a
  refactor, compare after — must be byte-identical.
- `npm run validate` = id checks alone; `npx tsc --noEmit` for types.

## Deploy

`./tools/deploy.sh "commit message"` does everything: validate → typecheck →
commit → push GitHub → `railway up` → wait for SUCCESS → probe the live URL.
Facts: Railway service `zork-ui`, `sleepApplication: true` (wakes on traffic;
the server MUST bind `::` — IPv4-only 502s at Railway's edge after wake).
Domains: https://zork.arobase.co (Cloudflare DNS-only CNAME — keep the proxy
OFF; Railway's own CDN caching is enabled) + zork-ui-production.up.railway.app.
Hashed `/assets/` ship `immutable`; index.html ships `no-cache`.

## Conventions

- Commits author as `posabsolute` (repo-local git config; the user's real name
  must not appear anywhere in the repo).
- The public repo is a showcase — keep README screenshots/URLs current.
- localStorage keys are slot-scoped via `src/game/players.ts` — never invent a
  new unscoped key.
