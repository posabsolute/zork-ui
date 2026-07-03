// scenes/rooms-temple.ts — the temple, altar, and the gates of Hades.

import { hasObj, rf } from "./state.ts";
import { TREASURE, builtRoom, caveBackdrop, coalVeins, darkArch, ditherGlow, dth, exitsBox, fillDisc, hash, lampPal, mazePal, mix, pickPal, pixelStage, treasureGlint } from "./kit.ts";

export function egyptRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "temple", 0.7, [224, 188, 120]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["WEST"]); // ascending stair west
    // hieroglyph bands across the tomb's back wall
    p.fillStyle = "#7a6a44"; for (let r = 0; r < 2; r++) { const yy = lay.by0 + 6 + r * Math.round((lay.by1 - lay.by0) * 0.35); for (let x = lay.bx0 + 4; x < lay.bx1 - 4; x += 7) { p.fillRect(x, yy, 1, 5); p.fillRect(x + 2, yy + 1, 3, 1); p.fillRect(x + 3, yy + 3, 1, 2); } }
    // the solid-gold coffin (sarcophagus), the focal treasure, upright on a plinth
    if (!hasObj("EGYPT-ROOM", "COFFIN")) return; // carried off — only the tomb remains
    const cx = Math.round(pw * 0.54), cy = floorY + Math.round((ph - floorY) * 0.48), CL = 26; // CL = head→foot length
    p.fillStyle = "#141008"; p.fillRect(cx - 15, cy + CL / 2 + 3, 30, 2); // its shadow
    p.fillStyle = "#6a604a"; p.fillRect(cx - 14, cy + CL / 2, 28, 3); p.fillStyle = "#847a62"; p.fillRect(cx - 14, cy + CL / 2, 28, 1); // stone plinth
    // a TRUE mummiform case: rounded head cap, widest at the shoulders, tapering
    // steadily to a narrow foot
    const halfW = (yy: number) => {
      const f = (yy + CL / 2) / CL; // 0 head → 1 foot
      if (f < 0.12) return Math.round(6 + f * 30); // head cap rounding out
      if (f < 0.3) return 11; // the shoulders
      return Math.max(4, Math.round(11 - (f - 0.3) * 9)); // the long taper to the foot
    };
    for (let yy = -CL / 2; yy <= CL / 2; yy++) { const hw = halfW(yy); p.fillStyle = "#c9a23a"; p.fillRect(cx - hw, cy + yy, hw * 2, 1); p.fillStyle = "#e8c860"; p.fillRect(cx - hw, cy + yy, 2, 1); p.fillStyle = "#8a6a20"; p.fillRect(cx + hw - 2, cy + yy, 2, 1); } // body + lit/shadowed edges
    p.fillStyle = "#0e0a04"; for (let yy = -CL / 2; yy <= CL / 2; yy += 1) { const hw = halfW(yy); p.fillRect(cx + hw, cy + yy, 1, 1); } // sel-out down the shadow side
    treasureGlint(p, cx - 8, cy - CL / 2 + 3, t, "#ffe9a0"); // the lamp catching the gold
    const headY = cy - CL / 2 + 4; // the mask end (head, top/back)
    if (rf("EGYPT-ROOM", "coffinOpen")) {
      p.fillStyle = "#241a06"; for (let yy = -CL / 2 + 3; yy <= CL / 2 - 3; yy++) { const hw = Math.max(1, halfW(yy) - 3); p.fillRect(cx - hw, cy + yy, hw * 2, 1); } // open — dark hollow
      p.fillStyle = "#d8c060"; p.fillRect(cx - 1, cy - 6, 2, 14); p.fillStyle = "#c93a3a"; p.fillRect(cx - 2, cy - 7, 4, 2); p.fillStyle = "#3a8ad8"; p.fillRect(cx - 1, cy - 7, 1, 1); p.fillRect(cx + 1, cy - 7, 1, 1); // the jewelled gold sceptre inside
      p.fillStyle = "#e8c24a"; p.fillRect(cx - 23, cy - 4, 7, 14); p.fillStyle = "#7a5a18"; p.fillRect(cx - 23, cy - 4, 7, 2); // the lid, lifted aside
    } else {
      p.fillStyle = "#1a3a8a"; p.fillRect(cx - 6, headY - 1, 12, 2); for (let s = -5; s <= 5; s += 2) { p.fillStyle = "#caa23a"; p.fillRect(cx + s, headY - 1, 1, 2); } // nemes headcloth + stripes
      p.fillStyle = "#e8d2a0"; p.fillRect(cx - 3, headY + 1, 6, 6); p.fillStyle = "#2a1a10"; p.fillRect(cx - 2, headY + 2, 1, 1); p.fillRect(cx + 1, headY + 2, 1, 1); // face + eyes
      p.fillStyle = "#1a3a8a"; p.fillRect(cx - 1, headY + 7, 2, 4); // false beard
      p.fillStyle = "#a8842c"; for (let b = 0; b < 3; b++) p.fillRect(cx - 8, headY + 12 + b * 4, 16, 1); // wrapping bands
    }
  });
}

