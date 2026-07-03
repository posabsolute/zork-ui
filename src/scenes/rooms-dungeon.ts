// scenes/rooms-dungeon.ts — the Great Underground Empire's core rooms.

import { hasObj, rf, roomState } from "./state.ts";
import { arches, builtRoom, canyonBackdrop, caveBackdrop, coalVeins, darkArch, ditherGlow, dth, exitsBox, fillDisc, hash, lampPal, litCave, mix, pickPal, pixelStage, qcol, riverBase, sandBand, sp, stairsDown, treasureGlint, waterFill, whiteCliff } from "./kit.ts";

export function roundRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    // a truly CIRCULAR chamber: the wall-floor seam is an arc (farthest at centre,
    // sweeping toward you at the sides), masonry curving with it, radial flagstones.
    const cx = pw >> 1, floorY = Math.round(ph * 0.56), K = Math.round(ph * 0.24), R = pw * 0.62;
    const seam = (x: number) => floorY + K - Math.round(Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx))) * (K / R));
    const lx2 = cx, ly2 = ph * 0.95; // your lamp
    const img = p.createImageData(pw, ph), d = img.data;
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const th = dth(x, y), s = seam(x);
      let c: number[];
      if (y < s) { // the curved wall
        const rel = s - y;
        if (rel > ph * 0.42) c = [10, 10, 12]; // vault darkness above
        else {
          const course = Math.floor(rel / 5), blk = Math.floor((x + (course % 2) * 6) / 12);
          const k = hash(blk, course);
          c = k > 0.72 ? [64, 62, 70] : k > 0.3 ? [52, 50, 58] : [42, 40, 48];
          if (rel % 5 === 4) c = [30, 28, 34]; // curving course seams
          else if ((x + (course % 2) * 6) % 12 === 11) c = [34, 32, 38];
        }
      } else { // the round floor
        const k = hash(x >> 2, y >> 1);
        c = k > 0.8 ? [66, 60, 52] : k > 0.35 ? [54, 48, 42] : [44, 39, 34];
      }
      const dx2 = (x - lx2) / (pw * 0.6), dy2 = (y - ly2) / ph, gl = Math.max(0, 1 - Math.sqrt(dx2 * dx2 + dy2 * dy2));
      c = mix(c, [222, 168, 92], gl * gl * 0.6);
      sp(d, pw, x, y, qcol(c, th));
    }
    p.putImageData(img, 0, 0);
    // ring + radial joints on the floor (the paving follows the round walls)
    p.fillStyle = "#241f18";
    for (let ring = 1; ring <= 3; ring++) for (let x = 0; x < pw; x++) { const yy = seam(x) + ring * Math.round((ph - seam(x)) / 4.4); if (yy < ph) p.fillRect(x, yy, 1, 1); }
    for (let j = -4; j <= 4; j++) { const xb = cx + j * Math.round(pw * 0.13); for (let y = 0; y < ph; y++) { const s2 = seam(Math.max(0, Math.min(pw - 1, xb))); if (y > s2) { const f2 = (y - s2) / Math.max(1, ph - s2); const xx = Math.round(cx + (xb - cx) * (0.5 + f2 * 0.5)); p.fillRect(xx, y, 1, 1); } } }
    // passages opening around the curve — the hub of the dungeon
    const rimC = "#6a6876";
    for (const [fx2, sc] of [[0.09, 1], [0.28, 0.85], [0.5, 0.75], [0.72, 0.85], [0.91, 1]] as const) {
      const ax = Math.round(pw * fx2), ay = seam(ax), ah = Math.round(ph * 0.2 * sc), aw = Math.round(pw * 0.06 * sc);
      darkArch(p, ax - (aw >> 1), ay - ah, aw, ah, rimC);
    }
    // the thief — never plainly here. You only catch a fleeting, uncertain glimpse:
    // a shadow that resolves for a heartbeat in a doorway, then is gone again.
    const cyc = (t * 0.5) % 11; // a long, irregular cycle
    if (cyc < 1.1) {
      const a = Math.sin((cyc / 1.1) * Math.PI); // fade in… and out
      const spot = [[0.7, 0.5], [0.12, 0.55], [0.5, 0.42]][Math.floor((t * 0.5) / 11) % 3]; // a different shadow each time
      const fx = Math.round(pw * spot[0]), fy = floorY + Math.round((ph - floorY) * spot[1]);
      p.globalAlpha = a * 0.38; p.fillStyle = "#0b0b11"; // a barely-there cloaked shape
      p.fillRect(fx - 3, fy - 20, 6, 20); fillDisc(p, fx, fy - 23, 4);
      p.globalAlpha = a * 0.8; p.fillStyle = "#9affb0"; p.fillRect(fx - 2, fy - 23, 1, 1); p.fillRect(fx + 1, fy - 23, 1, 1); // a glint of watching eyes
      p.globalAlpha = a * 0.5; p.fillStyle = "#cfd6e0"; p.fillRect(fx + 4, fy - 14, 4, 1); // a flash of his stiletto
      p.globalAlpha = 1;
    }
  });
}

export function loudRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("dungeon", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    p.fillStyle = "#000"; p.fillRect(0, 0, pw, Math.round(ph * 0.16)); // ceiling cannot be detected
    const calm = rf("LOUD-ROOM", "echoFixed");
    // deafening echoes — strong, fast ripples until you say "echo"; then near-silent
    const rings = calm ? 1 : 4, amp = calm ? 0.12 : 0.32, spd = calm ? 16 : 34;
    for (let k = 0; k < rings; k++) { const r = ((t * spd + k * 50) % 210); const a = amp * (1 - r / 210); p.fillStyle = `rgba(200,216,240,${a})`; for (let ang = 0; ang < Math.PI * 2; ang += 0.12) { const x = Math.round(pw * 0.5 + Math.cos(ang) * r), y = Math.round(floorY * 0.55 + Math.sin(ang) * r * 0.42); if (x >= 0 && x < pw && y >= 0 && y < ph) p.fillRect(x, y, 1, 1); } }
    darkArch(p, Math.round(pw * 0.03), floorY - Math.round(ph * 0.22), Math.round(pw * 0.07), Math.round(ph * 0.22), rim);
    darkArch(p, Math.round(pw * 0.9), floorY - Math.round(ph * 0.22), Math.round(pw * 0.07), Math.round(ph * 0.22), rim);
    darkArch(p, Math.round(pw * 0.47), 3, Math.round(pw * 0.08), Math.round(ph * 0.12), rim);
    if (hasObj("LOUD-ROOM", "BAR")) {
      treasureGlint(p, Math.round(pw * 0.5), floorY + Math.round((ph - floorY) * 0.45), t, "#cfe0ea"); // platinum bar
      p.fillStyle = "#cfe0ea"; p.fillRect(Math.round(pw * 0.5) - 5, floorY + Math.round((ph - floorY) * 0.45), 10, 3);
    }
  });
}

