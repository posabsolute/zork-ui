// scenes/rooms-forest.ts — the forest, clearings, and canyon above ground.

import { hasObj, rf, isRainbowSolid, hasObjKnown } from "./state.ts";
import { arches, canyonBackdrop, caveBackdrop, ditherGlow, dth, fgTreePixel, fillDisc, fireflies, forestBackdrop, hash, housePixel, litCave, mailboxPixel, pixelBackdrop, pixelCanopy, pixelPath, pixelStage, pixelTree, rainPixel, rainbowArc, ridge, sandBand, sp, treasureGlint, waterFill, waterfall, whiteCliff } from "./kit.ts";

export function westOfHousePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = pixelBackdrop(p, pw, ph, t);
    housePixel(p, pw, ph, horizon, t, 0.56, { door: true, face: "front", moonF: 0.26 }); // colonial front: portico + boarded door, moonlit only
    mailboxPixel(p, Math.round(pw * 0.22), horizon + Math.round((ph - horizon) * 0.34));
    fgTreePixel(p, pw, ph, t);
    rainPixel(p, pw, ph, t);
  });
}

export function northOfHousePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = pixelBackdrop(p, pw, ph, t, 0.74);
    pixelPath(p, pw, ph, horizon, "north"); // a path winds north into the forest
    housePixel(p, pw, ph, horizon, t, 0.64, { face: "end", moonF: 0.74 }); // north gable end: no door, boarded
    fgTreePixel(p, pw, ph, t);
    rainPixel(p, pw, ph, t);
  });
}

export function southOfHousePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = pixelBackdrop(p, pw, ph, t, 0.2);
    housePixel(p, pw, ph, horizon, t, 0.5, { face: "end", moonF: 0.2 }); // south gable end: no door, boarded
    fgTreePixel(p, pw, ph, t);
    rainPixel(p, pw, ph, t);
  });
}

export function behindHousePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = pixelBackdrop(p, pw, ph, t, 0.22);
    pixelPath(p, pw, ph, horizon, "east"); // a path leads east into the forest
    housePixel(p, pw, ph, horizon, t, 0.38, { ajar: true, face: "back", moonF: 0.22 }); // back façade: the small corner window, slightly ajar
    fgTreePixel(p, pw, ph, t);
    rainPixel(p, pw, ph, t);
  });
}

export function forest1Pixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = forestBackdrop(p, pw, ph, t, "east"); // sunlight to the east — the way out
    fireflies(p, pw, ph, horizon, t);
    for (let i = 0; i < 5; i++) pixelTree(p, pw * (0.1 + i * 0.16), horizon + 4, ph * (0.3 + hash(i, 21) * 0.1), pw * 0.05, t, true);
    pixelTree(p, pw * 0.3, ph - 2, ph * 0.8, pw * 0.09, t, false);
    pixelTree(p, pw * 0.12, ph + 8, ph * 1.0, pw * 0.12, t, false); // near framing tree, off-centre
    // motes drifting in the eastern light shaft
    p.fillStyle = "#d8c48a";
    for (let i = 0; i < 10; i++) { const mx = pw * 0.72 + hash(i, 3) * pw * 0.26; const my = ph * 0.25 + ((t * 4 + i * 30) % (ph * 0.5)); if (hash(i, 4) > 0.4) p.fillRect(Math.round(mx), Math.round(my), 1, 1); }
  });
}

export function pathPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = forestBackdrop(p, pw, ph, t, "soft");
    // the dirt path, winding north into the trees
    const dirt = ["#4a3f28", "#3a3120", "#2a2416"];
    for (let y = horizon - 2; y < ph; y++) {
      const f = (y - horizon + 2) / (ph - horizon + 2);
      const half = 1.5 + f * f * pw * 0.13; // perspective widening
      const cxp = pw * 0.5 + Math.sin(f * 2.6 + 0.4) * pw * 0.07; // the wind in the path
      for (let x = Math.floor(cxp - half); x <= cxp + half; x++) {
        const ex = Math.abs(x - cxp) / half;
        if (ex > 0.82 && hash(x, y) > 0.5) continue; // ragged grass edge
        const k = hash(x >> 1, y);
        p.fillStyle = dirt[k > 0.72 ? 0 : k > 0.3 ? 1 : 2];
        p.fillRect(x, y, 1, 1);
      }
      if (f > 0.25 && (y & 3) === 1) { p.fillStyle = "#241f12"; p.fillRect(Math.round(cxp - half * 0.3), y, 2, 1); p.fillRect(Math.round(cxp + half * 0.25), y, 2, 1); } // wheel-worn ruts
    }
    for (let i = 0; i < 4; i++) pixelTree(p, pw * (0.06 + i * 0.09), horizon + 5, ph * 0.36, pw * 0.05, t, true);
    for (let i = 0; i < 3; i++) pixelTree(p, pw * (0.62 + i * 0.09), horizon + 5, ph * 0.36, pw * 0.05, t, true);
    // the one large climbable tree at the path's edge, low branches within reach
    const bigX = pw * 0.82;
    pixelTree(p, bigX, ph + 12, ph * 1.1, pw * 0.15, t, false);
    p.fillStyle = "#0c1409";
    for (let b = 0; b < 3; b++) { // low limbs, tapering as they reach over the path
      const by = ph * (0.4 + b * 0.14), sw2 = Math.sin(t * 0.5 + b) * 1;
      for (let k = 0; k < 24 - b * 4; k++) { const tk = k < 6 ? 3 : k < 14 ? 2 : 1; p.fillRect(Math.round(bigX - 4 - k), Math.round(by - k * 0.3 + sw2), 2, tk); }
    }
    pixelTree(p, pw * 0.07, ph + 6, ph * 0.85, pw * 0.09, t, false);
  });
}

