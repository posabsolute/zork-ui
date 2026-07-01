---
name: retro-2d-scene
description: DEPRECATED — glowing vector/neon line-art for 2D scenes. This style was rejected as looking like "a kid's drawing." For zork-ui room scenes use the `retro-pixel-scene` skill instead. Kept only for the title-screen vector aesthetic (titleScene.ts), which still works for an abstract single-subject composition.
---

> ⚠️ **Superseded for room scenes.** Glowing line-art reads as childish for
> representational scenes (a house, a vista). Use **`retro-pixel-scene`** for
> those. The techniques below still apply to the abstract title screen only.

# Building a retro-realistic 2D scene

A scene looks "real" not because it's literal, but because it obeys how light, depth,
and atmosphere actually behave — then renders that in a tight retro palette. Flat
icon + thin outline = children's drawing. Layered light + depth + motion = a scene.

## The non-negotiables (every scene)

1. **One subject, one key light.** Decide the focal object and the single dominant
   light source. Everything else supports it. Compose it off-centre (rule of thirds),
   not dead-centre.
2. **Depth in 3+ layers**, back-to-front, with *atmospheric perspective*:
   - far = dimmer, cooler, hazier, lower-contrast;
   - near = brighter, sharper, warmer, higher-contrast.
   Parallax: nearer layers are larger and move more.
3. **Glow = two passes, never one.** Draw each neon stroke twice: a wide, low-alpha
   blurred "halo" pass, then a thin bright core. One-pass lines look like clip-art.
   (`shadowBlur` + additive `globalCompositeOperation = "lighter"`.)
4. **Atmosphere fills the empty space.** Gradient sky, soft haze/fog, particles
   (stars, embers, rain, dust, fireflies). Never leave large dead flat areas.
5. **Everything moves, subtly and always.** Twinkle, drift, sway, flicker, pulse,
   parallax. A still frame is dead. Tie motion to a time `t`; keep amplitudes small
   except for intended drama (rain, flame).
6. **Tight palette.** 2–3 hues max + neutrals. Pick a signature pair (e.g. cyan +
   magenta) and commit. Colour means something (structure vs accent vs light).
7. **Vary line weight & add small detail.** Uniform 2px outlines read cheap. Thick
   for nearby/important, thin for far/minor; add a few small details (texture,
   imperfection) so it doesn't read as a symbol.

## Composition recipe

- Establish a **horizon** (even implied). Sky above, ground below, subject on/near it.
- Lay layers: `gradient sky → distant silhouette (dim) → mid subject (bright) →
  foreground frame (dark, large)`.
- Lead the eye: a path, a river, a light shaft, converging lines toward the subject.
- Negative space is composition, not waste — give the subject room to breathe.

## Light & reflection

- Pick warm OR cool key light; let the opposite hue be the accent. Add a soft
  **glow pool** (radial gradient) around the light source.
- **Wet-ground reflection done right:** never mirror a hard flipped copy (it reads as
  a duplicate object / glitch). Instead smear the subject's *colours* downward as
  soft vertical gradient streaks that waver slightly and fade out — a colour bleed,
  not a clone. Break it with horizontal ripple lines.

## Animation patterns

- stars: opacity twinkle `0.35 + 0.65*|sin(t*1.4 + i)|`
- drift (clouds/fog/embers): `x = (t*speed + seed) % range`
- sway (grass/trees/flame): `+ sin(t*ω + phase)*amp`
- flicker (neon sign): `sin(t*9+i) > 0.9 ? dim : full`
- pulse (glow): `base + k*sin(t*ω)`

## Anti-patterns (the things that made earlier attempts look bad)

- ❌ Hard radial **vignette blob** in the centre → use only a gentle edge darkening
  (inner radius ≥ 0.55 of the frame).
- ❌ **Mirror doubling** for reflections → colour-bleed streaks instead.
- ❌ Single-pass thin outlines, uniform weight → two-pass glow + varied weight.
- ❌ A static frame → always animate.
- ❌ Box+triangle literal icons → stylise (neon, broken silhouette, texture, light).
- ❌ More than ~3 hues, or muddy mixing → commit to the palette.

## Implementation reference (this project)

- `src/ui/roomScenes.ts` — per-room `SceneDraw(ctx, w, h, t)` + the toolkit
  (`bg`, `neon`, `S`/`F`, `stars`, `rain`, `fog`, `fireflies`, `reflectionGlow`).
- `src/ui/scene2d.ts` — the rAF loop driving a scene onto the overlay canvas.
- Verify every scene by screenshot (build → screenshot → critique → fix). Judge it
  against the non-negotiables above before moving on.