export function atlantisRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "ancient", 0.55, [180, 210, 230]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["UP", "SOUTH"]);
    p.fillStyle = "rgba(140,190,210,0.12)"; for (let i = 0; i < 7; i++) { const y = lay.by0 + Math.round((lay.by1 - lay.by0) * (0.1 + i * 0.12)); for (let x = lay.bx0; x < lay.bx1; x += 2) p.fillRect(x, y + Math.round(Math.sin(x * 0.1 + i + t * 0.5) * 2), 1, 1); } // water-caustic shimmer on the ancient back wall
    if (!hasObj("ATLANTIS-ROOM", "TRIDENT")) return; // the relic is gone; the shrine stands empty
    const tx = Math.round(pw * 0.52), ty = floorY + Math.round((ph - floorY) * 0.34);
    // the crystal trident, leaning against nothing on the ancient floor: shaft,
    // crossbar, three barbed tines — glassy blues with a white spine
    p.fillStyle = "#1a3644"; p.fillRect(tx - 6, ty + 3, 14, 1); // its cold gleam on the floor
    p.fillStyle = "#8fd4ec"; p.fillRect(tx - 1, ty - 18, 3, 21); p.fillStyle = "#eaf8ff"; p.fillRect(tx, ty - 18, 1, 21); // shaft with bright spine
    p.fillStyle = "#8fd4ec"; p.fillRect(tx - 6, ty - 15, 15, 2); // crossbar
    for (const dx of [-6, 0, 6]) { p.fillStyle = "#8fd4ec"; p.fillRect(tx + dx, ty - 21, 2, 7); p.fillStyle = "#eaf8ff"; p.fillRect(tx + dx, ty - 21, 1, 2); p.fillStyle = "#5aa8c4"; p.fillRect(tx + dx + 1, ty - 16, 1, 2); } // three tines
    p.fillStyle = "#eaf8ff"; p.fillRect(tx - 7, ty - 20, 1, 1); p.fillRect(tx + 7, ty - 20, 1, 1); // barb glints
    treasureGlint(p, tx + 4, ty - 22, t, "#bfeaf5");
  });
}

export function engravingsCavePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("dungeon", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    p.fillStyle = "#0b0b0d"; for (let x = 0; x < pw; x++) { const ty = Math.round(ph * 0.18 + Math.abs(Math.sin(x * 0.08)) * 6); p.fillRect(x, 0, 1, ty); } // low ceiling
    // a dressed band of wall the old carvers smoothed for their frieze — shaded
    // by the lamp below, so it belongs to the room instead of floating on it
    const fy0 = Math.round(ph * 0.26), fh = 26, fx0 = 14, fx1 = pw - 14;
    for (let y = fy0; y < fy0 + fh; y++) for (let x = fx0; x < fx1; x++) {
      if (x < fx0 + 4 && hash(x, y >> 1) > 0.5 + (x - fx0) * 0.12) continue; // broken ragged ends
      if (x > fx1 - 5 && hash(x, y >> 1) > 0.5 + (fx1 - x) * 0.12) continue;
      const k = hash(x >> 2, y >> 2);
      let c: number[] = k > 0.7 ? [58, 54, 48] : [48, 44, 38];
      const dxl = Math.abs(x - pw * 0.5) / (pw * 0.5), dyl = (fy0 + fh - y) / fh; // lamp falloff: dim toward top and sides
      c = mix(c, [10, 9, 8], Math.min(0.62, dxl * 0.45 + dyl * 0.38));
      p.fillStyle = `rgb(${qcol(c, dth(x, y)).join(",")})`; p.fillRect(x, y, 1, 1);
    }
    p.fillStyle = "#1b1814"; p.fillRect(fx0 + 3, fy0 + fh, fx1 - fx0 - 6, 1); // chiseled base groove
    p.fillStyle = "#443f36"; p.fillRect(fx0 + 3, fy0 + fh + 1, fx1 - fx0 - 6, 1); // its lit lower lip
    // the engravings: varied ancient glyphs, each cut as a dark groove with a
    // lamplit lower edge so the relief reads
    const glyph = (bx: number, by: number, kind: number) => {
      const dim = Math.min(1, Math.abs(bx - pw * 0.5) / (pw * 0.5) + 0.25);
      const G = "#14110d", L = dim > 0.7 ? "#3e382e" : "#5c554a";
      const seg = (x: number, y: number, w2: number, h2: number) => { p.fillStyle = G; p.fillRect(bx + x, by + y, w2, h2); p.fillStyle = L; p.fillRect(bx + x, by + y + h2, w2, 1); };
      switch (kind % 6) {
        case 0: seg(0, 0, 6, 1); seg(0, 2, 4, 1); seg(0, 4, 6, 1); break; // stacked bars
        case 1: seg(0, 0, 1, 6); seg(2, 1, 1, 5); seg(4, 0, 1, 6); break; // reeds
        case 2: seg(0, 0, 5, 1); seg(4, 1, 1, 3); seg(1, 4, 4, 1); seg(1, 2, 1, 2); break; // square spiral
        case 3: seg(2, 0, 2, 2); seg(1, 3, 4, 1); seg(1, 5, 1, 2); seg(4, 5, 1, 2); break; // little figure
        case 4: for (let k = 0; k < 4; k++) seg(k * 2, (k % 2) * 2, 2, 1); break; // zigzag water
        case 5: seg(1, 1, 3, 3); seg(0, 2, 1, 1); seg(4, 2, 1, 1); seg(2, 0, 1, 1); seg(2, 4, 1, 1); break; // sun disc
      }
    };
    for (let row = 0; row < 2; row++) for (let col = 0; col < 11; col++) {
      if (hash(col, row * 7 + 3) < 0.14) continue; // weathered-away gaps
      glyph(fx0 + 6 + col * Math.round((fx1 - fx0 - 14) / 11), fy0 + 4 + row * 11, Math.floor(hash(col * 3, row) * 6));
    }
    p.fillStyle = "#14110d"; for (let i = 0; i < 5; i++) { const x = fx0 + 4 + Math.round(hash(i, 31) * (fx1 - fx0 - 12)); p.fillRect(x, fy0 + Math.round(hash(i, 32) * fh), 1 + Math.round(hash(i, 33) * 3), 1); } // age cracks through the frieze
    darkArch(p, Math.round(pw * 0.04), floorY - Math.round(ph * 0.2), Math.round(pw * 0.07), Math.round(ph * 0.2), rim); // nw
    darkArch(p, Math.round(pw * 0.9), floorY - Math.round(ph * 0.2), Math.round(pw * 0.07), Math.round(ph * 0.2), rim); // east
    void t;
  });
}

