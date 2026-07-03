// scenes/rooms-house.ts — the white house and the cellar beneath it.

import { hasObj, rf, treasuresOf, isTrapOpen } from "./state.ts";
import { ambiance, builtRoom, caveBackdrop, cyclopsSprite, darkArch, ditherGlow, dth, exitsBox, fillDisc, gothicDoor, hash, interiorBackdrop, lanternIcon, litCave, orientalRug, pal0, pixelStage, stairsUp, stoneRoom, swordMounted, trapDoor, treasureIcon, trollSprite } from "./kit.ts";

export function kitchenPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const wx = Math.round(pw * 0.74), wy = Math.round(ph * 0.16), ww = Math.round(pw * 0.15), wh = Math.round(ph * 0.26);
    const floorY = interiorBackdrop(p, pw, ph, {
      wallTop: [46, 40, 30], wallBot: [26, 22, 16], floorTop: [64, 48, 28], floorBot: [28, 20, 12], floorHi: [80, 62, 36],
      plank: "#221809", seam: "#150e06",
      light: { x: wx + ww / 2, y: ph * 0.4, rx: pw * 0.52, ry: ph * 0.8, col: [128, 152, 200], peak: 0.5 }, // moonlight through the east window
    }, t);
    // ── west passage to the living room: recessed, lit jamb ──
    const px0 = 2, pw0 = Math.round(pw * 0.1), py0 = Math.round(ph * 0.16);
    p.fillStyle = "#080706"; p.fillRect(px0, py0, pw0, floorY - py0);
    p.fillStyle = "#141210"; p.fillRect(px0 + pw0 - 3, py0 + 2, 3, floorY - py0 - 2); // inner reveal
    p.fillStyle = "#4a3e2c"; p.fillRect(px0 + pw0, py0 - 1, 2, floorY - py0 + 1); p.fillRect(px0 - 1, py0 - 1, pw0 + 3, 2); // lit jamb + lintel
    // ── the dark staircase up to the attic ──
    const sx = Math.round(pw * 0.13), sw = Math.round(pw * 0.13), sy0 = Math.round(ph * 0.12);
    p.fillStyle = "#070605"; p.fillRect(sx, sy0, sw, floorY - sy0); // stairwell void
    for (let s = 0; s < 6; s++) { // treads climbing up into the dark, dimmer as they rise
      const ty2 = floorY - 3 - s * 5, tw2 = sw - 3 - s * 2;
      const v = 34 - s * 5;
      p.fillStyle = `rgb(${v + 8},${v},${Math.round(v * 0.7)})`; p.fillRect(sx + 1, ty2, tw2, 2);
      p.fillStyle = `rgb(${v + 22},${v + 12},${Math.round(v * 0.8)})`; p.fillRect(sx + 1, ty2, tw2, 1); // nosing catches light
    }
    p.fillStyle = "#3c3222"; p.fillRect(sx - 1, sy0 - 1, sw + 2, 2); p.fillRect(sx - 1, sy0, 1, floorY - sy0); p.fillRect(sx + sw, sy0, 1, floorY - sy0); // trim
    // ── the dark chimney: a brick breast with a cold firebox (leads down) ──
    const hx = Math.round(pw * 0.28), hw = Math.round(pw * 0.15), hy = Math.round(ph * 0.05);
    for (let yy = hy; yy < floorY; yy++) for (let xx = hx; xx < hx + hw; xx++) {
      const course = yy >> 2, br = Math.floor((xx + (course % 2) * 4) / 8);
      const n = hash(br, course);
      p.fillStyle = n > 0.72 ? "#4a2c20" : n > 0.3 ? "#3e251b" : "#341f17";
      p.fillRect(xx, yy, 1, 1);
      if (yy % 4 === 3) { p.fillStyle = "#241511"; p.fillRect(xx, yy, 1, 1); } // mortar course
      else if ((xx + (course % 2) * 4) % 8 === 7) { p.fillStyle = "#2a1a13"; p.fillRect(xx, yy, 1, 1); } // head joint
    }
    p.fillStyle = "#55382a"; p.fillRect(hx - 1, hy, 1, floorY - hy); p.fillStyle = "#1c110c"; p.fillRect(hx + hw, hy, 1, floorY - hy); // lit/shadow edges
    p.fillStyle = "#5a4630"; p.fillRect(hx - 2, Math.round(ph * 0.3), hw + 4, 2); // mantel shelf
    const fbx = hx + 3, fbw = hw - 6, fby = floorY - 14, fbh = 14; // the cold firebox
    p.fillStyle = "#100a08"; p.fillRect(fbx, fby, fbw, fbh);
    p.fillStyle = "#030202"; p.fillRect(fbx + 2, fby + 3, fbw - 4, fbh - 3); // soot-black throat (no fire — the house is empty)
    p.fillStyle = "#4a3424"; for (let a = 0; a < fbw; a += 2) p.fillRect(fbx + a, fby - Math.round(Math.sin((a / fbw) * Math.PI) * 3), 2, 1); // shallow brick arch
    p.fillStyle = "#3a342a"; p.fillRect(fbx - 2, floorY - 1, fbw + 4, 2); // hearthstone
    // ── the small east window, moonlit night beyond ──
    const open = rf("KITCHEN", "windowOpen");
    p.fillStyle = "#0d1220"; p.fillRect(wx, wy, ww, wh); // night
    for (let yy = 0; yy < wh; yy++) for (let xx = 0; xx < ww; xx++) if ((1 - yy / wh) * 0.55 > dth(wx + xx, wy + yy)) { p.fillStyle = "#26314e"; p.fillRect(wx + xx, wy + yy, 1, 1); }
    for (let i = 0; i < 7; i++) { // twinkling stars
      if (Math.abs(Math.sin(t * 1.6 + i * 2.1)) > 0.35) { p.fillStyle = "#cdd6ea"; p.fillRect(wx + 2 + Math.round(hash(i, 8) * (ww - 4)), wy + 2 + Math.round(hash(i, 10) * (wh * 0.6)), 1, 1); }
    }
    p.fillStyle = "#141c30"; for (let xx = 0; xx < ww; xx++) { const ry2 = wy + wh - 3 + Math.round(hash(xx, 77) * 2); p.fillRect(wx + xx, ry2, 1, wy + wh - ry2); } // treeline through the glass
    const fr = "#5f4c32", frD = "#3a2d1c";
    p.fillStyle = fr; p.fillRect(wx - 2, wy - 2, ww + 4, 2); p.fillRect(wx - 2, wy + wh, ww + 4, 2); p.fillRect(wx - 2, wy, 2, wh); p.fillRect(wx + ww, wy, 2, wh); // frame
    p.fillStyle = frD; p.fillRect(wx - 2, wy + wh + 1, ww + 4, 1);
    if (open) {
      // sash thrown up: the lower half is open night air; the raised sash sits over the top half
      p.fillStyle = fr; p.fillRect(wx - 1, wy + Math.round(wh * 0.42), ww + 2, 2);
      p.fillStyle = "#6f5a3c"; p.fillRect(wx - 1, wy + Math.round(wh * 0.42), ww + 2, 1);
      p.fillStyle = fr; p.fillRect(wx + (ww >> 1), wy, 1, Math.round(wh * 0.42)); // upper muntin only
      p.fillStyle = "#7d90b2"; p.fillRect(wx + 1, wy + 1, 1, 3); // glass glint on the raised pane
    } else {
      p.fillStyle = fr; p.fillRect(wx + (ww >> 1), wy, 1, wh); p.fillRect(wx, wy + (wh >> 1), ww, 1); // muntins
      p.fillStyle = "#6f80a4"; p.fillRect(wx + 2, wy + 2, 1, 1); p.fillRect(wx + 3, wy + 3, 1, 1); p.fillRect(wx + (ww >> 1) + 2, wy + (wh >> 1) + 2, 1, 1); // faint pane glints
    }
    // ── the moon shaft: cool light pooling from the window across the floor ──
    ditherGlow(p, wx - 6, floorY + 10, 34, 9, "#5e7099", 0.5);
    ditherGlow(p, wx - 20, floorY + 16, 22, 7, "#8298c2", 0.3);
    // ── the kitchen table, used recently for the preparation of food ──
    const tcx = Math.round(pw * 0.56), tty = Math.round(ph * 0.68), tw = Math.round(pw * 0.24);
    const tx0 = Math.round(tcx - tw / 2);
    p.fillStyle = "#161006"; p.fillRect(tx0 - 1, tty - 1, tw + 2, 4); // sel-out under-edge
    p.fillStyle = "#7a5a32"; p.fillRect(tx0, tty, tw, 2); // top
    p.fillStyle = "#a08050"; p.fillRect(tx0 + Math.round(tw * 0.45), tty, Math.round(tw * 0.5), 1); // moonlit end of the top
    p.fillStyle = "#4a371e"; p.fillRect(tx0, tty + 2, tw, 2); // apron
    p.fillStyle = "#3a2a16"; p.fillRect(tx0 + 1, tty + 4, 2, 12); p.fillRect(tx0 + tw - 3, tty + 4, 2, 12); // rear legs
    p.fillStyle = "#523c20"; p.fillRect(tx0 + 3, tty + 4, 2, 15); p.fillRect(tx0 + tw - 5, tty + 4, 2, 15); // front legs (nearer, lighter)
    if (hasObj("KITCHEN", "SANDWICH-BAG")) {
      // the brown sack, lumpy with a gathered neck
      const scx = tx0 + 7, sy = tty - 8;
      p.fillStyle = "#1c1408"; p.fillRect(scx - 1, sy, 12, 8); // outline mass
      p.fillStyle = "#6a5230"; p.fillRect(scx, sy + 1, 10, 7);
      p.fillStyle = "#7e6338"; p.fillRect(scx + 1, sy + 1, 4, 3); // lit shoulder
      p.fillStyle = "#4a3820"; p.fillRect(scx + 6, sy + 3, 4, 5); p.fillRect(scx + 2, sy + 6, 8, 2); // folds
      p.fillStyle = "#3a2c16"; p.fillRect(scx + 3, sy - 2, 4, 3); p.fillStyle = "#8a7040"; p.fillRect(scx + 3, sy - 1, 4, 1); // gathered neck + tie
    }
    if (hasObj("KITCHEN", "BOTTLE")) {
      // the glass bottle of water — clear glass, water line, moon glint
      const bx = tx0 + tw - 10, by = tty - 10;
      p.fillStyle = "#101418"; p.fillRect(bx - 1, by, 5, 10); // outline
      p.fillStyle = "#3c5660"; p.fillRect(bx, by + 1, 3, 9);
      p.fillStyle = "#2a4048"; p.fillRect(bx, by - 2, 3, 3); p.fillStyle = "#4a6a74"; p.fillRect(bx, by - 3, 3, 1); // neck + lip
      p.fillStyle = "#54808c"; p.fillRect(bx, by + 5, 3, 4); // water inside
      p.fillStyle = "#bcd4e0"; p.fillRect(bx + 2, by + 1, 1, 8); // moonlit glass edge
      if (Math.sin(t * 2.4) > 0.55) { p.fillStyle = "#e8f4fa"; p.fillRect(bx + 2, by + 2, 1, 2); } // glint
    }
  });
}