export function southTemplePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "temple", 0.5, [230, 200, 140]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["NORTH"]);
    p.fillStyle = "#6a604a"; for (const fx of [0.15, 0.85]) { const x = Math.round(pw * fx); p.fillRect(x - 5, Math.round(ph * 0.08), 10, floorY + Math.round((ph - floorY) * 0.5) - Math.round(ph * 0.08)); p.fillStyle = "#544a38"; for (let y = Math.round(ph * 0.08); y < floorY; y += 4) p.fillRect(x - 5, y, 10, 1); p.fillStyle = "#7a7058"; p.fillRect(x - 7, Math.round(ph * 0.08), 14, 3); p.fillStyle = "#6a604a"; } // temple columns
    const ax = Math.round(pw * 0.5), ay = floorY + Math.round((ph - floorY) * 0.4);
    // the altar: a stepped stone block — plinth, body with shadowed flank, lit slab
    p.fillStyle = "#141210"; p.fillRect(ax - 19, ay + 12, 38, 2); // its shadow on the floor
    p.fillStyle = "#6a6250"; p.fillRect(ax - 18, ay + 10, 36, 3); p.fillStyle = "#847a62"; p.fillRect(ax - 18, ay + 10, 36, 1); // plinth step
    p.fillStyle = "#8a8068"; p.fillRect(ax - 16, ay, 32, 10); // body
    p.fillStyle = "#6e654f"; p.fillRect(ax + 12, ay, 4, 10); // candle-shadowed flank
    p.fillStyle = "#5a5240"; for (let yy = ay + 3; yy < ay + 10; yy += 3) p.fillRect(ax - 16, yy, 32, 1); // masonry courses
    p.fillStyle = "#b0a482"; p.fillRect(ax - 17, ay - 2, 34, 2); p.fillStyle = "#c6ba94"; p.fillRect(ax - 17, ay - 2, 34, 1); // the candle-lit slab on top
    if (hasObj("SOUTH-TEMPLE", "BOOK")) {
      // the large black book, lying open-side out in the centre of the altar
      p.fillStyle = "#0c0a10"; p.fillRect(ax - 5, ay - 8, 10, 6); // black cover
      p.fillStyle = "#26222e"; p.fillRect(ax - 5, ay - 8, 10, 1); p.fillRect(ax - 5, ay - 8, 1, 6); // its lamplit spine edge
      p.fillStyle = "#d8d0b4"; p.fillRect(ax - 4, ay - 3, 8, 1); // pale page edges under the cover
    }
    if (hasObj("SOUTH-TEMPLE", "CANDLES")) for (const dx of [-11, 11]) { const fl = Math.sin(t * 8 + dx) > 0 ? 1 : 0; p.fillStyle = "#e8e0c0"; p.fillRect(ax + dx - 1, ay - 9, 2, 7); ditherGlow(p, ax + dx, ay - 11, 8, 10, "#ffce6a", 0.55); p.fillStyle = "#fff0c0"; p.fillRect(ax + dx, ay - 11 - fl, 1, 2); } // two burning candles at the ends
    // the hole down into the dark: a recessed pit, not a flat patch
    const hx = Math.round(pw * 0.82), hy2 = ph - Math.round(ph * 0.08);
    p.fillStyle = "#7a7058"; p.fillRect(hx - 12, hy2 - 2, 24, 2); // worn stone lip
    for (let d = 0; d < 4; d++) { const v = Math.max(3, 14 - d * 4); p.fillStyle = `rgb(${v + 3},${v + 1},${v - 1})`; p.fillRect(hx - 12 + d * 2, hy2 + d * 2, 24 - d * 4, ph); }
  });
}

