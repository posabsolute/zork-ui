/*
 * roomBuilder.ts — render each room as glowing vector line-art.
 *
 * Design language: 1980 vector graphics (think Battlezone, the same year Zork
 * shipped). Luminous wireframe on pure black, a tight per-region phosphor palette,
 * a grid floor for depth. Doorways are bright portal frames where the room really
 * has exits; solid walls are quiet outlines. No texture, no filter — just light
 * and line. The glow comes from a real bloom pass, not a fake scanline.
 */
import * as THREE from "three";
import type { Room } from "../engine/roomState.ts";
import { vectorColor } from "../config/regions.ts";

const CARDINAL: Record<string, THREE.Vector2> = {
  NORTH: new THREE.Vector2(0, -1),
  SOUTH: new THREE.Vector2(0, 1),
  EAST: new THREE.Vector2(1, 0),
  WEST: new THREE.Vector2(-1, 0),
};

export interface BuiltRoom {
  group: THREE.Group;
  entryFacing: (dir?: string) => { pos: THREE.Vector3 };
}

export function buildRoom(room: Room): BuiltRoom {
  const group = new THREE.Group();
  const color = vectorColor(room.region);
  const dim = new THREE.Color(color).multiplyScalar(0.45).getHex();

  const W = 7 + ((room.value ?? 5) % 5);
  const H = 3.4;
  const D = 7 + ((room.id.length * 7) % 5);
  const doorW = 2.0;
  const doorH = 2.6;

  const seg: number[] = []; // bright structural lines
  const grid: number[] = []; // dim floor grid

  const hx = W / 2,
    hz = D / 2;

  // Floor & ceiling rectangles
  rect(seg, -hx, 0, -hz, hx, 0, hz);
  rect(seg, -hx, H, -hz, hx, H, hz);
  // Corner pillars
  for (const [sx, sz] of [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
  ]) {
    line(seg, sx, 0, sz, sx, H, sz);
  }

  // Vector grid floor (the iconic perspective grid)
  const step = 1.0;
  for (let x = -hx; x <= hx + 0.001; x += step) line(grid, x, 0.01, -hz, x, 0.01, hz);
  for (let z = -hz; z <= hz + 0.001; z += step) line(grid, -hx, 0.01, z, hx, 0.01, z);

  // Which directions are real exits?
  const open = (dir: string) => {
    const e = room.exits[dir];
    return !!e && e.kind !== "blocked";
  };
  const doorDirs = new Set<string>();
  for (const dir of Object.keys(room.exits)) {
    if (!open(dir)) continue;
    if (CARDINAL[dir]) doorDirs.add(dir);
    else if (dir === "NE" || dir === "NW") doorDirs.add("NORTH");
    else if (dir === "SE" || dir === "SW") doorDirs.add("SOUTH");
    else if (dir === "IN" || dir === "OUT") doorDirs.add("SOUTH");
  }

  // Portal frames on walls that have exits.
  const portal: number[] = [];
  for (const dir of ["NORTH", "SOUTH", "EAST", "WEST"]) {
    if (!doorDirs.has(dir)) continue;
    const onZ = dir === "NORTH" ? -hz : dir === "SOUTH" ? hz : 0;
    const onX = dir === "EAST" ? hx : dir === "WEST" ? -hx : 0;
    if (dir === "NORTH" || dir === "SOUTH") {
      doorRectXY(portal, -doorW / 2, 0, doorW / 2, doorH, onZ, true);
    } else {
      doorRectXY(portal, -doorW / 2, 0, doorW / 2, doorH, onX, false);
    }
  }

  // Stairs up / hatch down as little stacked frames.
  if (open("UP")) {
    for (let i = 0; i < 4; i++) {
      const y = 0.3 + i * 0.35;
      rect(seg, hx - 2.0, y, -hz + 0.6, hx - 0.6, y, -hz + 0.6 + 0.4 + i * 0.2);
    }
  }
  if (open("DOWN")) {
    // downward chevrons in the floor
    for (let i = 0; i < 3; i++) {
      const z = hz - 0.8 - i * 0.4;
      line(portal, -hx + 0.8, 0.02, z, -hx + 1.6, 0.02, z + 0.5);
      line(portal, -hx + 1.6, 0.02, z + 0.5, -hx + 2.4, 0.02, z);
    }
  }

  group.add(makeLines(seg, color, 1.0));
  group.add(makeLines(grid, dim, 0.6));
  group.add(makeLines(portal, color, 1.0));

  // Object markers: a glowing diamond + label.
  room.objects.forEach((id, i) => {
    const angle = (i / Math.max(1, room.objects.length)) * Math.PI * 2;
    const r = Math.min(W, D) / 2 - 1.6;
    const px = Math.cos(angle) * r;
    const pz = Math.sin(angle) * r;
    const diamond: number[] = [];
    diamondAt(diamond, px, 1.0, pz, 0.35);
    group.add(makeLines(diamond, color, 1.0));
    group.add(makeLabel(id, color, new THREE.Vector3(px, 1.7, pz)));
  });

  const entryFacing = (dir?: string) => {
    const back = oppositeCardinal(dir);
    const n = CARDINAL[back] ?? new THREE.Vector2(0, 1);
    return {
      pos: new THREE.Vector3((n.x * W) / 2 - n.x * 1.3, 1.6, (n.y * D) / 2 - n.y * 1.3),
    };
  };

  return { group, entryFacing };
}

