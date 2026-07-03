// scenes/rooms-river.ts — the Frigid River, its shores, falls and rainbow.

import { hasObj, rf } from "./state.ts";
import { arches, canyonBackdrop, caveBackdrop, darkArch, ditherGlow, dth, fillDisc, hash, interiorBackdrop, litCave, mix, pickPal, pixelStage, riverBase, sandBand, sp2, waterFill, whiteCliff } from "./kit.ts";

export function damRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    // standing ON TOP of Flood Control Dam #3: the reservoir held behind the
    // crest, the dam's great concrete face dropping into the gorge below you.
    const open = rf("DAM-ROOM", "gatesOpen");
    const crestY = Math.round(ph * 0.36), deckY = Math.round(ph * 0.86);
    // the cavern void above, with a hint of far rock
    for (let y = 0; y < crestY; y++) for (let x = 0; x < pw; x++) {
      const k = hash(x >> 3, y >> 3);
      p.fillStyle = y < crestY * 0.5 ? (k > 0.9 ? "#101014" : "#060608") : k > 0.85 ? "#16181e" : "#0a0b0e";
      p.fillRect(x, y, 1, 1);
    }
    // the reservoir behind the crest — calm dark water sliding to the dam
    for (let y = Math.round(crestY * 0.55); y < crestY; y++) for (let x = 0; x < pw; x++) {
      const v = Math.sin(x * 0.07 + t * 0.8 + y * 0.5) * 0.5 + 0.5;
      p.fillStyle = v * 0.55 > dth(x, y) ? (y & 1 ? "#1e425c" : "#2a566e") : "#0e1e2a";
      p.fillRect(x, y, 1, 1);
    }
    // the dam face: lift lines + construction joints, floodlit from your side
    for (let y = crestY; y < deckY; y++) for (let x = 0; x < pw; x++) {
      const k = hash(x >> 2, y >> 2), fy = (y - crestY) / (deckY - crestY);
      let c: number[] = k > 0.8 ? [96, 100, 110] : k > 0.35 ? [82, 86, 96] : [70, 74, 84];
      if (fy > 0.6) c = mix(c, [20, 22, 28], (fy - 0.6) * 1.6); // falls into the gorge dark
      if (y % 7 === 6) c = [52, 55, 64]; // horizontal lift lines
      if ((x % 26) === 13) c = [56, 59, 68]; // vertical joints
      sp2(p, x, y, c);
    }
    p.fillStyle = "#b0b4c0"; p.fillRect(0, crestY, pw, 2); p.fillStyle = "#8a8e9a"; p.fillRect(0, crestY + 2, pw, 1); // the lit crest parapet
    // the sluice gates in the face — three great outlets
    for (const gxf of [0.3, 0.5, 0.7]) {
      const gx = Math.round(pw * gxf), gw = 9, gy = crestY + 8, gh = Math.round((deckY - crestY) * 0.3);
      p.fillStyle = "#1c1e24"; p.fillRect(gx - gw - 1, gy - 1, gw * 2 + 2, gh + 2); // outlet recess
      if (open) {
        p.fillStyle = "#0a1014"; p.fillRect(gx - gw, gy, gw * 2, gh);
        for (let y = gy; y < deckY + 4; y++) { // water bursting out and falling
          const fy = (y - gy) / (deckY - gy), ww = Math.round(gw * (0.9 + fy * 1.3));
          for (let xx = -ww; xx <= ww; xx++) {
            const v = hash(xx + gx, (y >> 1) + Math.floor(t * 9));
            if (v > 0.5 - fy * 0.15) { p.fillStyle = v > 0.82 ? "#dfeaf2" : "#6fa0be"; p.fillRect(gx + xx, y, 1, 1); }
          }
        }
      } else { // gates shut: riveted steel
        p.fillStyle = "#3a3c43"; p.fillRect(gx - gw, gy, gw * 2, gh);
        p.fillStyle = "#54565e"; p.fillRect(gx - gw, gy, gw * 2, 1); p.fillRect(gx - 1, gy, 1, gh);
        p.fillStyle = "#22242a"; for (let ry2 = gy + 2; ry2 < gy + gh; ry2 += 4) { p.fillRect(gx - gw + 1, ry2, 1, 1); p.fillRect(gx + gw - 2, ry2, 1, 1); }
      }
    }
    if (open) { ditherGlow(p, pw * 0.5, deckY, pw * 0.4, 8, "#cfe0ea", 0.4); } // spray boiling below
    else { p.fillStyle = "#16323e"; for (let x = 0; x < pw; x++) if (Math.sin(x * 0.2 + t * 2) > 0.3) p.fillRect(x, deckY - 3 + (x % 2), 1, 1); } // just a trickle in the gorge
    // the walkway you stand on, with its railing against the drop
    for (let y = deckY; y < ph; y++) for (let x = 0; x < pw; x++) { const k = hash(x >> 1, y); p.fillStyle = k > 0.7 ? "#5c606c" : "#4a4e58"; p.fillRect(x, y, 1, 1); }
    p.fillStyle = "#787c88"; p.fillRect(0, deckY, pw, 1);
    p.fillStyle = "#2e3038"; for (let x = 4; x < pw; x += 16) p.fillRect(x, deckY - 8, 2, 8); // railing posts
    p.fillStyle = "#383a44"; p.fillRect(0, deckY - 8, pw, 2); // rail
    // the control panel beside you: the green glass bubble + the metal bolt
    const px = Math.round(pw * 0.78), py = deckY - 4;
    p.fillStyle = "#101216"; p.fillRect(px - 15, py - 17, 34, 21); // sel-out
    p.fillStyle = "#2a2c30"; p.fillRect(px - 14, py - 16, 32, 20); p.fillStyle = "#3a3e44"; p.fillRect(px - 14, py - 16, 32, 1);
    const glowAmt = open ? 0.35 : 0.75, fl = 0.9 + 0.1 * Math.sin(t * 3);
    ditherGlow(p, px - 6, py - 6, 7, 7, "#3affa0", glowAmt * fl); p.fillStyle = "#7affc0"; fillDisc(p, px - 6, py - 6, 2); // the green bubble, glowing while pressure holds
    p.fillStyle = "#b8b8c0"; p.fillRect(px + 6, py - 9, 5, 5); p.fillStyle = "#dadce2"; p.fillRect(px + 6, py - 9, 5, 1); p.fillStyle = "#8a8e96"; p.fillRect(px + 7, py - 7, 3, 1); // the large metal bolt
  });
}