export function upATreePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    // ten feet up: night sky above, a rolling canopy sea below
    const img = p.createImageData(pw, ph), d = img.data;
    const SKY: number[][] = [[10, 14, 28], [21, 29, 48]];
    const CAN: number[][] = [[9, 15, 11], [14, 22, 15], [20, 31, 19]];
    const sea = (x: number) => Math.round(ph * (0.3 + hash(x >> 4, 3) * 0.12 + hash(x >> 6, 13) * 0.08));
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const th = dth(x, y), sy2 = sea(x);
      let c: number[];
      if (y < sy2 - 2 + Math.round((th - 0.5) * 4)) c = SKY[(1 - y / Math.max(1, sy2)) * 1.3 > th ? 0 : 1];
      else {
        const k = hash(x >> 2, y >> 2);
        let i = k > 0.8 ? 2 : k > 0.36 ? 1 : 0;
        if (y - sy2 < 5 && k > 0.55) i = 2; // moonlit crowns
        if (y > ph * 0.8 && th > 0.4) i = Math.max(0, i - 1); // deep shade far below
        c = CAN[i];
      }
      sp(d, pw, x, y, c);
    }
    p.putImageData(img, 0, 0);
    // the moon, low over the treetops (glow first, disc on top)
    ditherGlow(p, pw * 0.84, ph * 0.11, 14, 10, "#39435f", 0.5);
    p.fillStyle = "#dbe4f2"; fillDisc(p, Math.round(pw * 0.84), Math.round(ph * 0.11), 5);
    p.fillStyle = "#b8c4dc"; p.fillRect(Math.round(pw * 0.84) - 2, Math.round(ph * 0.11) + 2, 3, 2); // maria
    for (let i = 0; i < 8; i++) { // stars
      const sx = Math.round(hash(i, 41) * pw), sy3 = Math.round(hash(i, 43) * ph * 0.16);
      if (sy3 < sea(sx) - 4 && Math.abs(Math.sin(t * 1.5 + i * 2.7)) > 0.4) { p.fillStyle = "#c8d2e8"; p.fillRect(sx, sy3, 1, 1); }
    }
    // the trunk you're perched against, rising out of frame
    const tkx = Math.round(pw * 0.66);
    for (let y = 0; y < ph; y++) {
      const wob = Math.round(Math.sin(y * 0.05) * 2), tk = 11;
      p.fillStyle = "#14100a"; p.fillRect(tkx + wob, y, tk, 1);
      p.fillStyle = "#241c10"; p.fillRect(tkx + wob + 2, y, 3, 1);
      p.fillStyle = "#0a0805"; p.fillRect(tkx + wob, y, 2, 1);
      p.fillStyle = "#32281a"; p.fillRect(tkx + wob + tk - 1, y, 1, 1); // moonlit edge
      if ((y & 6) === 2 && hash(3, y) > 0.55) { p.fillStyle = "#0a0805"; p.fillRect(tkx + wob + 3, y, 4, 1); } // bark scores
    }
    // leaf clusters crowding the frame edges (you are IN the tree)
    pixelCanopy(p, pw * 0.08, ph * 0.14, pw * 0.2, ph * 0.18, ["#26381e", "#1a2c14", "#101f0d"]);
    pixelCanopy(p, pw * 0.94, ph * 0.3, pw * 0.18, ph * 0.2, ["#26381e", "#1a2c14", "#101f0d"]);
    pixelCanopy(p, pw * 0.3, ph * 0.96, pw * 0.3, ph * 0.15, ["#1a2c14", "#122210", "#0a180b"]);
    // the big branch you're nestled on (across the lower third) + a limb above
    const drawLimb = (x0: number, y0: number, x1: number, y1: number, th0: number) => {
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= steps; s++) { const f = s / steps; const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f, tk = th0 * (1 - f * 0.5); p.fillStyle = "#3a2a1a"; fillDisc(p, Math.round(x), Math.round(y), Math.round(tk)); p.fillStyle = "#241a10"; p.fillRect(Math.round(x), Math.round(y - tk), 1, 1); }
    };
    drawLimb(-4, ph * 0.7, pw * 1.04, ph * 0.62, 5);
    drawLimb(pw * 0.4, ph * 0.62, pw * 1.05, ph * 0.2, 3); // a limb rising out of reach
    // the bird's nest on the branch, with the jewel-encrusted egg (a real item here)
    const nx = Math.round(pw * 0.64), ny = Math.round(ph * 0.6);
    p.fillStyle = "#4a3a22"; fillDisc(p, nx, ny, 9); p.fillStyle = "#2c2113"; fillDisc(p, nx, ny - 1, 6); // woven nest
    for (let a = 0; a < 14; a++) { const ang = a / 14 * Math.PI * 2; p.fillStyle = "#5a4626"; p.fillRect(nx + Math.round(Math.cos(ang) * 9), ny + Math.round(Math.sin(ang) * 5), 1, 1); }
    if (hasObj("UP-A-TREE", "EGG")) {
      // egg: golden ovoid with a jewel glint (reflective sheen, NOT a light source)
      p.fillStyle = "#c9a23a"; for (let yy = -4; yy <= 4; yy++) { const xw = Math.floor(Math.sqrt(1 - (yy / 4.5) ** 2) * 3.4); p.fillRect(nx - xw, ny - 2 + yy, xw * 2 + 1, 1); }
      p.fillStyle = "#f0d878"; p.fillRect(nx - 1, ny - 4, 2, 2); // highlight
      if (Math.sin(t * 2) > 0.6) { p.fillStyle = "#fff4c0"; p.fillRect(nx - 1, ny - 4, 1, 1); } // glint
      p.fillStyle = "#8a6a22"; p.fillRect(nx - 2, ny + 1, 4, 1); // shadow band
    } // taken → the nest sits empty
  });
}

export function onRainbowPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    canyonBackdrop(p, pw, ph, true);
    // a waterfall in the distance (Aragain Falls)
    waterfall(p, Math.round(pw * 0.7), Math.round(pw * 0.1), Math.round(ph * 0.18), Math.round(ph * 0.5), t);
    // the rainbow you stand upon — a broad band sweeping across, foreground as a road
    const solid = isRainbowSolid();
    const potKnown = solid && hasObjKnown("END-OF-RAINBOW", "POT-OF-GOLD");
    const potGy = Math.round(ph * 0.88);
    const cols = ["#d8504a", "#e0913a", "#e8d24a", "#5ab85a", "#4a8ad8", "#6a4ad8", "#a04ad8"];
    for (let b = 0; b < 7; b++) { p.fillStyle = cols[b]; for (let x = 0; x < pw; x++) { const y = Math.round(ph * 0.7 + b * 4 + Math.sin(x * 0.012) * ph * 0.06); for (let yy = y; yy < y + 4; yy++) if ((solid ? 1.01 : 0.85) > dth(x, yy)) p.fillRect(x, yy, 1, 1); } }
    if (solid) { p.fillStyle = "#fff6d8"; for (let x = 0; x < pw; x += 2) if (hash(x, 7) > 0.55) p.fillRect(x, Math.round(ph * 0.7 + Math.sin(x * 0.012) * ph * 0.06) - 1, 1, 1); } // the walkable edge, hard and glinting
    ditherGlow(p, pw * 0.5, ph * 0.78, pw * 0.5, ph * 0.12, "#fff0c0", 0.25); // luminous sheen
  });
}