export function domeRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("dungeon", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    // the dome overhead: pixel-stepped masonry courses arcing across, never strokes
    for (let k = 0; k < 3; k++) {
      const rx = pw * (0.46 - k * 0.05), ry = ph * (0.44 - k * 0.05);
      p.fillStyle = k === 0 ? rim : "#3a3a46";
      for (let x = Math.round(pw * 0.5 - rx); x <= pw * 0.5 + rx; x++) {
        const f = (x - pw * 0.5) / rx; const y = Math.round(ph * 0.03 + ry * (1 - Math.sqrt(Math.max(0, 1 - f * f))));
        p.fillRect(x, y, 1, 1); if (hash(x >> 3, k) > 0.72) p.fillRect(x, y + 1, 1, 1); // course with mortar chunks
      }
    }
    p.fillStyle = "#2c2c36"; for (let j = -3; j <= 3; j++) { const x = Math.round(pw * 0.5 + j * pw * 0.13); for (let y = Math.round(ph * 0.05 + Math.abs(j) * 3); y < Math.round(ph * 0.16 + Math.abs(j) * 2); y += 2) p.fillRect(x, y, 1, 1); } // radial ribs of the vault
    // the precipitous drop below — the shaft wall sliding down out of the light
    for (let y = floorY; y < ph; y++) for (let x = 0; x < pw; x++) {
      const f = (y - floorY) / (ph - floorY), k = hash(x >> 2, y >> 2);
      const v = Math.max(2, Math.round((9 - f * 7) * (k > 0.7 ? 1.5 : 1)));
      p.fillStyle = `rgb(${v},${v},${v + 2})`; p.fillRect(x, y, 1, 1);
    }
    const ry = floorY; p.fillStyle = "#6a4f2c"; p.fillRect(0, ry - 7, pw, 3); p.fillStyle = "#4a371e"; for (let x = 3; x < pw; x += 13) p.fillRect(x, ry - 7, 2, 11); // wooden railing
    if (rf("DOME-ROOM", "ropeTied")) { // a rope tied to the railing, hanging down into the drop
      const rx2 = Math.round(pw * 0.5);
      p.fillStyle = "#3a2a18"; p.fillRect(rx2 - 4, ry - 10, 8, 5); p.fillStyle = "#54402a"; p.fillRect(rx2 - 4, ry - 10, 8, 1); p.fillRect(rx2 - 3, ry - 7, 2, 2); // the knot, lashed around the rail
      for (let y = ry - 5; y < ph; y++) { // continuous braided line, swaying below
        const sw2 = Math.sin(y * 0.09 + t * 1.1) * (1 + (y - ry) * 0.02);
        p.fillStyle = ((y >> 1) & 1) ? "#8a7038" : "#6a5628"; // twist
        p.fillRect(rx2 + Math.round(sw2), y, 2, 1);
      }
    }
    darkArch(p, Math.round(pw * 0.03), Math.round(ph * 0.3), Math.round(pw * 0.07), Math.round(ph * 0.24), rim); void t;
  });
}