export function reservoirPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("dungeon", "water"); pal.light = { x: pw * 0.5, y: ph * 0.18, rx: pw * 0.95, ry: ph, col: [150, 170, 200], peak: 0.42 };
    caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    const top = Math.round(ph * 0.42);
    p.fillStyle = "#23272e"; p.fillRect(0, top - 2, pw, 3); // far shore
    darkArch(p, Math.round(pw * 0.46), top - Math.round(ph * 0.2), Math.round(pw * 0.08), Math.round(ph * 0.2), rim);
    darkArch(p, Math.round(pw * 0.06), top - Math.round(ph * 0.16), Math.round(pw * 0.07), Math.round(ph * 0.16), rim);
    darkArch(p, Math.round(pw * 0.87), top - Math.round(ph * 0.16), Math.round(pw * 0.07), Math.round(ph * 0.16), rim);
    if (rf("RESERVOIR", "drained")) {
      // drained (dam gates open) — a muddy basin you can now walk across
      p.fillStyle = "#2e2618"; p.fillRect(0, top, pw, ph - top);
      for (let y = top; y < ph; y += 3) for (let x = 0; x < pw; x += 3) { const n = hash(Math.floor(x / 3), Math.floor(y / 3)); p.fillStyle = n > 0.62 ? "#3e3320" : n < 0.24 ? "#1c1710" : "#2e2618"; p.fillRect(x, y, 3, 3); }
      p.fillStyle = "#3a5a6e"; for (let i = 0; i < 10; i++) p.fillRect(Math.floor(hash(i, 2) * pw), top + Math.floor(hash(i, 3) * (ph - top)), 3, 1); // shallow puddles
    } else {
      waterFill(p, pw, top, ph, t, "#3a6c8e", "#23506e"); // the reservoir, full
    }
  });
}

