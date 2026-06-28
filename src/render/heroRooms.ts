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
import {
  type Seg, line, rectXZ, rectXY, boxEdges, diamond, zigzag, makeLines,
} from "./lineKit.ts";
import { type Palette, scaleColor, FIRE_COLOR, WATER_COLOR } from "../config/regions.ts";
import { tagMotion, type MotionKind } from "./motion.ts";

/** Tag a built object so the generic animator gives it life. */
function moving(o: THREE.Object3D, kind: MotionKind = "glow"): THREE.Object3D {
  tagMotion(o, kind, 0);
  return o;
}

export interface HeroCtx {
  dims: { W: number; H: number; D: number };
  palette: Palette;
  rng: () => number;
}

export interface HeroSpec {
  /** Optional palette override (defaults to the region colour). */
  palette?: number;
  /** Build the room's bespoke geometry. Shell, portals and objects still render. */
  build: (ctx: HeroCtx) => THREE.Object3D[];
  /** Optional per-frame animation over the objects build() returned. */
  animate?: (objs: THREE.Object3D[], t: number) => void;
  /** Object ids the hero draws itself, so the generic icon isn't duplicated. */
  suppress?: string[];
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

interface HouseOpts {
  boardedDoor?: boolean;
  openWindow?: boolean;
  boardedWindows?: boolean;
  noDoor?: boolean; // only the front (west) has a door
}

/** Boards (an X plus a slat) across a window/door rectangle. */
function boards(a: Seg, m: Map2, x1: number, y1: number, x2: number, y2: number) {
  ln(a, m, x1, y1, x2, y2);
  ln(a, m, x1, y2, x2, y1);
  ln(a, m, x1, (y1 + y2) / 2, x2, (y1 + y2) / 2);
}

/** The white house facade, drawn in a wall plane chosen by `m`. */
function whiteHouse(a: Seg, m: Map2, opts: HouseOpts = {}) {
  const W = 2.6, bodyH = 2.6, roofH = 3.8;
  rc(a, m, -W, 0, W, bodyH); // body
  ln(a, m, -W - 0.2, bodyH, 0, roofH); // roof
  ln(a, m, 0, roofH, W + 0.2, bodyH);
  ln(a, m, -W - 0.2, bodyH, W + 0.2, bodyH);
  // door (only the front of the house has one)
  if (!opts.noDoor) {
    rc(a, m, -0.5, 0, 0.5, 1.6);
    if (opts.boardedDoor) boards(a, m, -0.5, 0.2, 0.5, 1.4);
  }
  // two windows
  rc(a, m, -1.7, 1.4, -1.0, 2.1);
  if (opts.boardedWindows) boards(a, m, -1.7, 1.4, -1.0, 2.1);
  if (opts.openWindow) {
    ln(a, m, 1.0, 1.4, 1.7, 1.4);
    ln(a, m, 1.0, 1.4, 1.0, 2.1);
    ln(a, m, 1.0, 2.1, 1.9, 2.4); // swung-open pane
    ln(a, m, 1.7, 1.4, 1.9, 2.4);
  } else {
    rc(a, m, 1.0, 1.4, 1.7, 2.1);
    if (opts.boardedWindows) boards(a, m, 1.0, 1.4, 1.7, 2.1);
  }
}

/** Open-field dressing: sparse tufts, a far tree line, a big starry sky. */
function openField(a: Seg, dim: { W: number; H: number; D: number }, rng: () => number) {
  const hx = dim.W / 2, hz = dim.D / 2;
  for (let i = 0; i < 12; i++) {
    const x = -hx + rng() * dim.W, z = -hz + rng() * dim.D, s = 0.06;
    line(a, x - s, dim.H - 0.1, z, x + s, dim.H - 0.1, z);
    line(a, x, dim.H - 0.1, z - s, x, dim.H - 0.1, z + s);
  }
  for (let i = 0; i < 6; i++) {
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

// --- more set pieces -------------------------------------------------------
/** A humanoid silhouette (head/body/limbs) standing at (x,z), facing +z. */
function figure(a: Seg, x: number, z: number, scale = 1) {
  const s = scale;
  // head
  diamond(a, x, 1.55 * s, z, 0.16 * s);
  // torso
  line(a, x, 1.4 * s, z, x, 0.75 * s, z);
  // arms
  line(a, x, 1.25 * s, z, x - 0.35 * s, 1.0 * s, z);
  line(a, x, 1.25 * s, z, x + 0.35 * s, 1.0 * s, z);
  // legs
  line(a, x, 0.75 * s, z, x - 0.22 * s, 0, z);
  line(a, x, 0.75 * s, z, x + 0.22 * s, 0, z);
}

/** A ring (circle) in the XZ plane at height y. */
function ring(a: Seg, cx: number, cz: number, r: number, y: number, seg = 28) {
  let px = cx + r, pz = cz;
  for (let i = 1; i <= seg; i++) {
    const t = (i / seg) * Math.PI * 2;
    const nx = cx + Math.cos(t) * r, nz = cz + Math.sin(t) * r;
    line(a, px, y, pz, nx, y, nz);
    px = nx; pz = nz;
  }
}

/** A semicircular arch in the XY plane at depth z. */
function archXY(a: Seg, cx: number, baseY: number, z: number, r: number, top: number) {
  line(a, cx - r, 0, z, cx - r, baseY, z);
  line(a, cx + r, 0, z, cx + r, baseY, z);
  let px = cx - r, py = baseY;
  for (let i = 1; i <= 12; i++) {
    const t = (i / 12) * Math.PI;
    const nx = cx - Math.cos(t) * r, ny = baseY + Math.sin(t) * (top - baseY);
    line(a, px, py, z, nx, ny, z);
    px = nx; py = ny;
  }
}

/** A fluted column from floor to height H at (x,z). */
function column(a: Seg, x: number, z: number, H: number, r = 0.3) {
  rectXZ(a, x - r, z - r, x + r, z + r, 0.12);
  rectXZ(a, x - r, z - r, x + r, z + r, H - 0.2);
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * Math.PI * 2;
    const px = x + Math.cos(ang) * r, pz = z + Math.sin(ang) * r;
    line(a, px, 0.12, pz, px, H - 0.2, pz);
  }
  boxEdges(a, x, H - 0.1, z, r * 2.4, 0.2, r * 2.4);
}

/** A flame cluster (several zig-zag tongues) at (x,z). */
function flame(a: Seg, x: number, z: number, h: number) {
  zigzag(a, x, 0, z, h, 0.12, 5);
  zigzag(a, x - 0.12, 0, z, h * 0.7, 0.08, 4);
  zigzag(a, x + 0.12, 0, z, h * 0.7, 0.08, 4);
}

/** A tree: trunk into `trunk`, angular canopy into `canopy`. */
function heroTree(trunk: Seg, canopy: Seg, x: number, z: number, h: number) {
  line(trunk, x, 0, z, x, h * 0.55, z);
  const cy = h * 0.55, r = 0.9;
  const pts: [number, number][] = [
    [x, h], [x - r, cy], [x - r * 0.5, cy + 0.4], [x + r * 0.5, cy + 0.4], [x + r, cy],
  ];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    line(canopy, p[0], p[1], z, q[0], q[1], z);
  }
}

/** A wavy water surface filling the floor at a given level. */
function waterPlane(seg: Seg, hx: number, hz: number, level: number, rows = 6) {
  for (let r = 0; r < rows; r++) {
    const z = -hz + (2 * hz * (r + 1)) / (rows + 1);
    let px = -hx, py = level;
    for (let i = 1; i <= 16; i++) {
      const nx = -hx + (2 * hx * i) / 16;
      const ny = level + Math.sin(i * 0.9 + r) * 0.09;
      line(seg, px, py, z, nx, ny, z);
      px = nx; py = ny;
    }
  }
}

/** A bottomless chasm: a jagged near edge with lines dropping into the dark. */
function chasmVoid(seg: Seg, x1: number, z1: number, x2: number, z2: number) {
  let px = x1;
  for (let i = 1; i <= 8; i++) {
    const nx = x1 + ((x2 - x1) * i) / 8;
    const z = z1 + (i % 2 ? 0.2 : -0.2);
    line(seg, px, 0.02, z1, nx, 0.02, z);
    px = nx;
  }
  for (let i = 0; i <= 6; i++) {
    const x = x1 + ((x2 - x1) * i) / 6;
    line(seg, x, 0.02, z1, x, -3, z2);
  }
}

/** A great mirror on a wall (sheen lines), drawn in plane `m`. */
function mirrorPanel(seg: Seg, m: Map2) {
  rc(seg, m, -1.4, 0.3, 1.4, 2.7);
  ln(seg, m, -1.4, 0.3, 1.4, 2.7); // diagonal sheen
  ln(seg, m, -1.2, 0.5, 1.2, 2.5);
}

/** A shimmering rainbow arch over the room. */
function rainbow(objs: THREE.Object3D[], z: number, r: number) {
  const bands = [0xff5a52, 0xffa54a, 0xffe24a, 0x5dff8a, 0x5cc8ff, 0xc79bff];
  bands.forEach((c, i) => {
    const s: Seg = [];
    archXY(s, 0, 0, z + i * 0.18, r + i * 0.4, r + i * 0.4);
    const o = makeLines(s, c, 1);
    tagMotion(o, "glow", i);
    objs.push(o);
  });
}

/** A great tree with low climbable branches. */
function bigTree(trunk: Seg, canopy: Seg, x: number, z: number, h: number) {
  line(trunk, x, 0, z, x, h * 0.6, z);
  for (let i = 0; i < 4; i++) {
    const by = 0.8 + i * 0.6, dir = i % 2 === 0 ? 1 : -1;
    line(trunk, x, by, z, x + dir * 1.0, by + 0.3, z); // low branches
  }
  const cy = h * 0.6, r = 1.6;
  const pts: [number, number][] = [
    [x, h], [x - r, cy], [x - r * 0.6, cy + 0.6], [x + r * 0.6, cy + 0.6], [x + r, cy],
  ];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    line(canopy, p[0], p[1], z, q[0], q[1], z);
  }
}