export function torchRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "temple", 0.6, [240, 180, 92]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["DOWN", "SOUTH"]);
    p.fillStyle = "#3a3a46"; { const rx = (lay.bx1 - lay.bx0) * 0.7, ry = (lay.by1 - lay.by0) * 0.8, cy0 = lay.by0 - ph * 0.08; // the dome far above, a stepped arc
      for (let x = Math.round(pw * 0.5 - rx); x <= pw * 0.5 + rx; x++) { const f = (x - pw * 0.5) / rx; const y = Math.round((cy0 + ry * (1 - Math.sqrt(Math.max(0, 1 - f * f)))) / 2) * 2; if (y > 0 && hash(x >> 2, 3) > 0.15) p.fillRect(x, y, 1, 1); } }
    const px = Math.round(pw * 0.5), py = floorY + Math.round((ph - floorY) * 0.3), pdh = Math.round((ph - floorY) * 0.5);
    // the white marble pedestal: plinth, fluted shaft, cap
    p.fillStyle = "#6a6252"; p.fillRect(px - 8, py + pdh - 3, 16, 3); p.fillStyle = "#8a8068"; p.fillRect(px - 8, py + pdh - 3, 16, 1); // plinth
    p.fillStyle = "#988e76"; p.fillRect(px - 5, py + 2, 10, pdh - 5); // shaft
    p.fillStyle = "#b4aa90"; p.fillRect(px - 5, py + 2, 2, pdh - 5); p.fillRect(px + 1, py + 2, 1, pdh - 5); // fire-lit fluting
    p.fillStyle = "#5c5444"; p.fillRect(px + 3, py + 2, 2, pdh - 5); // shadow flute
    p.fillStyle = "#aa9f84"; p.fillRect(px - 7, py, 14, 2); p.fillStyle = "#c4b898"; p.fillRect(px - 7, py, 14, 1); // cap
    if (rf("DOME-ROOM", "ropeTied")) { // the rope from the dome above, hanging into the room
      for (let y = 0; y < py - 22; y++) { const sw2 = Math.sin(y * 0.09 + t * 1.1) * 1.4; p.fillStyle = ((y >> 1) & 1) ? "#8a7038" : "#6a5628"; p.fillRect(px + 26 + Math.round(sw2), y, 2, 1); }
      p.fillStyle = "#54402a"; p.fillRect(px + 25, py - 24, 4, 3); // its frayed end, out of reach of the floor
    }
    if (!rf("TORCH-ROOM", "torchTaken")) {
      const fl = 0.8 + 0.2 * Math.abs(Math.sin(t * 7));
      ditherGlow(p, px, py - 8, 26, 22, "#ffcf6a", 0.17 * fl); // firelight, wide and soft
      p.fillStyle = "#d8ccb0"; p.fillRect(px - 1, py - 6, 3, 7); // the ivory torch handle
      p.fillStyle = "#8a5a2a"; p.fillRect(px - 2, py - 7, 5, 2); // its socket wrap
      p.fillStyle = "#ff9a3a"; p.fillRect(px - 2, py - 11, 5, 4); p.fillRect(px - 1, py - 13, 3, 2); // flame body
      p.fillStyle = "#fff0c0"; p.fillRect(px - 1 + Math.round(Math.sin(t * 9)), py - 12 - Math.round(fl), 2, 4); // dancing core
    } // torch taken — the bare pedestal stands in the gloom
  });
}

export function treasureRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone"); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["DOWN"]);
    for (let i = 0; i < 6; i++) { const x = Math.round(pw * (0.2 + i * 0.1)); p.fillStyle = "#4a3a26"; fillDisc(p, x, floorY + Math.round((ph - floorY) * 0.46), 3); p.fillStyle = "#2e2415"; p.fillRect(x - 1, floorY + Math.round((ph - floorY) * 0.46), 2, 2); } // crumbling bags on the floor
    if (!hasObj("TREASURE-ROOM", "CHALICE")) return; // the thief's prize, already lifted
    // the silver chalice (focal treasure): a goblet — bowl, stem, flared foot
    const cx = Math.round(pw * 0.42), cy = floorY + Math.round((ph - floorY) * 0.4); treasureGlint(p, cx, cy - 6, t, "#e6eef4");
    p.fillStyle = "#cfdae4"; p.fillRect(cx - 4, cy - 13, 8, 1); for (let yy = 0; yy < 4; yy++) { const ww = 4 - yy; p.fillRect(cx - ww, cy - 12 + yy, ww * 2, 1); } // bowl rim + tapering cup
    p.fillStyle = "#9fb0be"; p.fillRect(cx + 2, cy - 12, 2, 3); // shadowed side of the bowl
    p.fillStyle = "#cfdae4"; p.fillRect(cx - 1, cy - 8, 2, 6); p.fillRect(cx - 4, cy - 1, 8, 1); p.fillRect(cx - 3, cy, 6, 1); // stem + flared foot
    p.fillStyle = "#ffffff"; p.fillRect(cx - 3, cy - 12, 1, 3); // a bright highlight
  });
}