export function riverScene(rough: boolean, eastCliff: boolean, westBeach: boolean, buoy: boolean, eastBeach: boolean, t: number) {
  return (p: CanvasRenderingContext2D, pw: number, ph: number) => {
    const wy = riverBase(p, pw, ph, t, rough);
    if (eastCliff) whiteCliff(p, Math.round(pw * 0.86), pw, Math.round(ph * 0.1), wy + 6);
    if (westBeach) { sandBand(p, 0, Math.round(pw * 0.14), wy - 4, wy + 8); p.fillStyle = "#356a8c"; for (let y = wy - 4; y < wy + 8; y++) if (hash(9, y) > 0.4) p.fillRect(Math.round(pw * 0.14) - 1 - Math.round(hash(y, 3) * 3), y, 2, 1); } // waterline laps into the sand
    if (eastBeach) { sandBand(p, Math.round(pw * 0.86), pw, wy - 4, wy + 10); p.fillStyle = "#356a8c"; for (let y = wy - 4; y < wy + 10; y++) if (hash(11, y) > 0.4) p.fillRect(Math.round(pw * 0.86) + Math.round(hash(y, 7) * 3), y, 2, 1); }
    if (buoy) { const bx = Math.round(pw * 0.5), byy = wy + Math.round((ph - wy) * 0.3); p.fillStyle = "#c83a2a"; fillDisc(p, bx, byy, 4); p.fillStyle = "#7a1f14"; fillDisc(p, bx, byy, 2); p.fillStyle = "#e8e0c0"; p.fillRect(bx, byy - 7, 1, 3); }
  };
}

export function damBasePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    canyonBackdrop(p, pw, ph, false, false);
    const open = rf("DAM-ROOM", "gatesOpen");
    // the dam TOWERS above you to the north: a vast curved face, crest against the sky
    const crestY = Math.round(ph * 0.08), footY = Math.round(ph * 0.62);
    const x0 = Math.round(pw * 0.1), x1 = Math.round(pw * 0.9);
    for (let y = crestY; y < footY; y++) {
      const f = (y - crestY) / (footY - crestY);
      const inset = Math.round((1 - f) * pw * 0.05); // the face leans back as it rises
      for (let x = x0 + inset; x < x1 - inset; x++) {
        const k = hash(x >> 2, y >> 2);
        let c = k > 0.8 ? "#6a6a72" : k > 0.35 ? "#5a5a62" : "#4c4c54";
        if (y % 6 === 5) c = "#3e3e46"; // lift lines
        if (((x - x0) % 24) === 12) c = "#42424a"; // construction joints
        p.fillStyle = c; p.fillRect(x, y, 1, 1);
      }
    }
    p.fillStyle = "#8a8e9a"; p.fillRect(x0 + Math.round(pw * 0.05) - 2, crestY - 2, x1 - x0 - Math.round(pw * 0.1) + 4, 2); // the lit crest, impossibly high
    p.fillStyle = "#2e3038"; for (let x = x0 + Math.round(pw * 0.05) + 3; x < x1 - Math.round(pw * 0.05); x += 12) p.fillRect(x, crestY - 5, 1, 3); // railing posts, tiny with distance
    // the outlets at the foot — the river is born here
    for (const gxf of [0.34, 0.5, 0.66]) {
      const gx = Math.round(pw * gxf);
      p.fillStyle = "#16181e"; p.fillRect(gx - 7, footY - 12, 14, 12);
      if (open) { for (let y = footY - 11; y < footY + 4; y++) for (let xx = -7; xx <= 7; xx++) { const v = hash(xx + gx, (y >> 1) + Math.floor(t * 9)); if (v > 0.45) { p.fillStyle = v > 0.8 ? "#dfeaf2" : "#6fa0be"; p.fillRect(gx + xx, y, 1, 1); } } }
      else { p.fillStyle = "#3a3c43"; p.fillRect(gx - 6, footY - 11, 12, 10); p.fillStyle = "#54565e"; p.fillRect(gx - 6, footY - 11, 12, 1); }
    }
    // churn at the base + the Frigid flowing south past you
    waterFill(p, pw, footY, ph, t, "#356a8c", "#234e6c");
    for (let x = 0; x < pw; x++) if (hash(x, Math.floor(t * 6)) > (open ? 0.4 : 0.75)) { p.fillStyle = "#cfe0ea"; p.fillRect(x, footY + Math.round(hash(x, 9) * 4), 1, 1); } // white water at the foot
    whiteCliff(p, 0, Math.round(pw * 0.1), Math.round(ph * 0.3), ph); whiteCliff(p, Math.round(pw * 0.9), pw, Math.round(ph * 0.3), ph); // the gorge walls
    // the plastic boat on the near bank: a folded pile — or, pumped up, seaworthy
    const bx2 = Math.round(pw * 0.42), by2 = ph - 8;
    if (rf("DAM-BASE", "boatInflated") && hasObj("DAM-BASE", "INFLATED-BOAT")) {
      p.fillStyle = "#241a2e"; p.fillRect(bx2 - 2, by2 + 3, 28, 2); // shadow under the hull
      for (let r = 0; r < 6; r++) { const inset = r < 2 ? 2 - r : Math.round((r - 1) * 0.9); const wd = 26 - inset * 2; p.fillStyle = r === 0 ? "#a88aba" : r < 3 ? "#7a5a8a" : "#54406a"; p.fillRect(bx2 + inset, by2 - 3 + r, wd, 1); } // taut tube hull, bow tapering
      p.fillStyle = "#c8aad8"; p.fillRect(bx2 + 3, by2 - 3, 21, 1); // gunwale catching the light
      p.fillStyle = "#38284a"; p.fillRect(bx2 + 7, by2 - 1, 3, 2); p.fillRect(bx2 + 16, by2 - 1, 3, 2); // thwart seats
      p.fillStyle = "#e8e4da"; p.fillRect(bx2 + 11, by2, 4, 2); // the tan label in the bottom
    } else if (hasObj("DAM-BASE", "INFLATABLE-BOAT")) {
      p.fillStyle = "#3a2a44"; p.fillRect(bx2 - 2, by2 - 1, 16, 5);
      p.fillStyle = "#7a5a8a"; p.fillRect(bx2, by2, 12, 3); p.fillStyle = "#9a7aac"; p.fillRect(bx2, by2, 12, 1); p.fillStyle = "#54406a"; p.fillRect(bx2 + 4, by2 + 1, 2, 2); // folds
    }
  });
}