export function cliffMiddlePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    canyonBackdrop(p, pw, ph, false, false);
    // halfway up the river canyon wall: the gorge drops away below the ledge
    for (let y = Math.round(ph * 0.5); y < ph; y++) { // the deepening drop
      const f = (y - ph * 0.5) / (ph * 0.5);
      for (let x = 0; x < pw; x++) { const k = hash(x >> 2, y >> 2); p.fillStyle = f > 0.7 || k < 0.3 ? "#101218" : "#1a1e28"; p.fillRect(x, y, 1, 1); }
    }
    waterFill(p, pw, Math.round(ph * 0.88), ph, t, "#2c5878", "#1c3c56"); // the Frigid River, far below
    // the cliff face you cling to, framing both edges and rising out of frame
    whiteCliff(p, 0, Math.round(pw * 0.13), 0, Math.round(ph * 0.56));
    whiteCliff(p, Math.round(pw * 0.88), pw, 0, Math.round(ph * 0.56));
    p.fillStyle = "#6c665a"; for (let y = 0; y < ph * 0.56; y++) { p.fillRect(Math.round(pw * 0.13) - 1, y, 1, 1); p.fillRect(Math.round(pw * 0.88), y, 1, 1); } // sunset-caught edges
    // the cool ledge you stand on
    for (let x = 0; x < pw; x++) {
      const yy = Math.round(ph * 0.5 + Math.sin(x * 0.04) * 2 + (hash(x >> 3, 5) - 0.5) * 3);
      for (let y2 = yy; y2 < yy + 8; y2++) { const k = hash(x >> 1, y2 >> 1); p.fillStyle = k > 0.7 ? "#4a443a" : "#38322a"; p.fillRect(x, y2, 1, 1); }
      p.fillStyle = "#6a6254"; p.fillRect(x, yy, 1, 1); // lit lip
      p.fillStyle = "#0e0c0a"; p.fillRect(x, yy + 8, 1, 2); // undershadow
    }
    // loose scree at your feet
    p.fillStyle = "#57503f"; for (let i = 0; i < 8; i++) p.fillRect(Math.round(hash(i, 21) * pw), Math.round(ph * 0.52 + hash(i, 22) * 4), 2, 1);
  });
}

export function shorePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const wy = riverBase(p, pw, ph, t, false);
    sandBand(p, 0, pw, wy + Math.round((ph - wy) * 0.45), ph); // east shore
    // a worn dirt path running north–south along the shore (a textured band, not a box)
    const py = wy + Math.round((ph - wy) * 0.66);
    for (let x = 0; x < pw; x++) { const edge = Math.round(Math.sin(x * 0.07) * 2 + Math.sin(x * 0.21) * 1); for (let y = py - 6 + edge; y < py + 7 + edge; y++) { const n = hash(x, y); if (n > 0.28) { p.fillStyle = n > 0.74 ? "#54442e" : ((x + y) & 1) ? "#3f3221" : "#322717"; p.fillRect(x, y, 1, 1); } } }
    for (let i = 0; i < 24; i++) { const x = Math.round(hash(i, 5) * pw); p.fillStyle = "#6a5a3a"; p.fillRect(x, py - 5 + Math.round(hash(i, 6) * 11), 1, 1); } // scattered pebbles
  });
}

export function sandyBeachPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const wy = riverBase(p, pw, ph, t, false);
    sandBand(p, 0, pw, wy + Math.round((ph - wy) * 0.3), ph); // large sandy beach
    darkArch(p, Math.round(pw * 0.8), wy - 2, Math.round(pw * 0.1), Math.round(ph * 0.12), "#a8975f"); // passage half-buried in sand (NE)
    if (!hasObj("SANDY-BEACH", "SHOVEL")) return; // taken to dig with
    // the shovel, planted blade-down in the sand
    const sx = Math.round(pw * 0.45), sy = ph - Math.round(ph * 0.14);
    p.fillStyle = "#6a4a2a"; p.fillRect(sx, sy - 16, 2, 12); // wooden shaft
    p.fillStyle = "#8a6a3a"; p.fillRect(sx - 3, sy - 18, 8, 2); p.fillStyle = "#54401f"; p.fillRect(sx - 3, sy - 16, 2, 1); p.fillRect(sx + 3, sy - 16, 2, 1); // T-grip
    p.fillStyle = "#9aa0a8"; for (let k = 0; k < 5; k++) p.fillRect(sx - 3 + (k >> 1), sy - 4 + k, 8 - k, 1); // steel blade, biting in
    p.fillStyle = "#c8ccd2"; p.fillRect(sx - 3, sy - 4, 1, 2); // edge glint
    p.fillStyle = "#b8a86a"; p.fillRect(sx - 5, sy + 1, 12, 2); // kicked-up sand at the blade
  });
}