export function northTemplePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "temple", 0.5, [228, 206, 150]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["SOUTH", "EAST", "DOWN"]);
    for (const fx of [0.18, 0.82]) { const x = Math.round(pw * fx); p.fillStyle = "#8a8270"; p.fillRect(x - 4, Math.round(ph * 0.08), 8, floorY + Math.round((ph - floorY) * 0.5) - Math.round(ph * 0.08)); p.fillStyle = "#6a6454"; for (let y = Math.round(ph * 0.08); y < floorY; y += 4) p.fillRect(x - 4, y, 8, 1); p.fillStyle = "#a89e84"; p.fillRect(x - 6, Math.round(ph * 0.08), 12, 3); } // marble pillars (framing)
    p.fillStyle = "#7a7058"; for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 4; xx++) p.fillRect(lay.bx1 - 14 + xx * 3, lay.by0 + 6 + yy * 4, 2, 2); // prayer inscription on the back wall
    if (!hasObj("NORTH-TEMPLE", "BELL")) { void t; return; } // the bell has been carried off to Hades
    // the brass bell — a rounded shoulder flaring (convex) to a wide mouth, crown loop, clapper
    const bx = Math.round(pw * 0.5), byy = floorY + Math.round((ph - floorY) * 0.4), bh = 12, bhw = 8, top = byy - bh;
    p.fillStyle = "#9a7a22"; p.fillRect(bx - 1, top - 4, 2, 3); p.fillRect(bx - 2, top - 4, 4, 1); // crown loop on top
    for (let k = 0; k < bh; k++) { const f = k / (bh - 1), ww = Math.max(2, Math.round(bhw * (0.3 + 0.7 * Math.pow(f, 1.6)))); p.fillStyle = "#b8902a"; p.fillRect(bx - ww, top + k, ww * 2 + 1, 1); if (k > 0) { p.fillStyle = "#e0c060"; p.fillRect(bx - ww, top + k, 1, 1); p.fillStyle = "#7a5a18"; p.fillRect(bx + ww, top + k, 1, 1); } } // convex bell body, lit/shadowed sides
    p.fillStyle = "#b8902a"; p.fillRect(bx - 2, top, 5, 1); p.fillRect(bx - 1, top - 1, 3, 1); // rounded dome cap (not a point)
    p.fillStyle = "#8a6a1a"; p.fillRect(bx - bhw - 1, byy - 1, bhw * 2 + 3, 2); // the flared mouth rim
    p.fillStyle = "#5a4514"; p.fillRect(bx - 1, byy + 1, 2, 2); // the clapper peeking below
    void t;
  });
}

