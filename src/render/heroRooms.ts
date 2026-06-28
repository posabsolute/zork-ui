/*
 * heroRooms.ts — hand-authored "hero" rooms.
 *
 * Procedural decor gives every room something; hero rooms override it for the
 * iconic locations so the scene matches what the game's prose actually says
 * (an open field really looks like an open field, the white house is there, the
 * living room has its trophy case and rug). Add to HERO_ROOMS to hero more — the
 * registry is the tracked set (also mirrored in HEROES.md).
 */
import * as THREE from "three";
import { type Seg, line, rectXZ, makeLines } from "./lineKit.ts";

export interface HeroCtx {
  dims: { W: number; H: number; D: number };
  color: number;
  rng: () => number;
}

export interface HeroSpec {
  /** Optional palette override (defaults to the region colour). */
  palette?: number;
  /** Build the room's bespoke geometry. Shell, portals and objects still render. */
  build: (ctx: HeroCtx) => THREE.Object3D[];
  /** Short note for the tracking doc. */
  note: string;
}

// --- shared set pieces -----------------------------------------------------
type Map2 = (u: number, y: number) => [number, number, number];

function ln(a: Seg, m: Map2, u1: number, y1: number, u2: number, y2: number) {
  const p = m(u1, y1), q = m(u2, y2);
  line(a, p[0], p[1], p[2], q[0], q[1], q[2]);
}
function rc(a: Seg, m: Map2, u1: number, y1: number, u2: number, y2: number) {
  ln(a, m, u1, y1, u2, y1);
  ln(a, m, u2, y1, u2, y2);
  ln(a, m, u2, y2, u1, y2);
  ln(a, m, u1, y2, u1, y1);
}

/** The white house facade, drawn in a wall plane chosen by `m`. */
function whiteHouse(a: Seg, m: Map2, opts: { boardedDoor?: boolean; openWindow?: boolean } = {}) {
  const W = 2.6, bodyH = 2.6, roofH = 3.8;
  rc(a, m, -W, 0, W, bodyH); // body
  ln(a, m, -W - 0.2, bodyH, 0, roofH); // roof
  ln(a, m, 0, roofH, W + 0.2, bodyH);
  ln(a, m, -W - 0.2, bodyH, W + 0.2, bodyH);
  // door
  rc(a, m, -0.5, 0, 0.5, 1.6);
  if (opts.boardedDoor) {
    ln(a, m, -0.5, 0.4, 0.5, 1.2);
    ln(a, m, -0.5, 1.2, 0.5, 0.4);
    ln(a, m, -0.5, 0.8, 0.5, 0.8);
  }
  // windows
  rc(a, m, -1.7, 1.4, -1.0, 2.1);
  if (opts.openWindow) {
    // right window ajar
    ln(a, m, 1.0, 1.4, 1.7, 1.4);
    ln(a, m, 1.0, 1.4, 1.0, 2.1);
    ln(a, m, 1.0, 2.1, 1.9, 2.4); // swung-open pane
    ln(a, m, 1.7, 1.4, 1.9, 2.4);
  } else {
    rc(a, m, 1.0, 1.4, 1.7, 2.1);
  }
}

/** Open-field dressing: sparse tufts, a far tree line, a big starry sky. */
function openField(a: Seg, dim: { W: number; H: number; D: number }, rng: () => number) {
  const hx = dim.W / 2, hz = dim.D / 2;
  for (let i = 0; i < 30; i++) {
    const x = -hx + rng() * dim.W, z = -hz + rng() * dim.D, s = 0.06;
    line(a, x - s, dim.H - 0.1, z, x + s, dim.H - 0.1, z);
    line(a, x, dim.H - 0.1, z - s, x, dim.H - 0.1, z + s);
  }
  for (let i = 0; i < 14; i++) {
    const x = -hx + rng() * dim.W, z = -hz + rng() * dim.D;
    line(a, x, 0.02, z, x - 0.1, 0.35, z);
    line(a, x, 0.02, z, x + 0.1, 0.35, z);
  }
}

function eastWall(dim: { W: number }): Map2 {
  const hx = dim.W / 2;
  return (u, y) => [hx - 0.1, y, u];
}
function westWall(dim: { W: number }): Map2 {
  const hx = dim.W / 2;
  return (u, y) => [-hx + 0.1, y, u];
}
function southWall(dim: { D: number }): Map2 {
  const hz = dim.D / 2;
  return (u, y) => [u, y, hz - 0.1];
}
function northWall(dim: { D: number }): Map2 {
  const hz = dim.D / 2;
  return (u, y) => [u, y, -hz + 0.1];
}