export function livingRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const floorY = interiorBackdrop(p, pw, ph, {
      wallTop: [42, 32, 22], wallBot: [26, 20, 13], floorTop: [62, 44, 26], floorBot: [30, 21, 12], floorHi: [80, 60, 36],
      plank: "#241a0e", seam: "#160e07",
      light: { x: pw * 0.5, y: ph * 0.3, rx: pw * 0.9, ry: ph, col: [186, 170, 142], peak: 0.34 },
    }, t);
    const out = (x: number, y: number, wd: number, hh: number, c = "#100a06") => { p.fillStyle = c; p.fillRect(Math.round(x) - 1, Math.round(y) - 1, Math.round(wd) + 2, Math.round(hh) + 2); };
    // raised wood panelling: solid inset fields with lit/shadow edges (no speckle)
    const wallB = Math.round(ph * 0.08), pby = floorY - 7;
    for (let px = 6; px + Math.round(pw * 0.13) < pw - 4; px += Math.round(pw * 0.165)) {
      const pwd = Math.round(pw * 0.13);
      p.fillStyle = "rgba(10,6,2,0.3)"; p.fillRect(px, wallB + 3, pwd, pby - wallB - 6); // inset field
      p.fillStyle = "#4c3a22"; p.fillRect(px, wallB + 3, pwd, 1); p.fillRect(px, wallB + 3, 1, pby - wallB - 6); // lit top/left
      p.fillStyle = "#150e08"; p.fillRect(px, pby - 4, pwd, 1); p.fillRect(px + pwd - 1, wallB + 3, 1, pby - wallB - 6); // shadow bottom/right
    }
    p.fillStyle = "#2a1d10"; p.fillRect(0, floorY - 6, pw, 6); p.fillStyle = "#3c2c18"; p.fillRect(0, floorY - 6, pw, 1); // baseboard
    // the elvish sword, mounted on the wall high above the case
    if (hasObj("LIVING-ROOM", "SWORD")) swordMounted(p, Math.round(pw * 0.5), Math.round(ph * 0.085), Math.round(pw * 0.22));
    // the trophy case — an ornate glass cabinet (focal point), showing your treasures
    const cx = Math.round(pw * 0.5), cyT = Math.round(ph * 0.2), cw = Math.round(pw * 0.25), chH = Math.round(ph * 0.34);
    out(cx - cw / 2, cyT, cw, chH);
    p.fillStyle = "#4a3420"; p.beginPath(); p.moveTo(cx - cw / 2 - 2, cyT); p.lineTo(cx, cyT - Math.round(ph * 0.05)); p.lineTo(cx + cw / 2 + 2, cyT); p.closePath(); p.fill(); // pediment
    p.fillStyle = "#3a2814"; p.fillRect(cx - cw / 2, cyT, cw, chH); // frame
    const gx = Math.round(cx - cw / 2 + 3), gw = cw - 6, gy = cyT + 3, gh = chH - 8;
    p.fillStyle = "#0e161c"; p.fillRect(gx, gy, gw, gh); // glass interior
    const shelfYs = [gy + Math.round(gh * 0.3), gy + Math.round(gh * 0.62), gy + gh - 3];
    p.fillStyle = "#33271a"; for (const sy of shelfYs) p.fillRect(gx, sy, gw, 2); // shelves
    treasuresOf("LIVING-ROOM").forEach((nm, i) => { const sh = Math.min(2, Math.floor(i / 3)), c2 = i % 3; treasureIcon(p, nm, gx + 4 + c2 * Math.round((gw - 8) / 3), shelfYs[sh] - 7); }); // deposited treasures
    p.fillStyle = "rgba(150,190,210,0.14)"; for (let yy = 0; yy < gh; yy++) for (let xx = 0; xx < gw; xx++) if (((xx + yy) % 9) === 0 && xx + yy < gw * 0.8) p.fillRect(gx + xx, gy + yy, 1, 1); // glass reflection, top-left corner only
    p.fillRect(cx - cw / 2 + 2, cyT + chH, 3, 4); p.fillStyle = "#241a0e"; p.fillRect(cx + cw / 2 - 5, cyT + chH, 3, 4); // legs
    if (rf("LIVING-ROOM", "caseOpen")) { // the glass doors swung open at the sides
      p.fillStyle = "#3a2814"; p.fillRect(cx - cw / 2 - 4, cyT + 2, 4, chH - 4); p.fillRect(cx + cw / 2, cyT + 2, 4, chH - 4);
      p.fillStyle = "#5a4022"; p.fillRect(cx - cw / 2 - 4, cyT + 2, 1, chH - 4); p.fillRect(cx + cw / 2 + 3, cyT + 2, 1, chH - 4);
    } else { p.fillStyle = "#241a0e"; p.fillRect(cx - 1, cyT, 2, chH); } // closed: the seam between the two doors
    // the brass lantern, on top of the case
    if (hasObj("LIVING-ROOM", "LAMP")) lanternIcon(p, cx + Math.round(cw * 0.28), cyT - 8);
    // gothic wooden door (WEST), arched & nailed shut
    gothicDoor(p, Math.round(pw * 0.04), Math.round(ph * 0.18), Math.round(pw * 0.12), floorY - Math.round(ph * 0.18));
    // doorway EAST — recessed opening to the kitchen; its moonlit window shows through
    const ex = Math.round(pw * 0.86), ew = Math.round(pw * 0.12), ey = Math.round(ph * 0.18);
    p.fillStyle = "#0a0908"; p.fillRect(ex, ey, ew, floorY - ey); // dark opening
    p.fillStyle = "#17161a"; p.fillRect(ex + 3, ey + 3, ew - 3, floorY - ey - 3); // room beyond, faintly moonlit
    p.fillStyle = "#2e3b56"; p.fillRect(ex + ew - 7, ey + 8, 5, 6); p.fillStyle = "#42506e"; p.fillRect(ex + ew - 7, ey + 8, 2, 3); // the kitchen window, small in the distance
    p.fillStyle = "#141210"; p.fillRect(ex + 3, ey + 3, 3, floorY - ey - 3); // inner reveal
    p.fillStyle = "#5a4630"; p.fillRect(ex - 2, ey - 2, 2, floorY - ey + 2); p.fillRect(ex - 2, ey - 2, ew + 2, 2); // lit jamb + lintel
    p.fillStyle = "#33281a"; p.fillRect(ex + ew, ey - 1, 1, floorY - ey + 1);
    // the large oriental rug — move it aside to reveal the trap door beneath
    const rcx = Math.round(pw * 0.5), rcy = floorY + Math.round((ph - floorY) * 0.52);
    if (!rf("LIVING-ROOM", "rugMoved")) {
      orientalRug(p, rcx, rcy, Math.round(pw * 0.46), Math.round((ph - floorY) * 0.82));
    } else {
      orientalRug(p, Math.round(pw * 0.82), rcy, Math.round(pw * 0.22), Math.round((ph - floorY) * 0.66)); // bunched to one side
      trapDoor(p, Math.round(pw * 0.46), rcy, isTrapOpen()); // the revealed trap door
    }
    void t;
  });
}