export function sandyCavePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("mine", ""); pal.floorTop = [180, 160, 110]; pal.floorBot = [120, 100, 64]; pal.floorHi = [210, 190, 130]; pal.light = { x: pw * 0.5, y: ph * 0.98, rx: pw * 0.75, ry: ph, col: [222, 168, 92], peak: 0.8 };
    const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    sandBand(p, 0, pw, floorY - 4, ph); // sand filling the cave
    p.fillStyle = "#c8b87a"; for (let i = 0; i < 4; i++) { const x = Math.round(pw * (0.2 + i * 0.2)); for (let k = 0; k < 10; k++) p.fillRect(x - k, floorY + k, k * 2, 1); } // sand drifts
    const sgx = Math.round(pw * 0.5), sgy = floorY + Math.round((ph - floorY) * 0.4);
    if (rf("SANDY-CAVE", "dug")) { // dug out with the shovel — a pit, the scarab uncovered
      p.fillStyle = "#7a6838"; for (let yy = 0; yy < 10; yy++) { const wd = 14 - yy; p.fillRect(sgx - wd, sgy - 6 + yy, wd * 2, 1); } p.fillStyle = "#4a3e20"; p.fillRect(sgx - 12, sgy + 3, 24, 1); // the hole
      treasureGlint(p, sgx, sgy, t, "#6affa0"); // the jeweled scarab, revealed
    } else { p.fillStyle = "#b8a86a"; for (let i = 0; i < 5; i++) p.fillRect(sgx - 8 + i * 4, sgy - (i % 2), 3, 2); } // undisturbed sand mound (scarab buried beneath)
    darkArch(p, Math.round(pw * 0.06), floorY - Math.round(ph * 0.2), Math.round(pw * 0.08), Math.round(ph * 0.2), rim); // SW exit
  });
}

export function whiteCliffsBeach(north: boolean, t: number) {
  return (p: CanvasRenderingContext2D, pw: number, ph: number) => {
    const wy = riverBase(p, pw, ph, t, false);
    whiteCliff(p, north ? Math.round(pw * 0.0) : Math.round(pw * 0.7), north ? Math.round(pw * 0.7) : pw, 0, wy + 6); // the White Cliffs
    sandBand(p, 0, pw, wy + Math.round((ph - wy) * 0.4), ph); // narrow beach
    if (north) darkArch(p, Math.round(pw * 0.3), wy - 4, Math.round(pw * 0.08), Math.round(ph * 0.14), "#9c968a"); // tight passage into the cliffs (west)
  };
}

export function slideRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    coalVeins(p, pw, floorY);
    p.fillStyle = "#6a6660"; for (let i = 0; i < 11; i++) { const bx = Math.round(pw * 0.28) + i * 12; p.fillRect(bx, Math.round(ph * 0.2), 7, 9); p.fillStyle = "#2a2824"; p.fillRect(bx + 1, Math.round(ph * 0.2) + 1, 5, 7); p.fillStyle = "#6a6660"; } // "GRANITE WALL" etched (carved blocks)
    for (let k = 0; k < 40; k++) { // the steep chute twisting down — a shaded half-pipe, not a ribbon
      const x = Math.round(pw * 0.5 + Math.sin(k * 0.18) * pw * 0.12), y = floorY - 8 + k;
      const wd2 = Math.max(6, 16 - Math.round(k * 0.16)); // narrows as it drops away
      p.fillStyle = "#23222a"; p.fillRect(x - wd2 - 1, y, wd2 * 2 + 2, 2); // outer shadow
      p.fillStyle = "#565662"; p.fillRect(x - wd2, y, wd2 * 2, 1); // worn steel bed
      p.fillStyle = "#7c7c8a"; p.fillRect(x - wd2, y, 3, 1); // lamplit rail
      p.fillStyle = "#38383f"; p.fillRect(x + wd2 - 3, y, 3, 1); // shadowed rail
      if ((k & 7) === 5) { p.fillStyle = "#2c2c33"; p.fillRect(x - wd2, y, wd2 * 2, 1); } // seams between plates
    }
    p.fillStyle = "#040405"; for (let yy = 0; yy < 5; yy++) p.fillRect(Math.round(pw * 0.5 + Math.sin(39 * 0.18) * pw * 0.12) - 6 + yy, floorY + 31 + yy, 12 - yy * 2, 1); // it vanishes into a dark chute mouth
    darkArch(p, Math.round(pw * 0.9), floorY - Math.round(ph * 0.2), Math.round(pw * 0.07), Math.round(ph * 0.2), rim); // east
    darkArch(p, Math.round(pw * 0.1), floorY - Math.round(ph * 0.16), Math.round(pw * 0.06), Math.round(ph * 0.16), rim); // north
    void t;
  });
}

// -- dungeon passages & rooms --
export function strangePassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone"); exitsBox(p, pw, ph, lay, ["WEST"]);
    // an old wooden door set in the back wall (east side), a cyclops-sized hole smashed through it
    const dw = Math.round((lay.bx1 - lay.bx0) * 0.4), dh = Math.round((lay.by1 - lay.by0) * 0.78), dx = lay.bx1 - dw - 2, dy = lay.by1 - dh;
    p.fillStyle = "#4a3e2c"; p.fillRect(dx - 2, dy - 2, dw + 4, dh + 2); p.fillStyle = "#3a2a1a"; p.fillRect(dx, dy, dw, dh);
    p.fillStyle = "#241810"; for (let y = dy; y < lay.by1; y += 4) p.fillRect(dx, y, dw, 1); // planks
    p.fillStyle = "#040405"; p.fillRect(dx + 3, dy + Math.round(dh * 0.22), dw - 6, Math.round(dh * 0.56)); // the smashed opening
    void t;
  });
}

