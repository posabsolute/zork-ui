// scenes/index.ts — the room-id -> scene registry and the public API.

import { TREASURE, caveBackdrop, drawExitsCave, drawProp, dth, forestBackdrop, interiorBackdrop, pickPal, pixelStage, pixelTree, thiefOverlay } from "./kit.ts";
import type { SceneDraw } from "./kit.ts";
import { atticPixel, cellarPixel, chasmPixel, cyclopsRoomPixel, galleryPixel, kitchenPixel, livingRoomPixel, studioPixel, trollRoomPixel } from "./rooms-house.ts";
import { aragainFallsPixel, behindHousePixel, canyonBottomPixel, canyonViewPixel, clearingPixel, deepCanyonPixel, endOfRainbowPixel, forest1Pixel, forestDimPixel, mountainsPixel, northOfHousePixel, onRainbowPixel, pathPixel, southOfHousePixel, stoneBarrowPixel, upATreePixel, westOfHousePixel } from "./rooms-forest.ts";
import { atlantisRoomPixel, batRoomPixel, cliffMiddlePixel, coldPassagePixel, engravingsCavePixel, ewPassagePixel, loudRoomPixel, maintenanceRoomPixel, mirrorRoomPixel, narrowPassagePixel, nsPassagePixel, roundRoomPixel, sandyBeachPixel, sandyCavePixel, shorePixel, slideRoomPixel, smallCavePixel, smellyRoomPixel, squeekyRoomPixel, strangePassagePixel, whiteCliffsBeach, windingPassagePixel } from "./rooms-dungeon.ts";
import { gratingRoomPixel, maze5Pixel, mazePixel } from "./rooms-maze.ts";
import { damBasePixel, damLobbyPixel, damRoomPixel, dampCavePixel, inStreamPixel, reservoirPixel, reservoirShorePixel, riverScene, streamViewPixel } from "./rooms-river.ts";
import { coalMinePixel, gasRoomPixel, ladderBottomPixel, ladderTopPixel, lowerShaftPixel, machineRoomPixel, mineEntrancePixel, shaftRoomPixel, timberRoomPixel } from "./rooms-mine.ts";
import { deadEndPixel, domeRoomPixel, egyptRoomPixel, entranceToHadesPixel, landOfLivingDeadPixel, northTemplePixel, southTemplePixel, torchRoomPixel, treasureRoomPixel } from "./rooms-temple.ts";

