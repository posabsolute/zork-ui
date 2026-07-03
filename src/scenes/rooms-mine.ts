// scenes/rooms-mine.ts — the coal mine, shafts, and the diamond machine.

import { hasObj, rf } from "./state.ts";
import { caveBackdrop, coalVeins, darkArch, dth, fillDisc, hash, lampPal, mineLadder, mineTimbers, pixelStage, rockStairs, treasureGlint } from "./kit.ts";

export function mineEntrancePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    coalVeins(p, pw, floorY); mineTimbers(p, pw, ph, floorY);
    p.fillStyle = "#040404"; p.fillRect(0, floorY - Math.round(ph * 0.3), Math.round(pw * 0.16), Math.round(ph * 0.3));
    p.fillStyle = "#4a3a24"; p.fillRect(0, floorY - Math.round(ph * 0.3), Math.round(pw * 0.16), 4); p.fillRect(Math.round(pw * 0.14), floorY - Math.round(ph * 0.3), 3, Math.round(ph * 0.3)); // timber-framed shaft, west wall
    darkArch(p, Math.round(pw * 0.46), ph - Math.round(ph * 0.12), Math.round(pw * 0.08), Math.round(ph * 0.12), rim); // south exit
    void t;
  });
}

export function shaftRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    coalVeins(p, pw, floorY);
    const sx = Math.round(pw * 0.5), sw = Math.round(pw * 0.16), sy = floorY + Math.round((ph - floorY) * 0.2);
    const x0 = sx - (sw >> 1), lowered = rf("SHAFT-ROOM", "basketLowered");
    // the shaft: a recessed square pit — lamplit lip, walls stepping down into black
    p.fillStyle = "#5a5248"; p.fillRect(x0 - 2, sy - 2, sw + 4, 2); // worn stone lip
    p.fillStyle = "#2e2a24"; for (let y = sy; y < ph; y++) { const dpt = Math.min(1, (y - sy) / 14); const inw = Math.round(dpt * 4); const v = Math.round(26 * (1 - dpt)); p.fillStyle = `rgb(${v + 8},${v + 5},${v + 2})`; p.fillRect(x0 + inw, y, sw - inw * 2, 1); }
    p.fillStyle = "#040404"; p.fillRect(x0 + 4, sy + 14, sw - 8, ph - sy - 14); // the long dark below
    p.fillStyle = "#3a352c"; for (let y = sy + 1; y < sy + 12; y += 3) { p.fillRect(x0, y, 1, 2); p.fillRect(x0 + sw - 1, y, 1, 2); } // timbered shaft walls
    // the headframe gantry over the pit: two heavy timber legs and a cross-beam with pulley
    const gy = Math.round(ph * 0.1);
    p.fillStyle = "#4a3a24"; p.fillRect(x0 - 4, gy, 3, sy - gy); p.fillRect(x0 + sw + 1, gy, 3, sy - gy);
    p.fillStyle = "#6a5434"; p.fillRect(x0 - 4, gy, 1, sy - gy); p.fillRect(x0 + sw + 1, gy, 1, sy - gy); // lamplit edges
    p.fillStyle = "#4a3a24"; p.fillRect(x0 - 6, gy - 2, sw + 12, 3); p.fillStyle = "#6a5434"; p.fillRect(x0 - 6, gy - 2, sw + 12, 1); // cross-beam
    p.fillStyle = "#8a8a92"; fillDisc(p, sx, gy + 2, 3); p.fillStyle = "#3a3a40"; p.fillRect(sx - 1, gy + 1, 2, 2); // the pulley wheel
    const sway = Math.round(Math.sin(t * 0.8) * 1);
    if (lowered) {
      p.fillStyle = "#8a8a92"; for (let y = gy + 4; y < ph; y += 3) p.fillRect(sx + sway, y, 1, 2); // chain runs taut, all the way down — basket out of sight
    } else {
      p.fillStyle = "#8a8a92"; for (let y = gy + 4; y < sy + 2; y += 3) p.fillRect(sx + sway, y, 1, 2); // heavy iron chain
      const bx2 = sx + sway, by2 = sy - 1; // the basket, hanging at the top of the shaft
      p.fillStyle = "#54402a"; p.fillRect(bx2 - 7, by2 - 8, 14, 8);
      p.fillStyle = "#7a5a32"; for (let yy = by2 - 7; yy < by2 - 1; yy += 2) p.fillRect(bx2 - 6, yy, 12, 1); // woven wicker bands
      p.fillStyle = "#3a2c1a"; p.fillRect(bx2 - 7, by2 - 1, 14, 1);
      p.fillStyle = "#8a8a92"; p.fillRect(bx2 - 6, by2 - 12, 1, 4); p.fillRect(bx2 + 5, by2 - 12, 1, 4); // bail wires to the chain
    }
    darkArch(p, Math.round(pw * 0.04), floorY - Math.round(ph * 0.22), Math.round(pw * 0.07), Math.round(ph * 0.22), rim);
    darkArch(p, Math.round(pw * 0.78), floorY - Math.round(ph * 0.22), Math.round(pw * 0.07), Math.round(ph * 0.22), rim);
    void t;
  });
}