export function mirrorRoomPixel(lit: boolean, roomId: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone", lit ? 0.5 : 0.74); exitsBox(p, pw, ph, lay, ["WEST", "EAST"]);
    const mx = Math.round((lay.bx0 + lay.bx1) / 2), mw = Math.round((lay.bx1 - lay.bx0) * 0.78), my = lay.by0 + 3, mh = lay.by1 - my - 3;
    p.fillStyle = "#4a3a1a"; p.fillRect(mx - mw / 2 - 4, my - 4, mw + 8, mh + 8); p.fillStyle = "#6a5226"; p.fillRect(mx - mw / 2 - 4, my - 4, mw + 8, 2); // ornate gold frame on the back wall
    p.fillStyle = "#8a6e34"; for (let gy = my; gy < my + mh; gy += 7) { p.fillRect(mx - mw / 2 - 4, gy, 2, 3); p.fillRect(mx + mw / 2 + 2, gy, 2, 3); } // chased scrollwork on the frame rails
    if (!rf(roomId, "broken")) { const aura = 0.5 + 0.5 * Math.sin(t * 1.3); ditherGlow(p, mx, my + mh / 2, mw * 0.62, mh * 0.54, lit ? "#7ad8ff" : "#4f7ec0", 0.12 + aura * 0.08); } // a faint arcane breath around the glass
    if (rf(roomId, "broken")) {
      p.fillStyle = "#1a1d22"; p.fillRect(mx - mw / 2, my, mw, mh); // dead glass
      p.fillStyle = "#3a4450"; for (let i = 0; i < 7; i++) { let bx = mx, by = my + 2; const ang = i / 7 * Math.PI * 2; for (let k = 0; k < mh; k += 2) { bx += Math.cos(ang) * 2; by += Math.sin(ang) * 1.5 + 1; if (bx > mx - mw / 2 && bx < mx + mw / 2 && by < my + mh) p.fillRect(Math.round(bx), Math.round(by), 1, 1); } } // cracks
      p.fillStyle = "#0a0c10"; for (let i = 0; i < 8; i++) p.fillRect(mx - mw / 2 + Math.floor(hash(i, 2) * mw), my + Math.floor(hash(i, 3) * mh), 2, 2); // missing shards
    } else {
      // not a flat looking-glass but a SCRYING PORTAL: a luminous depth that swirls
      const x0 = Math.round(mx - mw / 2), cx = mw / 2, cy = mh / 2;
      const pal = lit ? ["#0c1430", "#1a2a58", "#2c4d8e", "#4f8fc8", "#9fe6ff", "#e8fbff"]
                      : ["#080e1e", "#101e3a", "#1e3a64", "#356a98", "#6ab0d0", "#bfeaff"];
      const NL = pal.length;
      for (let yy = 0; yy < mh; yy++) for (let xx = 0; xx < mw; xx++) {
        const nx = (xx - cx) / cx, ny = (yy - cy) / cy, r = Math.sqrt(nx * nx + ny * ny), ang = Math.atan2(ny, nx);
        let v = 0.44 + 0.42 * Math.sin(ang * 3 + r * 7 - t * 1.1) * (1 - r * 0.55); // a slow scrying swirl
        v += 0.2 * Math.sin((xx * 0.6 - yy * 0.45) + t * 0.7);                       // drifting liquid ripple
        v += (1 - Math.min(1, r)) * 0.5;                                             // a luminous depth at the centre
        let f = v * NL, lvl = Math.floor(f); if (dth(xx, yy) < f - lvl) lvl++;
        p.fillStyle = pal[Math.max(0, Math.min(NL - 1, lvl))]; p.fillRect(x0 + xx, my + yy, 1, 1);
      }
      p.fillStyle = "rgba(230,245,255,0.12)"; p.fillRect(x0 + 3, my + 3, 3, mh - 6); // edge sheen
      for (let i = 0; i < 14; i++) { // drifting arcane sparkles across the glass
        const px = (hash(i, 1) * mw + t * (8 + hash(i, 3) * 14)) % mw, py = (hash(i, 2) * mh + Math.sin(t * 0.5 + i) * 6 + mh) % mh;
        const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); if (tw < 0.45) continue;
        const sx = Math.round(x0 + px), sy = Math.round(my + py); p.globalAlpha = tw; p.fillStyle = "#eafcff"; p.fillRect(sx, sy, 1, 1);
        if (tw > 0.85) { p.fillRect(sx - 1, sy, 1, 1); p.fillRect(sx + 1, sy, 1, 1); p.fillRect(sx, sy - 1, 1, 1); p.fillRect(sx, sy + 1, 1, 1); } // a four-point star glint
      }
      p.globalAlpha = 1;
    }
    void t;
  });
}

export function smallCavePixel(forbidding: boolean) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = litCave("dungeon", "", pw, ph, forbidding ? 0.6 : 0.82);
    if (forbidding) { pal.wallTop = [38, 40, 52]; pal.wallBot = [16, 17, 24]; pal.floorTop = [32, 34, 44]; pal.floorBot = [12, 13, 18]; } // a cold, unfriendly blue
    const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    // a SMALL cave: the ceiling presses down — a deep stalactite fringe
    p.fillStyle = forbidding ? "#05060a" : "#0a0806";
    for (let x = 0; x < pw; x++) { const cy2 = Math.round(ph * 0.2 + Math.abs(Math.sin(x * 0.09) + Math.sin(x * 0.031)) * ph * 0.06 + (hash(x >> 3, 3) - 0.5) * 6); p.fillRect(x, 0, 1, cy2); }
    for (let i = 0; i < 5; i++) { const sx2 = Math.round((0.12 + hash(i, 21) * 0.76) * pw), len = 6 + Math.round(hash(i, 22) * 8); for (let yy = 0; yy < len; yy++) { const wd2 = Math.max(1, Math.round((1 - yy / len) * 3)); p.fillRect(sx2 - wd2, Math.round(ph * 0.22) + yy, wd2 * 2, 1); } }
    // scattered rubble on the floor
    p.fillStyle = forbidding ? "#232633" : "#3a332a"; for (let i = 0; i < 7; i++) p.fillRect(Math.round(hash(i, 31) * pw), floorY + 4 + Math.round(hash(i, 32) * (ph - floorY - 8)), 2, 1);
    arches(p, pw, ph, floorY, rim, ["NORTH", "WEST"]);
    stairsDown(p, Math.round(pw * 0.5) - 12, ph - Math.round(ph * 0.16), 24, Math.round(ph * 0.16), forbidding ? "#2a2e3e" : rim); // the stairwell descending out of the room
  });
}