// --- the registry (the tracked hero set) -----------------------------------
export const HERO_ROOMS: Record<string, HeroSpec> = {
  "WEST-OF-HOUSE": {
    note: "Open field west of the white house; boarded front door faces you (house to the east).",
    build: ({ dims, palette, rng }) => {
      const env: Seg = [], house: Seg = [];
      openField(env, dims, rng);
      whiteHouse(house, eastWall(dims), { boardedDoor: true });
      return [makeLines(env, palette.detail, 0.75), makeLines(house, palette.primary, 1)];
    },
  },
  "NORTH-OF-HOUSE": {
    note: "North side of the white house; barred windows (house to the south).",
    build: ({ dims, palette, rng }) => {
      const env: Seg = [], house: Seg = [];
      openField(env, dims, rng);
      whiteHouse(house, southWall(dims), { boardedWindows: true, noDoor: true });
      return [makeLines(env, palette.detail, 0.75), makeLines(house, palette.primary, 1)];
    },
  },
  "SOUTH-OF-HOUSE": {
    note: "South side of the white house; barred windows (house to the north).",
    build: ({ dims, palette, rng }) => {
      const env: Seg = [], house: Seg = [];
      openField(env, dims, rng);
      whiteHouse(house, northWall(dims), { boardedWindows: true, noDoor: true });
      return [makeLines(env, palette.detail, 0.75), makeLines(house, palette.primary, 1)];
    },
  },
  "EAST-OF-HOUSE": {
    note: "Behind the white house; a small window is ajar (house to the west).",
    build: ({ dims, palette, rng }) => {
      const env: Seg = [], house: Seg = [];
      openField(env, dims, rng);
      whiteHouse(house, westWall(dims), { openWindow: true, noDoor: true });
      return [makeLines(env, palette.detail, 0.75), makeLines(house, palette.primary, 1)];
    },
  },
  "LIVING-ROOM": {
    note: "Trophy case, oriental rug, trap door beneath it, wooden gothic door west.",
    suppress: ["TROPHY-CASE", "RUG", "TRAP-DOOR", "WOODEN-DOOR"],
    build: ({ dims, palette }) => {
      const focal: Seg = [], structure: Seg = [], dim: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2, H = dims.H;
      // Trophy case on the east wall — the focal point (accent).
      const m = eastWall(dims);
      rc(focal, m, -1.0, 0.4, 1.0, 2.0);
      ln(focal, m, -1.0, 1.0, 1.0, 1.0);
      ln(focal, m, -1.0, 1.5, 1.0, 1.5);
      // The wooden door with gothic lettering, to the west.
      const wm = westWall(dims);
      rc(structure, wm, -0.5, 0, 0.5, 2.0);
      ln(structure, wm, -0.5, 2.0, 0, 2.4); // gothic point
      ln(structure, wm, 0.5, 2.0, 0, 2.4);
      ln(structure, wm, -0.3, 1.0, 0.3, 1.0); // lettering hint
      // Oriental rug.
      rectXZ(dim, -1.5, -1.0, 1.5, 1.0, 0.015);
      for (let i = -3; i <= 3; i++) line(dim, (i * 1.5) / 4, 0.015, -1.0, (i * 1.5) / 4, 0.015, 1.0);
      // Trap door under the rug — also focal (accent).
      rectXZ(focal, -0.5, -0.4, 0.5, 0.4, 0.02);
      line(focal, -0.5, 0.02, -0.4, 0.5, 0.02, 0.4);
      // Beamed ceiling.
      for (let i = 1; i <= 3; i++) line(structure, -hx, H - 0.05, -hz + (dims.D * i) / 4, hx, H - 0.05, -hz + (dims.D * i) / 4);
      return [
        moving(makeLines(focal, palette.accent, 1)), // trophy case + trap door breathe
        makeLines(structure, palette.primary, 1),
        makeLines(dim, scaleColor(palette.primary, 0.5), 0.7),
      ];
    },
  },
  "KITCHEN": {
    note: "Table (sack + bottle), chimney, window ajar east, stairs up, dark stair down.",
    suppress: ["KITCHEN-TABLE"],
    build: ({ dims, palette }) => {
      const a: Seg = [], focal: Seg = [], dim: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2, H = dims.H;
      // Table with a sack and a bottle on it (described).
      rectXZ(a, -0.9, -0.5, 0.9, 0.5, 0.95);
      for (const [lx, lz] of [[-0.8, -0.4], [0.8, -0.4], [0.8, 0.4], [-0.8, 0.4]]) line(a, lx, 0, lz, lx, 0.95, lz);
      boxEdges(a, -0.4, 1.1, 0, 0.3, 0.3, 0.3); // sack
      line(a, 0.4, 0.95, 0, 0.4, 1.25, 0); // bottle
      // Window on the east wall (ajar to "Behind House") — focal accent.
      const m = eastWall(dims);
      rc(focal, m, -0.6, 1.3, 0.6, 2.2);
      ln(focal, m, 0, 1.3, 0, 2.2);
      // Chimney column.
      line(a, -hx + 0.4, 0, 0, -hx + 0.4, H, 0);
      line(a, -hx + 1.0, 0, 0, -hx + 1.0, H, 0);
      line(a, -hx + 0.4, H, 0, -hx + 1.0, H, 0);
      // Staircase up to the attic (steps rising in the back corner).
      for (let i = 0; i < 4; i++) rectXZ(a, hx - 1.8, -hz + 0.6, hx - 0.6, -hz + 1.0 + i * 0.25, 0.3 + i * 0.35);
      // Dark stairway down (to the studio) — a black hatch.
      rectXZ(dim, hx - 1.6, hz - 1.6, hx - 0.6, hz - 0.6, 0.02);
      // Floor boards.
      for (let i = 1; i < 6; i++) line(dim, -hx, 0.01, -dims.D / 2 + (dims.D * i) / 6, hx, 0.01, -dims.D / 2 + (dims.D * i) / 6);
      return [
        makeLines(a, palette.primary, 1),
        moving(makeLines(focal, palette.accent, 1)), // window ajar glows
        makeLines(dim, scaleColor(palette.primary, 0.5), 0.7),
      ];
    },
  },
  "FOREST-1": {
    note: "Forest, trees in all directions; sunlight breaks through to the east.",
    build: ({ dims, palette }) => {
      const trunks: Seg = [], leaves: Seg = [], sun: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        heroTree(trunks, leaves, Math.cos(a) * (hx - 0.6), Math.sin(a) * (hz - 0.6), 2.6 + (i % 3) * 0.4);
      }
      for (let i = 0; i < 5; i++) {
        const y = 1.0 + i * 0.5;
        line(sun, hx - 0.2, y, -1.5 + i * 0.6, hx + 2, y - 0.4, -2 + i * 0.7); // sunbeams east
      }
      return [
        makeLines(trunks, palette.primary, 1),
        makeLines(leaves, palette.accent, 1),
        moving(makeLines(sun, 0xffe07a, 0.9), "twinkle"),
      ];
    },
  },
  "PATH": {
    note: "Forest path N-S; one great tree with low branches stands at its edge (climb up).",
    build: ({ dims, palette }) => {
      const trunks: Seg = [], leaves: Seg = [], path: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      for (let i = 0; i < 6; i++) {
        heroTree(trunks, leaves, -hx + 0.6 + i * (dims.W / 6), i % 2 ? hz - 0.7 : -hz + 0.7, 2.4 + (i % 2) * 0.5);
      }
      bigTree(trunks, leaves, hx - 1.6, 0, 4.4); // the great climbable tree
      line(path, -0.4, 0.02, -hz, -0.4, 0.02, hz);
      line(path, 0.4, 0.02, -hz, 0.4, 0.02, hz);
      return [
        makeLines(trunks, palette.primary, 1),
        makeLines(leaves, palette.accent, 1),
        makeLines(path, palette.detail, 0.6),
      ];
    },
  },
  "UP-A-TREE": {
    note: "High in the great tree: low branches, a bird's nest, a singing songbird.",
    suppress: ["NEST"],
    build: ({ palette }) => {
      const branches: Seg = [], nest: Seg = [], bird: Seg = [];
      line(branches, 0, -1.2, 0, 0, 1.4, 0); // trunk through the view
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        line(branches, 0, 0.2, 0, Math.cos(a) * 2.4, 0.5 + Math.sin(a * 2) * 0.5, Math.sin(a) * 2.4);
      }
      ring(nest, 1.6, 0.7, 0.4, 1.0); // bird's nest on a branch
      ring(nest, 1.6, 0.7, 0.3, 1.15);
      line(bird, -1.4, 1.6, -0.6, -1.1, 1.85, -0.6); // songbird (a V)
      line(bird, -1.1, 1.85, -0.6, -0.8, 1.6, -0.6);
      return [
        makeLines(branches, palette.primary, 1),
        makeLines(nest, 0xfff0d0, 1),
        moving(makeLines(bird, palette.accent, 1), "wisp"), // it flits about
      ];
    },
  },
  "CELLAR": {
    note: "Where you fall in: a steep ramp up the west wall, the trap door open above.",
    build: ({ dims, palette }) => {
      const a: Seg = [], ac: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2, H = dims.H;
      // Ramp up the west wall.
      line(a, -hx, 0, hz - 0.6, -hx + 2.6, H - 0.4, hz - 0.6);
      line(a, -hx, 0, hz - 2.6, -hx + 2.6, H - 0.4, hz - 2.6);
      line(a, -hx + 2.6, H - 0.4, hz - 0.6, -hx + 2.6, H - 0.4, hz - 2.6);
      line(a, -hx, 0, hz - 0.6, -hx, 0, hz - 2.6);
      // Trap door open in the ceiling, light spilling through (accent).
      rectXZ(ac, -0.8, -0.8, 0.8, 0.8, H - 0.02);
      for (let i = -2; i <= 2; i++) line(ac, (i * 0.8) / 2, H - 0.02, -0.8, (i * 0.4), 1.4, 0.0);
      return [makeLines(a, palette.primary, 1), moving(makeLines(ac, palette.accent, 0.8))];
    },
  },
  "TROLL-ROOM": {
    note: "The nasty troll, bloody axe in hand, blocking the way.",
    build: ({ palette }) => {
      const body: Seg = [], axe: Seg = [], blood: Seg = [];
      figure(body, 0, -0.5, 1.5); // hulking troll
      // axe: handle + blade
      line(axe, 0.5, 1.4, -0.5, 1.1, 1.9, -0.5);
      diamond(axe, 1.1, 1.95, -0.5, 0.3);
      // bloodstains on the floor
      for (const [x, z] of [[-1.4, 0.8], [0.9, 1.2], [-0.3, -1.4]]) diamond(blood, x, 0.02, z, 0.2);
      return [
        makeLines(body, palette.primary, 1),
        moving(makeLines(axe, palette.accent, 1)), // the bloody axe glints
        makeLines(blood, FIRE_COLOR, 0.7),
      ];
    },
  },
  "ROUND-ROOM": {
    note: "The great circular hub; passages radiate in every direction.",
    build: ({ dims, palette }) => {
      const a: Seg = [], dim: Seg = [];
      const H = dims.H, r = Math.min(dims.W, dims.D) / 2 - 0.4;
      ring(a, 0, 0, r, 0.02);
      ring(a, 0, 0, r, H - 0.05);
      ring(dim, 0, 0, r * 0.6, 0.02);
      ring(dim, 0, 0, r * 0.3, 0.02);
      // central column
      column(a, 0, 0, H, 0.35);
      // spokes
      for (let k = 0; k < 8; k++) {
        const t = (k / 8) * Math.PI * 2;
        line(dim, 0, 0.02, 0, Math.cos(t) * r, 0.02, Math.sin(t) * r);
      }
      return [makeLines(a, palette.primary, 1), makeLines(dim, palette.detail, 0.5)];
    },
  },
  "LOUD-ROOM": {
    note: "Deafening: visible rings of sound ripple outward without end.",
    build: ({ dims, palette }) => {
      const objs: THREE.Object3D[] = [];
      const r = Math.min(dims.W, dims.D) / 2 - 0.3;
      for (let i = 0; i < 4; i++) {
        const seg: Seg = [];
        ring(seg, 0, 0, r, 1.2);
        const m = makeLines(seg, palette.accent, 1);
        m.userData.kind = "ripple";
        m.userData.phase = i / 4;
        m.userData.rmax = r;
        objs.push(m);
      }
      return objs;
    },
    animate: (objs, t) => {
      for (const o of objs as any[]) {
        if (o.userData.kind !== "ripple") continue;
        const s = ((t / 2.4 + o.userData.phase) % 1);
        o.scale.setScalar(0.15 + s * 1.1);
        o.material.transparent = true;
        o.material.opacity = 1 - s;
      }
    },
  },
  "TORCH-ROOM": {
    note: "A torch on a pillar lights a vast dome high overhead.",
    build: ({ dims, palette }) => {
      const a: Seg = [], fire: Seg = [];
      const H = dims.H;
      const out: THREE.Object3D[] = [];
      // pedestal
      boxEdges(a, 0, 0.5, 0, 0.6, 1.0, 0.6);
      // dome ribs overhead, each rotated around the centre
      const ribR = Math.min(dims.W, dims.D) / 2 - 0.5;
      for (let k = 0; k < 4; k++) {
        const rib: Seg = [];
        archXY(rib, 0, H - 1.4, 0, ribR, H - 0.1);
        const ribObj = makeLines(rib, palette.detail, 0.6);
        ribObj.rotation.y = (k / 4) * Math.PI;
        out.push(ribObj);
      }
      // torch flame on the pedestal
      flame(fire, 0, 0, 0.8);
      const flameObj = makeLines(fire, FIRE_COLOR, 1);
      flameObj.position.y = 1.0;
      flameObj.userData.kind = "flame";
      out.unshift(makeLines(a, palette.primary, 1));
      out.push(flameObj);
      return out;
    },
    animate: (objs, t) => {
      for (const o of objs as any[]) {
        if (o.userData.kind !== "flame") continue;
        o.scale.y = 1 + Math.sin(t * 11) * 0.12 + Math.sin(t * 7.3) * 0.06;
        o.material.transparent = true;
        o.material.opacity = 0.75 + 0.25 * Math.abs(Math.sin(t * 9));
      }
    },
  },
  "EGYPT-ROOM": {
    note: "The gold coffin of the ancient pharaohs rests here, gleaming.",
    build: ({ palette }) => {
      const a: Seg = [], gold: Seg = [];
      // sarcophagus
      boxEdges(gold, 0, 0.4, 0, 1.0, 0.8, 2.2);
      // tapered lid lines + face panel
      line(gold, -0.5, 0.8, -1.1, 0.5, 0.8, -1.1);
      diamond(gold, 0, 0.85, -0.7, 0.25); // mask
      rectXY(a, -0.4, 0.85, 0.4, 1.4, -1.1);
      return [makeLines(a, palette.primary, 1), moving(makeLines(gold, palette.accent, 1))];
    },
  },
  "SOUTH-TEMPLE": {
    note: "The altar; two candles gutter in the still air.",
    build: ({ dims, palette }) => {
      const a: Seg = [];
      const hz = dims.D / 2, H = dims.H;
      boxEdges(a, 0, 0.5, -hz + 1.4, 1.6, 1.0, 0.9); // altar
      archXY(a, 0, 1.0, -hz + 0.04, 1.4, H - 1.0); // arch behind
      const out: THREE.Object3D[] = [];
      for (const cx of [-0.6, 0.6]) {
        line(a, cx, 1.0, -hz + 1.4, cx, 1.4, -hz + 1.4); // candlestick
        const f: Seg = [];
        zigzag(f, cx, 1.4, -hz + 1.4, 1.7, 0.05, 3);
        const fo = makeLines(f, FIRE_COLOR, 1);
        fo.userData.kind = "candle";
        out.push(fo);
      }
      out.unshift(makeLines(a, palette.primary, 1));
      return out;
    },
    animate: (objs, t) => {
      for (const o of objs as any[]) {
        if (o.userData.kind !== "candle") continue;
        o.scale.y = 1 + Math.sin(t * 13 + o.id) * 0.18;
        o.material.transparent = true;
        o.material.opacity = 0.7 + 0.3 * Math.abs(Math.sin(t * 10 + o.id));
      }
    },
  },
  "NORTH-TEMPLE": {
    note: "The temple; a brass bell hangs above, a prayer book on its stand.",
    build: ({ dims, palette }) => {
      const a: Seg = [], ac: Seg = [];
      const H = dims.H;
      column(a, -dims.W / 2 + 0.8, -1, H);
      column(a, dims.W / 2 - 0.8, -1, H);
      // bell
      line(ac, 0, H, 0, 0, H - 0.6, 0);
      const by = H - 1.2;
      line(ac, -0.4, by, 0, -0.3, by + 0.6, 0);
      line(ac, 0.4, by, 0, 0.3, by + 0.6, 0);
      line(ac, -0.4, by, 0, 0.4, by, 0);
      // book on a stand
      boxEdges(a, 0, 0.9, 1.2, 0.7, 0.1, 0.5);
      line(a, 0, 0, 1.2, 0, 0.9, 1.2);
      return [makeLines(a, palette.primary, 1), moving(makeLines(ac, palette.accent, 1))]; // bell glows
    },
  },
  "ENTRANCE-TO-HADES": {
    note: "The gates of Hades; spectral wisps drift before the barred portal.",
    build: ({ dims, palette }) => {
      const gate: Seg = [];
      const hz = dims.D / 2;
      rectXY(gate, -1.4, 0, 1.4, 2.6, -hz + 0.05);
      for (let i = -2; i <= 2; i++) line(gate, i * 0.5, 0, -hz + 0.05, i * 0.5, 2.6, -hz + 0.05);
      const out: THREE.Object3D[] = [makeLines(gate, palette.primary, 1)];
      // drifting wisps
      for (let i = 0; i < 4; i++) {
        const w: Seg = [];
        diamond(w, 0, 0, 0, 0.18);
        const wo = makeLines(w, FIRE_COLOR, 0.9);
        wo.position.set(-1.5 + i, 1.0 + (i % 2) * 0.4, -hz + 1.5 + i * 0.3);
        wo.userData.kind = "wisp";
        wo.userData.phase = i;
        out.push(wo);
      }
      return out;
    },
    animate: (objs, t) => {
      for (const o of objs as any[]) {
        if (o.userData.kind !== "wisp") continue;
        o.position.y = 1.1 + Math.sin(t * 1.5 + o.userData.phase) * 0.4;
        o.material.transparent = true;
        o.material.opacity = 0.5 + 0.5 * Math.abs(Math.sin(t * 2 + o.userData.phase));
      }
    },
  },
  "LAND-OF-LIVING-DEAD": {
    note: "A ghoulish plain; shades wander, a crystal skull glows cold.",
    build: ({ dims, palette }) => {
      const ghosts: Seg = [], skull: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      for (const [x, z] of [[-hx + 1.5, -1], [hx - 2, 0.5], [-1, hz - 1.5], [1.5, -hz + 2]])
        figure(ghosts, x, z, 0.9);
      diamond(skull, 0, 1.0, 0, 0.35);
      line(skull, -0.14, 0.85, 0, 0.14, 0.85, 0);
      return [makeLines(ghosts, palette.detail, 0.6), moving(makeLines(skull, palette.accent, 1))];
    },
  },
  "CYCLOPS-ROOM": {
    note: "The hungry cyclops looms; his single eye fixes on you.",
    build: ({ palette }) => {
      const body: Seg = [], eye: Seg = [];
      figure(body, 0, -1, 2.2); // huge
      diamond(eye, 0, 3.0, -1, 0.22); // single eye high up
      const eo = makeLines(eye, FIRE_COLOR, 1);
      eo.userData.kind = "eye";
      return [makeLines(body, palette.primary, 1), eo];
    },
    animate: (objs, t) => {
      for (const o of objs as any[]) {
        if (o.userData.kind !== "eye") continue;
        const blink = Math.sin(t * 0.8) > 0.96 ? 0.2 : 1; // occasional blink
        o.scale.set(1, blink, 1);
        o.material.transparent = true;
        o.material.opacity = 0.7 + 0.3 * Math.abs(Math.sin(t * 3));
      }
    },
  },
  "TREASURE-ROOM": {
    note: "The thief's hoard: heaps of jewels and a great chest.",
    build: ({ palette }) => {
      const a: Seg = [], gems: Seg = [];
      boxEdges(a, 0, 0.4, -1, 1.4, 0.8, 0.9); // chest
      line(a, -0.7, 0.8, -1.45, 0.7, 0.8, -1.45);
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        diamond(gems, Math.cos(ang) * 1.6, 0.15, Math.sin(ang) * 1.6 + 0.5, 0.15);
      }
      figure(a, 1.8, 1.2, 1.0); // the thief lurking
      return [makeLines(a, palette.primary, 1), moving(makeLines(gems, palette.accent, 1))];
    },
  },
  "DAM-ROOM": {
    note: "The great dam; a control panel with a glowing bolt and bubble.",
    build: ({ dims, palette }) => {
      const a: Seg = [], ac: Seg = [];
      const hx = dims.W / 2, H = dims.H;
      // sloped dam wall on the north
      const hz = dims.D / 2;
      for (let i = 0; i <= 6; i++) {
        const x = -hx + (dims.W * i) / 6;
        line(a, x, 0, -hz + 0.1, x, H, -hz + 0.8);
      }
      line(a, -hx, H, -hz + 0.8, hx, H, -hz + 0.8);
      // control panel
      boxEdges(a, hx - 1.2, 1.0, 0, 0.1, 1.0, 1.4);
      diamond(ac, hx - 1.2, 1.2, 0.3, 0.12); // glowing bubble
      line(ac, hx - 1.2, 0.8, -0.3, hx - 1.2, 1.0, -0.3); // bolt
      return [makeLines(a, palette.primary, 1), moving(makeLines(ac, palette.accent, 1))]; // bubble/bolt pulse
    },
  },
  "ON-RAINBOW": {
    note: "Standing on the rainbow itself; its bands shimmer underfoot.",
    build: ({ dims }) => {
      const bands = [0xff5a52, 0xffa54a, 0xffe24a, 0x5dff8a, 0x5cc8ff, 0xc79bff];
      const out: THREE.Object3D[] = [];
      const hz = dims.D / 2;
      bands.forEach((c, i) => {
        const seg: Seg = [];
        archXY(seg, 0, 0, -hz + 1 + i * 0.18, 4 + i * 0.4, 4 + i * 0.4);
        const m = makeLines(seg, c, 1);
        m.userData.kind = "band";
        m.userData.phase = i / bands.length;
        out.push(m);
      });
      return out;
    },
    animate: (objs, t) => {
      for (const o of objs as any[]) {
        if (o.userData.kind !== "band") continue;
        o.material.transparent = true;
        o.material.opacity = 0.55 + 0.45 * Math.abs(Math.sin(t * 2 + o.userData.phase * 6.28));
      }
    },
  },
  "ATTIC": {
    note: "A dark, cramped attic; a table, a coil of rope, a nasty knife.",
    suppress: ["ATTIC-TABLE", "ROPE"],
    build: ({ dims, palette }) => {
      const a: Seg = [], ac: Seg = [];
      const H = dims.H;
      boxEdges(a, 0.5, 0.5, 0, 1.4, 0.1, 0.9); // table top
      for (const [lx, lz] of [[-0.6, -0.4], [1.6, -0.4], [1.6, 0.4], [-0.6, 0.4]]) line(a, lx, 0, lz, lx, 0.5, lz);
      // exposed rafters
      for (let i = 0; i < 3; i++) line(a, -dims.W / 2, H - 0.1, -1 + i, dims.W / 2, H - 0.1, -1 + i);
      // coiled rope (accent)
      ring(ac, -1.4, 0.5, 0.3, 0.6);
      ring(ac, -1.4, 0.5, 0.22, 0.7);
      return [makeLines(a, palette.primary, 1), makeLines(ac, palette.accent, 1)];
    },
  },
  "GAS-ROOM": {
    note: "Reeking of coal gas — bring no flame here. Vapours drift and curl.",
    build: ({ dims, palette }) => {
      const out: THREE.Object3D[] = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      const base: Seg = [];
      // a few rocks
      for (let i = 0; i < 4; i++) diamond(base, -hx + 1 + i * 1.5, 0.2, hz - 1.5, 0.2);
      out.push(makeLines(base, palette.primary, 1));
      for (let i = 0; i < 4; i++) {
        const g: Seg = [];
        ring(g, 0, 0, 0.4 + i * 0.1, 0);
        const m = makeLines(g, palette.accent, 0.5);
        m.position.set(-hx + 1.5 + i * 1.6, 1.0 + (i % 2) * 0.5, 0);
        m.rotation.x = Math.PI / 2;
        m.userData.kind = "gas";
        m.userData.phase = i;
        out.push(m);
      }
      return out;
    },
    animate: (objs, t) => {
      for (const o of objs as any[]) {
        if (o.userData.kind !== "gas") continue;
        o.position.y = 1.0 + Math.sin(t * 1.2 + o.userData.phase) * 0.5;
        o.material.transparent = true;
        o.material.opacity = 0.3 + 0.3 * Math.abs(Math.sin(t * 1.5 + o.userData.phase));
      }
    },
  },
  // --- Dam & reservoir water system ----------------------------------------
  "DAM-LOBBY": {
    note: "Tour waiting room; doorways marked Private to N and E, path south.",
    build: ({ dims, palette }) => {
      const a: Seg = [];
      const hz = dims.D / 2, hx = dims.W / 2;
      rectXY(a, -0.9, 0, 0.9, 2.2, -hz + 0.05); // north "Private" doorway
      ln(a, eastWall(dims), -0.9, 0, 0.9, 2.2); // east "Private" doorway
      for (const [x, z] of [[-1.5, 0], [1.5, 0.5]]) boxEdges(a, x, 0.45, z, 0.6, 0.9, 0.6); // benches
      const fire: Seg = [];
      flame(fire, hx - 0.6, -hz + 0.6, 0.5); // a guttering wall lamp
      return [makeLines(a, palette.primary, 1), moving(makeLines(fire, FIRE_COLOR, 1), "flame")];
    },
  },
  "MAINTENANCE-ROOM": {
    note: "Ransacked control room: 4 coloured buttons, tool chest, a dripping leak.",
    suppress: ["YELLOW-BUTTON", "BROWN-BUTTON", "RED-BUTTON", "BLUE-BUTTON", "TOOL-CHEST", "LEAK"],
    build: ({ dims, palette }) => {
      const a: Seg = [], leak: Seg = [];
      const hz = dims.D / 2;
      boxEdges(a, -1.6, 0.5, 0, 1.2, 1.0, 0.7); // tool chest
      const cols = [0xffe24a, 0x9a6a3a, 0xff5a52, 0x5cc8ff];
      const out: THREE.Object3D[] = [makeLines(a, palette.primary, 1)];
      cols.forEach((c, i) => {
        const b: Seg = [];
        rectXY(b, 0.4 + i * 0.5 - 0.15, 1.2, 0.4 + i * 0.5 + 0.15, 1.5, -hz + 0.05);
        out.push(makeLines(b, c, 1)); // the four coloured buttons
      });
      zigzag(leak, 1.8, 2.4, 0.6, 0.2, 0.05, 5); // water leaking from the wall
      out.push(moving(makeLines(leak, WATER_COLOR, 1), "water"));
      return out;
    },
  },
  "DAM-BASE": {
    note: "Base of the dam looming north; the Frigid River flows past the White Cliffs.",
    build: ({ dims, palette }) => {
      const a: Seg = [], water: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      for (let i = 0; i <= 6; i++) line(a, -hx + (dims.W * i) / 6, 2.2, -hz + 0.1, -hx + (dims.W * i) / 6, dims.H, -hz + 0.9); // dam wall N
      line(a, hx - 0.1, 0, -hz, hx - 0.1, dims.H, hz); // white cliff E
      waterPlane(water, hx, hz * 0.5, 0.3, 4);
      return [makeLines(a, palette.primary, 1), moving(makeLines(water, WATER_COLOR, 1), "water")];
    },
  },
  "RESERVOIR-SOUTH": {
    note: "South shore of the reservoir; water stretches north.",
    build: ({ dims, palette }) => {
      const w: Seg = [];
      waterPlane(w, dims.W / 2, dims.D / 2, 0.25);
      return [moving(makeLines(w, WATER_COLOR, 1), "water")];
    },
  },
  "RESERVOIR": {
    note: "On/across the reservoir — a wide body of water.",
    build: ({ dims, palette }) => {
      const w: Seg = [];
      waterPlane(w, dims.W / 2, dims.D / 2, 0.3, 8);
      return [moving(makeLines(w, WATER_COLOR, 1), "water")];
    },
  },
  "RESERVOIR-NORTH": {
    note: "North shore; an air pump sits here, stairs lead on.",
    build: ({ dims, palette }) => {
      const w: Seg = [];
      waterPlane(w, dims.W / 2, dims.D / 2, 0.25);
      return [moving(makeLines(w, WATER_COLOR, 1), "water")];
    },
  },
  "STREAM-VIEW": {
    note: "A path beside a stream flowing west to east.",
    build: ({ dims, palette }) => {
      const w: Seg = [], path: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      for (let r = 0; r < 3; r++) {
        let px = -hx, py = 0.2;
        for (let i = 1; i <= 16; i++) { const nx = -hx + (2 * hx * i) / 16; const ny = 0.2 + Math.sin(i + r) * 0.06; line(w, px, py, hz - 1 + r * 0.4, nx, ny, hz - 1 + r * 0.4); px = nx; py = ny; }
      }
      line(path, -hx, 0.02, -hz + 1, hx, 0.02, -hz + 1);
      return [makeLines(path, palette.detail, 0.6), moving(makeLines(w, WATER_COLOR, 1), "water")];
    },
  },
  "IN-STREAM": {
    note: "Afloat on the stream; a narrow beach to land on.",
    build: ({ dims, palette }) => {
      const w: Seg = [], beach: Seg = [];
      waterPlane(w, dims.W / 2, dims.D / 2, 0.3, 7);
      rectXZ(beach, dims.W / 2 - 1.4, -dims.D / 2 + 0.5, dims.W / 2 - 0.2, dims.D / 2 - 0.5, 0.05); // beach
      return [makeLines(beach, palette.detail, 0.7), moving(makeLines(w, WATER_COLOR, 1), "water")];
    },
  },
  // --- Canyon & rainbow ----------------------------------------------------
  "CANYON-VIEW": {
    note: "Top of the Great Canyon; the Frigid River below, a rainbow across.",
    build: ({ dims, palette }) => {
      const cliff: Seg = [], water: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      chasmVoid(cliff, -hx + 0.5, -hz + 0.6, hx - 0.5, hz - 0.6); // the canyon drop
      const out: THREE.Object3D[] = [makeLines(cliff, palette.primary, 1)];
      for (let i = 0; i < 4; i++) line(water, -hx + 1 + i, -2.5, 0, hx - 1, -2.5, 0.4 + i * 0.1); // river far below
      out.push(moving(makeLines(water, WATER_COLOR, 0.8), "water"));
      rainbow(out, -hz + 1, 5); // rainbow across the canyon
      return out;
    },
  },
  "CANYON-BOTTOM": {
    note: "Beneath the canyon walls; runoff of Aragain Falls flows by, path north.",
    build: ({ dims, palette }) => {
      const walls: Seg = [], water: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2, H = dims.H;
      line(walls, -hx + 0.1, 0, -hz, -hx + 0.6, H + 3, hz); // towering walls
      line(walls, hx - 0.1, 0, -hz, hx - 0.6, H + 3, hz);
      waterPlane(water, hx, 1.0, 0.2, 3);
      return [makeLines(walls, palette.primary, 1), moving(makeLines(water, WATER_COLOR, 1), "water")];
    },
  },
  "CLIFF-MIDDLE": {
    note: "A ledge halfway up the canyon wall; the falls' flow twists below.",
    build: ({ dims, palette }) => {
      const ledge: Seg = [], water: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      rectXZ(ledge, -hx + 0.4, -hz + 0.4, hx - 0.4, hz - 0.4, 0.02); // the ledge
      line(ledge, -hx, 0, -hz, -hx, dims.H + 4, -hz); // wall up
      for (let i = 0; i < 3; i++) line(water, -hx + 1, -3, i * 0.4, hx - 1, -3, i * 0.4 + 0.3);
      return [makeLines(ledge, palette.primary, 1), moving(makeLines(water, WATER_COLOR, 0.7), "water")];
    },
  },
  "ARAGAIN-FALLS": {
    note: "The thundering Aragain Falls, a rainbow arching over the spray.",
    build: ({ dims, palette }) => {
      const out: THREE.Object3D[] = [];
      const fall: Seg = [];
      const hx = dims.W / 2;
      for (let i = 0; i <= 10; i++) { const x = -hx + (dims.W * i) / 10; zigzag(fall, x, 3.5, -dims.D / 2 + 0.4, 0.0, 0.06, 6); } // falling water curtain
      out.push(moving(makeLines(fall, WATER_COLOR, 1), "water"));
      rainbow(out, -dims.D / 2 + 1, 4.5);
      return out;
    },
  },
  "END-OF-RAINBOW": {
    note: "A rocky beach past the falls; the rainbow ends here (a pot of gold).",
    build: ({ dims, palette }) => {
      const beach: Seg = [], water: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      rectXZ(beach, -hx + 0.4, hz - 1.6, hx - 0.4, hz - 0.4, 0.04); // beach
      waterPlane(water, hx, 1.0, 0.25, 3);
      const out: THREE.Object3D[] = [makeLines(beach, palette.detail, 0.7), moving(makeLines(water, WATER_COLOR, 1), "water")];
      rainbow(out, -hz + 1.2, 4);
      return out;
    },
  },
  // --- Central halls & curiosities -----------------------------------------
  "DOME-ROOM": {
    note: "A wrought-iron railing rings a dome over the Torch Room far below.",
    suppress: ["RAILING"],
    build: ({ dims, palette }) => {
      const rail: Seg = [], fire: Seg = [];
      const r = Math.min(dims.W, dims.D) / 2 - 0.8;
      ring(rail, 0, 0, r, 0.9); // railing
      for (let k = 0; k < 16; k++) { const t = (k / 16) * Math.PI * 2; line(rail, Math.cos(t) * r, 0, Math.sin(t) * r, Math.cos(t) * r, 0.9, Math.sin(t) * r); } // balusters
      flame(fire, 0, 0, 0.8); // torch glimmer far below the dome
      const fo = moving(makeLines(fire, FIRE_COLOR, 0.8), "flame");
      fo.position.y = -4;
      return [makeLines(rail, palette.primary, 1), fo];
    },
  },
  "MIRROR-ROOM-1": {
    note: "A great mirror fills the north wall — touch it to be elsewhere.",
    suppress: ["MIRROR-1"],
    build: ({ dims, palette }) => {
      const m: Seg = [];
      mirrorPanel(m, northWall(dims));
      return [moving(makeLines(m, palette.accent, 1), "glow")];
    },
  },
  "MIRROR-ROOM-2": {
    note: "A great mirror fills the south wall — touch it to be elsewhere.",
    suppress: ["MIRROR-2"],
    build: ({ dims, palette }) => {
      const m: Seg = [];
      mirrorPanel(m, southWall(dims));
      return [moving(makeLines(m, palette.accent, 1), "glow")];
    },
  },
  "GALLERY": {
    note: "An art gallery; the thieves left empty frames and one fine painting.",
    suppress: ["PAINTING"],
    build: ({ dims, palette }) => {
      const frames: Seg = [], art: Seg = [];
      const hz = dims.D / 2, hx = dims.W / 2;
      // empty frames on the walls (paintings stolen)
      for (let i = -1; i <= 1; i++) rectXY(frames, i * 1.3 - 0.5, 1.2, i * 1.3 + 0.5, 2.1, -hz + 0.05);
      // the one remaining painting on the east wall
      const m = eastWall(dims);
      rc(art, m, -0.6, 1.2, 0.6, 2.1);
      ln(art, m, -0.5, 1.5, 0.5, 1.8);
      void hx;
      return [makeLines(frames, palette.detail, 0.7), moving(makeLines(art, palette.accent, 1), "glow")];
    },
  },
  "STUDIO": {
    note: "An artist's studio splattered with 69 colours; a chimney leads up.",
    build: ({ dims, palette }) => {
      const a: Seg = [];
      const hx = dims.W / 2, H = dims.H;
      line(a, hx - 0.5, 0, 0, hx - 0.5, H, 0); line(a, hx - 1.1, 0, 0, hx - 1.1, H, 0); line(a, hx - 0.5, H, 0, hx - 1.1, H, 0); // chimney up
      const out: THREE.Object3D[] = [makeLines(a, palette.primary, 1)];
      // paint splatters in many colours on the floor
      const cols = [0xff5a52, 0xffa54a, 0xffe24a, 0x5dff8a, 0x5cc8ff, 0xc79bff, 0xffffff];
      cols.forEach((c, i) => {
        const s: Seg = [];
        const ang = (i / cols.length) * Math.PI * 2;
        diamond(s, Math.cos(ang) * 1.6, 0.03, Math.sin(ang) * 1.4, 0.12);
        out.push(makeLines(s, c, 0.9));
      });
      return out;
    },
  },
  "ATLANTIS-ROOM": {
    note: "An ancient room long under water; a crystal trident, stairs up.",
    build: ({ dims, palette }) => {
      const a: Seg = [], caustic: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2, H = dims.H;
      for (let i = 0; i < 4; i++) { const y = 0.5 + i * 0.4; rectXZ(a, hx - 1.8, -hz + 0.6, hx - 0.6, -hz + 1.0 + i * 0.2, y); } // stairs up
      waterPlane(caustic, hx, hz, H - 0.2, 5); // light caustics on the ceiling
      return [makeLines(a, palette.primary, 1), moving(makeLines(caustic, WATER_COLOR, 0.5), "water")];
    },
  },
  "EAST-OF-CHASM": {
    note: "The east edge of a bottomless chasm; passage north, path east.",
    build: ({ dims, palette }) => {
      const a: Seg = [], mist: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      chasmVoid(a, -hx + 0.4, -1, hx - 0.4, 1);
      for (let i = 0; i < 4; i++) zigzag(mist, -hx + 1.5 + i * 1.2, -1, 0, 1.2, 0.1, 4); // mist rising
      return [makeLines(a, palette.primary, 1), moving(makeLines(mist, palette.detail, 0.5), "wisp")];
    },
  },
  "CHASM-ROOM": {
    note: "A chasm runs SW-NE; a crack opens into a passage.",
    build: ({ dims, palette }) => {
      const a: Seg = [], mist: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      // diagonal chasm SW-NE
      for (let i = 0; i <= 6; i++) { const t = i / 6; line(a, -hx + t * dims.W, 0.02, hz - t * dims.D, -hx + t * dims.W, -3, hz - t * dims.D); }
      zigzag(mist, 0, 0, 0, 1.4, 0.12, 5);
      return [makeLines(a, palette.primary, 1), moving(makeLines(mist, palette.detail, 0.5), "wisp")];
    },
  },
  "EW-PASSAGE": {
    note: "A narrow east-west passage; a stair leads down at the north end.",
    build: ({ dims, palette }) => {
      const a: Seg = [], glow: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      for (let i = 0; i < 4; i++) { const y = 0.3 + i * 0.3; rectXZ(a, -0.7, -hz + 0.5 + i * 0.2, 0.7, -hz + 0.9 + i * 0.2, y); } // stair down at north
      diamond(glow, 0, 1.6, hz - 0.3, 0.12); // a lit niche
      return [makeLines(a, palette.primary, 1), moving(makeLines(glow, palette.accent, 1), "glow")];
    },
  },
  "ENGRAVINGS-CAVE": {
    note: "A low cave, walls covered in ancient glowing engravings.",
    suppress: ["ENGRAVINGS"],
    build: ({ dims, palette }) => {
      const a: Seg = [], eng: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2, H = dims.H;
      rectXZ(a, -hx, -hz, hx, hz, H - 0.4); // low ceiling
      // engraving glyphs along the walls
      for (let i = 0; i < 8; i++) { const x = -hx + 0.4 + i * (dims.W / 8); for (let j = 0; j < 3; j++) { const y = 0.8 + j * 0.5; line(eng, x, y, -hz + 0.05, x + 0.2, y + 0.2, -hz + 0.05); line(eng, x + 0.2, y + 0.2, -hz + 0.05, x, y + 0.4, -hz + 0.05); } }
      return [makeLines(a, palette.primary, 1), moving(makeLines(eng, palette.accent, 1), "glow")];
    },
  },
  "DEEP-CANYON": {
    note: "A deep canyon; far below, the echo of rushing water, stairs descend.",
    build: ({ dims, palette }) => {
      const a: Seg = [], water: Seg = [];
      const hx = dims.W / 2, hz = dims.D / 2;
      chasmVoid(a, -hx + 0.4, -hz + 0.6, hx - 0.4, hz - 0.6);
      for (let i = 0; i < 3; i++) line(water, -hx + 1, -3.5, i * 0.4, hx - 1, -3.5, i * 0.4 + 0.3);
      return [makeLines(a, palette.primary, 1), moving(makeLines(water, WATER_COLOR, 0.6), "water")];
    },
  },
};

export function getHero(id: string): HeroSpec | undefined {
  return HERO_ROOMS[id];
}

export const HEROED_IDS = Object.keys(HERO_ROOMS);