export function gasRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    coalVeins(p, pw, floorY);
    rockStairs(p, Math.round(pw * 0.14), floorY + 6, 5, 1); // the short climb up
    darkArch(p, Math.round(pw * 0.88), floorY - Math.round(ph * 0.2), Math.round(pw * 0.07), Math.round(ph * 0.2), rim); // narrow tunnel east
    // coal gas: sick yellow-green wisps seeping up out of floor cracks and pooling
    // under the ceiling — dithered pixel ribbons, no soft glow
    p.fillStyle = "#0a0c06"; for (const fx of [0.3, 0.55, 0.72]) p.fillRect(Math.round(pw * fx) - 4, floorY + Math.round((ph - floorY) * (0.3 + fx * 0.4)), 9, 1); // the cracks it leaks from
    for (let i = 0; i < 3; i++) {
      const gx = pw * (0.3 + i * 0.22), base = floorY + (ph - floorY) * (0.42 + i * 0.09);
      for (let k = 0; k < 34; k++) {
        const yy = base - k * 1.8, f = k / 34;
        const xx = gx + Math.sin(yy * 0.16 + t * 0.9 + i * 2.1) * (2 + f * 7);
        const a = (1 - f) * 0.75 + 0.15;
        if (a > dth(Math.round(xx), Math.round(yy))) { p.fillStyle = f > 0.6 ? "#5a6e2e" : "#79904a"; p.fillRect(Math.round(xx), Math.round(yy), 2, 1); }
      }
    }
    for (let x = 0; x < pw; x += 2) { const cy = 16 + Math.round(Math.sin(x * 0.06 + t * 0.5) * 3); if (0.4 > dth(x, cy)) { p.fillStyle = "#4a5a28"; p.fillRect(x, cy, 2, 1); } } // gas pooled along the ceiling
    if (hasObj("GAS-ROOM", "BRACELET")) {
      // the sapphire-encrusted bracelet: a pixel-honest gold hoop with blue stones
      const bx = Math.round(pw * 0.5), by = floorY + Math.round((ph - floorY) * 0.42);
      treasureGlint(p, bx, by - 3, t, "#5a9aff");
      p.fillStyle = "#caa24a"; p.fillRect(bx - 5, by - 1, 10, 1); p.fillRect(bx - 6, by, 12, 2); p.fillRect(bx - 5, by + 2, 10, 1); // the hoop, seen at a shallow angle
      p.fillStyle = "#8a6a24"; p.fillRect(bx - 4, by + 1, 8, 1); // its dark inner rim
      p.fillStyle = "#4a8aff"; for (const dx of [-5, -2, 1, 4]) p.fillRect(bx + dx, by, 1, 1); // sapphires
      p.fillStyle = "#bfe0ff"; p.fillRect(bx - 2, by, 1, 1); // one catching the lamp
    }
  });
}

export function ladderTopPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t);
    coalVeins(p, pw, floorY);
    rockStairs(p, Math.round(pw * 0.14), floorY + 4, 5, 1); // the way back up
    // the hole in the floor the ladder drops through: recessed, with a worn lip
    const lx = Math.round(pw * 0.72), hy = floorY + Math.round((ph - floorY) * 0.5);
    p.fillStyle = "#4a443a"; p.fillRect(lx - 13, hy - 2, 26, 2); // lamplit stone lip
    for (let d = 0; d < 5; d++) { const v = Math.max(2, 16 - d * 4); p.fillStyle = `rgb(${v},${v - 1},${v - 2})`; p.fillRect(lx - 13 + d * 2, hy + d * 2, 26 - d * 4, ph); } // stepping down into black
    mineLadder(p, lx, hy - Math.round(ph * 0.09), ph, 2); // the rickety ladder, poking up out of the hole and running down out of frame
    void t;
  });
}