export const SCENES: Record<string, SceneDraw> = {
  "WEST-OF-HOUSE": (ctx, w, h, t) => westOfHousePixel(ctx, w, h, t),
  "NORTH-OF-HOUSE": (ctx, w, h, t) => northOfHousePixel(ctx, w, h, t),
  "SOUTH-OF-HOUSE": (ctx, w, h, t) => southOfHousePixel(ctx, w, h, t),
  "EAST-OF-HOUSE": (ctx, w, h, t) => behindHousePixel(ctx, w, h, t),
  "FOREST-1": (ctx, w, h, t) => forest1Pixel(ctx, w, h, t),
  "PATH": (ctx, w, h, t) => pathPixel(ctx, w, h, t),
  "UP-A-TREE": (ctx, w, h, t) => upATreePixel(ctx, w, h, t),
  "KITCHEN": (ctx, w, h, t) => kitchenPixel(ctx, w, h, t),
  "LIVING-ROOM": (ctx, w, h, t) => livingRoomPixel(ctx, w, h, t),
  "ATTIC": (ctx, w, h, t) => atticPixel(ctx, w, h, t),
  // ---- hand-crafted landmarks (batch 1) ----
  "TROLL-ROOM": (ctx, w, h, t) => trollRoomPixel(ctx, w, h, t),
  "ROUND-ROOM": (ctx, w, h, t) => roundRoomPixel(ctx, w, h, t),
  "CYCLOPS-ROOM": (ctx, w, h, t) => cyclopsRoomPixel(ctx, w, h, t),
  "DAM-ROOM": (ctx, w, h, t) => damRoomPixel(ctx, w, h, t),
  "EGYPT-ROOM": (ctx, w, h, t) => egyptRoomPixel(ctx, w, h, t),
  "GALLERY": (ctx, w, h, t) => galleryPixel(ctx, w, h, t),
  "SOUTH-TEMPLE": (ctx, w, h, t) => southTemplePixel(ctx, w, h, t),
  "ON-RAINBOW": (ctx, w, h, t) => onRainbowPixel(ctx, w, h, t),
  // ---- hand-crafted landmarks (batch 2: underground showpieces) ----
  "RESERVOIR": (ctx, w, h, t) => reservoirPixel(ctx, w, h, t),
  "LOUD-ROOM": (ctx, w, h, t) => loudRoomPixel(ctx, w, h, t),
  "DOME-ROOM": (ctx, w, h, t) => domeRoomPixel(ctx, w, h, t),
  "TORCH-ROOM": (ctx, w, h, t) => torchRoomPixel(ctx, w, h, t),
  "TREASURE-ROOM": (ctx, w, h, t) => treasureRoomPixel(ctx, w, h, t),
  "NORTH-TEMPLE": (ctx, w, h, t) => northTemplePixel(ctx, w, h, t),
  "ENTRANCE-TO-HADES": (ctx, w, h, t) => entranceToHadesPixel(ctx, w, h, t),
  "LAND-OF-LIVING-DEAD": (ctx, w, h, t) => landOfLivingDeadPixel(ctx, w, h, t),
  "ATLANTIS-ROOM": (ctx, w, h, t) => atlantisRoomPixel(ctx, w, h, t),
  "ENGRAVINGS-CAVE": (ctx, w, h, t) => engravingsCavePixel(ctx, w, h, t),
  // ---- hand-crafted landmarks (batch 3: river & canyon vistas) ----
  "ARAGAIN-FALLS": (ctx, w, h, t) => aragainFallsPixel(ctx, w, h, t),
  "END-OF-RAINBOW": (ctx, w, h, t) => endOfRainbowPixel(ctx, w, h, t),
  "CANYON-VIEW": (ctx, w, h, t) => canyonViewPixel(ctx, w, h, t),
  "CANYON-BOTTOM": (ctx, w, h, t) => canyonBottomPixel(ctx, w, h, t),
  "CLIFF-MIDDLE": (ctx, w, h, t) => cliffMiddlePixel(ctx, w, h, t),
  "DAM-BASE": (ctx, w, h, t) => damBasePixel(ctx, w, h, t),
  "DAM-LOBBY": (ctx, w, h, t) => damLobbyPixel(ctx, w, h, t),
  "SHORE": (ctx, w, h, t) => shorePixel(ctx, w, h, t),
  "SANDY-BEACH": (ctx, w, h, t) => sandyBeachPixel(ctx, w, h, t),
  "SANDY-CAVE": (ctx, w, h, t) => sandyCavePixel(ctx, w, h, t),
  "WHITE-CLIFFS-NORTH": (ctx, w, h, t) => pixelStage(ctx, w, h, 256, whiteCliffsBeach(true, t)),
  "WHITE-CLIFFS-SOUTH": (ctx, w, h, t) => pixelStage(ctx, w, h, 256, whiteCliffsBeach(false, t)),
  "RIVER-1": (ctx, w, h, t) => pixelStage(ctx, w, h, 256, riverScene(false, false, true, false, false, t)),
  "RIVER-2": (ctx, w, h, t) => pixelStage(ctx, w, h, 256, riverScene(false, true, false, false, false, t)),
  "RIVER-3": (ctx, w, h, t) => pixelStage(ctx, w, h, 256, riverScene(false, true, true, false, false, t)),
  "RIVER-4": (ctx, w, h, t) => pixelStage(ctx, w, h, 256, riverScene(true, false, true, true, true, t)),
  "RIVER-5": (ctx, w, h, t) => pixelStage(ctx, w, h, 256, riverScene(true, false, false, false, true, t)),
  // ---- hand-crafted landmarks (batch 4: the coal mine & machine) ----
  "MINE-ENTRANCE": (ctx, w, h, t) => mineEntrancePixel(ctx, w, h, t),
  "SHAFT-ROOM": (ctx, w, h, t) => shaftRoomPixel(ctx, w, h, t),
  "GAS-ROOM": (ctx, w, h, t) => gasRoomPixel(ctx, w, h, t),
  "LADDER-TOP": (ctx, w, h, t) => ladderTopPixel(ctx, w, h, t),
  "LADDER-BOTTOM": (ctx, w, h, t) => ladderBottomPixel(ctx, w, h, t),
  "TIMBER-ROOM": (ctx, w, h, t) => timberRoomPixel(ctx, w, h, t),
  "LOWER-SHAFT": (ctx, w, h, t) => lowerShaftPixel(ctx, w, h, t),
  "MACHINE-ROOM": (ctx, w, h, t) => machineRoomPixel(ctx, w, h, t),
  "MINE-1": coalMinePixel(0),
  "MINE-2": coalMinePixel(1),
  "MINE-3": coalMinePixel(2),
  "MINE-4": coalMinePixel(3),
  "SLIDE-ROOM": (ctx, w, h, t) => slideRoomPixel(ctx, w, h, t),
  // ---- hand-crafted landmarks (batch 5: the maze & dead-ends) ----
  "MAZE-1": mazePixel(1), "MAZE-2": mazePixel(2), "MAZE-3": mazePixel(3), "MAZE-4": mazePixel(4),
  "MAZE-5": (ctx, w, h, t) => maze5Pixel(ctx, w, h, t),
  "MAZE-6": mazePixel(6), "MAZE-7": mazePixel(7), "MAZE-8": mazePixel(8), "MAZE-9": mazePixel(9),
  "MAZE-10": mazePixel(10), "MAZE-11": mazePixel(11), "MAZE-12": mazePixel(12), "MAZE-13": mazePixel(13),
  "MAZE-14": mazePixel(14), "MAZE-15": mazePixel(15),
  "GRATING-ROOM": (ctx, w, h, t) => gratingRoomPixel(ctx, w, h, t),
  "DEAD-END-1": deadEndPixel(false, 1), "DEAD-END-2": deadEndPixel(false, 2),
  "DEAD-END-3": deadEndPixel(false, 3), "DEAD-END-4": deadEndPixel(false, 4),
  "DEAD-END-5": deadEndPixel(true, 5),
  // ---- hand-crafted landmarks (batch 6: the finale — all remaining) ----
  "STONE-BARROW": (ctx, w, h, t) => stoneBarrowPixel(ctx, w, h, t),
  "FOREST-2": forestDimPixel(2), "FOREST-3": forestDimPixel(3),
  "MOUNTAINS": (ctx, w, h, t) => mountainsPixel(ctx, w, h, t),
  "CLEARING": clearingPixel(false), "GRATING-CLEARING": clearingPixel(true),
  "CELLAR": (ctx, w, h, t) => cellarPixel(ctx, w, h, t),
  "EAST-OF-CHASM": chasmPixel(true), "CHASM-ROOM": chasmPixel(false),
  "STUDIO": (ctx, w, h, t) => studioPixel(ctx, w, h, t),
  "STRANGE-PASSAGE": (ctx, w, h, t) => strangePassagePixel(ctx, w, h, t),
  "MIRROR-ROOM-1": mirrorRoomPixel(false, "MIRROR-ROOM-1"), "MIRROR-ROOM-2": mirrorRoomPixel(true, "MIRROR-ROOM-2"),
  "SMALL-CAVE": smallCavePixel(false), "TINY-CAVE": smallCavePixel(true),
  "COLD-PASSAGE": (ctx, w, h, t) => coldPassagePixel(ctx, w, h, t),
  "NARROW-PASSAGE": (ctx, w, h, t) => narrowPassagePixel(ctx, w, h, t),
  "WINDING-PASSAGE": windingPassagePixel(1), "TWISTING-PASSAGE": windingPassagePixel(2),
  "EW-PASSAGE": (ctx, w, h, t) => ewPassagePixel(ctx, w, h, t),
  "NS-PASSAGE": (ctx, w, h, t) => nsPassagePixel(ctx, w, h, t),
  "MAINTENANCE-ROOM": (ctx, w, h, t) => maintenanceRoomPixel(ctx, w, h, t),
  "SQUEEKY-ROOM": (ctx, w, h, t) => squeekyRoomPixel(ctx, w, h, t),
  "BAT-ROOM": (ctx, w, h, t) => batRoomPixel(ctx, w, h, t),
  "SMELLY-ROOM": (ctx, w, h, t) => smellyRoomPixel(ctx, w, h, t),
  "RESERVOIR-NORTH": reservoirShorePixel(true), "RESERVOIR-SOUTH": reservoirShorePixel(false),
  "STREAM-VIEW": (ctx, w, h, t) => streamViewPixel(ctx, w, h, t),
  "IN-STREAM": (ctx, w, h, t) => inStreamPixel(ctx, w, h, t),
  "DAMP-CAVE": (ctx, w, h, t) => dampCavePixel(ctx, w, h, t),
  "DEEP-CANYON": (ctx, w, h, t) => deepCanyonPixel(ctx, w, h, t),
};

