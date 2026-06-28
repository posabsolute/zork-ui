/*
 * decor.ts — per-region set dressing for the wireframe rooms.
 *
 * Channeling Eric Chahi's Another World: evoke a place with a few well-chosen
 * polygon silhouettes and lots of negative space, rather than filling the room.
 * Each region gets its own props (trees, furniture, columns, stalactites, water,
 * flame...) placed by a per-room seeded RNG so spaces vary yet stay stable.
 */
import * as THREE from "three";
import {
  type Seg, line, rectXY, rectXZ, boxEdges, diamond, zigzag, makeLines,
} from "./lineKit.ts";
import type { Room } from "../engine/roomState.ts";

export interface Dims {
  W: number;
  H: number;
  D: number;
}

type RNG = () => number;

export function decorateRoom(
  room: Room,
  color: number,
  dims: Dims,
  rng: RNG
): THREE.Object3D[] {
  const bright: Seg = [];
  const dim: Seg = [];
  const dimColor = new THREE.Color(color).multiplyScalar(0.5).getHex();

  // Universal: a base trim line around the walls and a couple of ceiling beams.
  wallTrim(dim, dims);
  ceilingBeams(dim, dims, rng);

  const decorator = DECORATORS[room.region] ?? DECORATORS.dungeon;
  decorator(bright, dim, dims, rng);

  const out: THREE.Object3D[] = [];
  if (bright.length) out.push(makeLines(bright, color, 1));
  if (dim.length) out.push(makeLines(dim, dimColor, 0.7));
  return out;
}

// ---------------------------------------------------------------------------
const DECORATORS: Record<string, (b: Seg, d: Seg, dim: Dims, rng: RNG) => void> = {
  forest: forest,
  house: house,
  cellar: cave,
  dungeon: dungeon,
  maze: maze,
  temple: temple,
  river: river,
  hades: hades,
  mine: mine,
};

function half(dim: Dims) {
  return { hx: dim.W / 2, hz: dim.D / 2, H: dim.H };
}

// Universal -----------------------------------------------------------------
function wallTrim(d: Seg, dim: Dims) {
  const { hx, hz } = half(dim);
  const y = 1.0;
  rectXZ(d, -hx + 0.02, -hz + 0.02, hx - 0.02, hz - 0.02, y);
}

function ceilingBeams(d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  const n = 2 + Math.floor(rng() * 2);
  for (let i = 1; i <= n; i++) {
    const x = -hx + (dim.W * i) / (n + 1);
    line(d, x, H - 0.05, -hz, x, H - 0.05, hz);
  }
}

// Forest --------------------------------------------------------------------
function forest(b: Seg, d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  // Stars overhead.
  for (let i = 0; i < 22; i++) {
    const x = -hx + rng() * dim.W;
    const z = -hz + rng() * dim.D;
    const s = 0.06;
    line(d, x - s, H - 0.1, z, x + s, H - 0.1, z);
    line(d, x, H - 0.1, z - s, x, H - 0.1, z + s);
  }
  // Trees around the edges.
  const count = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const edge = rng();
    const x = edge < 0.5 ? (rng() < 0.5 ? -hx + 0.6 : hx - 0.6) : -hx + rng() * dim.W;
    const z = edge < 0.5 ? -hz + rng() * dim.D : (rng() < 0.5 ? -hz + 0.6 : hz - 0.6);
    tree(b, x, z, 2.4 + rng() * 1.0, rng);
  }
  // Ground tufts.
  for (let i = 0; i < 10; i++) {
    const x = -hx + rng() * dim.W, z = -hz + rng() * dim.D;
    line(d, x, 0.02, z, x - 0.12, 0.4, z);
    line(d, x, 0.02, z, x + 0.12, 0.4, z);
    line(d, x, 0.02, z, x, 0.45, z + 0.05);
  }
}