export function atticPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    // the Attic is DARK — only the lamp you must be carrying lights it; it falls to black
    const floorY = interiorBackdrop(p, pw, ph, {
      wallTop: [24, 20, 14], wallBot: [13, 11, 8], floorTop: [36, 28, 17], floorBot: [10, 8, 5], floorHi: [48, 38, 23],
      plank: "#140e07", seam: "#0c0805",
      light: { x: pw * 0.5, y: ph * 0.96, rx: pw * 0.62, ry: ph * 0.92, col: [222, 168, 92], peak: 0.85 }, // the player's lit brass lamp
    }, t);
    // ── the roof: sloped planes meeting at the ridge — the attic's silhouette ──
    const cx = pw >> 1, ridgeY = Math.round(ph * 0.05), eaveY = Math.round(ph * 0.36);
    for (let x = 0; x < pw; x++) { // roof underside above the slope line, pitch-dark
      const sy = ridgeY + Math.round((Math.abs(x - cx) / cx) * (eaveY - ridgeY));
      p.fillStyle = "#080604"; p.fillRect(x, 0, 1, sy);
      p.fillStyle = "#2a1f12"; p.fillRect(x, sy, 1, 2); // lamp-caught edge of the slope
      if (((x - cx + 600) % 25) < 2) { p.fillStyle = "#1c140b"; p.fillRect(x, Math.max(0, sy - 6), 1, 6); } // rafter tails
    }
    p.fillStyle = "#312414"; p.fillRect(cx - 1, ridgeY - 2, 2, 4); // ridge beam end
    // collar tie: a heavy horizontal beam between the slopes
    const tieY = Math.round(ph * 0.16);
    p.fillStyle = "#241a0e"; p.fillRect(Math.round(cx - pw * 0.21), tieY, Math.round(pw * 0.42), 3);
    p.fillStyle = "#3a2c16"; p.fillRect(Math.round(cx - pw * 0.21), tieY, Math.round(pw * 0.42), 1);
    // ── the stairway down: an opening in the FLOOR (the only exit) ──
    const ox = Math.round(pw * 0.1), ow = Math.round(pw * 0.16), oy = Math.round(ph * 0.72), oh = Math.round(ph * 0.16);
    p.fillStyle = "#050403"; p.fillRect(ox - 2, oy - 2, ow + 4, oh + 4); // shadow curb
    p.fillStyle = "#030302"; p.fillRect(ox, oy, ow, oh); // the well, black
    p.fillStyle = "#241a0e"; p.fillRect(ox - 2, oy - 2, ow + 4, 2); p.fillRect(ox - 2, oy + oh, ow + 4, 2); p.fillRect(ox - 2, oy, 2, oh); p.fillRect(ox + ow, oy, 2, oh); // worn curb boards
    p.fillStyle = "#3c2c16"; p.fillRect(ox - 2, oy - 2, ow + 4, 1); // lamp-lit curb edge
    for (let s = 0; s < 3; s++) { const v = 26 - s * 8; p.fillStyle = `rgb(${v},${Math.round(v * 0.75)},${Math.round(v * 0.45)})`; p.fillRect(ox + 2 + s, oy + 2 + s * 4, ow - 4 - s * 2, 2); } // treads descending into dark
    p.fillStyle = "#2e2212"; p.fillRect(ox + ow + 2, oy - 6, 2, oh + 6); p.fillRect(ox + ow + 1, oy - 7, 4, 2); // newel post
    // ── the table with the nasty knife ──
    const tcx = Math.round(pw * 0.56), tty = Math.round(ph * 0.62), tw = Math.round(pw * 0.22), tx0 = tcx - (tw >> 1);
    p.fillStyle = "#120c05"; p.fillRect(tx0 - 1, tty - 1, tw + 2, 4); // sel-out
    p.fillStyle = "#6a4f2c"; p.fillRect(tx0, tty, tw, 2); p.fillStyle = "#8a6a3c"; p.fillRect(tx0 + 3, tty, tw - 6, 1); // lamp-lit top
    p.fillStyle = "#3e2e19"; p.fillRect(tx0, tty + 2, tw, 1); // apron
    p.fillStyle = "#32250f"; p.fillRect(tx0 + 1, tty + 3, 2, 9); p.fillRect(tx0 + tw - 3, tty + 3, 2, 9);
    p.fillStyle = "#46351a"; p.fillRect(tx0 + 3, tty + 3, 2, 11); p.fillRect(tx0 + tw - 5, tty + 3, 2, 11); // near legs
    if (hasObj("ATTIC", "KNIFE")) {
      // the nasty-looking knife, on the table
      const kx = tcx - 2;
      p.fillStyle = "#11141a"; p.fillRect(kx - 1, tty - 3, 12, 3); // outline
      p.fillStyle = "#aab4c2"; p.fillRect(kx, tty - 2, 7, 1); p.fillStyle = "#d8e2ec"; p.fillRect(kx, tty - 3, 6, 1); // wicked blade
      p.fillStyle = "#4a3016"; p.fillRect(kx + 7, tty - 3, 3, 2); p.fillStyle = "#2a1a0c"; p.fillRect(kx + 9, tty - 3, 1, 2); // handle
      if (Math.sin(t * 3.1) > 0.72) { p.fillStyle = "#ffffff"; p.fillRect(kx + 1, tty - 3, 1, 1); } // mean little glint
    }
    if (hasObj("ATTIC", "ROPE")) {
      // ── the large coil of rope, lying in the corner (right, half in shadow) ──
      const rcx2 = Math.round(pw * 0.85), rcy2 = Math.round(ph * 0.78);
      p.fillStyle = "#100c06"; for (let yy = -6; yy <= 6; yy++) { const xw = Math.floor(Math.sqrt(Math.max(0, 1 - (yy / 6.5) ** 2)) * 13); p.fillRect(rcx2 - xw, rcy2 + yy, xw * 2 + 1, 1); } // outline mass
      for (let ring = 11; ring >= 3; ring -= 3) { // coiled loops, flattened ellipses
        for (let a = 0; a < 64; a++) { const ang = (a / 64) * Math.PI * 2; const xx = rcx2 + Math.round(Math.cos(ang) * ring), yy = rcy2 + Math.round(Math.sin(ang) * ring * 0.45);
          p.fillStyle = (a & 2) ? "#7a6234" : "#5c4826"; p.fillRect(xx, yy, 1, 1); }
      }
      p.fillStyle = "#8a7040"; p.fillRect(rcx2 - 13, rcy2 - 3, 2, 1); p.fillRect(rcx2 - 14, rcy2 - 2, 2, 2); // the loose end
    }
    // faint lamp flicker on the nearest floor
    const fl = 0.85 + 0.15 * Math.abs(Math.sin(t * 4) + 0.3 * Math.sin(t * 9));
    p.globalAlpha = (fl - 0.85) * 0.6; p.fillStyle = "#caa24e"; for (let i = 0; i < 40; i++) { const gx = pw * 0.5 + (hash(i, 5) - 0.5) * pw * 0.5, gy = ph * 0.82 + hash(i, 6) * ph * 0.14; if (hash(i, 7) > 0.5) p.fillRect(Math.round(gx), Math.round(gy), 1, 1); }
    p.globalAlpha = 1;
  });
}