export function coldPassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone", 0.6, [172, 190, 222]); exitsBox(p, pw, ph, lay, ["WEST", "SOUTH"]);
    // rime clinging along the mortar courses — frost in CLUSTERS, not sprinkles
    p.fillStyle = "#b8ccdf";
    for (let i = 0; i < 16; i++) {
      const fx = Math.round(hash(i, 1) * (pw - 20)) + 8, fy = lay.by0 + 4 + (Math.round(hash(i, 2) * ((lay.by1 - lay.by0) / 5)) * 5);
      const len = 3 + Math.round(hash(i, 3) * 6);
      for (let k = 0; k < len; k++) if (hash(fx + k, fy) > 0.3) p.fillRect(fx + k, fy, 1, 1);
    }
    // icicles hanging from the ceiling line
    for (let i = 0; i < 6; i++) {
      const ix = Math.round(pw * (0.2 + hash(i, 7) * 0.6)), len = 4 + Math.round(hash(i, 8) * 7);
      for (let yy = 0; yy < len; yy++) { const wd2 = Math.max(1, Math.round((1 - yy / len) * 2)); p.fillStyle = yy === 0 ? "#dcebf8" : "#a8c4dc"; p.fillRect(ix - (wd2 >> 1), lay.by0 - 2 + yy, wd2, 1); }
      if (Math.sin(t * 1.4 + i * 2) > 0.85) { p.fillStyle = "#e8f4fc"; p.fillRect(ix, lay.by0 - 2 + len + Math.round(((t * 20) % 8)), 1, 2); } // a melt-drop lets go
    }
    // your breath drifts as a pale band
    p.fillStyle = "rgba(200,220,240,0.10)";
    for (let x = 0; x < pw; x += 2) { const my = Math.round(ph * 0.55 + Math.sin(x * 0.08 + t * 1.2) * 3); p.fillRect(x, my, 2, 2); }
  });
}

export function narrowPassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone");
    // the rock CROWDS in from both sides — barely room to squeeze through
    const rock = (side: 1 | -1, seed: number) => {
      for (let y = 0; y < ph; y++) {
        const wd2 = Math.round(pw * 0.3 + Math.sin(y * 0.05 + seed) * 8 + (hash(seed, y >> 2) - 0.5) * 10);
        const x0 = side === 1 ? 0 : pw - wd2;
        for (let x = x0; x < x0 + wd2; x++) { const k = hash(x >> 2, y >> 2); p.fillStyle = k > 0.78 ? "#3e3e4a" : k > 0.3 ? "#2e2e38" : "#22222a"; p.fillRect(x, y, 1, 1); }
        p.fillStyle = "#565664"; p.fillRect(side === 1 ? wd2 - 1 : pw - wd2, y, 1, 1);
      }
    };
    rock(1, 3); rock(-1, 7);
    // the slot continues north — a tall thin gap between the crowding walls
    const cx = pw >> 1;
    p.fillStyle = "#08080b"; p.fillRect(cx - 6, lay.by0 + 6, 12, lay.by1 - lay.by0 - 4);
    p.fillStyle = "#15151b"; p.fillRect(cx - 4, lay.by0 + 8, 8, lay.by1 - lay.by0 - 8);
    p.fillStyle = "#55515e"; p.fillRect(cx - 7, lay.by0 + 5, 1, lay.by1 - lay.by0 - 3); p.fillRect(cx + 6, lay.by0 + 5, 1, lay.by1 - lay.by0 - 3);
    void t;
  });
}

export function windingPassagePixel(seed: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("dungeon", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t);
    // the tunnel visibly WINDS: nested arches telescoping into the dark, each
    // slipping a little further to one side — a curve you can read
    const dirSign = seed % 2 ? 1 : -1;
    const cols = ["#23262d", "#15181d", "#0b0d11", "#040506"];
    const cx0 = Math.round(pw * 0.5);
    let ax = cx0, aw = Math.round(pw * 0.09), ah = Math.round(ph * 0.34), ay = floorY;
    p.fillStyle = `rgb(${pal.wallHi.join(",")})`; p.fillRect(ax - aw - 2, ay - Math.round(ah * 0.6), 2, Math.round(ah * 0.6)); p.fillRect(ax + aw, ay - Math.round(ah * 0.6), 2, Math.round(ah * 0.6)); // the near mouth's lit jambs
    for (let i = 0; i < 4; i++) {
      p.fillStyle = cols[i];
      for (let yy = 0; yy < ah; yy++) { const rr = ah * 0.55; const wd2 = yy < rr ? Math.round(aw * Math.sqrt(Math.max(0, 1 - ((rr - yy) / rr) ** 2))) : aw; p.fillRect(ax - wd2, ay - ah + yy, wd2 * 2, 1); }
      ax += dirSign * Math.round(aw * (i % 2 ? -0.5 : 0.9)); // the swing: right, back, right…
      aw = Math.round(aw * 0.62); ah = Math.round(ah * 0.68); ay -= 2;
    }
    // the worn floor-path snaking into the mouth
    p.fillStyle = "#3b3428";
    for (let y = floorY; y < ph; y++) { const f = (y - floorY) / Math.max(1, ph - floorY); const cxp = cx0 + Math.sin(f * 2.2 + seed) * pw * 0.05 * dirSign; const half = 2 + f * 7; for (let x = Math.round(cxp - half); x <= cxp + half; x++) if (hash(x, y) > 0.4) p.fillRect(x, y, 1, 1); }
  });
}

export function ewPassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone"); exitsBox(p, pw, ph, lay, ["EAST", "WEST"]);
    // the narrow stairway at the NORTH end, cut down through the floor of the passage
    const cx = pw >> 1, swd = 22, sy0 = lay.by1 - 2;
    p.fillStyle = "#0c0a08"; p.fillRect(cx - (swd >> 1) - 2, sy0 - 14, swd + 4, 16); // the stair mouth in the back wall
    for (let s = 0; s < 5; s++) { const v = 30 - s * 6; p.fillStyle = `rgb(${v},${Math.round(v * 0.9)},${Math.round(v * 0.75)})`; p.fillRect(cx - (swd >> 1) + s, sy0 - 2 - s * 3, swd - s * 2, 3); }
    p.fillStyle = "#565064"; p.fillRect(cx - (swd >> 1) - 3, sy0 - 15, 1, 16); p.fillRect(cx + (swd >> 1) + 2, sy0 - 15, 1, 16); // worn jambs
    void t;
  });
}