// --- the registry (the tracked hero set) -----------------------------------
export const HERO_ROOMS: Record<string, HeroSpec> = {
  "WEST-OF-HOUSE": {
    note: "Open field west of the white house; boarded front door faces you (house to the east).",
    build: ({ dims, color, rng }) => {
      const env: Seg = [], house: Seg = [];
      openField(env, dims, rng);
      whiteHouse(house, eastWall(dims), { boardedDoor: true });
      return [makeLines(env, color, 0.7), makeLines(house, color, 1)];
    },
  },
  "NORTH-OF-HOUSE": {
    note: "North side of the white house; barred windows (house to the south).",
    build: ({ dims, color, rng }) => {
      const env: Seg = [], house: Seg = [];
      openField(env, dims, rng);
      whiteHouse(house, southWall(dims), {});
      return [makeLines(env, color, 0.7), makeLines(house, color, 1)];
    },
  },
  "SOUTH-OF-HOUSE": {
    note: "South side of the white house; barred windows (house to the north).",
    build: ({ dims, color, rng }) => {
      const env: Seg = [], house: Seg = [];
      openField(env, dims, rng);
      whiteHouse(house, northWall(dims), {});
      return [makeLines(env, color, 0.7), makeLines(house, color, 1)];
    },
  },
  "EAST-OF-HOUSE": {
    note: "Behind the white house; a small window is ajar (house to the west).",
    build: ({ dims, color, rng }) => {
      const env: Seg = [], house: Seg = [];
      openField(env, dims, rng);
      whiteHouse(house, westWall(dims), { openWindow: true });
      return [makeLines(env, color, 0.7), makeLines(house, color, 1)];
    },
  },
  "LIVING-ROOM": {
    note: "Trophy case on the wall, oriental rug centre, trap door beneath it, lamp.",
    build: ({ dims, color }) => {
      const a: Seg = [], dim: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2, H = dims.H;
      // Trophy case on the east wall.
      const m = eastWall(dims);
      rc(a, m, -1.0, 0.4, 1.0, 2.0);
      ln(a, m, -1.0, 1.0, 1.0, 1.0);
      ln(a, m, -1.0, 1.5, 1.0, 1.5);
      // Oriental rug.
      rectXZ(dim, -1.5, -1.0, 1.5, 1.0, 0.015);
      for (let i = -3; i <= 3; i++) line(dim, (i * 1.5) / 4, 0.015, -1.0, (i * 1.5) / 4, 0.015, 1.0);
      // Trap door under the rug.
      rectXZ(a, -0.5, -0.4, 0.5, 0.4, 0.02);
      line(a, -0.5, 0.02, -0.4, 0.5, 0.02, 0.4);
      // Beamed ceiling.
      for (let i = 1; i <= 3; i++) line(dim, -hx, H - 0.05, -hz + (dims.D * i) / 4, hx, H - 0.05, -hz + (dims.D * i) / 4);
      return [makeLines(a, color, 1), makeLines(dim, new THREE.Color(color).multiplyScalar(0.5).getHex(), 0.7)];
    },
  },
  "KITCHEN": {
    note: "Table with a sack and bottle, chimney, window to the east, stairs up.",
    build: ({ dims, color }) => {
      const a: Seg = [], dim: Seg = [];
      const hx = dims.W / 2, H = dims.H;
      // Table.
      rectXZ(a, -0.9, -0.5, 0.9, 0.5, 0.95);
      for (const [lx, lz] of [[-0.8, -0.4], [0.8, -0.4], [0.8, 0.4], [-0.8, 0.4]]) line(a, lx, 0, lz, lx, 0.95, lz);
      // Window on the east wall (ajar to "Behind House").
      const m = eastWall(dims);
      rc(a, m, -0.6, 1.3, 0.6, 2.2);
      ln(a, m, 0, 1.3, 0, 2.2);
      // Chimney column.
      line(a, -hx + 0.4, 0, 0, -hx + 0.4, H, 0);
      line(a, -hx + 1.0, 0, 0, -hx + 1.0, H, 0);
      line(a, -hx + 0.4, H, 0, -hx + 1.0, H, 0);
      // Floor boards.
      for (let i = 1; i < 6; i++) line(dim, -hx, 0.01, -dims.D / 2 + (dims.D * i) / 6, hx, 0.01, -dims.D / 2 + (dims.D * i) / 6);
      return [makeLines(a, color, 1), makeLines(dim, new THREE.Color(color).multiplyScalar(0.5).getHex(), 0.7)];
    },
  },
};

export function getHero(id: string): HeroSpec | undefined {
  return HERO_ROOMS[id];
}

export const HEROED_IDS = Object.keys(HERO_ROOMS);