export function ladderBottomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    coalVeins(p, pw, floorY);
    // the ladder runs up into a dark chimney in the ceiling
    const lx = Math.round(pw * 0.8);
    p.fillStyle = "#060607"; p.fillRect(lx - 12, 0, 24, Math.round(ph * 0.16));
    p.fillStyle = "#2c2822"; p.fillRect(lx - 12, Math.round(ph * 0.16) - 1, 24, 1); // the chimney rim overhead
    mineLadder(p, lx, 0, floorY + 6, -2);
    p.fillStyle = "#1c1814"; p.fillRect(lx - 8, floorY + 5, 16, 2); // its shadow where it foots the floor
    darkArch(p, Math.round(pw * 0.04), floorY - Math.round(ph * 0.22), Math.round(pw * 0.07), Math.round(ph * 0.22), rim); // west
    darkArch(p, Math.round(pw * 0.46), ph - Math.round(ph * 0.12), Math.round(pw * 0.08), Math.round(ph * 0.12), rim); // south
    void t;
  });
}

export function timberRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    coalVeins(p, pw, floorY);
    // a broken shoring frame still standing — one post snapped, the cap sagging
    const capY = Math.round(ph * 0.12);
    p.fillStyle = "#3a2c1c"; for (let x = Math.round(pw * 0.14); x < pw * 0.86; x++) p.fillRect(x, capY + Math.round((x - pw * 0.5) * (x - pw * 0.5) * 0.0006), 1, 5); // the sagging cap beam
    p.fillStyle = "#5a4326"; p.fillRect(Math.round(pw * 0.14), capY, 6, floorY - capY); p.fillStyle = "#7a5a32"; p.fillRect(Math.round(pw * 0.14), capY, 2, floorY - capY); // the sound post
    const bx = Math.round(pw * 0.84); // the snapped post: stub below, splintered stump hanging above
    p.fillStyle = "#5a4326"; p.fillRect(bx, floorY - 14, 6, 14); p.fillRect(bx - 2, capY, 6, 12);
    p.fillStyle = "#8a6a3a"; for (const [sx2, sy2] of [[0, -14], [2, -17], [4, -15], [-1, 11], [2, 13]] as const) p.fillRect(bx + 2 + sx2, (sy2 < 0 ? floorY : capY) + sy2, 1, 4); // pale splinters at both breaks
    // broken timbers strewn in a criss-crossed heap — thick beams with lit tops
    for (let i = 0; i < 7; i++) {
      const x = Math.round(pw * (0.2 + i * 0.09)), y = floorY + Math.round((ph - floorY) * 0.34) + Math.round((hash(i, 2) - 0.5) * 16);
      const len = 22 + Math.round(hash(i, 3) * 16), ang = (hash(i, 4) - 0.5) * 0.9, ca = Math.cos(ang), sa = Math.sin(ang);
      for (let k = 0; k < len; k++) {
        const tx2 = x + Math.round(ca * k), ty2 = y + Math.round(sa * k);
        p.fillStyle = "#241a0e"; p.fillRect(tx2, ty2 + 3, 2, 1); // underside shadow
        p.fillStyle = "#4a3a22"; p.fillRect(tx2, ty2 + 1, 2, 2); // body
        p.fillStyle = "#6f5630"; p.fillRect(tx2, ty2, 2, 1); // lamplit top
      }
      p.fillStyle = "#8a6a3a"; p.fillRect(x + Math.round(ca * len), y + Math.round(sa * len) - 1, 2, 4); // raw split end
    }
    for (let i = 0; i < 5; i++) { const x = ((t * 14 + i * 50) % pw); p.fillStyle = "rgba(160,170,180,0.10)"; p.fillRect(Math.round(x), Math.round(ph * 0.3), 2, floorY - Math.round(ph * 0.3)); } // draft from the west
    darkArch(p, Math.round(pw * 0.04), floorY - Math.round(ph * 0.18), Math.round(pw * 0.06), Math.round(ph * 0.18), rim);
    darkArch(p, Math.round(pw * 0.9), floorY - Math.round(ph * 0.22), Math.round(pw * 0.07), Math.round(ph * 0.22), rim);
  });
}

