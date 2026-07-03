// scenes/rooms-maze.ts — the twisty little passages, all alike (but not quite).

import { hasObj, rf } from "./state.ts";
import { ditherGlow, dth, fillDisc, mazeShell, pixelStage, treasureGlint } from "./kit.ts";

export function mazePixel(seed: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => { mazeShell(p, pw, ph, seed, t); });
}

export function maze5Pixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const floorY = mazeShell(p, pw, ph, 5, t);
    const sx = Math.round(pw * 0.4), sy = floorY + Math.round((ph - floorY) * 0.55);
    // the luckless adventurer's skeleton
    p.fillStyle = "#d8d2c0"; fillDisc(p, sx, sy - 3, 4); p.fillStyle = "#2a2620"; p.fillRect(sx - 2, sy - 3, 1, 1); p.fillRect(sx + 1, sy - 3, 1, 1); // skull
    p.fillStyle = "#c8c2b0"; for (let i = 0; i < 5; i++) p.fillRect(sx + 4 + i * 4, sy - 1, 3, 1); // spine
    for (let i = 0; i < 4; i++) { p.fillRect(sx + 5 + i * 4, sy - 4, 1, 6); } // ribs
    // its scattered gear: burned-out lantern, bag of coins, rusty knife, skeleton key
    if (hasObj("MAZE-5", "BURNED-OUT-LANTERN")) { p.fillStyle = "#4a4640"; p.fillRect(sx + 24, sy - 4, 5, 5); p.fillStyle = "#2a2824"; p.fillRect(sx + 24, sy - 4, 5, 1); } // dead lantern
    if (hasObj("MAZE-5", "BAG-OF-COINS")) { treasureGlint(p, sx + 36, sy, t, "#e8c24a"); p.fillStyle = "#6a4f2c"; p.fillRect(sx + 33, sy - 1, 7, 4); } // bag of coins
    if (hasObj("MAZE-5", "RUSTY-KNIFE")) { p.fillStyle = "#9a7a5a"; p.fillRect(sx - 14, sy + 2, 8, 1); p.fillStyle = "#6a4a2a"; p.fillRect(sx - 6, sy + 1, 2, 3); } // rusty knife
    if (hasObj("MAZE-5", "KEYS")) { p.fillStyle = "#c8a84a"; p.fillRect(sx - 22, sy, 4, 2); p.fillRect(sx - 22, sy - 2, 2, 4); } // skeleton key
  });
}

export function gratingRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    mazeShell(p, pw, ph, 9, t);
    const open = rf("GRATING-ROOM", "gratingOpen");
    const gx0 = Math.round(pw * 0.4), gx1 = Math.round(pw * 0.6), gy = Math.round(ph * 0.04), floorY = Math.round(ph * 0.6);
    if (open) {
      // a defined shaft of skylight falling from the open grate to a pool on the floor
      for (let y = gy + 2; y < floorY + 6; y++) {
        const f = (y - gy) / (floorY - gy);
        const sx0 = gx0 - Math.round(f * 5) + 3, sx1 = gx1 + Math.round(f * 5) - 3;
        const density = 0.26 - f * 0.16;
        for (let x = sx0; x <= sx1; x++) {
          const ex = Math.min(1, Math.min(x - sx0, sx1 - x) / 6); // soft shaft edges
          if (density * ex > dth(x, y)) { p.fillStyle = f < 0.4 ? "#a8c2d4" : "#7e94a8"; p.fillRect(x, y, 1, 1); }
        }
      }
      ditherGlow(p, pw * 0.5, floorY + 4, (gx1 - gx0) * 0.8, 7, "#93acc0", 0.45); // the pool where it lands
      for (let i = 0; i < 3; i++) { // a leaf or two, drifting down from the world above
        const fy2 = ((t * 8 + i * 37) % (floorY - gy)) + gy;
        const fx2 = pw * 0.5 + Math.sin(t * 2 + i * 2.2) * 8;
        p.fillStyle = i % 2 ? "#6a5a2a" : "#4a3a1a"; p.fillRect(Math.round(fx2), Math.round(fy2), 2, 1);
      }
    } else {
      ditherGlow(p, pw * 0.5, gy + 2, (gx1 - gx0) * 0.6, ph * 0.1, "#7e94a8", 0.25); // only a dim glow seeps through
    }
    // the grating itself, set in the rock ceiling
    p.fillStyle = "#26262c"; p.fillRect(gx0 - 3, gy - 2, gx1 - gx0 + 6, 4); // frame
    p.fillStyle = "#4c4c56"; p.fillRect(gx0 - 3, gy - 2, gx1 - gx0 + 6, 1);
    if (open) {
      p.fillStyle = "#5a5a64"; for (let i = 0; i <= 6; i++) p.fillRect(gx0 + 2 + i * Math.round((gx1 - gx0 - 4) / 6), gy - 4, 2, 3); // bars swung up out of the way
      p.fillStyle = "#0d1420"; p.fillRect(gx0, gy, gx1 - gx0, 2); // the open hole: night sky beyond
    } else {
      p.fillStyle = "#101216"; p.fillRect(gx0, gy, gx1 - gx0, 3);
      p.fillStyle = "#5a5a64"; for (let i = 0; i <= 6; i++) p.fillRect(gx0 + 2 + i * Math.round((gx1 - gx0 - 4) / 6), gy, 2, 4); // bars down (locked)
      p.fillStyle = "#7a7a86"; p.fillRect(gx0 + 2, gy, gx1 - gx0 - 4, 1); // light catching the bar tops
    }
  });
}