export function damLobbyPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const floorY = interiorBackdrop(p, pw, ph, { wallTop: [56, 56, 60], wallBot: [34, 34, 38], floorTop: [62, 60, 58], floorBot: [32, 31, 30], floorHi: [80, 78, 76], plank: "#26252a", seam: "#1a1a1e", light: { x: pw * 0.5, y: ph * 0.3, rx: pw * 0.85, ry: ph, col: [170, 175, 185], peak: 0.4 } }, t);
    // two doorways marked "Private" (north + east)
    for (const fx of [0.24, 0.86]) { const x = Math.round(pw * fx); darkArch(p, x - Math.round(pw * 0.05), Math.round(ph * 0.2), Math.round(pw * 0.1), Math.round(ph * 0.4), "#6a6a72"); p.fillStyle = "#caa24a"; p.fillRect(x - 8, Math.round(ph * 0.16), 16, 2); p.fillStyle = "#7a6228"; p.fillRect(x - 8, Math.round(ph * 0.17), 16, 1); } // "PRIVATE" plates
    // the visitors' display: a framed tour poster of mighty FCD#3
    const dxp = Math.round(pw * 0.52), dyp = Math.round(ph * 0.2), dwp = 52, dhp = 30;
    p.fillStyle = "#181a20"; p.fillRect(dxp - 1, dyp + dhp + 2, dwp + 4, 2); // cast shadow under the frame
    p.fillStyle = "#6a5a34"; p.fillRect(dxp - 2, dyp - 2, dwp + 4, dhp + 4); // brass frame
    p.fillStyle = "#8a7648"; p.fillRect(dxp - 2, dyp - 2, dwp + 4, 1); p.fillRect(dxp - 2, dyp - 2, 1, dhp + 4); // lit bevel
    p.fillStyle = "#3a2f1c"; p.fillRect(dxp - 2, dyp + dhp + 1, dwp + 4, 1); p.fillRect(dxp + dwp + 1, dyp - 2, 1, dhp + 4); // shadow bevel
    for (let yy = 0; yy < 8; yy++) { p.fillStyle = yy < 4 ? "#2a3450" : "#38466a"; p.fillRect(dxp, dyp + yy, dwp, 1); } // dusk sky bands
    p.fillStyle = "#caa24a"; p.fillRect(dxp + 3, dyp + 2, 17, 2); p.fillRect(dxp + 3, dyp + 5, 11, 1); // poster title lines, tour-brochure gold
    p.fillStyle = "#46586a"; p.fillRect(dxp, dyp + 8, dwp, 5); // the reservoir behind the dam
    p.fillStyle = "#5c7286"; for (let x = 1; x < dwp - 1; x += 3) if ((x >> 1) & 1) p.fillRect(dxp + x, dyp + 9, 2, 1); // still-water glints
    for (let yy = 13; yy < 26; yy++) for (let x = 0; x < dwp; x++) { p.fillStyle = hash(x, yy) > 0.6 ? "#7e6e4c" : "#6e5f42"; p.fillRect(dxp + x, dyp + yy, 1, 1); } // canyon rock flanking the dam
    p.fillStyle = "#aab0b8"; p.fillRect(dxp + 6, dyp + 13, dwp - 12, 2); // the crest road, catching the light
    for (let yy = 0; yy < 10; yy++) { p.fillStyle = yy < 5 ? "#868d96" : "#6e757e"; p.fillRect(dxp + 7 + (yy >> 1), dyp + 15 + yy, dwp - 14 - yy, 1); } // the concrete face, battered inward
    p.fillStyle = "#4c535c"; for (let g = 0; g < 4; g++) p.fillRect(dxp + 12 + g * 8, dyp + 15, 2, 6); // sluice gates in shadow
    p.fillStyle = "#dfe8ee"; p.fillRect(dxp + 20, dyp + 18, 3, 7); p.fillStyle = "#b9cdd9"; p.fillRect(dxp + 21, dyp + 22, 2, 3); // one gate spilling a white ribbon
    p.fillStyle = "#5a7a96"; p.fillRect(dxp, dyp + 26, dwp, 4); // the river reach below
    p.fillStyle = "#7e9cb6"; p.fillRect(dxp + 17, dyp + 26, 9, 1); p.fillRect(dxp + 30, dyp + 27, 6, 1); // churn where the spill lands
    // the tour table: guidebooks in a rack + the matchbook
    const tx2 = Math.round(pw * 0.5), ty2 = floorY + Math.round((ph - floorY) * 0.35);
    p.fillStyle = "#101216"; p.fillRect(tx2 - 21, ty2 - 1, 42, 4);
    p.fillStyle = "#4a4e58"; p.fillRect(tx2 - 20, ty2, 40, 2); p.fillStyle = "#6a6e78"; p.fillRect(tx2 - 20, ty2, 40, 1); // formica top
    p.fillStyle = "#33363e"; p.fillRect(tx2 - 18, ty2 + 2, 2, 10); p.fillRect(tx2 + 16, ty2 + 2, 2, 10); // legs
    for (let i = 0; i < 3; i++) { p.fillStyle = i % 2 ? "#b8b09a" : "#a89e86"; p.fillRect(tx2 - 14 + i * 2, ty2 - 7 + i, 3, 7 - i); } // the leaning stack of guidebooks
    p.fillStyle = "#8a3a2a"; p.fillRect(tx2 + 6, ty2 - 3, 7, 3); p.fillStyle = "#c86a4a"; p.fillRect(tx2 + 6, ty2 - 3, 7, 1); // the matchbook
    void t;
  });
}