export function entranceToHadesPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("hades", ""); pal.light = { x: pw * 0.5, y: ph * 0.66, rx: pw * 0.5, ry: ph * 0.62, col: [170, 62, 36], peak: 0.34 };
    const floorY = caveBackdrop(p, pw, ph, pal, t);
    const gx = Math.round(pw * 0.5), gw = Math.round(pw * 0.28), gtop = Math.round(ph * 0.14);
    const x0 = gx - (gw >> 1), x1 = gx + (gw >> 1);
    // THE GATE'S INTERIOR: hell beyond — a fire ramp climbing out of black,
    // committed bands dithered at the seams, never a flat rectangle
    const FIRE: number[][] = [[6, 2, 3], [42, 8, 6], [96, 22, 10], [164, 52, 18]];
    for (let y = gtop; y < floorY; y++) for (let x = x0; x < x1; x++) {
      const f = Math.pow((y - gtop) / (floorY - gtop), 1.5) * (FIRE.length - 1), b = Math.floor(f);
      let c = FIRE[Math.min(FIRE.length - 1, b + ((f - b) * 1.8 - 0.4 > dth(x, y) ? 1 : 0))];
      const side = Math.min(x - x0, x1 - x); if (side < 4) c = mix(c, [0, 0, 0], (4 - side) * 0.2); // walls of the passage recede
      p.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; p.fillRect(x, y, 1, 1);
    }
    for (let x = x0 + 1; x < x1 - 1; x += 2) { // flame tongues licking up at the threshold
      const fh = 3 + Math.round(Math.abs(Math.sin(x * 1.3 + t * 7)) * 6 + hash(x, Math.floor(t * 5)) * 3);
      for (let k = 0; k < fh; k++) { p.fillStyle = k > fh - 3 ? "#ffc04a" : "#ff7a2a"; if (hash(x, k + Math.floor(t * 8)) > 0.3) p.fillRect(x, floorY - 2 - k, 1, 1); }
    }
    p.fillStyle = "#ff9a4a"; for (let i = 0; i < 5; i++) { const ex = x0 + 3 + Math.round(hash(i, 3) * (gw - 6)), ey = floorY - 6 - Math.round(((t * 9 + i * 17) % 26)); if (ey > gtop + 4 && hash(i, Math.floor(t * 3)) > 0.35) p.fillRect(ex, ey, 1, 1); } // embers drifting up
    // carved basalt gateposts + lintel, their inner edges caught by the fire
    for (const px2 of [x0 - 7, x1 + 1]) {
      for (let y = gtop - 4; y < floorY; y++) { const k = hash(px2 + (y >> 2), 5); p.fillStyle = k > 0.7 ? "#2e1a1a" : "#241416"; p.fillRect(px2, y, 6, 1); if (y % 6 === 4) { p.fillStyle = "#170d0e"; p.fillRect(px2, y, 6, 1); } }
      p.fillStyle = "#7a2a1c"; p.fillRect(px2 === x0 - 7 ? px2 + 5 : px2, gtop, 1, floorY - gtop); // fire-lit inner edge
    }
    p.fillStyle = "#241416"; p.fillRect(x0 - 9, gtop - 8, gw + 18, 5); p.fillStyle = "#38201f"; p.fillRect(x0 - 9, gtop - 8, gw + 18, 1); // the great lintel
    p.fillStyle = "#caa24a"; for (let i = 0; i < 14; i++) if (hash(i, 9) > 0.2) p.fillRect(x0 - 4 + i * Math.round((gw + 8) / 14), gtop - 6, 2, 2); // the dread inscription
    p.fillStyle = "#0c0605"; p.fillRect(x0 - 9, floorY, gw + 18, 2); // threshold shadow
    if (!rf("ENTRANCE-TO-HADES", "spiritsGone")) {
      // the evil spirits — DARK cowled shapes barring the way, black against the
      // fire, green grave-light in their hoods
      for (let i = 0; i < 3; i++) {
        const fx = Math.round(gx - gw * 0.3 + i * gw * 0.3), fy = Math.round(floorY - 2 + Math.sin(t * 1.2 + i * 2.1) * 2);
        const hgt = 24 + (i === 1 ? 4 : 0);
        for (let k = 0; k < hgt; k++) { // robe: widening downward, ragged hem
          const f = k / hgt, ww = Math.max(2, Math.round(2 + f * 5));
          const wob = Math.round(Math.sin(t * 2 + k * 0.4 + i * 3) * f * 2);
          const y = fy - hgt + k;
          if (k > hgt - 4 && hash(fx + k, i) > 0.55) continue; // hem dissolving to threads
          p.fillStyle = k % 5 === 3 ? "#0a1410" : "#0d1a13"; p.fillRect(fx - ww + wob, y, ww * 2, 1);
        }
        p.fillStyle = "#0d1a13"; fillDisc(p, fx, fy - hgt + 1, 4); // the cowl
        p.fillStyle = "#050b07"; p.fillRect(fx - 2, fy - hgt, 5, 3); // its hollow
        const gl = 0.55 + 0.45 * Math.sin(t * 3 + i * 2);
        p.globalAlpha = Math.max(0.3, gl); p.fillStyle = "#7dffb0"; p.fillRect(fx - 2, fy - hgt + 1, 1, 1); p.fillRect(fx + 1, fy - hgt + 1, 1, 1); p.globalAlpha = 1; // grave-light eyes
        p.fillStyle = "#0d1a13"; p.fillRect(fx - 7, fy - Math.round(hgt * 0.55), 3, 1); p.fillRect(fx + 5, fy - Math.round(hgt * 0.6), 3, 1); // reaching sleeve tips
      }
    } // exorcised → the gateway stands empty, the fire burning on alone
  });
}