export function trollRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone"); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["EAST", "SOUTH", "WEST"]);
    // deep axe-scratches and bloodstains on the back wall
    p.fillStyle = "#2c2c33"; for (let i = 0; i < 6; i++) { const x = lay.bx0 + Math.floor(hash(i, 5) * (lay.bx1 - lay.bx0)); p.fillRect(x, lay.by0 + 4, 1, Math.round((lay.by1 - lay.by0) * 0.7)); p.fillRect(x + 2, lay.by0 + 8, 1, Math.round((lay.by1 - lay.by0) * 0.5)); }
    p.fillStyle = "#5a1212"; for (let i = 0; i < 8; i++) { const x = lay.bx0 + Math.floor(hash(i, 1) * (lay.bx1 - lay.bx0)), y = lay.by0 + Math.floor(hash(i, 2) * (lay.by1 - lay.by0)); p.fillRect(x, y, 2, 1); p.fillRect(x, y + 1, 1, 2); }
    // the troll — alive and menacing, or slain if you've defeated him
    if (rf("TROLL-ROOM", "trollDead")) {
      const bx = Math.round(pw * 0.5), by = floorY + Math.round((ph - floorY) * 0.66);
      p.fillStyle = "#2a331c"; p.fillRect(bx - 17, by - 4, 34, 6); fillDisc(p, bx - 15, by - 3, 5); p.fillStyle = "#1c2412"; p.fillRect(bx - 17, by, 34, 2); // slumped body
      p.fillStyle = "#5a4a3a"; p.fillRect(bx + 7, by - 2, 14, 2); p.fillStyle = "#b2b8c2"; p.fillRect(bx + 18, by - 5, 6, 5); p.fillStyle = "#7a1414"; p.fillRect(bx + 18, by - 5, 6, 2); // fallen axe
      p.fillStyle = "#5a1212"; for (let i = 0; i < 9; i++) p.fillRect(bx - 18 + Math.floor(hash(i, 9) * 36), by + 2 + Math.floor(hash(i, 8) * 4), 2, 1); // blood pool
    } else {
      trollSprite(p, Math.round(pw * 0.5), floorY + Math.round((ph - floorY) * 0.62), Math.round(ph * 0.46), t);
    }
  });
}