// ---- line helpers ---------------------------------------------------------
function line(a: number[], x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  a.push(x1, y1, z1, x2, y2, z2);
}
function rect(a: number[], x1: number, y: number, z1: number, x2: number, y2OrZ: number, z2: number) {
  // axis-aligned rectangle in the XZ plane at height y (y2OrZ unused name kept simple)
  const yy = y;
  line(a, x1, yy, z1, x2, yy, z1);
  line(a, x2, yy, z1, x2, yy, z2);
  line(a, x2, yy, z2, x1, yy, z2);
  line(a, x1, yy, z2, x1, yy, z1);
}
function doorRectXY(a: number[], x1: number, y1: number, x2: number, y2: number, plane: number, onZ: boolean) {
  const p = (x: number, y: number) =>
    onZ ? [x, y, plane] : [plane, y, x];
  const c = [p(x1, y1), p(x2, y1), p(x2, y2), p(x1, y2)];
  for (let i = 0; i < 4; i++) {
    const s = c[i],
      e = c[(i + 1) % 4];
    a.push(s[0], s[1], s[2], e[0], e[1], e[2]);
  }
}
function diamondAt(a: number[], x: number, y: number, z: number, s: number) {
  const pts = [
    [x, y + s, z],
    [x + s, y, z],
    [x, y - s, z],
    [x - s, y, z],
  ];
  for (let i = 0; i < 4; i++) {
    const p = pts[i],
      q = pts[(i + 1) % 4];
    a.push(p[0], p[1], p[2], q[0], q[1], q[2]);
  }
}

function makeLines(positions: number[], color: number, opacity: number): THREE.LineSegments {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  return new THREE.LineSegments(geo, mat);
}

function makeLabel(id: string, color: number, pos: THREE.Vector3): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 48;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "bold 26px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.fillText(id.replace(/-/g, " ").toLowerCase(), 128, 26);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true })
  );
  sprite.scale.set(2.6, 0.5, 1);
  sprite.position.copy(pos);
  return sprite;
}

function oppositeCardinal(dir?: string): string {
  switch (dir) {
    case "NORTH": return "SOUTH";
    case "SOUTH": return "NORTH";
    case "EAST": return "WEST";
    case "WEST": return "EAST";
    case "NE": case "NW": return "SOUTH";
    case "SE": case "SW": return "NORTH";
    case "UP": return "DOWN";
    case "DOWN": return "UP";
    default: return "SOUTH";
  }
}