// ---- batch 3: river & canyon vistas ----
export function aragainFallsPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    canyonBackdrop(p, pw, ph, false, false);
    const brinkY = Math.round(ph * 0.48);
    waterFill(p, pw, Math.round(ph * 0.36), brinkY, t, "#3a6c8e", "#244e6e"); // the river sliding to the brink
    // the brink itself: a churning bright lip across the full width
    for (let x = 0; x < pw; x++) {
      const yy = brinkY + Math.round(Math.sin(x * 0.3 + t * 6) * 1);
      p.fillStyle = "#eef5fb"; if (hash(x, Math.floor(t * 5)) > 0.3) p.fillRect(x, yy, 1, 2);
      p.fillStyle = "#bcd8ea"; p.fillRect(x, yy + 2, 1, 1);
    }
    waterfall(p, 0, pw, brinkY + 2, Math.round(ph * 0.9), t); // the great plunge, wall to wall
    // the mist bank boiling at the foot — two dithered layers, drifting
    for (let x = 0; x < pw; x++) for (let y = Math.round(ph * 0.8); y < ph; y++) {
      const f = (y - ph * 0.8) / (ph * 0.2), drift = Math.sin(x * 0.05 + t * 0.8) * 2;
      if ((0.3 + f * 0.45) > dth(x + Math.round(drift), y)) { p.fillStyle = f > 0.5 ? "#eaf2f8" : "#b8ccdc"; p.fillRect(x, y, 1, 1); }
    }
    rainbowArc(p, pw, ph, isRainbowSolid(), t); // the famous rainbow, spanning the falls
    void t;
  });
}