export function cyclopsRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone"); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["UP", "NE"]);
    if (rf("CYCLOPS-ROOM", "cyclopsGone")) {
      // the cyclops has fled, smashing a ragged hole clean through the east wall —
      // torn edges, darkness deepening inside, rubble avalanched onto the floor
      const hx0 = lay.bx1 - Math.round((lay.bx1 - lay.bx0) * 0.4), hw = Math.round((lay.bx1 - lay.bx0) * 0.34);
      const hyTop = lay.by0 + 3, hyBot = lay.by1 + 4;
      for (let y = hyTop; y < hyBot; y++) {
        const jl = Math.round((hash(y >> 1, 3) - 0.5) * 8), jr = Math.round((hash(y >> 1, 7) - 0.5) * 8);
        const x0 = hx0 + jl, x1 = hx0 + hw + jr;
        for (let x = x0; x < x1; x++) {
          const f = Math.min(x - x0, x1 - x) / Math.max(1, (x1 - x0) * 0.5); // 0 at the torn edge → 1 deep inside
          const v = Math.max(2, Math.round(15 - f * 13));
          p.fillStyle = `rgb(${v},${v},${v + 2})`; p.fillRect(x, y, 1, 1);
        }
        if ((y % 4) === 1) { p.fillStyle = "#787c88"; p.fillRect(x0 - 2, y, 3, 2); p.fillStyle = "#3c4048"; p.fillRect(x1 - 1, y, 2, 2); } // snapped brick ends at the torn edges
      }
      // cracks radiating into the wall that held — pixel walks
      p.fillStyle = "#1c1c22";
      for (const [sx0, sy0, ddx] of [[hx0 - 2, hyTop + 8, -1], [hx0 - 3, hyTop + 26, -1], [hx0 + hw + 2, hyTop + 16, 1]] as const) {
        let xx = sx0; for (let k = 0; k < 14; k++) { xx += ddx * (hash(xx, k) > 0.3 ? 2 : 1); p.fillRect(xx, sy0 + Math.round((hash(k, xx) - 0.5) * 4), 2, 1); }
      }
      // the avalanche of broken masonry spilling out of the hole
      for (let i = 0; i < 16; i++) {
        const rx = hx0 - 4 + Math.round(hash(i, 11) * (hw + 10)), ry = lay.by1 + 1 + Math.round(hash(i, 12) * 9);
        const bw2 = 2 + Math.round(hash(i, 13) * 3);
        p.fillStyle = "#15151a"; p.fillRect(rx, ry + 1, bw2, 2); // shadow under each block
        p.fillStyle = hash(i, 14) > 0.5 ? "#4a4e58" : "#3a3e46"; p.fillRect(rx, ry - 1, bw2, 2);
        p.fillStyle = "#6a6e78"; p.fillRect(rx, ry - 1, bw2, 1); // lamplit top
      }
    } else if (rf("CYCLOPS-ROOM", "cyclopsAsleep")) {
      // fed, watered, and dead to the world — slumped against the back wall
      const cx2 = Math.round(pw * 0.48), fy = floorY + Math.round((ph - floorY) * 0.5);
      const d0 = "#3e2c18", d1 = "#5a4226", d2 = "#755733", ink = "#1c1206", fur = "#4a3418";
      const breathe = Math.round(Math.abs(Math.sin(t * 1.1)) * 2);
      p.fillStyle = "#0e0a06"; p.fillRect(cx2 - 26, fy + 7, 64, 3); // his shadow
      p.fillStyle = d1; p.fillRect(cx2 + 4, fy + 1, 28, 6); p.fillStyle = d0; p.fillRect(cx2 + 4, fy + 5, 28, 2); // legs stretched out
      p.fillStyle = d0; p.fillRect(cx2 + 30, fy - 2, 6, 9); p.fillStyle = "#e8dec2"; p.fillRect(cx2 + 32, fy - 2, 3, 1); // feet, toenails up
      for (let yy = 0; yy < 18 + breathe; yy++) { const wd = 24 - Math.round(yy * 0.5); p.fillStyle = yy < 3 ? d2 : d1; p.fillRect(cx2 - 20, fy + 3 - yy, wd, 1); } // torso reclined, rising with each breath
      p.fillStyle = fur; p.fillRect(cx2 - 14, fy - 1, 20, 5); // loincloth
      p.fillStyle = d1; p.fillRect(cx2 - 8, fy - 9, 18, 5); p.fillStyle = d2; p.fillRect(cx2 - 8, fy - 9, 18, 1); // an arm flopped over the belly
      p.fillStyle = d1; fillDisc(p, cx2 - 13, fy - 17 - breathe, 9); p.fillStyle = d2; fillDisc(p, cx2 - 16, fy - 16 - breathe, 5); // head tipped onto the chest
      p.fillStyle = "#32220e"; p.fillRect(cx2 - 22, fy - 22 - breathe, 18, 3); // matted hair
      p.fillStyle = ink; p.fillRect(cx2 - 19, fy - 16 - breathe, 11, 2); // the one great eye, shut tight
      p.fillStyle = "#2a1208"; p.fillRect(cx2 - 16, fy - 11 - breathe, 7, 2); // slack, snoring mouth
      p.fillStyle = "#c8c4b0"; // Zzz drifting up and away
      const zt = (t * 7) % 26;
      for (const [zo, zs] of [[0, 2], [9, 3], [18, 4]] as const) {
        const prog = (zt + zo) % 26, zy = fy - 24 - prog, zx = cx2 - 4 + Math.round(prog * 0.5);
        if (zy > 6) { p.fillRect(zx, zy, zs, 1); for (let k = 0; k < zs; k++) p.fillRect(zx + zs - 1 - k, zy + 1 + k, 1, 1); p.fillRect(zx, zy + zs + 1, zs, 1); }
      }
    } else {
      // the cyclops — a huge one-eyed giant, hungry, blocking the stair
      cyclopsSprite(p, pw * 0.5, floorY + Math.round((ph - floorY) * 0.55), Math.round(ph * 0.62), t);
    }
  });
}