function tree(b: Seg, x: number, z: number, h: number, rng: RNG) {
  const lean = (rng() - 0.5) * 0.3;
  line(b, x, 0, z, x + lean, h * 0.55, z);
  // branches
  for (let i = 0; i < 3; i++) {
    const by = h * (0.35 + i * 0.12);
    const dir = i % 2 === 0 ? 1 : -1;
    line(b, x + lean * (by / (h * 0.55)), by, z, x + dir * 0.5, by + 0.3, z);
  }
  // angular canopy
  const cy = h * 0.55;
  const r = 0.9 + rng() * 0.3;
  const pts = [
    [x + lean, h], [x + lean - r, cy], [x + lean - r * 0.5, cy + 0.4],
    [x + lean + r * 0.5, cy + 0.4], [x + lean + r, cy],
  ];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    line(b, p[0], p[1], z, q[0], q[1], z);
  }
}

// House ---------------------------------------------------------------------
function house(b: Seg, d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  // Table with legs, slightly off-centre.
  const tx = (rng() - 0.5) * 1.5, tz = (rng() - 0.5) * 1.5;
  const tw = 1.8, td = 1.0, th = 0.95;
  rectXZ(b, tx - tw / 2, tz - td / 2, tx + tw / 2, tz + td / 2, th);
  for (const [lx, lz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const px = tx + (lx * tw) / 2 * 0.9, pz = tz + (lz * td) / 2 * 0.9;
    line(b, px, 0, pz, px, th, pz);
  }
  // A chair.
  const cx = tx + 1.4, cz = tz;
  boxEdges(b, cx, 0.45, cz, 0.5, 0.06, 0.5);
  line(b, cx - 0.22, 0, cz - 0.22, cx - 0.22, 0.45, cz - 0.22);
  line(b, cx + 0.22, 0, cz - 0.22, cx + 0.22, 0.45, cz - 0.22);
  line(b, cx - 0.22, 0, cz + 0.22, cx - 0.22, 0.9, cz + 0.22);
  line(b, cx + 0.22, 0, cz + 0.22, cx + 0.22, 0.9, cz + 0.22);
  rectXY(b, cx - 0.22, 0.45, cx + 0.22, 0.9, cz + 0.22);
  // Rug with cross-hatch.
  const rw = 2.6, rd = 1.8;
  rectXZ(d, -rw / 2, -rd / 2, rw / 2, rd / 2, 0.015);
  for (let i = -2; i <= 2; i++) {
    line(d, (i * rw) / 5, 0.015, -rd / 2, (i * rw) / 5, 0.015, rd / 2);
  }
  // Window on the back wall with panes.
  const wy = 1.6;
  rectXY(b, -0.7, wy - 0.5, 0.7, wy + 0.5, -hz + 0.03);
  line(b, 0, wy - 0.5, -hz + 0.03, 0, wy + 0.5, -hz + 0.03);
  line(b, -0.7, wy, -hz + 0.03, 0.7, wy, -hz + 0.03);
  // Hanging lamp.
  line(d, 0, H, 0, 0, H - 0.5, 0);
  diamond(b, 0, H - 0.7, 0, 0.2);
}

// Cave / cellar -------------------------------------------------------------
function cave(b: Seg, d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  stalactites(b, dim, rng, 6);
  // Stalagmites.
  for (let i = 0; i < 4; i++) {
    const x = -hx + rng() * dim.W, z = -hz + rng() * dim.D;
    const h = 0.4 + rng() * 0.7;
    line(b, x, 0, z, x - 0.18, 0, z); line(b, x - 0.18, 0, z, x, h, z);
    line(b, x, h, z, x + 0.18, 0, z); line(b, x + 0.18, 0, z, x, 0, z);
  }
  // Support timber in a corner.
  timberPost(b, hx - 0.6, hz - 0.6, H);
  // Rubble.
  rubble(d, dim, rng, 8);
  // Rough stone accents on walls.
  stoneAccents(d, dim, rng);
}

function dungeon(b: Seg, d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  // Pillars on both sides.
  boxEdges(b, -hx + 0.7, H / 2, 0, 0.5, H, 0.5);
  boxEdges(b, hx - 0.7, H / 2, 0, 0.5, H, 0.5);
  stalactites(b, dim, rng, 3);
  stoneAccents(d, dim, rng);
  rubble(d, dim, rng, 5);
  // Iron sconce on back wall.
  line(b, -1.2, 1.7, -hz + 0.05, -1.0, 2.0, -hz + 0.4);
  zigzag(b, -1.0, 2.0, -hz + 0.4, 2.5, 0.12, 4);
}

function maze(b: Seg, d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  // False openings and crooked passage hints — disorienting.
  for (let i = 0; i < 3; i++) {
    const wall = Math.floor(rng() * 4);
    const ox = (rng() - 0.5) * dim.W * 0.5;
    if (wall === 0) rectXY(d, ox - 0.6, 0, ox + 0.6, 2.0, -hz + 0.05);
    else if (wall === 1) rectXY(d, ox - 0.6, 0, ox + 0.6, 2.0, hz - 0.05);
  }
  stoneAccents(d, dim, rng);
  rubble(d, dim, rng, 6);
  // A jumble of angled struts.
  for (let i = 0; i < 5; i++) {
    const x = -hx + rng() * dim.W, z = -hz + rng() * dim.D;
    line(b, x, 0, z, x + (rng() - 0.5) * 1.2, 1.0 + rng(), z + (rng() - 0.5) * 1.2);
  }
}

function temple(b: Seg, d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  // Colonnade.
  const cols = 3;
  for (let i = 0; i < cols; i++) {
    const z = -hz + (dim.D * (i + 1)) / (cols + 1);
    column(b, -hx + 0.8, z, H);
    column(b, hx - 0.8, z, H);
  }
  // Altar.
  boxEdges(b, 0, 0.5, -hz + 1.4, 1.4, 1.0, 0.9);
  // Arch on the back wall.
  arch(b, 0, 1.0, -hz + 0.04, 1.4, H - 1.0);
  // Steps to the altar.
  for (let i = 0; i < 3; i++) rectXZ(d, -1.4, -hz + 2.0 + i * 0.4, 1.4, -hz + 2.4 + i * 0.4, 0.1 + i * 0.15);
}

function river(b: Seg, d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz } = half(dim);
  // Water surface: layered wavy lines.
  const level = 0.25;
  for (let r = 0; r < 6; r++) {
    const z = -hz + (dim.D * (r + 1)) / 8;
    let px = -hx;
    let py = level + Math.sin(r) * 0.05;
    const seg = 18;
    for (let i = 1; i <= seg; i++) {
      const nx = -hx + (dim.W * i) / seg;
      const ny = level + Math.sin(i * 0.9 + r) * 0.08;
      line(b, px, py, z, nx, ny, z);
      px = nx; py = ny;
    }
  }
  // Reeds at the near bank.
  for (let i = 0; i < 8; i++) {
    const x = -hx + rng() * dim.W;
    zigzag(d, x, 0, hz - 0.5 - rng(), 0.8 + rng() * 0.6, 0.08, 4);
  }
}

