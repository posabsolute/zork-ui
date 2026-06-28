/*
 * roomBuilder.ts — render each room as glowing vector line-art.
 *
 * The shell (floor/ceiling/pillars/grid + portal doorways at the real exits) is
 * built here; region-specific atmosphere (trees, furniture, columns, water...) is
 * added by decorateRoom. Design language: 1980 vector graphics meets Another
 * World silhouettes — luminous line on black, a tight per-region palette.
 */
import * as THREE from "three";
import type { Room } from "../engine/roomState.ts";
import { vectorColor } from "../config/regions.ts";
import {
  type Seg, line, rectXZ, makeLines, makeLabel,
  hashStr, mulberry32,
} from "./lineKit.ts";
import { decorateRoom } from "./decor.ts";
import { buildObjectIcon } from "./objectIcons.ts";
import { getHero } from "./heroRooms.ts";

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
  const hero = getHero(room.id);
  const color = hero?.palette ?? vectorColor(room.region);
  const dimColor = new THREE.Color(color).multiplyScalar(0.45).getHex();
  const rng = mulberry32(hashStr(room.id));

  const W = 7 + ((room.value ?? 5) % 5);
  const H = 3.4;
  const D = 7 + ((room.id.length * 7) % 5);
  const doorW = 2.0;
  const doorH = 2.6;
  const hx = W / 2,
    hz = D / 2;

  const seg: Seg = [];
  const grid: Seg = [];

  // Shell: floor + ceiling + corner pillars.
  rectXZ(seg, -hx, -hz, hx, hz, 0);
  rectXZ(seg, -hx, -hz, hx, hz, H);
  for (const [sx, sz] of [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]) {
    line(seg, sx, 0, sz, sx, H, sz);
  }

  // Vector grid floor.
  for (let x = -hx; x <= hx + 0.001; x += 1) line(grid, x, 0.01, -hz, x, 0.01, hz);
  for (let z = -hz; z <= hz + 0.001; z += 1) line(grid, -hx, 0.01, z, hx, 0.01, z);

  // Portal frames where the room really has exits.
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
  const portal: Seg = [];
  for (const dir of ["NORTH", "SOUTH", "EAST", "WEST"]) {
    if (!doorDirs.has(dir)) continue;
    if (dir === "NORTH") portalXY(portal, -doorW / 2, doorW / 2, doorH, -hz, true);
    else if (dir === "SOUTH") portalXY(portal, -doorW / 2, doorW / 2, doorH, hz, true);
    else if (dir === "EAST") portalXY(portal, -doorW / 2, doorW / 2, doorH, hx, false);
    else portalXY(portal, -doorW / 2, doorW / 2, doorH, -hx, false);
  }

  // Stairs up / chevrons down.
  if (open("UP")) {
    for (let i = 0; i < 4; i++) {
      const y = 0.3 + i * 0.35;
      rectXZ(seg, hx - 2.0, -hz + 0.6, hx - 0.6, -hz + 1.0 + i * 0.2, y);
    }
  }
  if (open("DOWN")) {
    for (let i = 0; i < 3; i++) {
      const z = hz - 0.8 - i * 0.4;
      line(portal, -hx + 0.8, 0.02, z, -hx + 1.6, 0.02, z + 0.5);
      line(portal, -hx + 1.6, 0.02, z + 0.5, -hx + 2.4, 0.02, z);
    }
  }

  group.add(makeLines(seg, color, 1));
  group.add(makeLines(grid, dimColor, 0.55));
  group.add(makeLines(portal, color, 1));

  // Hero rooms override procedural atmosphere with hand-authored geometry.
  if (hero) {
    for (const o of hero.build({ dims: { W, H, D }, color, rng })) group.add(o);
  } else {
    for (const o of decorateRoom(room, color, { W, H, D }, rng)) group.add(o);
  }

  // Object icons, placed where they belong (floor items on the floor, fixtures
  // on walls) rather than floating in a ring.
  placeObjects(group, room, color, { W, H, D }, doorDirs);

  const entryFacing = (dir?: string) => {
    const back = oppositeCardinal(dir);
    const n = CARDINAL[back] ?? new THREE.Vector2(0, 1);
    return {
      pos: new THREE.Vector3((n.x * W) / 2 - n.x * 1.3, 1.6, (n.y * D) / 2 - n.y * 1.3),
    };
  };

  return { group, entryFacing };
}