export function landOfLivingDeadPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("hades", ""); pal.light = { x: pw * 0.5, y: ph * 0.5, rx: pw * 0.8, ry: ph, col: [150, 90, 80], peak: 0.45 };
    const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    // tiers of burial niches cut into the rock — the land of the dead is a necropolis
    for (let row = 0; row < 2; row++) for (let col = 0; col < 7; col++) {
      if (hash(col, row * 5 + 2) < 0.2) continue; // some collapsed
      const nx = Math.round(pw * (0.12 + col * 0.115)), ny = Math.round(ph * (0.2 + row * 0.16));
      for (let d = 0; d < 3; d++) { const v = Math.max(2, 12 - d * 4); p.fillStyle = `rgb(${v + 3},${v + 1},${v})`; p.fillRect(nx + d, ny + d, 12 - d * 2, 9 - d * 2); } // recessed hollow
      p.fillStyle = "#3a2c28"; p.fillRect(nx - 1, ny + 9, 14, 1); // its worn sill
      if (hash(col * 3, row) > 0.55) { p.fillStyle = "#b8ad92"; p.fillRect(nx + 4, ny + 4, 4, 3); p.fillStyle = "#241a16"; p.fillRect(nx + 5, ny + 5, 1, 1); p.fillRect(nx + 7, ny + 5, 1, 1); } // a skull staring out
      else if (hash(col * 7, row) > 0.6) { p.fillStyle = "#9a9078"; p.fillRect(nx + 3, ny + 6, 6, 1); p.fillRect(nx + 5, ny + 4, 1, 2); } // scattered long-bones
    }
    // a heap of the dead's remains — crossed long-bones, a ribcage, a skull atop
    const bx = Math.round(pw * 0.2), by = floorY + Math.round((ph - floorY) * 0.46);
    p.fillStyle = "#c8c0a4"; for (let k = -8; k <= 8; k++) { p.fillRect(bx + k, by + Math.round(k * 0.4), 1, 2); p.fillRect(bx + k, by - Math.round(k * 0.4), 1, 2); } // two femurs crossed
    p.fillStyle = "#d8d0b4"; for (const e of [[-9, -4], [9, 4], [-9, 4], [9, -4]]) fillDisc(p, bx + e[0], by + e[1], 2); // knobbed bone ends
    p.fillStyle = "#c0b89c"; p.fillRect(bx, by - 14, 1, 9); // spine
    p.fillStyle = "#d4ccb0"; for (let r = 0; r < 4; r++) { const ry = by - 6 - r * 2; for (let x = -5; x <= 5; x++) if (Math.abs(x) > 1) p.fillRect(bx + x, ry + Math.round(Math.abs(x) * 0.3), 1, 1); } // curved ribcage
    p.fillStyle = "#e0d8bc"; fillDisc(p, bx, by - 18, 4); p.fillStyle = "#2a2418"; p.fillRect(bx - 2, by - 19, 2, 2); p.fillRect(bx + 1, by - 19, 2, 2); p.fillRect(bx - 1, by - 15, 1, 1); p.fillStyle = "#bdb498"; for (let j = -2; j <= 2; j++) p.fillRect(bx + j, by - 14, 1, 1); // skull: sockets, nasal, jaw
    for (let i = 0; i < 4; i++) { // lost souls — hooded wisps trailing off to nothing
      p.globalAlpha = 0.28 + 0.2 * Math.sin(t + i); p.fillStyle = "#aac4d4";
      const x = Math.round(pw * (0.4 + i * 0.13) + Math.sin(t * 0.5 + i) * 6), y = Math.round(ph * 0.3 + Math.cos(t * 0.6 + i) * 8);
      fillDisc(p, x, y, 2); // cowled head
      p.fillRect(x - 2, y + 2, 4, 2); p.fillRect(x - 1, y + 4, 2, 2); p.fillRect(x + (i % 2 ? 1 : -1), y + 6, 1, 2); // tattered tail
      p.globalAlpha = 0.5; p.fillStyle = "#1a2a34"; p.fillRect(x - 1, y, 1, 1); p.fillRect(x + 1, y, 1, 1); // hollow eyes
    }
    p.globalAlpha = 1;
    if (hasObj("LAND-OF-LIVING-DEAD", "SKULL")) {
      // the crystal skull — a real skull in ice-clear crystal, softly alight
      const sx = Math.round(pw * 0.58), sy = floorY + Math.round((ph - floorY) * 0.34);
      p.fillStyle = "#2a4a5a"; p.fillRect(sx - 5, sy + 4, 11, 1); // its cold light pooling beneath it
      p.fillStyle = "#d4eeff"; fillDisc(p, sx, sy - 2, 4); // cranium
      p.fillRect(sx - 3, sy + 1, 7, 2); p.fillRect(sx - 2, sy + 3, 5, 1); // cheeks + jaw
      p.fillStyle = "#2a4a5a"; p.fillRect(sx - 2, sy - 2, 2, 2); p.fillRect(sx + 1, sy - 2, 2, 2); p.fillRect(sx, sy + 1, 1, 1); // sockets + nasal
      p.fillStyle = "#8ab4c4"; for (let j = -2; j <= 2; j++) if (j % 2 === 0) p.fillRect(sx + j, sy + 3, 1, 1); // teeth
      p.fillStyle = "#ffffff"; if (Math.sin(t * 2.2) > 0.4) p.fillRect(sx - 2, sy - 4, 1, 1); // crystal glint
    }
    darkArch(p, Math.round(pw * 0.46), floorY - Math.round(ph * 0.22), Math.round(pw * 0.08), Math.round(ph * 0.22), rim); // north
  });
}