// -- river (underground stream / reservoir shores) --
export function reservoirShorePixel(north: boolean) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("dungeon", "water"); pal.light = { x: pw * 0.5, y: ph * 0.96, rx: pw * 0.8, ry: ph, col: [222, 168, 92], peak: 0.6 };
    caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    // the water fills the MIDDLE distance only — you stand on a real shore
    const wTop = Math.round(ph * 0.44), wBot = Math.round(ph * 0.72);
    const drained = rf("RESERVOIR", "drained");
    if (drained) { // the gates stand open downstream — a basin of cracked mud
      for (let y = wTop; y < wBot; y++) for (let x = 0; x < pw; x++) { const k = hash(x >> 2, y >> 2); p.fillStyle = k > 0.7 ? "#3e3320" : k < 0.22 ? "#1c1710" : "#2e2618"; p.fillRect(x, y, 1, 1); }
      p.fillStyle = "#151009"; for (let i = 0; i < 12; i++) { let xx = Math.round(hash(i, 4) * pw); for (let k = 0; k < 10; k++) { xx += Math.round((hash(xx, k) - 0.5) * 3); p.fillRect(xx, wTop + 3 + Math.round(hash(i, 5) * (wBot - wTop - 6)) + (k >> 2), 2, 1); } } // drying cracks
      p.fillStyle = "#3a5a6e"; for (let i = 0; i < 8; i++) p.fillRect(Math.round(hash(i, 7) * pw), wTop + 2 + Math.round(hash(i, 8) * (wBot - wTop - 4)), 3, 1); // last stranded puddles
    } else {
      waterFill(p, pw, wTop, wBot, t, "#31607e", "#1e4460");
    }
    p.fillStyle = "#0e2334"; p.fillRect(0, wTop - 1, pw, 1); // far waterline against the rock
    // your lamplit shore: wet rock shelving into the reservoir
    for (let y = wBot; y < ph; y++) for (let x = 0; x < pw; x++) {
      const k = hash(x >> 1, y >> 1), f = (y - wBot) / Math.max(1, ph - wBot);
      p.fillStyle = k > 0.78 ? (f < 0.3 ? "#4a4438" : "#3e382c") : k > 0.3 ? "#332e24" : "#26221a";
      p.fillRect(x, y, 1, 1);
    }
    if (!drained) { p.fillStyle = "#5c6f7e"; for (let x = 0; x < pw; x += 2) if (Math.sin(x * 0.2 + t * 2.4) > 0.4) p.fillRect(x, wBot + (x % 2), 2, 1); } // the reservoir lapping the shore
    arches(p, pw, ph, ph - 6, rim, north ? ["NORTH"] : ["EAST", "WEST"]);
    if (north && hasObj("RESERVOIR-NORTH", "PUMP")) { // the hand-held air pump, abandoned on the north shore
      const ax = Math.round(pw * 0.62), ay = ph - Math.round((ph - wBot) * 0.5);
      p.fillStyle = "#101216"; p.fillRect(ax - 7, ay - 6, 15, 9);
      p.fillStyle = "#3a3a42"; p.fillRect(ax - 6, ay - 5, 12, 7); p.fillStyle = "#5a5a64"; p.fillRect(ax - 6, ay - 5, 12, 1); // the barrel
      p.fillStyle = "#8a8a92"; p.fillRect(ax - 2, ay - 9, 2, 4); p.fillRect(ax - 5, ay - 10, 8, 2); // plunger handle
      p.fillStyle = "#6a6a72"; p.fillRect(ax + 6, ay - 2, 5, 2); p.fillRect(ax + 10, ay - 3, 2, 2); // the hose
    }
  });
}