function placeObjects(
  group: THREE.Group,
  room: Room,
  color: number,
  dim: { W: number; H: number; D: number },
  doorDirs: Set<string>
) {
  const hx = dim.W / 2,
    hz = dim.D / 2;
  // Prefer walls without a doorway for mounting fixtures.
  const wallOrder = ["NORTH", "EAST", "WEST", "SOUTH"].sort(
    (a, b) => (doorDirs.has(a) ? 1 : 0) - (doorDirs.has(b) ? 1 : 0)
  );
  const wallCount = new Map<string, number>();
  let wallTurn = 0;

  const sx = dim.W * 0.3,
    sz = dim.D * 0.3;
  const floorSlots = [
    { x: -sx, z: -sz }, { x: sx, z: -sz }, { x: sx, z: sz }, { x: -sx, z: sz },
    { x: 0, z: -sz }, { x: -sx, z: 0 }, { x: sx, z: 0 }, { x: 0, z: sz },
  ];
  let floorIdx = 0;

  for (const id of room.objects) {
    const icon = buildObjectIcon(id, id);
    const ls = makeLines(icon.segs, color, 1);
    let labelPos: THREE.Vector3;

    if (icon.kind === "wall") {
      const wall = wallOrder[wallTurn++ % wallOrder.length];
      const n = wallCount.get(wall) ?? 0;
      wallCount.set(wall, n + 1);
      const along = Math.max(-((wall === "EAST" || wall === "WEST" ? hz : hx) - 1), Math.min((wall === "EAST" || wall === "WEST" ? hz : hx) - 1, (n - 1) * 1.6));
      if (wall === "NORTH") { ls.position.set(along, 0, -hz + 0.05); }
      else if (wall === "SOUTH") { ls.position.set(along, 0, hz - 0.05); ls.rotation.y = Math.PI; }
      else if (wall === "EAST") { ls.position.set(hx - 0.05, 0, along); ls.rotation.y = -Math.PI / 2; }
      else { ls.position.set(-hx + 0.05, 0, along); ls.rotation.y = Math.PI / 2; }
      labelPos = ls.position.clone();
      labelPos.y = icon.height + 0.25;
    } else if (icon.kind === "flat") {
      const slot = floorSlots[floorIdx++ % floorSlots.length];
      ls.position.set(slot.x * 0.4, 0.02, slot.z * 0.4);
      labelPos = new THREE.Vector3(ls.position.x, 0.6, ls.position.z);
    } else {
      const slot = floorSlots[floorIdx++ % floorSlots.length];
      ls.position.set(slot.x, 0, slot.z);
      ls.rotation.y = Math.atan2(-slot.x, -slot.z);
      labelPos = new THREE.Vector3(slot.x, icon.height + 0.3, slot.z);
    }

    group.add(ls);
    group.add(makeLabel(id, color, labelPos, 0.7));
  }
}

function portalXY(a: Seg, x1: number, x2: number, h: number, plane: number, onZ: boolean) {
  const p = (x: number, y: number): [number, number, number] =>
    onZ ? [x, y, plane] : [plane, y, x];
  const c = [p(x1, 0), p(x2, 0), p(x2, h), p(x1, h)];
  for (let i = 0; i < 4; i++) {
    const s = c[i], e = c[(i + 1) % 4];
    a.push(s[0], s[1], s[2], e[0], e[1], e[2]);
  }
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