export function endOfRainbowPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    // "You are on a small, rocky beach on the continuation of the Frigid River
    // past the Falls. The beach is narrow due to the presence of the White
    // Cliffs. The river canyon opens here and sunlight shines in from above.
    // A rainbow crosses over the falls to the east and a narrow path continues
    // to the southwest."  Every element below is that sentence, in order.
    const poolY = Math.round(ph * 0.72), beachY = Math.round(ph * 0.86);
    // the canyon opens overhead: daylight sky, brightening toward the rim
    const sky = ["#dceefa", "#b6d8ee", "#93bede", "#7aa8cc"];
    for (let y = 0; y < poolY; y++) { const f = y / poolY;
      for (let x = 0; x < pw; x++) { const idx = Math.max(0, Math.min(3, Math.floor(f * 4 + (dth(x, y) - 0.5) * 0.7))); p.fillStyle = sky[idx]; p.fillRect(x, y, 1, 1); } }
    // downstream haze: the canyon walls falling away to the southwest
    p.fillStyle = "#8fa8bc"; for (let x = 0; x < pw; x++) { const hgt = Math.round(ph * 0.16 + Math.sin(x * 0.03 + 2) * 4 + hash(x >> 2, 11) * 4); p.fillRect(x, poolY - hgt, 1, hgt); }
    p.fillStyle = "#7492a8"; for (let x = 0; x < pw; x++) { const hgt = Math.round(ph * 0.09 + Math.sin(x * 0.05) * 3 + hash(x >> 2, 12) * 3); p.fillRect(x, poolY - hgt, 1, hgt); }
    // sunlight shining in from above: a dithered shaft slanting onto the water
    for (let y = 0; y < beachY; y++) { const cx = pw * 0.30 + y * 0.10, hw = 12 + y * 0.30;
      for (let x = Math.round(cx - hw); x < cx + hw; x++) { const sfr = Math.max(0, 1 - Math.abs(x - cx) / hw) * 0.30; if (sfr > dth(x, y)) { p.fillStyle = "#f2f9fd"; p.fillRect(x, y, 1, 1); } } }
    // the east canyon wall, in its own shade, the falls cut into it
    const nx0 = Math.round(pw * 0.66), nx1 = Math.round(pw * 0.86);
    const eEdge = (y: number) => Math.round(pw * 0.55 + (Math.sin(y * 0.15) * 2 + (hash(9, y >> 1) - 0.5) * 4) * (0.25 + 0.75 * y / poolY));
    for (let y = 0; y < poolY; y++) { const e = eEdge(y);
      for (let x = e; x < pw; x++) { const depth = y / poolY, n = hash(x, y), tex = 0.3 + 0.7 * depth;
        const v = 44 + depth * 26; let cr = v, cg = v * 0.86, cb = v * 0.74;
        if (n > 0.84) { cr += 18 * tex; cg += 15 * tex; cb += 12 * tex; } else if (n < 0.14) { cr -= 12 * tex; cg -= 10 * tex; cb -= 8 * tex; }
        p.fillStyle = `rgb(${Math.round(cr)},${Math.round(cg)},${Math.round(cb)})`; p.fillRect(x, y, 1, 1); }
      p.fillStyle = "#8a7a62"; p.fillRect(e, y, 1, 1); // sun grazing its edge
    }
    p.fillStyle = "#0c0a08"; p.fillRect(nx0 - 2, 0, 2, poolY); p.fillRect(nx1, 0, 2, poolY); // the falls' shadowed flanks
    waterfall(p, nx0, nx1 - nx0, 0, poolY + 2, t); // the Falls, brink out of sight overhead
    // the White Cliffs hemming the beach in from the west
    const wEdge = (y: number) => Math.round(pw * 0.12 + Math.sin(y * 0.09) * 3 + (hash(4, y >> 1) - 0.5) * 4);
    for (let y = 0; y < beachY; y++) { const e = wEdge(y);
      for (let x = 0; x < e; x++) { const k = hash(x >> 1, y >> 2), lit = 1 - (y / beachY) * 0.30;
        const base = k > 0.74 ? [207, 201, 189] : k < 0.16 ? [160, 154, 142] : [187, 180, 166];
        p.fillStyle = `rgb(${Math.round(base[0] * lit)},${Math.round(base[1] * lit)},${Math.round(base[2] * lit)})`; p.fillRect(x, y, 1, 1);
        if ((y % 11) === 5 && hash(x >> 3, y) > 0.6) { p.fillStyle = "#948e82"; p.fillRect(x, y, 1, 1); } }
      p.fillStyle = "#e6e0d2"; p.fillRect(e - 1, y, 1, 1); // its sunlit east face
    }
    // the Frigid River, continuing past the Falls
    for (let y = poolY; y < beachY; y++) for (let x = 0; x < pw; x++) { p.fillStyle = (0.5 + 0.1 * Math.sin(y * 0.9)) > dth(x, y) ? "#3a7c9e" : "#2a5878"; p.fillRect(x, y, 1, 1); }
    waterFill(p, pw, poolY, beachY, t, "#3a7c9e", "#2a5878");
    for (let x = nx0 - 5; x < nx1 + 5; x++) { const yy = poolY + 1 + ((x + Math.floor(t * 6)) % 3); p.fillStyle = hash(x, Math.floor(t * 4)) > 0.4 ? "#eef7fc" : "#cfe4ee"; p.fillRect(x, yy, 1, 1); } // churn at the plunge
    for (let i = 0; i < 16; i++) { const x = Math.round(pw * 0.16 + hash(i, 15) * pw * 0.45), y = poolY + 1 + Math.round(hash(i, 16) * (beachY - poolY - 2)); if (Math.sin(t * 4 + i * 2.2) > 0.45) { p.fillStyle = "#ffffff"; p.fillRect(x, y, 1, 1); } } // sun glitter on the water
    for (let i = 0; i < 24; i++) { // mist rising where the falls land
      const mx = nx0 - 5 + Math.round(hash(i, 5) * (nx1 - nx0 + 10) + Math.sin(t * 0.9 + i) * 3);
      const my = poolY - 1 - Math.round(((hash(i, 6) * 12 + t * 5 + i) % 12));
      if (hash(i, Math.floor(t * 2)) > 0.35) { p.fillStyle = my < poolY - 7 ? "#cddbe6" : "#e8f1f7"; p.fillRect(mx, my, 1, 1); }
    }
    // the small rocky beach, in the sun
    for (let y = beachY; y < ph; y++) for (let x = 0; x < pw; x++) {
      const k = hash(x, y); p.fillStyle = k > 0.8 ? "#8a7d68" : k > 0.35 ? "#6a5f4e" : "#55493c"; p.fillRect(x, y, 1, 1); }
    for (let i = 0; i < 22; i++) { const x = Math.round(hash(i, 21) * pw), y = beachY + 1 + Math.round(hash(i, 22) * (ph - beachY - 2)); p.fillStyle = "#9a8c74"; p.fillRect(x, y, 2, 1); p.fillStyle = "#b0a288"; p.fillRect(x, y - 1, 1, 1); }
    // the narrow path, continuing southwest out of frame
    for (let i = 0; i < 40; i++) { const f = i / 40; const px = Math.round(pw * 0.34 * (1 - f) - 2 + Math.sin(f * 5) * 2), py = beachY + 2 + Math.round(f * (ph - beachY - 4)); if (px >= 0) { p.fillStyle = hash(i, 27) > 0.5 ? "#a89878" : "#8f8064"; p.fillRect(px, py, 2, 1); } }
    for (let x = 0; x < pw; x++) if (hash(x, Math.floor(t * 3)) > 0.82) { p.fillStyle = "#d8e8f0"; p.fillRect(x, beachY, 1, 1); } // water lapping the shore
    const solid = isRainbowSolid();
    const potKnown = solid && hasObjKnown("END-OF-RAINBOW", "POT-OF-GOLD");
    const gx = Math.round(pw * 0.24), gy = ph - 9;
    // the rainbow: one end on this beach, crossing over the falls to the east
    { const Fx = pw * 0.24, Fy = ph * 0.97, Tx = pw + 4, Ty = ph * 0.10;
      const acy = ph * 1.5;
      const acx = (Tx * Tx + Ty * Ty - Fx * Fx - Fy * Fy + 2 * acy * (Fy - Ty)) / (2 * (Tx - Fx));
      const R = Math.hypot(acx - Tx, acy - Ty);
      let a0 = Math.atan2(Fy - acy, Fx - acx); if (a0 < 0) a0 += Math.PI * 2;
      let a1 = Math.atan2(Ty - acy, Tx - acx); while (a1 <= a0) a1 += Math.PI * 2;
      const cols = ["#c9524c", "#d3893f", "#d9c352", "#5fae5f", "#4f84c4", "#655bc4", "#9155b8"];
      const W = 14;
      for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
        const dx = x - acx, dy = y - acy, d = Math.hypot(dx, dy);
        const off = R - d; if (off < 0 || off >= W) continue;
        let a = Math.atan2(dy, dx); if (a < 0) a += Math.PI * 2;
        if (a < a0 - 0.01 || a > a1) continue;
        if (potKnown && y > gy - 8 && x < pw * 0.34) continue; // it ends IN the pot
        const bandF = off / 2, b = Math.min(6, Math.floor(bandF)), frac = bandF - b;
        const bi = frac > 0.5 + (dth(x, y) - 0.5) * 0.9 && b < 6 ? b + 1 : b;
        const edge = Math.min(1, Math.min(off + 0.5, W - off) / 2.5);
        const wave = solid ? 1 : 0.78 + 0.22 * Math.sin(a * 22 - t * 3 + off * 0.35);
        const vis = edge * wave * (solid ? 1.5 : 1.1);
        if (vis > dth(x + (solid ? 0 : Math.floor(t * 2)), y)) { p.fillStyle = cols[bi]; p.fillRect(x, y, 1, 1); }
      }
      if (solid) { p.fillStyle = "#fff6d8"; const r = R + 1; // glinting outer edge — solid enough to walk
        for (let a = a0; a < a1; a += 0.008) { const x = Math.round(acx + Math.cos(a) * r), y = Math.round(acy + Math.sin(a) * r); if (y >= 0 && y < ph && x >= 0 && x < pw && hash(x, 3) > 0.5) p.fillRect(x, y, 1, 1); } }
      else { p.fillStyle = "#ffffff"; // glints winking along the bow
        for (let i = 0; i < 12; i++) { const a = a0 + hash(i, 31) * (a1 - a0), r = R - 2 - hash(i, 32) * (W - 4); const x = Math.round(acx + Math.cos(a) * r), y = Math.round(acy + Math.sin(a) * r); if (y >= 0 && y < ph && x >= 0 && x < pw && Math.sin(t * 3 + i * 1.7) > 0.45) p.fillRect(x, y, 1, 1); } }
    }
    if (potKnown) { // the pot of gold, right where the rainbow comes down
      for (let yy = gy + 4; yy < gy + 7; yy++) for (let xx = gx - 9; xx < gx + 10; xx++) { const ex = (xx - gx) / 9, ey = (yy - gy - 5) / 1.6; if (ex * ex + ey * ey < 1 && dth(xx, yy) < 0.6) { p.fillStyle = "#3a3226"; p.fillRect(xx, yy, 1, 1); } }
      const rows = [5, 7, 8, 8, 8, 7, 5];
      for (let yy = 0; yy < rows.length; yy++) { p.fillStyle = "#1c2126"; p.fillRect(gx - rows[yy], gy - 2 + yy, rows[yy] * 2 + 1, 1); }
      p.fillStyle = "#3a4854"; for (let yy = 1; yy < 6; yy++) p.fillRect(gx - rows[yy] + 1, gy - 2 + yy, 2, 1);
      p.fillStyle = "#48525c"; p.fillRect(gx - 6, gy - 3, 13, 1);
      p.fillStyle = "#14171a"; p.fillRect(gx - 6, gy + 5, 2, 2); p.fillRect(gx + 5, gy + 5, 2, 2);
      p.fillStyle = "#c89a2e"; p.fillRect(gx - 5, gy - 5, 11, 2); p.fillStyle = "#e8c24a"; p.fillRect(gx - 4, gy - 6, 9, 1); p.fillRect(gx - 2, gy - 7, 5, 1);
      p.fillStyle = "#8a6a1e"; p.fillRect(gx - 2, gy - 4, 1, 1); p.fillRect(gx + 2, gy - 5, 1, 1);
      p.fillStyle = "#fff0b0"; p.fillRect(gx, gy - 7, 1, 1); p.fillRect(gx + 3, gy - 6, 1, 1);
      treasureGlint(p, gx, gy - 10, t, "#ffe9a0");
    }
  });
}