export function streamViewPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("dungeon", "water"); pal.light = { x: pw * 0.5, y: ph * 0.98, rx: pw * 0.8, ry: ph, col: [200, 210, 230], peak: 0.5 };
    const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    const sTop = floorY - Math.round(ph * 0.06), sBot = floorY + Math.round((ph - floorY) * 0.5);
    waterFill(p, pw, sTop, sBot, t, "#3a6c8e", "#244e6e");
    p.fillStyle = "#9cc2d8"; for (let x = 0; x < pw; x++) { const yy = sTop + 2 + Math.round(Math.sin(x * 0.12) * 2 + (sBot - sTop) * 0.4); if (Math.sin(x * 0.4 - t * 5) > 0.55) p.fillRect(x, yy, 2, 1); } // the current, sliding west→east
    // the rocky bank you walk along
    for (let y = sBot; y < ph; y++) for (let x = 0; x < pw; x++) { const k = hash(x >> 1, y >> 1); p.fillStyle = k > 0.78 ? "#453c2e" : k > 0.3 ? "#372f23" : "#282218"; p.fillRect(x, y, 1, 1); }
    p.fillStyle = "#5a4e38"; for (let i = 0; i < 9; i++) { const bx3 = Math.round(hash(i, 5) * pw), by3 = sBot + 2 + Math.round(hash(i, 6) * (ph - sBot - 4)); p.fillRect(bx3, by3, 2 + (i % 2), 2); p.fillStyle = "#6f6046"; p.fillRect(bx3, by3, 2 + (i % 2), 1); p.fillStyle = "#5a4e38"; } // boulders
    p.fillStyle = "#6a7f8e"; for (let x = 0; x < pw; x += 2) if (Math.sin(x * 0.3 + t * 3) > 0.5) p.fillRect(x, sBot, 2, 1); // water licking the bank
    arches(p, pw, ph, floorY, rim, ["EAST"]);
  });
}