export function composeRoom(room: any, objects: any): SceneDraw {
  const region = room.region || "dungeon";
  const ld = (room.ldesc || "").toLowerCase();
  const names = (room.objects || []).map((id: string) => objects[id]?.name || id.replace(/-/g, " "));
  return (ctx, w, h, t) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    // pick the scape from region + description keywords
    if (region === "house") {
      const floorY = interiorBackdrop(p, pw, ph, { wallTop: [40, 34, 26], wallBot: [24, 20, 14], floorTop: [56, 42, 26], floorBot: [28, 20, 12], floorHi: [74, 56, 34], plank: "#211810", seam: "#170f08", light: { x: pw * 0.5, y: ph * 0.34, rx: pw * 0.8, ry: ph * 0.9, col: [150, 145, 150], peak: 0.3 } }, t);
      names.slice(0, 4).forEach((nm: string, i: number) => drawProp(p, nm, Math.round(pw * (0.3 + i * 0.18)), floorY, ph, t));
      return;
    }
    if (region === "forest" && !/canyon|rainbow|falls|barrow|cliff|beach/.test(ld)) {
      const horizon = forestBackdrop(p, pw, ph, t, "soft");
      for (let i = 0; i < 6; i++) pixelTree(p, pw * (0.05 + i * 0.08), horizon + 6, ph * 0.4, pw * 0.06, t, true);
      pixelTree(p, pw * 0.1, ph + 6, ph * 0.9, pw * 0.1, t, false);
      pixelTree(p, pw * 0.88, ph + 10, ph * 1.0, pw * 0.11, t, false);
      names.slice(0, 3).forEach((nm: string, i: number) => drawProp(p, nm, Math.round(pw * (0.4 + i * 0.16)), horizon, ph, t));
      return;
    }
    // cave / temple / mine / hades / water — a rock chamber, lit by your lamp
    const pal = pickPal(region, ld);
    pal.light = { x: pw * 0.5, y: ph * 0.98, rx: pw * 0.72, ry: ph, col: [222, 168, 92], peak: region === "temple" ? 0.5 : 0.8 };
    const floorY = caveBackdrop(p, pw, ph, pal, t);
    drawExitsCave(p, pw, ph, floorY, room, pal.wallHi ? `rgb(${pal.wallHi.join(",")})` : "#444");
    // water on the floor for river/stream rooms
    if (/water|stream|river|reservoir/.test(ld)) {
      for (let y = floorY; y < ph; y++) for (let x = 0; x < pw; x++) { const w2 = Math.sin(x * 0.1 + t * 1.5 + y * 0.3) * 0.5 + 0.5; if (w2 * 0.6 > dth(x, y)) { p.fillStyle = y % 2 ? "#2a4a64" : "#36607e"; p.fillRect(x, y, 1, 1); } }
    }
    names.slice(0, 4).forEach((nm: string, i: number) => drawProp(p, nm, Math.round(pw * (0.32 + i * 0.17)), floorY, ph, t));
  });
}