export function galleryPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const floorY = interiorBackdrop(p, pw, ph, { wallTop: [46, 40, 34], wallBot: [28, 24, 20], floorTop: [60, 46, 30], floorBot: [30, 22, 14], floorHi: [78, 60, 38], plank: "#241a10", seam: "#170f08", light: { x: pw * 0.5, y: ph * 0.32, rx: pw * 0.8, ry: ph * 0.9, col: [160, 150, 140], peak: 0.34 } }, t);
    // empty frames where vandals stole the art, and one remaining painting
    p.fillStyle = "#6a5436"; for (const fx of [0.16, 0.34, 0.84]) { const x = Math.round(pw * fx); p.fillRect(x - 10, Math.round(ph * 0.16), 20, Math.round(ph * 0.2)); p.fillStyle = pal0(p, x, ph); p.fillRect(x - 8, Math.round(ph * 0.16) + 2, 16, Math.round(ph * 0.2) - 4); p.fillStyle = "#6a5436"; }
    // the surviving painting (focal) — a small framed landscape, gilt-framed;
    // once it's taken, its frame hangs as empty as all the others
    const gx = Math.round(pw * 0.55), gy = Math.round(ph * 0.16), iw = 24, ih = Math.round(ph * 0.22) - 4, ix = gx - iw / 2, iy = gy + 2;
    p.fillStyle = "#8a6a3a"; p.fillRect(gx - iw / 2 - 3, gy, iw + 6, Math.round(ph * 0.22)); p.fillStyle = "#c8a24a"; p.fillRect(gx - iw / 2 - 3, gy, iw + 6, 2); p.fillStyle = "#5a431f"; p.fillRect(gx - iw / 2 - 3, gy + Math.round(ph * 0.22) - 2, iw + 6, 2); // gilt frame
    if (hasObj("GALLERY", "PAINTING")) {
      for (let yy = 0; yy < Math.round(ih * 0.58); yy++) { const f = yy / (ih * 0.58); p.fillStyle = f < 0.5 ? "#9cbcd6" : "#d2e2dc"; p.fillRect(ix, iy + yy, iw, 1); } // sky
      p.fillStyle = "#f0d878"; fillDisc(p, ix + iw - 6, iy + 5, 3); // sun
      p.fillStyle = "#6f9050"; for (let xx = 0; xx < iw; xx++) { const hy = Math.round(ih * 0.5 + Math.sin(xx * 0.45) * 2); p.fillRect(ix + xx, iy + hy, 1, ih - hy); } // far hills
      p.fillStyle = "#4d6e34"; for (let xx = 0; xx < iw; xx++) { const hy = Math.round(ih * 0.68 + Math.sin(xx * 0.3 + 2) * 2); p.fillRect(ix + xx, iy + hy, 1, ih - hy); } // near hills
      p.fillStyle = "#3a2a18"; p.fillRect(ix + 5, iy + ih - 9, 1, 5); p.fillStyle = "#3e5e2a"; fillDisc(p, ix + 5, iy + ih - 10, 3); // a little tree
    } else { p.fillStyle = "#1c1712"; p.fillRect(ix, iy, iw, ih); p.fillStyle = "#292118"; p.fillRect(ix + 2, iy + 2, iw - 4, 1); } // bare backing where it hung
    darkArch(p, Math.round(pw * 0.04), floorY - Math.round(ph * 0.26), Math.round(pw * 0.08), Math.round(ph * 0.26), "#3a342c"); // west
    void t;
  });
}

