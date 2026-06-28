/*
 * motion.ts — generic per-object motion so every room has life.
 *
 * Any LineSegments tagged with `userData.motion` is animated each frame by the
 * viewport. Design rule: 1–3 moving elements per room (a guttering flame, a
 * flowing stream, twinkling stars) — enough to give character, never so much it
 * turns busy. Hero rooms may still define a bespoke `animate()` for complex motion.
 */
import * as THREE from "three";

export type MotionKind =
  | "flame"   // guttering fire / candles / sconces
  | "water"   // flowing surface
  | "twinkle" // stars / distant lights
  | "glow"    // a focal feature breathing (altar, vein, window)
  | "wisp"    // a drifting spirit / mote
  | "drift";  // slow rotation (mist, machinery)

export function tagMotion(obj: THREE.Object3D, kind: MotionKind, seed = 0) {
  obj.userData.motion = kind;
  obj.userData.seed = seed;
  if ((obj as any).material) {
    (obj as any).material.transparent = true;
    obj.userData.baseY = obj.position.y;
  }
}

export function applyMotion(o: THREE.Object3D, t: number) {
  const kind: MotionKind | undefined = o.userData.motion;
  if (!kind) return;
  const s: number = o.userData.seed ?? 0;
  const mat = (o as any).material as THREE.Material & { opacity: number };

  switch (kind) {
    case "flame":
      o.scale.y = 1 + Math.sin(t * 11 + s) * 0.14 + Math.sin(t * 7.3 + s) * 0.06;
      if (mat) mat.opacity = 0.75 + 0.25 * Math.abs(Math.sin(t * 9 + s));
      break;
    case "water":
      o.position.z = Math.sin(t * 0.5 + s) * 0.12;
      if (mat) mat.opacity = 0.55 + 0.4 * Math.abs(Math.sin(t * 1.4 + s));
      break;
    case "twinkle":
      if (mat) mat.opacity = 0.35 + 0.6 * Math.abs(Math.sin(t * 2.1 + s));
      break;
    case "glow":
      if (mat) mat.opacity = 0.55 + 0.45 * Math.abs(Math.sin(t * 1.5 + s));
      break;
    case "wisp":
      o.position.y = (o.userData.baseY ?? 1) + Math.sin(t * 1.3 + s) * 0.3;
      if (mat) mat.opacity = 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + s));
      break;
    case "drift":
      o.rotation.y = t * 0.05 + s;
      break;
  }
}

export function animateGroup(group: THREE.Object3D, t: number) {
  group.traverse((o) => {
    if (o.userData && o.userData.motion) applyMotion(o, t);
  });
}