export function canyonViewPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    canyonBackdrop(p, pw, ph, false, false);
    // deep canyon: extra descending wall layers + a far river ribbon way down
    const ridge = (baseY: number, amp: number, seed: number, col: string) => { p.fillStyle = col; for (let x = 0; x < pw; x++) { const crest = Math.round(baseY - (Math.sin(x * 0.02 + seed) + 0.5 * Math.sin(x * 0.007 + seed)) * amp - amp * 0.2); p.fillRect(x, crest, 1, ph - crest); } };
    ridge(ph * 0.62, ph * 0.06, 1.2, "#3a4660"); ridge(ph * 0.74, ph * 0.06, 3.0, "#2a3346");
    waterFill(p, pw, Math.round(ph * 0.66), Math.round(ph * 0.72), t, "#3a6c8e", "#244e6e"); // Frigid River far below
    // the upstream canyon shelf the falls pour OVER — grounds the falls in rock
    const rimY = Math.round(ph * 0.33), fx0 = Math.round(pw * 0.43), fw = Math.round(pw * 0.055);
    for (let x = 0; x < pw; x++) {
      const yy = rimY + Math.round(Math.sin(x * 0.07) * 1.5 + hash(x >> 2, 61) * 2 - Math.abs(x - pw * 0.46) * 0.04);
      const hgt2 = Math.max(8, Math.round(ph * 0.3 - Math.abs(x - pw * 0.46) * 0.06));
      for (let y2 = yy; y2 < yy + hgt2 && y2 < ph; y2++) { // textured rock face, darker as it drops
        const k = hash(x >> 2, y2 >> 2), fy2 = (y2 - yy) / hgt2;
        p.fillStyle = k > 0.78 && fy2 < 0.5 ? "#303a52" : k < 0.2 || fy2 > 0.7 ? "#1c2334" : "#242c40";
        p.fillRect(x, y2, 1, 1);
      }
      p.fillStyle = "#3e4a66"; p.fillRect(x, yy, 1, 2); // moonlit shelf edge
      if ((x % 11) === 4) { p.fillStyle = "#1a2130"; p.fillRect(x, yy + 3, 1, Math.min(9, hgt2 - 3)); } // vertical fissures
    }
    p.fillStyle = "#7ec2de"; for (let x = fx0 - 3; x < fx0 + fw + 3; x += 2) p.fillRect(x, rimY - 1 + Math.round(hash(x, 63) * 2), 2, 2); // the river glinting at the notch
    waterfall(p, fx0, fw, rimY + 1, Math.round(ph * 0.62), t); // Aragain Falls, two miles upstream
    ditherGlow(p, pw * 0.46, ph * 0.48, pw * 0.06, ph * 0.16, "#6a7290", 0.3); // distance haze over the falls
    p.fillStyle = "#1a3a1a"; for (let i = 0; i < 5; i++) pixelCanopy(p, pw * (0.05 + i * 0.06), ph * 0.5, pw * 0.05, ph * 0.04, ["#1c3016", "#142510"]); // distant forest SW
    // the towering canyon walls beside you, framing the vista
    for (let y = 0; y < ph; y++) {
      const lw = Math.round(pw * 0.1 * (1 - y / ph) + 4 + Math.abs(Math.sin(y * 0.09)) * 5 + (hash(3, y >> 2) - 0.5) * 4);
      p.fillStyle = "#151824"; p.fillRect(0, y, lw, 1);
      p.fillStyle = "#2c3448"; p.fillRect(lw - 1, y, 1, 1); // rock edge catches dusk
      const rw = Math.round(pw * 0.12 * (1 - y / ph) + 5 + Math.abs(Math.sin(y * 0.07 + 2)) * 6 + (hash(4, y >> 2) - 0.5) * 4);
      p.fillStyle = "#12151f"; p.fillRect(pw - rw, y, rw, 1);
      p.fillStyle = "#272e42"; p.fillRect(pw - rw, y, 1, 1);
    }
    p.fillStyle = "#161210"; for (let x = 0; x < pw; x++) { const yy = ph - Math.round(ph * 0.08 + Math.abs(Math.sin(x * 0.05)) * ph * 0.03); p.fillRect(x, yy, 1, ph - yy); } // the rim you stand on
  });
}