export function cellarPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    // a cold, damp, built cellar — blue-grey stone, lit by your lamp
    const L = { bx0: 0, by0: 0, bx1: 0, by1: 0 };
    Object.assign(L, stoneRoom(p, pw, ph, {
      back: [50, 54, 60], left: [32, 35, 41], right: [44, 47, 53], ceil: [20, 22, 27], floor: [50, 47, 43],
      mortar: "#23252b",
      light: { x: pw * 0.5, y: ph * 0.92, rx: pw * 0.66, ry: ph * 0.85, col: [222, 170, 100], peak: 0.72 },
    }, t));
    const { bx0, by0, bx1, by1 } = L;
    // damp: dark water-streaks weeping down the back wall + moss in the corners
    p.fillStyle = "#283640"; for (let i = 0; i < 5; i++) { const x = bx0 + Math.round(hash(i, 5) * (bx1 - bx0)); for (let y = by0 + 2; y < by1; y += 2) p.fillRect(x + Math.round(Math.sin(y * 0.3 + i) * 1), y, 1, 1); }
    p.fillStyle = "#2f4a30"; for (let i = 0; i < 10; i++) { const x = Math.round(hash(i, 6) * pw), y = Math.round((by1 - 6) + hash(i, 7) * 6); p.fillRect(x, y, 2, 2); p.fillRect(x + 1, y + 1, 2, 1); }
    // the narrow passage NORTH — a doorway cut into the back wall
    const dwx = Math.round((bx0 + bx1) / 2), dw = Math.round((bx1 - bx0) * 0.22), dh = Math.round((by1 - by0) * 0.7);
    p.fillStyle = "#4a4e56"; p.fillRect(dwx - dw / 2 - 2, by1 - dh - 2, dw + 4, dh + 2); // stone lintel/jambs
    p.fillStyle = "#050608"; p.fillRect(dwx - dw / 2, by1 - dh, dw, dh); // the dark passage
    // the trap door overhead, tucked into the ceiling's west edge — the way you
    // came in, and the door that slammed. The metal ramp climbs the west wall
    // and meets it: one structure, floor to hatch.
    const tdOpen = isTrapOpen();
    const cu0 = Math.round(by0 * 0.40), cu1 = Math.round(by0 * 0.78);
    // the rail: its FOOT stands on the wall-floor junction, and it leans up the
    // west wall to the hatch — a steep straight run, planted, not painted on
    const uh = ((cu0 + cu1) / 2) / by0; // the hatch's depth along the wall
    const u0r = 0.2; // the foot, forward of it along the floor line
    const fx0 = Math.round(bx0 * u0r), fy0 = Math.round(ph + (by1 - ph) * u0r);
    const rx1 = Math.round(bx0 * uh), ry1 = Math.round(by0 * uh);
    p.fillStyle = "#101318"; p.fillRect(fx0 - 2, fy0 + 1, 12, 2); // shadow where it stands
    for (let y = ry1; y <= fy0; y++) {
      const f = (y - ry1) / Math.max(1, fy0 - ry1);
      const x = Math.round(rx1 + (fx0 - rx1) * f), gap = 3 + Math.round(f * 3); // rails spread nearing the viewer
      p.fillStyle = "#7a828c"; p.fillRect(x, y, 1, 1); // lit near rail
      p.fillStyle = "#4c525b"; p.fillRect(x + 1, y, 1, 1);
      p.fillStyle = "#3a3e45"; p.fillRect(x + gap + 1, y, 1, 1); // far rail, in shade
      if ((fy0 - y) % 9 === 4) { p.fillStyle = "#2e3238"; p.fillRect(x + 2, y, gap - 1, 1); } // cross-ties
    }
    p.fillStyle = "#565b63"; p.fillRect(fx0 - 1, fy0 - 1, 10, 2); p.fillStyle = "#767d87"; p.fillRect(fx0 - 1, fy0 - 1, 10, 1); // the foot plate on the flagstones
    for (let y = cu0; y <= cu1; y++) {
      const u = y / by0;
      const xl = Math.round(bx0 * u), xr = Math.round(pw + (bx1 - pw) * u);
      const rowL = xl + Math.round((xr - xl) * 0.02), rowR = xl + Math.round((xr - xl) * 0.22);
      if (tdOpen) { p.fillStyle = "#040302"; p.fillRect(rowL, y, rowR - rowL, 1); } // thrown back — a hole into the house above
      else for (let x = rowL; x < rowR; x++) { const s = (x - xl) / Math.max(1, xr - xl); p.fillStyle = Math.floor((s - 0.30) / 0.05) % 2 ? "#2a2013" : "#221a0f"; p.fillRect(x, y, 1, 1); } // shut wooden planks
      p.fillStyle = tdOpen ? "#6a5124" : "#3a3e46"; p.fillRect(rowL - 1, y, 1, 1); p.fillRect(rowR, y, 1, 1); // frame (warm-lit when open)
      if (y === cu0 || y === cu1) { p.fillStyle = tdOpen ? "#6a5124" : "#3a3e46"; p.fillRect(rowL - 1, y, rowR - rowL + 2, 1); }
    }
    // the low crawlway SOUTH — a small dark hole at the front of the floor
    p.fillStyle = "#43474e"; p.fillRect(Math.round(pw * 0.5) - Math.round(pw * 0.09), ph - Math.round(ph * 0.1) - 1, Math.round(pw * 0.18), 2);
    p.fillStyle = "#050608"; p.fillRect(Math.round(pw * 0.5) - Math.round(pw * 0.08), ph - Math.round(ph * 0.1), Math.round(pw * 0.16), Math.round(ph * 0.1));
    // puddles glinting on the flagstones + slow drips
    p.fillStyle = "#34505e"; for (let i = 0; i < 5; i++) { const px = Math.round(pw * (0.34 + hash(i, 2) * 0.5)), py = by1 + Math.round((ph - by1) * (0.4 + hash(i, 3) * 0.5)); p.fillRect(px, py, 5, 1); p.fillStyle = "#4e7283"; p.fillRect(px + 1, py, 2, 1); p.fillStyle = "#34505e"; }
    ambiance(p, pw, ph, t, { x: pw * 0.5, y: ph * 0.92, peak: 0.7 });
  });
}