function hades(b: Seg, d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  // Flames rising from the floor.
  for (let i = 0; i < 7; i++) {
    const x = -hx + rng() * dim.W, z = -hz + rng() * dim.D;
    zigzag(b, x, 0, z, 0.8 + rng() * 1.0, 0.15, 5);
  }
  // Cracks in the floor glowing.
  for (let i = 0; i < 5; i++) {
    const x = -hx + rng() * dim.W, z = -hz + rng() * dim.D;
    line(d, x, 0.02, z, x + (rng() - 0.5) * 1.5, 0.02, z + (rng() - 0.5) * 1.5);
  }
  // A skull (diamond + jaw) on the back wall.
  diamond(b, 0, 1.8, -hz + 0.05, 0.3);
  line(b, -0.12, 1.7, -hz + 0.05, 0.12, 1.7, -hz + 0.05);
}

function mine(b: Seg, d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  // Timber frame supports along the passage.
  for (let i = 0; i < 2; i++) {
    const z = -hz + (dim.D * (i + 1)) / 3;
    line(b, -hx + 0.5, 0, z, -hx + 0.5, H - 0.3, z);
    line(b, hx - 0.5, 0, z, hx - 0.5, H - 0.3, z);
    line(b, -hx + 0.5, H - 0.3, z, hx - 0.5, H - 0.3, z);
  }
  // Rail tracks with ties.
  line(b, -0.4, 0.05, -hz, -0.4, 0.05, hz);
  line(b, 0.4, 0.05, -hz, 0.4, 0.05, hz);
  for (let z = -hz + 0.4; z < hz; z += 0.8) line(d, -0.5, 0.04, z, 0.5, 0.04, z);
  stoneAccents(d, dim, rng);
}

