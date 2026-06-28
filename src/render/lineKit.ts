/*
 * lineKit.ts — shared vector-drawing primitives for the wireframe world.
 * Everything is line segments (pairs of xyz) collected into flat arrays, then
 * turned into glowing LineSegments. Plus a seeded RNG so each room varies but
 * stays stable across visits.
 */
import * as THREE from "three";

export type Seg = number[];

export function line(a: Seg, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  a.push(x1, y1, z1, x2, y2, z2);
}

/** Axis-aligned rectangle in the XZ plane at height y. */
export function rectXZ(a: Seg, x1: number, z1: number, x2: number, z2: number, y: number) {
  line(a, x1, y, z1, x2, y, z1);
  line(a, x2, y, z1, x2, y, z2);
  line(a, x2, y, z2, x1, y, z2);
  line(a, x1, y, z2, x1, y, z1);
}

/** Rectangle in the XY plane at depth z. */
export function rectXY(a: Seg, x1: number, y1: number, x2: number, y2: number, z: number) {
  line(a, x1, y1, z, x2, y1, z);
  line(a, x2, y1, z, x2, y2, z);
  line(a, x2, y2, z, x1, y2, z);
  line(a, x1, y2, z, x1, y1, z);
}

/** Wireframe box centred at (cx,cy,cz). */
export function boxEdges(a: Seg, cx: number, cy: number, cz: number, w: number, h: number, d: number) {
  const x1 = cx - w / 2, x2 = cx + w / 2;
  const y1 = cy - h / 2, y2 = cy + h / 2;
  const z1 = cz - d / 2, z2 = cz + d / 2;
  rectXZ(a, x1, z1, x2, z2, y1);
  rectXZ(a, x1, z1, x2, z2, y2);
  line(a, x1, y1, z1, x1, y2, z1);
  line(a, x2, y1, z1, x2, y2, z1);
  line(a, x2, y1, z2, x2, y2, z2);
  line(a, x1, y1, z2, x1, y2, z2);
}

/** Diamond (rotated square) in the XY plane, faces roughly toward the room. */
export function diamond(a: Seg, x: number, y: number, z: number, s: number) {
  const pts = [
    [x, y + s, z], [x + s, y, z], [x, y - s, z], [x - s, y, z],
  ];
  for (let i = 0; i < 4; i++) {
    const p = pts[i], q = pts[(i + 1) % 4];
    a.push(p[0], p[1], p[2], q[0], q[1], q[2]);
  }
}

/** A vertical zig-zag (flames, reeds, cracks) from (x,y0) up to y1. */
export function zigzag(a: Seg, x: number, y0: number, z: number, y1: number, amp: number, steps: number) {
  let px = x, py = y0;
  for (let i = 1; i <= steps; i++) {
    const ny = y0 + ((y1 - y0) * i) / steps;
    const nx = x + (i % 2 === 0 ? -amp : amp);
    line(a, px, py, z, nx, ny, z);
    px = nx; py = ny;
  }
}

export function makeLines(positions: Seg, color: number, opacity = 1): THREE.LineSegments {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  return new THREE.LineSegments(geo, mat);
}

export function makeLabel(text: string, color: number, pos: THREE.Vector3, scale = 1): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 48;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "bold 24px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.fillText(text.replace(/-/g, " ").toLowerCase(), 128, 26);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  sprite.scale.set(2.0 * scale, 0.38 * scale, 1);
  sprite.position.copy(pos);
  return sprite;
}

// Deterministic per-room randomness.
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