export function canyonBottomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    canyonBackdrop(p, pw, ph, false, false);
    // beneath the canyon walls: rock towers over you on both sides, sky far above
    const wall = (side: 1 | -1, wTop: number, seed: number) => {
      for (let y = 0; y < ph; y++) {
        const wd2 = Math.round(wTop * (1 - y / ph * 0.5) + Math.abs(Math.sin(y * 0.05 + seed)) * 6 + (hash(seed, y >> 2) - 0.5) * 5);
        const x0 = side === 1 ? 0 : pw - wd2;
        for (let x = x0; x < x0 + wd2; x++) {
          const k = hash(x >> 2, y >> 2);
          p.fillStyle = k > 0.78 ? "#3e3830" : k < 0.2 ? "#1e1a16" : "#2c2620";
          p.fillRect(x, y, 1, 1);
        }
        p.fillStyle = "#4c453a"; p.fillRect(side === 1 ? wd2 - 1 : pw - wd2, y, 1, 1); // dusk-caught edge
      }
    };
    // the runoff of Aragain Falls flowing by, at the foot of the gorge
    waterFill(p, pw, Math.round(ph * 0.84), ph, t, "#356a8c", "#234e6c");
    // rocky bank between you and the water, with the narrow path receding north
    for (let y = Math.round(ph * 0.7); y < ph * 0.86; y++) for (let x = 0; x < pw; x++) {
      const k = hash(x >> 1, y >> 1); p.fillStyle = k > 0.78 ? "#453a2c" : k > 0.3 ? "#362d20" : "#282116"; p.fillRect(x, y, 1, 1);
    }
    const dirt = ["#4a3f28", "#3a3120", "#2a2416"];
    for (let y = Math.round(ph * 0.7); y < ph * 0.86; y++) { const f = (y - ph * 0.7) / (ph * 0.16), half = 1.5 + f * 6, cxp = pw * 0.5 + Math.sin(f * 2) * 4; for (let x = Math.round(cxp - half); x <= cxp + half; x++) { const k = hash(x, y); p.fillStyle = dirt[k > 0.7 ? 0 : k > 0.3 ? 1 : 2]; p.fillRect(x, y, 1, 1); } } // the path, narrowing away to the north
    wall(1, Math.round(pw * 0.3), 3); wall(-1, Math.round(pw * 0.34), 7); // the walls tower in front of everything
  });
}

// -- forest --
export function forestDimPixel(seed: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = forestBackdrop(p, pw, ph, t, "none");
    fireflies(p, pw, ph, horizon, t + seed * 3);
    for (let i = 0; i < 7; i++) pixelTree(p, pw * (0.04 + i * 0.07 + hash(seed, i) * 0.03), horizon + 6, ph * (0.34 + hash(seed + 1, i) * 0.1), pw * 0.055, t, true);
    if (seed === 2) { // a mossy split boulder marks this stretch of forest
      const bx = Math.round(pw * 0.6), by = ph - Math.round(ph * 0.1);
      for (let yy = 0; yy < 13; yy++) { const wd = Math.round(14 * Math.sqrt(1 - (yy / 13) * (yy / 13))) + Math.round((hash(seed, yy) - 0.5) * 3); for (let x = bx - wd; x <= bx + wd; x++) { const k = hash(x >> 1, yy >> 1); p.fillStyle = k > 0.72 ? "#2e3830" : k < 0.2 ? "#0c100d" : "#1d2620"; p.fillRect(x, by - yy, 1, 1); } }
      p.fillStyle = "#060a07"; for (let yy = 0; yy < 11; yy++) p.fillRect(bx + 1 + ((yy >> 2) % 2), by - yy - 1, 1, 1); // the split down its face
      p.fillStyle = "#39543c"; for (let i = 0; i < 9; i++) p.fillRect(bx - 12 + Math.round(hash(i, 7) * 22), by - 11 + Math.round(hash(i, 8) * 4), 2, 1); // moon-caught moss cap
    } else { // a great fallen trunk rots across this one
      const ly = ph - Math.round(ph * 0.08);
      for (let x = Math.round(pw * 0.3); x < pw * 0.94; x++) {
        const yc = ly - Math.round(Math.sin((x - pw * 0.3) * 0.012) * 5);
        p.fillStyle = "#04070a"; p.fillRect(x, yc + 4, 1, 3); // ground shadow
        const k = hash(x >> 2, 3); p.fillStyle = k > 0.6 ? "#1a1512" : "#120e0b"; p.fillRect(x, yc, 1, 5); // bark
        p.fillStyle = "#25301f"; if (hash(x >> 1, 5) > 0.6) p.fillRect(x, yc - 1, 1, 1); // moss along its top
      }
      p.fillStyle = "#2a221a"; for (let r = 0; r < 4; r++) p.fillRect(Math.round(pw * 0.3) - 2, ly - 4 + r * 3, 2, 2); // the torn root end
      p.fillStyle = "#0d1410"; for (const bx2 of [0.45, 0.62, 0.8]) p.fillRect(Math.round(pw * bx2), ly - 6, 2, 6); // snapped branch stubs
    }
    pixelTree(p, pw * (0.1 + hash(seed, 9) * 0.05), ph + 6, ph * 0.92, pw * 0.1, t, false);
    pixelTree(p, pw * (0.86 - hash(seed, 8) * 0.05), ph + 10, ph * 1.0, pw * 0.11, t, false);
  });
}

export function mountainsPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = forestBackdrop(p, pw, ph, t, "none");
    // impassable range: jagged piecewise peaks, two depth layers
    const range = (amp: number, seed: number, col: string, snow: boolean) => {
      const seg = 22, pts: number[] = [];
      for (let i = 0; i <= Math.ceil(pw / seg) + 1; i++) pts.push(horizon - amp * (0.35 + hash(i, seed) * 0.65 + (i % 2) * 0.25));
      for (let x = 0; x < pw; x++) {
        const i = Math.floor(x / seg), f = (x % seg) / seg;
        const y = Math.round(pts[i] + (pts[i + 1] - pts[i]) * f);
        p.fillStyle = col; p.fillRect(x, y, 1, horizon - y + 2);
        if (snow && y < horizon - amp * 0.62) { // snow clings near the summits, moonlit
          p.fillStyle = "#a8b8cc"; p.fillRect(x, y, 1, 2);
          if (hash(x, seed + 1) > 0.62) { p.fillStyle = "#8194ac"; p.fillRect(x, y + 2, 1, 2); }
        }
        if (!snow && (x % 9) === seed % 9 && y < horizon - 4) { p.fillStyle = "#171a22"; p.fillRect(x, y + 2, 1, Math.min(6, horizon - y)); } // gullies
      }
    };
    range(ph * 0.44, 5, "#2e3444", true); // far ridge, snow-capped
    range(ph * 0.24, 9, "#1e222c", false); // near ridge, dark
    for (let i = 0; i < 5; i++) pixelTree(p, pw * (0.06 + i * 0.09), horizon + 6, ph * 0.34, pw * 0.05, t, true);
    pixelTree(p, pw * 0.12, ph + 6, ph * 0.9, pw * 0.1, t, false);
  });
}