export const sceneIds = () => Object.keys(SCENES); // dev/verification: enumerate the registry

export function getRoomScene(room: any, objects: any): SceneDraw | undefined {
  const base: SceneDraw | undefined = typeof room === "string" ? SCENES[room] : (SCENES[room.id] || composeRoom(room, objects));
  if (!base) return undefined;
  return (ctx, w, h, t) => { base(ctx, w, h, t); thiefOverlay(ctx, w, h, t); }; // the thief may stride through any room
}

// A dark room (the attic, the underground) is UNSEEABLE without a lit lamp — the
// game says "pitch black, likely to be eaten by a grue." Render true darkness with
// a pair of lurking grue eyes; never fabricate light the player doesn't have.
export const darknessScene: SceneDraw = (ctx, w, h, t) => {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";
  const r = Math.max(2, Math.min(w, h) * 0.006);
  for (let i = 0; i < 5; i++) {
    const cycle = (t * 0.32 + i * 1.7) % 7;
    const a = cycle < 2.2 ? Math.sin((cycle / 2.2) * Math.PI) : 0; // blink in, lurk, vanish
    if (a <= 0.02) continue;
    const x = (((i * 97) % 100) / 100) * (w * 0.8) + w * 0.1;
    const y = (0.32 + ((i * 53) % 46) / 100) * h + Math.sin(t * 0.6 + i) * 3;
    ctx.globalAlpha = a * 0.85; ctx.fillStyle = "#7dff8a"; ctx.shadowColor = "#46ff6e"; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x - r * 2.2, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 2.2, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
};

// ---- public API re-exports (the roomScenes.ts shim forwards these) ----
export * from "./state.ts";
export { flashThief } from "./kit.ts";
export type { SceneDraw } from "./kit.ts";