// Shared props --------------------------------------------------------------
function stalactites(b: Seg, dim: Dims, rng: RNG, n: number) {
  const { hx, hz, H } = half(dim);
  for (let i = 0; i < n; i++) {
    const x = -hx + rng() * dim.W, z = -hz + rng() * dim.D;
    const len = 0.4 + rng() * 0.8;
    line(b, x - 0.16, H, z, x, H - len, z);
    line(b, x + 0.16, H, z, x, H - len, z);
    line(b, x - 0.16, H, z, x + 0.16, H, z);
  }
}

function stalagmite() {}

function rubble(d: Seg, dim: Dims, rng: RNG, n: number) {
  const { hx, hz } = half(dim);
  for (let i = 0; i < n; i++) {
    const x = -hx + 0.5 + rng() * (dim.W - 1);
    const z = -hz + 0.5 + rng() * (dim.D - 1);
    const s = 0.12 + rng() * 0.18;
    line(d, x - s, 0.02, z, x, 0.02 + s, z);
    line(d, x, 0.02 + s, z, x + s, 0.02, z);
    line(d, x + s, 0.02, z, x - s, 0.02, z);
  }
}

function stoneAccents(d: Seg, dim: Dims, rng: RNG) {
  const { hx, hz, H } = half(dim);
  for (let i = 0; i < 10; i++) {
    const onZ = rng() < 0.5;
    const y = 0.3 + rng() * (H - 0.6);
    if (onZ) {
      const x = -hx + rng() * dim.W;
      const z = rng() < 0.5 ? -hz + 0.03 : hz - 0.03;
      line(d, x, y, z, x + 0.3, y + (rng() - 0.5) * 0.3, z);
    } else {
      const z = -hz + rng() * dim.D;
      const x = rng() < 0.5 ? -hx + 0.03 : hx - 0.03;
      line(d, x, y, z, x, y + (rng() - 0.5) * 0.3, z + 0.3);
    }
  }
}

function timberPost(b: Seg, x: number, z: number, H: number) {
  boxEdges(b, x, H / 2, z, 0.25, H, 0.25);
}

function column(b: Seg, x: number, z: number, H: number) {
  const r = 0.3;
  // base, shaft (fluted = vertical lines), capital
  rectXZ(b, x - r, z - r, x + r, z + r, 0.15);
  rectXZ(b, x - r, z - r, x + r, z + r, H - 0.2);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const px = x + Math.cos(ang) * r, pz = z + Math.sin(ang) * r;
    line(b, px, 0.15, pz, px, H - 0.2, pz);
  }
  boxEdges(b, x, H - 0.1, z, r * 2.4, 0.2, r * 2.4);
}

function arch(b: Seg, cx: number, baseY: number, z: number, r: number, top: number) {
  const seg = 12;
  // legs
  line(b, cx - r, 0, z, cx - r, baseY, z);
  line(b, cx + r, 0, z, cx + r, baseY, z);
  let px = cx - r, py = baseY;
  for (let i = 1; i <= seg; i++) {
    const t = (i / seg) * Math.PI;
    const nx = cx - Math.cos(t) * r;
    const ny = baseY + Math.sin(t) * (top - baseY);
    line(b, px, py, z, nx, ny, z);
    px = nx; py = ny;
  }
}

void stalagmite;