export function lowerShaftPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    coalVeins(p, pw, floorY);
    // the long shaft overhead: a timber-framed mouth receding into black
    const sx = Math.round(pw * 0.5), sw = Math.round(pw * 0.18), mouthY = Math.round(ph * 0.38);
    for (let d = 0; d < 4; d++) { const v = Math.max(3, 14 - d * 4), inw = d * 3; p.fillStyle = `rgb(${v + 2},${v + 1},${v + 3})`; p.fillRect(sx - (sw >> 1) + inw, 0, sw - inw * 2, mouthY - d * 2); } // walls stepping up into dark
    p.fillStyle = "#4a3a24"; p.fillRect(sx - (sw >> 1) - 3, mouthY - 2, sw + 6, 3); p.fillStyle = "#6a5434"; p.fillRect(sx - (sw >> 1) - 3, mouthY - 2, sw + 6, 1); // the timbered mouth frame
    p.fillStyle = "#3a2c1a"; p.fillRect(sx - (sw >> 1) - 3, mouthY - 12, 3, 12); p.fillRect(sx + (sw >> 1), mouthY - 12, 3, 12); // side timbers
    const sway = Math.round(Math.sin(t * 0.8) * 1);
    p.fillStyle = "#8a8a92"; for (let y = 2; y < mouthY + 6; y += 3) p.fillRect(sx + sway, y, 1, 2); // the iron chain, swaying faintly
    if (rf("SHAFT-ROOM", "basketLowered")) { // the basket has come all the way down
      const by2 = mouthY + 14;
      p.fillStyle = "#8a8a92"; for (let y = mouthY + 6; y < by2 - 8; y += 3) p.fillRect(sx + sway, y, 1, 2);
      p.fillStyle = "#54402a"; p.fillRect(sx - 7 + sway, by2 - 8, 14, 8);
      p.fillStyle = "#7a5a32"; for (let yy = by2 - 7; yy < by2 - 1; yy += 2) p.fillRect(sx - 6 + sway, yy, 12, 1); // wicker bands
      p.fillStyle = "#3a2c1a"; p.fillRect(sx - 7 + sway, by2 - 1, 14, 1);
      p.fillStyle = "#8a8a92"; p.fillRect(sx - 6 + sway, by2 - 12, 1, 4); p.fillRect(sx + 5 + sway, by2 - 12, 1, 4); // bail wires
    } else { p.fillStyle = "#8a8a92"; p.fillRect(sx - 1 + sway, mouthY + 6, 3, 2); } // just the chain's hook end — the basket is up top
    for (let i = 0; i < 4; i++) { const x = ((t * 16 + i * 60) % pw); p.fillStyle = "rgba(160,170,180,0.10)"; p.fillRect(Math.round(x), Math.round(ph * 0.45), 2, floorY - Math.round(ph * 0.45)); } // drafty
    darkArch(p, Math.round(pw * 0.46), ph - Math.round(ph * 0.12), Math.round(pw * 0.08), Math.round(ph * 0.12), rim); // south
    darkArch(p, Math.round(pw * 0.9), floorY - Math.round(ph * 0.16), Math.round(pw * 0.05), Math.round(ph * 0.16), rim); // very narrow east
  });
}