export function inStreamPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("dungeon", "water"); pal.light = { x: pw * 0.5, y: ph * 0.9, rx: pw * 0.85, ry: ph, col: [190, 205, 225], peak: 0.5 };
    const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    waterFill(p, pw, Math.round(ph * 0.42), ph, t, "#3a6c8e", "#234e6c"); // you're on the stream
    sandBand(p, 0, Math.round(pw * 0.16), Math.round(ph * 0.42) - 2, Math.round(ph * 0.5)); // narrow beach to land
    arches(p, pw, ph, Math.round(ph * 0.42), rim, ["EAST"]);
    void t;
  });
}

export function dampCavePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = litCave("dungeon", "damp", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    // wet sheen running down the walls in streaks (water follows the rock, not random)
    for (let i = 0; i < 9; i++) {
      const x = Math.round(pw * (0.1 + hash(i, 1) * 0.8)), y0 = Math.round(ph * (0.12 + hash(i, 2) * 0.2)), len = Math.round((floorY - y0) * (0.5 + hash(i, 3) * 0.5));
      for (let k = 0; k < len; k++) { const xx = x + Math.round(Math.sin(k * 0.2 + i) * 1); if (hash(xx, k) > 0.3) { p.fillStyle = k % 3 ? "#3d4a54" : "#55707e"; p.fillRect(xx, y0 + k, 1, 1); } }
    }
    // moss creeping where the water runs
    p.fillStyle = "#2c3e24"; for (let i = 0; i < 6; i++) { const mx = Math.round(pw * (0.14 + hash(i, 7) * 0.7)), my = floorY - 3 - Math.round(hash(i, 8) * 8); for (let k = 0; k < 4; k++) if (hash(mx + k, my) > 0.3) p.fillRect(mx + k, my + (k % 2), 2, 1); }
    // drips falling from the ceiling to puddles that blink with each strike
    for (let i = 0; i < 6; i++) {
      const x = Math.round(pw * (0.15 + hash(i, 5) * 0.7)), cyc = (t * 0.9 + i * 0.7) % 1;
      const py2 = floorY + 4 + Math.round(hash(i, 6) * ((ph - floorY) * 0.5));
      p.fillStyle = "#1c2830"; p.fillRect(x - 3, py2, 7, 2); p.fillStyle = "#2c4250"; p.fillRect(x - 2, py2, 5, 1); // the puddle
      const dy2 = Math.round(ph * 0.14 + cyc * (py2 - ph * 0.14));
      p.fillStyle = "#9ac0d4"; p.fillRect(x, dy2, 1, 2); // the falling drop
      if (cyc > 0.92) { p.fillStyle = "#c8e2ee"; p.fillRect(x - 2, py2, 1, 1); p.fillRect(x + 2, py2, 1, 1); } // splash rings
    }
    p.fillStyle = "#040406"; p.fillRect(Math.round(pw * 0.46), floorY, Math.round(pw * 0.08), ph - floorY); // narrows to a crack (south)
    arches(p, pw, ph, floorY, rim, ["WEST", "EAST"]);
  });
}