export function clearingPixel(grating: boolean) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = forestBackdrop(p, pw, ph, t, "soft");
    fireflies(p, pw, ph, horizon, t + (grating ? 5 : 0), 2);
    // the open clearing floor: a moonlit grass oval breaking the undergrowth
    const ccx = pw * 0.5, ccy = horizon + (ph - horizon) * 0.5, crx = pw * 0.34, cry = (ph - horizon) * 0.52;
    for (let y = horizon; y < ph; y++) for (let x = 0; x < pw; x++) {
      const dd = Math.sqrt(((x - ccx) / crx) ** 2 + ((y - ccy) / cry) ** 2);
      if (dd > 1) continue;
      if ((1 - dd) * 1.4 < dth(x, y) * 0.8) continue; // ragged grass rim
      const k = hash(x >> 1, y >> 1);
      p.fillStyle = k > 0.8 ? "#2c3a1c" : k > 0.35 ? "#222e17" : "#1a2412";
      p.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 4; i++) { pixelTree(p, pw * (0.05 + i * 0.055), horizon + 4, ph * 0.32, pw * 0.05, t, true); pixelTree(p, pw * (0.95 - i * 0.055), horizon + 4, ph * 0.32, pw * 0.05, t, true); } // ring of trees, open centre
    // the well-marked path crossing E-W
    const dirt = ["#4a3f28", "#3a3120", "#2a2416"];
    const pyc = horizon + Math.round((ph - horizon) * 0.55);
    for (let x = 0; x < pw; x++) {
      const yy = pyc + Math.round(Math.sin(x * 0.03) * 2);
      for (let y = yy - 3; y < yy + 4; y++) {
        if (Math.abs(y - yy) > 2 && hash(x, y) > 0.5) continue;
        const k = hash(x >> 1, y); p.fillStyle = dirt[k > 0.7 ? 0 : k > 0.3 ? 1 : 2]; p.fillRect(x, y, 1, 1);
      }
    }
    // fireflies drifting over the clearing
    for (let i = 0; i < 4; i++) {
      const fx = ccx + Math.sin(t * 0.5 + i * 2.4) * crx * 0.7, fy = ccy - 6 + Math.sin(t * 0.8 + i * 1.7) * cry * 0.5;
      if (Math.abs(Math.sin(t * 1.9 + i * 2.1)) > 0.55) { p.fillStyle = "#c8d86a"; p.fillRect(Math.round(fx), Math.round(fy), 1, 1); }
    }
    if (grating) {
      const gx = Math.round(pw * 0.5), gy = pyc + Math.round((ph - horizon) * 0.16);
      const moved = rf("GRATING-CLEARING", "leavesMoved");
      if (moved) {
        // the iron grating, set flush into the ground (an ellipse in perspective)
        const grx = 13, gry2 = 6;
        p.fillStyle = "#08080a"; for (let yy = -gry2; yy <= gry2; yy++) { const xw = Math.floor(Math.sqrt(Math.max(0, 1 - (yy / gry2) ** 2)) * grx); p.fillRect(gx - xw, gy + yy, xw * 2 + 1, 1); } // dark below
        p.fillStyle = "#3c3c44"; for (let yy = -gry2; yy <= gry2; yy++) { const xw = Math.floor(Math.sqrt(Math.max(0, 1 - (yy / gry2) ** 2)) * grx); p.fillRect(gx - xw, gy + yy, 2, 1); p.fillRect(gx + xw - 1, gy + yy, 2, 1); } // iron rim
        p.fillStyle = "#4c4c56"; p.fillRect(gx - grx, gy - 1, grx * 2 + 1, 1); // lit rim top
        p.fillStyle = "#52525c"; for (let b = -2; b <= 2; b++) { const xw = Math.floor(Math.sqrt(Math.max(0, 1 - ((b * 2) / gry2) ** 2)) * (grx - 2)); p.fillRect(gx - xw, gy + b * 2, xw * 2, 1); } // cross bars
        for (let b = -2; b <= 2; b++) p.fillRect(gx + b * 5 - (b > 0 ? 1 : 0), gy - gry2 + 2, 1, gry2 * 2 - 3); // long bars
        p.fillStyle = "#6a6a74"; p.fillRect(gx - 1, gy - gry2, 2, 1); // hinge stud
        for (let i = 0; i < 26; i++) { // the pile raked aside — a crescent of dead leaves next to it
          const ang = -0.6 + (i / 26) * 2.4, rr = grx + 4 + hash(i, 3) * 5;
          p.fillStyle = ["#6a5a2a", "#4a3a1a", "#7a6a3a"][i % 3];
          p.fillRect(Math.round(gx + Math.cos(ang) * rr * 1.3), Math.round(gy + Math.sin(ang) * rr * 0.5 + 3), 2, 1);
        }
      } else { // the pile of leaves — the grating is completely hidden beneath it
        for (let yy = -6; yy <= 6; yy++) for (let xx = -16; xx <= 16; xx++) {
          const dd = Math.sqrt((xx / 17) ** 2 + (yy / 7.5) ** 2); if (dd > 1) continue;
          if ((1 - dd) * 1.7 < dth(gx + xx, gy + yy) * 0.85) continue;
          const k = hash(xx + 20, yy + 9);
          p.fillStyle = k > 0.66 ? "#7a6a3a" : k > 0.33 ? "#5a4a24" : "#3e3216";
          p.fillRect(gx + xx, gy + yy - 1, 1, 1);
        }
        p.fillStyle = "#8a7a46"; for (let i = 0; i < 7; i++) p.fillRect(gx - 11 + i * 4, gy - 6 + (i % 2), 2, 1); // top-lit leaves
        p.fillStyle = "#2a2210"; for (let i = 0; i < 5; i++) p.fillRect(gx - 8 + i * 5, gy + 4 - (i % 2), 2, 1); // shadowed underside
      }
    }
  });
}