export function nsPassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone"); exitsBox(p, pw, ph, lay, ["NORTH", "NE", "SOUTH"]);
    // a HIGH passage: the walls run up out of sight — tall shadow streaks above
    p.fillStyle = "#0b0b0f"; p.fillRect(0, 0, pw, lay.by0 - 2);
    for (let x = 4; x < pw; x += 9) { const hgt2 = Math.round(lay.by0 * (0.4 + hash(x, 9) * 0.6)); p.fillStyle = "#17171d"; p.fillRect(x, lay.by0 - hgt2, 2, hgt2); } // ribs of rock vanishing upward
    p.fillStyle = "#26262e"; for (let x = 0; x < pw; x += 2) if (hash(x, 5) > 0.5) p.fillRect(x, lay.by0 - 2, 2, 2); // broken upper edge
    void t;
  });
}

export function maintenanceRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone", 0.6, [170, 180, 195]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["WEST", "SOUTH"]);
    const px = Math.round(pw * 0.5), py = Math.round((lay.by0 + lay.by1) / 2); p.fillStyle = "#2a2c32"; p.fillRect(px - 26, py - 10, 52, 22); // control panel on the back wall
    const bc = ["#3a6ad8", "#caa24a", "#8a5a2a", "#c83a2a"]; for (let i = 0; i < 4; i++) { p.fillStyle = bc[i]; p.fillRect(px - 20 + i * 12, py - 2, 7, 7); p.fillStyle = "#101216"; p.fillRect(px - 20 + i * 12, py - 2, 7, 1); } // blue/yellow/brown/red buttons
    // the group of tool chests, ransacked and left open along the west wall
    for (let c = 0; c < 3; c++) {
      const cx2 = Math.round(pw * 0.16) + c * 17, cy2 = floorY + Math.round((ph - floorY) * (0.3 + c * 0.16)), cw2 = 14 - c;
      p.fillStyle = "#111318"; p.fillRect(cx2 - 1, cy2 + 7, cw2 + 2, 2); // shadow
      p.fillStyle = "#3a424c"; p.fillRect(cx2, cy2, cw2, 8); p.fillStyle = "#4c565f"; p.fillRect(cx2, cy2, cw2, 2); // chest, lit top rail
      p.fillStyle = "#0c0e12"; p.fillRect(cx2 + 1, cy2 + 2, cw2 - 2, 3); // gaping open, emptied
      p.fillStyle = "#5c666f"; p.fillRect(cx2 - 1, cy2 - 2, cw2 + 2, 2); p.fillStyle = "#252b32"; p.fillRect(cx2 + (cw2 >> 1) - 1, cy2 - 1, 2, 1); // lid thrown back + latch
    }
    if (hasObj("MAINTENANCE-ROOM", "WRENCH")) { p.fillStyle = "#7a8a92"; p.fillRect(px + 14, floorY + Math.round((ph - floorY) * 0.4), 10, 2); p.fillRect(px + 22, floorY + Math.round((ph - floorY) * 0.4) - 1, 2, 4); } // wrench with jaw
    if (hasObj("MAINTENANCE-ROOM", "SCREWDRIVER")) { p.fillStyle = "#6a5030"; p.fillRect(px - 24, floorY + Math.round((ph - floorY) * 0.55), 8, 2); p.fillStyle = "#9aa4ac"; p.fillRect(px - 16, floorY + Math.round((ph - floorY) * 0.55), 4, 1); } // screwdriver, handle + shank
    if (hasObj("MAINTENANCE-ROOM", "TUBE")) { p.fillStyle = "#4a5a3a"; p.fillRect(px - 4, floorY + Math.round((ph - floorY) * 0.62), 7, 3); p.fillStyle = "#5c7048"; p.fillRect(px - 4, floorY + Math.round((ph - floorY) * 0.62), 7, 1); } // the tube of viscous material
    // THE BLUE BUTTON: a pipe bursts on the east wall and the room floods,
    // the pool climbing with the game's "water level is now up to your …" turns
    const lvv = roomState["MAINTENANCE-ROOM"]?.waterLevel;
    const lvl = typeof lvv === "number" ? Math.min(7, lvv) : 0;
    const leak = rf("MAINTENANCE-ROOM", "leak");
    if (leak || lvl > 0) {
      const waterY = ph - 2 - Math.round((ph - floorY + 4) * Math.max(1, lvl) / 7);
      // the pool: two committed teals dithered at the depth seam, drowning the floor
      for (let y = waterY; y < ph; y++) for (let x = 0; x < pw; x++) {
        const deep = (y - waterY) / Math.max(1, ph - waterY);
        p.fillStyle = deep + (dth(x, y) - 0.5) * 0.3 > 0.45 ? "#0d2f38" : "#154551";
        p.fillRect(x, y, 1, 1);
      }
      p.fillStyle = "#2e7a8c"; p.fillRect(0, waterY, pw, 1); // the surface line
      for (let x = 0; x < pw; x += 2) if (Math.sin(x * 0.31 + t * 2.2) > 0.72) { p.fillStyle = "#9fd8e4"; p.fillRect(x, waterY, 2, 1); } // sliding lamplight glints
      if (leak) {
        // the split pipe collar high on the east wall + the pressure jet arcing down
        const oy = Math.round(lay.by0 + (floorY - lay.by0) * 0.45);
        p.fillStyle = "#31363e"; p.fillRect(pw - 7, oy - 4, 7, 9);
        p.fillStyle = "#4a515b"; p.fillRect(pw - 7, oy - 4, 7, 1); // lit rim
        p.fillStyle = "#0c0e12"; p.fillRect(pw - 8, oy - 1, 2, 4); // the rupture
        for (let i = 0; i < 60; i++) {
          const jx = pw - 8 - i;
          const jy = oy + Math.round(i * i * 0.014) + (hash(i, Math.floor(t * 9)) > 0.6 ? 1 : 0);
          if (jy >= waterY) { // churning foam where the jet lands
            for (let s = -3; s <= 3; s++) if (hash(i + s, Math.floor(t * 7)) > 0.5) { p.fillStyle = "#e8f6fa"; p.fillRect(jx + s, waterY - 1 + (s & 1), 1, 1); }
            break;
          }
          p.fillStyle = i < 5 ? "#eef8fb" : i < 22 ? "#b9e2ec" : "#8cc6d6";
          p.fillRect(jx, jy, 2, 2);
          if (hash(i * 3, Math.floor(t * 11)) > 0.8) { p.fillStyle = "#cfeaf2"; p.fillRect(jx + 1, jy + 3, 1, 1); } // stray spray
        }
      }
    }
  });
}