export function deadEndPixel(mine: boolean, seed: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal(mine ? "mine" : "dungeon", pw, ph); if (!mine) Object.assign(pal, mazePal(pw, ph));
    const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    // the passage simply ENDS — a rough wall of natural rock looms across the way,
    // bulging out toward you, lit by the lamp at its centre and dark at the seams.
    const base = mine ? [46, 38, 28] : [70, 70, 80];
    const x0 = Math.round(pw * 0.14), x1 = Math.round(pw * 0.86), top = Math.round(ph * 0.08);
    for (let x = x0; x < x1; x++) {
      const edge = top + Math.round((hash(Math.floor(x / 5), 1) - 0.5) * ph * 0.06 + Math.sin(x * 0.06) * ph * 0.025); // ragged crown of the rock
      const cxd = Math.abs(x - pw * 0.5) / (pw * 0.4); // 0 centre → 1 sides
      for (let y = edge; y < floorY; y++) {
        const n = hash(Math.floor(x / 2), Math.floor(y / 2));
        let v = 1 - cxd * 0.42 - n * 0.22; // lit, bulging centre; cooler shadowed flanks
        if (y < edge + 4) v -= 0.3; if (x < x0 + 5 || x > x1 - 5) v -= 0.25; // crevice shadow at the seams
        v = Math.max(0.26, Math.min(1, v)); const lvl = v + (dth(x, y) - 0.5) * 0.12;
        const c = base.map(ch => Math.round(ch * Math.max(0.26, Math.min(1, lvl))));
        p.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; p.fillRect(x, y, 1, 1);
      }
    }
    // deep fissures: jittering 1px pixel walks (never smooth curves)
    p.fillStyle = "#0c0b09";
    for (let i = 0; i < 3; i++) {
      let xx = Math.round(pw * (0.3 + i * 0.19 + hash(seed, i) * 0.05));
      for (let y = top + 5; y < floorY - 2; y += 2) {
        xx += Math.round((hash(xx, y) - 0.5) * 3);
        p.fillRect(xx, y, 1, 2);
        if (hash(y, xx) > 0.88) p.fillRect(xx + 1, y, 2, 1); // a side branch
      }
    }
    p.fillStyle = `rgb(${pal.wallHi.join(",")})`; // lamp-caught chips and edges
    for (let i = 0; i < 5; i++) { const xs = Math.round(pw * (0.24 + hash(seed, i) * 0.52)), ys = Math.round(ph * (0.18 + hash(seed, i + 4) * 0.32)); p.fillRect(xs, ys, 3, 1); p.fillRect(xs + 1, ys + 1, 1, 1); }
    const side = seed % 2 ? 0.04 : 0.89; darkArch(p, Math.round(pw * side), floorY - Math.round(ph * 0.2), Math.round(pw * 0.07), Math.round(ph * 0.2), rim); // the way back
    if (mine) { coalVeins(p, pw, floorY); p.fillStyle = "#0a0a0c"; for (let i = 0; i < 10; i++) { const x = Math.round(pw * 0.45 + (hash(i, 1) - 0.5) * 40); fillDisc(p, x, floorY + Math.round((ph - floorY) * 0.5) - Math.round(hash(i, 2) * 8), 3); } p.fillStyle = "#33333c"; p.fillRect(Math.round(pw * 0.45), floorY + Math.round((ph - floorY) * 0.5), 2, 1); } // pile of coal
    void t;
  });
}