export function stoneBarrowPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = forestBackdrop(p, pw, ph, t, "soft");
    // the massive stone barrow: a mound of laid stones, courses following the dome
    const bcx = pw * 0.5, bby = horizon + (ph - horizon) * 0.35, brx = pw * 0.36, bry = ph * 0.42;
    for (let y = Math.round(bby - bry); y <= bby; y++) {
      const fy = (bby - y) / bry, xw = Math.floor(Math.sqrt(Math.max(0, 1 - fy * fy)) * brx);
      for (let x = Math.round(bcx - xw); x <= bcx + xw; x++) {
        const course = y >> 2, blk = Math.floor((x + (course % 2) * 5) / 10);
        const k = hash(blk, course);
        // moon hits the crown; the flanks fall off dark
        const lit = fy > 0.55 ? 1 : 0;
        p.fillStyle = k > 0.7 ? (lit ? "#5c5850" : "#454138") : k > 0.3 ? (lit ? "#4e4a42" : "#3a362e") : (lit ? "#403c34" : "#302c26");
        p.fillRect(x, y, 1, 1);
        if ((y & 3) === 3) { p.fillStyle = "#242018"; p.fillRect(x, y, 1, 1); } // course seams
        else if ((x + (course % 2) * 5) % 10 === 9) { p.fillStyle = "#282420"; p.fillRect(x, y, 1, 1); } // head joints
      }
      p.fillStyle = "#6a665a"; p.fillRect(Math.round(bcx - xw), y, 1, 1); // moonlit west rim
      p.fillStyle = "#1c1914"; p.fillRect(Math.round(bcx + xw), y, 1, 1); // shadowed east rim
    }
    // grass creeping up the foot of the mound
    p.fillStyle = "#1c2814"; for (let x = Math.round(bcx - brx); x <= bcx + brx; x += 2) if (hash(x, 91) > 0.4) p.fillRect(x, bby - 1 - Math.round(hash(x, 92) * 3), 2, 2);
    // the portal: two megalith posts + a massive lintel, the tomb dark beyond
    const dx0 = Math.round(bcx - pw * 0.05), dw = Math.round(pw * 0.1), dy0 = Math.round(bby - ph * 0.24), dh = Math.round(ph * 0.24);
    p.fillStyle = "#050507"; p.fillRect(dx0, dy0, dw, dh); // you cannot see into the dark
    p.fillStyle = "#6e6a5e"; p.fillRect(dx0 - 4, dy0 - 2, 4, dh + 2); p.fillStyle = "#4a463c"; p.fillRect(dx0 - 2, dy0 - 2, 2, dh + 2); // west post (lit face + return)
    p.fillStyle = "#55514a"; p.fillRect(dx0 + dw, dy0 - 2, 4, dh + 2); p.fillStyle = "#38342c"; p.fillRect(dx0 + dw + 2, dy0 - 2, 2, dh + 2); // east post
    p.fillStyle = "#787468"; p.fillRect(dx0 - 6, dy0 - 6, dw + 12, 5); p.fillStyle = "#514d44"; p.fillRect(dx0 - 6, dy0 - 2, dw + 12, 1); // the great lintel
    p.fillStyle = "#8a867a"; p.fillRect(dx0 - 6, dy0 - 6, dw + 12, 1); // moon edge on the lintel
    // the huge stone door, swung open and leaning against the mound (east side)
    const sx0 = dx0 + dw + 5;
    for (let yy = 0; yy < dh + 4; yy++) {
      const lean = Math.round(yy * 0.22);
      p.fillStyle = "#5e5a50"; p.fillRect(sx0 + lean, dy0 - 4 + yy, 7, 1);
      p.fillStyle = "#767266"; p.fillRect(sx0 + lean, dy0 - 4 + yy, 2, 1); // lit edge
      p.fillStyle = "#3a362e"; p.fillRect(sx0 + lean + 6, dy0 - 4 + yy, 1, 1);
    }
    // its long shadow spilling toward the viewer
    p.fillStyle = "#10140c"; for (let yy = 0; yy < 5; yy++) p.fillRect(sx0 + 2 + yy, bby + yy, 12 - yy, 1);
    pixelTree(p, pw * 0.08, ph + 6, ph * 0.86, pw * 0.09, t, false); pixelTree(p, pw * 0.93, ph + 10, ph * 0.96, pw * 0.1, t, false);
  });
}

export function deepCanyonPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = litCave("dungeon", "", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    arches(p, pw, ph, floorY, rim, ["NW", "EAST", "SW"]);
    // you stand on the SOUTH RIM: the canyon falls away in shelves of rock,
    // down and down to a thread of white water you can only hear
    const rimY = floorY + 2;
    p.fillStyle = "#4c4336"; p.fillRect(0, rimY - 1, pw, 1); // your lamplit lip
    const bands: [number, string][] = [[0.12, "#211d18"], [0.3, "#161310"], [0.52, "#0d0b09"], [0.8, "#050505"]];
    let yTop = rimY;
    for (const [frac, col] of bands) {
      const yBot = rimY + Math.round((ph - rimY) * frac);
      for (let x = 0; x < pw; x++) { const wob = Math.round((hash(x >> 3, Math.round(yTop)) - 0.5) * 3); p.fillStyle = col; p.fillRect(x, yTop + wob, 1, yBot - yTop + 3); }
      p.fillStyle = "#2e2921"; for (let x = 0; x < pw; x += 2) if (hash(x, yBot) > 0.55) p.fillRect(x, yBot + Math.round((hash(x >> 3, yBot) - 0.5) * 3), 2, 1); // each shelf's faint edge
      yTop = yBot;
    }
    // the river, far below: a glinting thread through the black
    const ry2 = ph - 4;
    for (let x = 0; x < pw; x++) {
      const yy = ry2 + Math.round(Math.sin(x * 0.05) * 1.5);
      if (Math.sin(x * 0.3 + t * 3) > 0.2) { p.fillStyle = "#2c5878"; p.fillRect(x, yy, 1, 1); }
      if (Math.sin(x * 0.5 - t * 4) > 0.82) { p.fillStyle = "#7fa8c4"; p.fillRect(x, yy, 1, 1); } // white-water sparks
    }
    // the way down: steps cut into the rock, zig-zagging along the near wall
    let sx2 = Math.round(pw * 0.72), sy2 = rimY + 2, dir2 = -1;
    p.fillStyle = "#3a332a";
    for (let s = 0; s < 9; s++) {
      const wd2 = Math.max(4, 10 - s);
      p.fillStyle = `rgb(${58 - s * 5},${51 - s * 5},${42 - s * 4})`;
      p.fillRect(sx2, sy2, wd2, 2);
      sx2 += dir2 * (wd2 - 2); sy2 += 4 + (s >> 1);
      if (s % 3 === 2) dir2 = -dir2;
      if (sy2 > ph - 8) break;
    }
  });
}