export function squeekyRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = litCave("dungeon", "", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    arches(p, pw, ph, floorY, rim, ["NORTH", "EAST"]);
    // the squeakers themselves: mice darting near the north passage
    const mouse = (seed: number) => {
      const cyc = (t * 0.9 + seed * 2.7) % 6;
      const running = cyc < 1.6;
      const mx = Math.round(pw * 0.5 + (running ? (cyc / 1.6 - 0.5) * 46 : (hash(seed, Math.floor((t * 0.9 + seed * 2.7) / 6)) - 0.5) * 40));
      const my = floorY + 6 + Math.round(hash(seed, 4) * 8);
      p.fillStyle = "#2a2622"; p.fillRect(mx, my, 3, 2); p.fillRect(mx + 3, my, 1, 1); // body + nose
      p.fillStyle = "#1c1916"; for (let k = 1; k <= 3; k++) p.fillRect(mx - k, my + (k > 1 ? 1 : 0), 1, 1); // tail
      if (!running && Math.sin(t * 3 + seed) > 0.6) { p.fillStyle = "#c8c49a"; p.fillRect(mx + 4, my - 3, 1, 1); p.fillRect(mx + 6, my - 5, 1, 1); } // a squeak!
    };
    mouse(1); mouse(5);
    p.fillStyle = "#2e2a24"; for (let i = 0; i < 8; i++) p.fillRect(Math.round(pw * (0.38 + hash(i, 11) * 0.24)), floorY + 3 + Math.round(hash(i, 12) * 10), 1, 1); // droppings by the passage mouth
    // squeaks drifting from the north passage
    p.fillStyle = "rgba(200,200,160,0.5)"; for (let i = 0; i < 5; i++) { const a = 0.35 + 0.3 * Math.abs(Math.sin(t * 6 + i)); p.globalAlpha = a; p.fillRect(Math.round(pw * 0.5) + Math.round(Math.sin(t * 4 + i) * 10), Math.round(ph * 0.16) + i * 3, 2, 1); } p.globalAlpha = 1;
  });
}

export function batRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = litCave("dungeon", "", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    const bx = Math.round(pw * 0.5 + Math.sin(t * 1.2) * pw * 0.1), by = Math.round(ph * 0.22 + Math.cos(t * 1.6) * ph * 0.06), flap = Math.round(Math.sin(t * 10) * 4); // the deranged vampire bat, flitting
    p.fillStyle = "#1a1016";
    p.fillRect(bx - 1, by, 3, 5); p.fillRect(bx - 1, by - 2, 1, 2); p.fillRect(bx + 1, by - 2, 1, 2); // body + ears
    for (let k = 0; k < 8; k++) { const wy2 = by + flap + Math.round(Math.abs(k - 3.5) * (flap > 0 ? 0.5 : -0.5)); p.fillRect(bx - 10 + k, wy2, 1, 2); p.fillRect(bx + 3 + k, wy2, 1, 2); } // membranous wings, angling with the beat
    p.fillStyle = "#4a2a34"; p.fillRect(bx, by + 1, 1, 1); // its mad little eye
    if (hasObj("BAT-ROOM", "JADE")) { // the exquisite jade figurine — a small seated idol, actually carved
      const jx = Math.round(pw * 0.5), jy = floorY + Math.round((ph - floorY) * 0.4);
      p.fillStyle = "#0e2a18"; p.fillRect(jx - 4, jy + 3, 9, 1); // its shadow
      p.fillStyle = "#2e8a52"; p.fillRect(jx - 3, jy, 7, 3); // crossed-leg base
      p.fillStyle = "#37a663"; p.fillRect(jx - 2, jy - 4, 5, 4); // body
      p.fillStyle = "#2e8a52"; fillDisc(p, jx, jy - 6, 2); // head
      p.fillStyle = "#4fd88a"; p.fillRect(jx - 2, jy - 4, 1, 4); p.fillRect(jx - 1, jy - 7, 1, 1); // lamplit jade edge
      p.fillStyle = "#123a22"; p.fillRect(jx + 1, jy - 4, 1, 4); // shadow side
      treasureGlint(p, jx + 3, jy - 7, t, "#6affa0");
    }
    arches(p, pw, ph, floorY, rim, ["SOUTH", "EAST"]);
  });
}

export function smellyRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = litCave("dungeon", "", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    const sx = Math.round(pw * 0.3); stairsDown(p, sx - 11, ph - Math.round(ph * 0.16), 22, Math.round(ph * 0.16), rim); // the stairwell the smell crawls out of
    // the SMELL: sinuous ribbons of coal-gas crawling up from the stairwell below
    for (let r = 0; r < 4; r++) {
      const bx = sx - 8 + r * 5;
      for (let k = 0; k < 34; k++) {
        const yy = ph - Math.round(ph * 0.15) - k;
        const xx = bx + Math.round(Math.sin(k * 0.3 + t * 1.6 + r * 2) * (2 + k * 0.12));
        const a = Math.max(0, 0.5 - k * 0.014);
        if (a > 0.06 && hash(xx, yy + Math.floor(t * 3)) > 0.35) { p.globalAlpha = a; p.fillStyle = r % 2 ? "#7a9a3a" : "#5c7a2c"; p.fillRect(xx, yy, 2, 1); }
      }
    }
    p.globalAlpha = 1;
    ditherGlow(p, sx, ph - Math.round(ph * 0.2), 16, 9, "#66802e", 0.2); // a sickly pall hangs over the stairs
    arches(p, pw, ph, floorY, rim, ["SOUTH"]);
  });
}