export function machineRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    const cx = Math.round(pw * 0.5), by = floorY + Math.round((ph - floorY) * 0.55);
    // the machine: for all the world like a clothes dryer — a riveted metal box
    // with a big round door, a lid on top, and a switch you can't turn by hand
    p.fillStyle = "#14131a"; p.fillRect(cx - 28, by - 39, 56, 40); // sel-out
    p.fillStyle = "#44424c"; p.fillRect(cx - 27, by - 38, 54, 38);
    p.fillStyle = "#5a5864"; p.fillRect(cx - 27, by - 38, 54, 2); p.fillRect(cx - 27, by - 38, 2, 38); // lamplit top/left
    p.fillStyle = "#302e38"; p.fillRect(cx + 25, by - 38, 2, 38); p.fillRect(cx - 27, by - 2, 54, 2); // shadow side + base
    p.fillStyle = "#2a2830"; for (let i = 0; i < 7; i++) { p.fillRect(cx - 24 + i * 8, by - 36, 1, 1); p.fillRect(cx - 24 + i * 8, by - 5, 1, 1); } // rivets
    p.fillStyle = "#56545e"; p.fillRect(cx - 20, by - 43, 40, 5); p.fillStyle = "#6a6874"; p.fillRect(cx - 20, by - 43, 40, 1); p.fillStyle = "#3a3842"; p.fillRect(cx - 4, by - 41, 8, 2); // the hinged lid + its handle
    // the round door: steel ring, dark glass, a gleam
    p.fillStyle = "#6a6874"; fillDisc(p, cx, by - 19, 13);
    p.fillStyle = "#1a181e"; fillDisc(p, cx, by - 19, 10);
    p.fillStyle = "#0c0b10"; fillDisc(p, cx, by - 19, 8);
    p.fillStyle = "#3a3f4c"; p.fillRect(cx - 5, by - 25, 3, 2); p.fillRect(cx - 7, by - 22, 2, 2); // glass gleam
    p.fillStyle = "#8a8a94"; p.fillRect(cx + 9, by - 20, 3, 3); // door latch
    // the triangular-holed switch on its side panel
    p.fillStyle = "#3a3a42"; p.fillRect(cx + 31, by - 24, 10, 14); p.fillStyle = "#4c4a54"; p.fillRect(cx + 31, by - 24, 10, 1);
    p.fillStyle = "#0e0d12"; p.fillRect(cx + 34, by - 20, 4, 4); p.fillStyle = "#caa24a"; p.fillRect(cx + 35, by - 19, 2, 2); // the socket that wants a screwdriver
    darkArch(p, Math.round(pw * 0.46), floorY - Math.round(ph * 0.22), Math.round(pw * 0.08), Math.round(ph * 0.22), rim); // north
    void t;
  });
}

export function coalMinePixel(seed: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    coalVeins(p, pw, floorY);
    // a thick coal seam banding through the rock — angle and height differ per
    // twist of the mine, so the "all alike" passages still read as places
    const sy0 = ph * (0.2 + (seed % 4) * 0.07), slope = [0.1, -0.14, 0.05, -0.06][seed % 4], thick = 5 + (seed % 3) * 2;
    for (let x = 0; x < pw; x++) {
      const yc = sy0 + x * slope + Math.sin(x * 0.05 + seed) * 2;
      for (let dy = 0; dy < thick; dy++) { const y = Math.round(yc + dy), k = hash(x >> 1, y >> 1); p.fillStyle = k > 0.8 ? "#22242c" : k < 0.2 ? "#050507" : "#101116"; p.fillRect(x, y, 1, 1); }
      if (hash(x >> 2, seed) > 0.7) { p.fillStyle = "#3a3d48"; p.fillRect(x, Math.round(yc + (hash(x, seed) * thick)), 1, 1); } // anthracite glitter
    }
    // pick scars where miners chased the seam
    p.fillStyle = "#1c1a16"; for (let i = 0; i < 8; i++) { const x = Math.round(hash(i, seed * 5 + 1) * pw), y = Math.round(sy0 + x * slope) + thick + 2 + Math.round(hash(i, seed) * 5); p.fillRect(x, y, 3, 1); p.fillRect(x + 1, y + 1, 2, 1); }
    mineTimbers(p, pw, ph, floorY);
    if (seed % 2) { const lx = Math.round(pw * (seed === 1 ? 0.3 : 0.62)); p.fillStyle = "#3a2c1c"; for (let k = 0; k < 26; k++) p.fillRect(lx + Math.round(k * 0.45), Math.round(ph * 0.14) + k, 5, 2); p.fillStyle = "#584428"; for (let k = 0; k < 26; k += 5) p.fillRect(lx + Math.round(k * 0.45), Math.round(ph * 0.14) + k, 5, 1); } // a leaning prop, half given way
    const fxs = [[0.06, 0.84, 0.45], [0.06, 0.5, 0.9], [0.2, 0.7, 0], [0.1, 0.55, 0.88]][seed % 4];
    for (const fx of fxs) if (fx > 0) darkArch(p, Math.round(pw * fx - pw * 0.035), floorY - Math.round(ph * 0.2), Math.round(pw * 0.07), Math.round(ph * 0.2), rim);
    void t;
  });
}