export function chasmPixel(eastEdge: boolean) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = litCave("cellar", "", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    // a bottomless chasm: a far rock ledge across a black gulf, and the near ledge
    // you stand on. (chasm-room's gulf runs at a slight SW→NE diagonal.)
    const tilt = eastEdge ? 0 : 1;
    const farLip = (x: number) => floorY + Math.round((hash(Math.floor(x / 4), 3) - 0.5) * 4) - tilt * Math.round((x / pw) * ph * 0.08);
    const nearLip = (x: number) => ph - Math.round((ph - floorY) * 0.26) + Math.round((hash(Math.floor(x / 4), 7) - 0.5) * 4) - tilt * Math.round((x / pw) * ph * 0.05);
    for (let x = 0; x < pw; x++) {
      const fl = farLip(x), nl = nearLip(x);
      // the gulf: the far cliff face descending in fading striations, then true black
      const cliffH = Math.round((nl - fl) * 0.62);
      for (let y2 = fl; y2 < fl + cliffH; y2++) {
        const f = (y2 - fl) / cliffH, k = hash(x >> 1, y2 >> 2);
        const v = Math.max(2, Math.round((22 - f * 20) * (k > 0.6 ? 1.4 : k < 0.2 ? 0.6 : 1)));
        p.fillStyle = `rgb(${v},${Math.max(0, v - 1)},${Math.max(0, v - 3)})`; p.fillRect(x, y2, 1, 1);
      }
      p.fillStyle = "#020203"; p.fillRect(x, fl + cliffH, 1, Math.max(0, nl - fl - cliffH)); // and below that, nothing at all
      if (hash(x >> 3, 5) > 0.8) { p.fillStyle = "#0c0a08"; p.fillRect(x, fl + cliffH - 3, 1, 5); } // fissures swallowing the last light
      p.fillStyle = "#2c2720"; p.fillRect(x, fl - 2, 1, 3); p.fillStyle = "#453d30"; p.fillRect(x, fl - 2, 1, 1); // far lip, lamp-caught
      for (let y2 = nl - 2; y2 < ph; y2++) { const k = hash(x >> 1, y2 >> 1); p.fillStyle = k > 0.75 ? "#332e26" : k > 0.3 ? "#28241d" : "#1d1a15"; p.fillRect(x, y2, 1, 1); } // the near ledge, textured rock
      p.fillStyle = "#4c4336"; p.fillRect(x, nl - 2, 1, 1); // its lit lip
      if (hash(x, 11) > 0.93) { p.fillStyle = "#3c352a"; p.fillRect(x, nl - 4, 2, 2); } // loose stones at the edge
    }
    // a spur of rock jutting out over the drop — scale for the void
    { const sx0 = Math.round(pw * (eastEdge ? 0.22 : 0.66)), snl = nearLip(sx0);
      for (let k = 0; k < 12; k++) { const wd2 = Math.round(6 * (1 - k / 12)) + 1; const y2 = snl - 3 - Math.round(k * 0.4); p.fillStyle = "#241f18"; p.fillRect(sx0 - wd2 + (eastEdge ? k : -k), y2, wd2 * 2, 2); }
      p.fillStyle = "#3c352a"; p.fillRect(sx0 + (eastEdge ? 10 : -10), snl - 8, 2, 1); } // its lit tip
    // cold air breathes up out of the dark — thin mist threads rising
    for (let i = 0; i < 4; i++) {
      const mx = Math.round(pw * (0.14 + i * 0.24)), base = nearLip(mx) - 4;
      for (let k = 0; k < 16; k++) {
        const yy = base - k, xx = mx + Math.round(Math.sin(yy * 0.2 + t * 0.7 + i * 2) * (1 + k * 0.18));
        if ((0.4 - k * 0.02) > dth(xx, yy)) { p.fillStyle = "#1b1d20"; p.fillRect(xx, yy, 2, 1); }
      }
    }
    // exits cut into the far wall / sides
    if (eastEdge) { darkArch(p, Math.round(pw * 0.46), floorY - Math.round(ph * 0.22), Math.round(pw * 0.08), Math.round(ph * 0.22), rim); darkArch(p, pw - Math.round(pw * 0.06), Math.round(ph * 0.5), Math.round(pw * 0.06), Math.round(ph * 0.16), rim); } // north passage + path east
    else {
      darkArch(p, pw - Math.round(pw * 0.07), floorY - Math.round(ph * 0.2), Math.round(pw * 0.07), Math.round(ph * 0.22), rim); // a crack opening into a passage (NE)
      darkArch(p, 0, floorY - Math.round(ph * 0.16), Math.round(pw * 0.06), Math.round(ph * 0.18), rim); // SW passage (left edge)
      stairsUp(p, Math.round(pw * 0.2), floorY - Math.round(ph * 0.42), Math.round(pw * 0.11), Math.round(ph * 0.24), rim); // UP — a stair climbing out of the rock wall
    }
    void t;
  });
}

// -- studio --
export function studioPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const floorY = interiorBackdrop(p, pw, ph, { wallTop: [50, 46, 42], wallBot: [30, 27, 24], floorTop: [56, 50, 44], floorBot: [28, 24, 20], floorHi: [74, 66, 56], plank: "#2a221a", seam: "#1a140e", light: { x: pw * 0.5, y: ph * 0.34, rx: pw * 0.8, ry: ph, col: [150, 145, 140], peak: 0.3 } }, t);
    // paint of 69 different colours — SPLATTERED: blobs with spray and wall-drips,
    // desaturated by the gloom (not neon confetti)
    const cols = ["#8a3434", "#8a7440", "#3a6a3e", "#38508a", "#6a3a86", "#8a5430", "#3a7a7a"];
    for (let i = 0; i < 22; i++) {
      const col = cols[i % cols.length];
      const x = Math.floor(hash(i, 1) * pw), y = Math.floor(hash(i, 2) * ph * 0.92);
      const r = 1 + Math.floor(hash(i, 4) * 2);
      p.fillStyle = col; fillDisc(p, x, y, r); // the blob
      for (let d2 = 0; d2 < 4; d2++) p.fillRect(x + Math.round((hash(i, 5 + d2) - 0.5) * 11), y + Math.round((hash(i, 9 + d2) - 0.5) * 7), 1, 1); // spray
      if (y < floorY - 5 && hash(i, 3) > 0.35) { const dl = 3 + Math.round(hash(i, 6) * 5); for (let dd2 = 1; dd2 <= dl; dd2++) { p.globalAlpha = 1 - (dd2 / dl) * 0.6; p.fillRect(x, y + r + dd2, 1, 1); } p.globalAlpha = 1; } // it ran down the wall
    }
    // the fireplace: brick surround, cold firebox, the dark narrow chimney up
    const fx = Math.round(pw * 0.78), fpy = floorY - Math.round(ph * 0.26), fph = Math.round(ph * 0.26);
    for (let yy = fpy; yy < floorY; yy++) for (let xx = fx - 14; xx < fx + 14; xx++) {
      const course = yy >> 2, k = hash(Math.floor((xx + (course % 2) * 4) / 8), course);
      p.fillStyle = k > 0.7 ? "#3e3028" : k > 0.3 ? "#342822" : "#2c221c"; p.fillRect(xx, yy, 1, 1);
      if (yy % 4 === 3) { p.fillStyle = "#1e1613"; p.fillRect(xx, yy, 1, 1); }
    }
    p.fillStyle = "#4a3c30"; p.fillRect(fx - 16, fpy - 2, 32, 2); // mantel
    p.fillStyle = "#0a0a0c"; p.fillRect(fx - 8, fpy + 4, 16, fph - 6); p.fillStyle = "#030203"; p.fillRect(fx - 6, fpy + 6, 12, fph - 9); // cold firebox
    for (let yy = 2; yy < fpy - 2; yy++) { const wob = Math.round(Math.sin(yy * 0.2) * 1); p.fillStyle = "#181414"; p.fillRect(fx - 5 + wob, yy, 10, 1); p.fillStyle = "#060505"; p.fillRect(fx - 3 + wob, yy, 6, 1); } // the dark and narrow chimney, wide enough for you and one item
    void fph;
    darkArch(p, Math.round(pw * 0.46), floorY - Math.round(ph * 0.22), Math.round(pw * 0.08), Math.round(ph * 0.22), "#5a5048"); // open (paint-covered) door south
    p.fillStyle = "#8a7a4a"; p.fillRect(Math.round(pw * 0.3), floorY + Math.round((ph - floorY) * 0.4), 7, 5); p.fillStyle = "#d8c890"; p.fillRect(Math.round(pw * 0.3), floorY + Math.round((ph - floorY) * 0.4), 7, 1); // ZORK owner's manual
    void t;
  });
}
