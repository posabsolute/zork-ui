/*
 * roomScenes.ts — hand-composed 2D canvas scenes for hero rooms, in the same
 * style as the title screen (glowing neon line-art on black, additive glow,
 * one clear subject, restraint). Each scene is drawn straight from the room's
 * description. This trades 3D navigation for full compositional control — which
 * is why these look like the homescreen.
 */
export type SceneDraw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

// ---- 2D toolkit -----------------------------------------------------------
function bg(ctx: CanvasRenderingContext2D, w: number, h: number, top = "#03040c", bot = "#010206") {
  ctx.globalCompositeOperation = "source-over";
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter"; // additive glow from here on
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
}
function S(ctx: CanvasRenderingContext2D, color: string, lw = 2, blur = 12) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.globalAlpha = 1;
}
function F(ctx: CanvasRenderingContext2D, color: string, blur = 14) {
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.globalAlpha = 1;
}
function ln(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.stroke();
}
function poly(ctx: CanvasRenderingContext2D, pts: number[][], close = false) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  if (close) ctx.closePath();
  ctx.stroke();
}
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function stars(ctx: CanvasRenderingContext2D, w: number, maxY: number, t: number, n = 46) {
  F(ctx, "#bfe6ff", 6);
  for (let i = 0; i < n; i++) {
    const x = ((i * 73) % 100) / 100 * w;
    const y = ((i * 37) % 100) / 100 * maxY;
    ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + i))) * 0.8;
    dot(ctx, x, y, 1.2);
  }
  ctx.globalAlpha = 1;
}
function treeline(ctx: CanvasRenderingContext2D, w: number, y: number, color: string, seedoff = 0) {
  S(ctx, color, 2, 8);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  for (let x = 0; x <= w; x += w / 28) {
    const yy = y - (6 + Math.abs(Math.sin(x * 0.03 + seedoff)) * 16 + Math.cos(x * 0.011) * 6);
    x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}
function vignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.globalCompositeOperation = "source-over";
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, h * 0.85);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(1,2,8,0.6)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// ---- shared subjects ------------------------------------------------------
type Face = "door" | "windows" | "ajar";
// glow pass then bright pass = neon bloom (like the logo)
function neon(ctx: CanvasRenderingContext2D, color: string, halo: string, draw: () => void, lw = 2.2) {
  S(ctx, halo, lw * 5, 26); draw();
  S(ctx, color, lw, 8); draw();
}
function moon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.globalCompositeOperation = "lighter";
  const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
  const pulse = 0.16 + 0.03 * Math.sin(t * 0.6);
  halo.addColorStop(0, `rgba(190,214,255,${0.45})`);
  halo.addColorStop(0.2, `rgba(120,150,220,${pulse})`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 6, 0, Math.PI * 2); ctx.fill();
  F(ctx, "#e7eeff", 24); dot(ctx, x, y, r);
  ctx.shadowBlur = 0; ctx.fillStyle = "rgba(10,14,30,0.5)"; dot(ctx, x + r * 0.4, y - r * 0.3, r * 0.7); // crater shadow
}
function clouds(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 4; i++) {
    const y = h * (0.1 + i * 0.06);
    const x = ((t * (6 + i * 3) + i * 400) % (w + 400)) - 200;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 160);
    g.addColorStop(0, "rgba(80,110,170,0.10)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 160, 36, 0, 0, Math.PI * 2); ctx.fill();
  }
}
function fog(ctx: CanvasRenderingContext2D, w: number, y: number, t: number) {
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const x = ((t * (10 + i * 6) + i * 500) % (w + 500)) - 250;
    const g = ctx.createRadialGradient(x, y + i * 10, 0, x, y + i * 10, 220);
    g.addColorStop(0, "rgba(90,140,120,0.10)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y + i * 10, 220, 26, 0, 0, Math.PI * 2); ctx.fill();
  }
}
function swayGrass(ctx: CanvasRenderingContext2D, w: number, y: number, color: string, t: number, density = 18) {
  S(ctx, color, 1.6, 6); ctx.globalAlpha = 0.7;
  for (let x = 0; x < w; x += density) {
    const hh = 6 + ((x * 7) % 12);
    const sway = Math.sin(t * 1.6 + x * 0.05) * 3;
    ln(ctx, x, y, x + sway - 2, y - hh); ln(ctx, x, y, x + sway + 2, y - hh);
  }
  ctx.globalAlpha = 1;
}
function fireflies(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, n: number, color: string) {
  F(ctx, color, 12);
  for (let i = 0; i < n; i++) {
    const x = ((i * 53) % 100) / 100 * w + Math.sin(t * 0.6 + i * 1.3) * 26;
    const y = h * 0.42 + ((i * 31) % 100) / 100 * h * 0.32 + Math.cos(t * 0.8 + i) * 16;
    ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(t * 2.2 + i));
    dot(ctx, x, y, 1.7);
  }
  ctx.globalAlpha = 1;
}

// Flat neon house (a glowing sign): cyan structure, magenta roof, lit windows.
function whiteHouse(ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, face: Face, t: number) {
  const bw = s * 2.3, bh = s * 1.5, ov = s * 0.22, rh = s * 1.0;
  const x0 = cx - bw / 2, x1 = cx + bw / 2, yt = baseY - bh;
  neon(ctx, "#6cf0ff", "rgba(40,200,255,0.5)", () => rect(ctx, x0, yt, bw, bh)); // body
  neon(ctx, "#ff5ad8", "rgba(255,70,190,0.5)", () => poly(ctx, [[x0 - ov, yt], [cx, yt - rh], [x1 + ov, yt]])); // roof
  neon(ctx, "#ff5ad8", "rgba(255,70,190,0.4)", () => ln(ctx, cx, yt - rh, cx, yt)); // ridge accent
  const fb = baseY, fy = yt;
  if (face === "door") {
    neon(ctx, "#ffc24a", "rgba(255,170,60,0.5)", () => {
      rect(ctx, cx - s * 0.3, fb - s * 0.98, s * 0.6, s * 0.98);
      ln(ctx, cx - s * 0.3, fb - s * 0.72, cx + s * 0.3, fb - s * 0.28);
      ln(ctx, cx - s * 0.3, fb - s * 0.28, cx + s * 0.3, fb - s * 0.72);
      ln(ctx, cx - s * 0.3, fb - s * 0.5, cx + s * 0.3, fb - s * 0.5);
    }, 1.8);
    win(ctx, x0 + s * 0.42, fy + s * 0.42, s * 0.5, t, 0);
    win(ctx, x1 - s * 0.52, fy + s * 0.42, s * 0.5, t, 1);
  } else if (face === "windows") {
    for (let k = -1; k <= 1; k++) win(ctx, cx + k * s * 0.74, fy + s * 0.5, s * 0.5, t, k + 1);
  } else {
    win(ctx, cx - s * 0.55, fy + s * 0.5, s * 0.5, t, 0);
    const ox = cx + s * 0.2, oy = fy + s * 0.5;
    win(ctx, ox, oy, s * 0.5, t, 1);
    neon(ctx, "#9be8ff", "rgba(120,200,255,0.4)", () =>
      poly(ctx, [[ox + s * 0.5, oy], [ox + s * 0.82, oy - s * 0.12], [ox + s * 0.82, oy + s * 0.4], [ox + s * 0.5, oy + s * 0.5]]), 1.6);
  }
}
function win(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, i: number) {
  // a buzzing neon window that occasionally flickers
  const flick = Math.sin(t * 9 + i * 2) > 0.92 ? 0.3 : 1;
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(x, y, x, y + s);
  g.addColorStop(0, `rgba(120,235,255,${0.32 * flick})`); g.addColorStop(1, `rgba(40,120,200,${0.1 * flick})`);
  ctx.fillStyle = g; ctx.fillRect(x, y, s, s); // glowing pane fill
  neon(ctx, `rgba(180,245,255,${flick})`, "rgba(120,200,255,0.4)", () => {
    rect(ctx, x, y, s, s);
    ln(ctx, x + s / 2, y, x + s / 2, y + s);
    ln(ctx, x, y + s / 2, x + s, y + s / 2);
  }, 1.6);
}
// Vertically-mirrored, faint, wavy reflection (wet-ground cyberpunk look).
function reflect(ctx: CanvasRenderingContext2D, axisY: number, alpha: number, drawFn: () => void) {
  ctx.save();
  ctx.translate(0, axisY * 2);
  ctx.scale(1, -1);
  ctx.globalAlpha = alpha;
  drawFn();
  ctx.restore();
  ctx.globalAlpha = 1;
}
function rain(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, n = 80) {
  S(ctx, "rgba(150,210,255,0.5)", 1, 4);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < n; i++) {
    const speed = 280 + (i % 5) * 60;
    const x = ((i * 137) % w) + Math.sin(i) * 4;
    const y = ((t * speed + i * 90) % (h + 60)) - 30;
    ln(ctx, x, y, x - 4, y + 16);
  }
  ctx.globalAlpha = 1;
}
/**
 * Wet-ground reflection done right: smear the subject's colours downward as soft
 * wavering gradient streaks (a colour bleed, not a mirrored clone), broken up by
 * ripple lines. `sources` = {x, w, color-with-alpha}.
 */
function reflectionGlow(
  ctx: CanvasRenderingContext2D, hz: number, h: number,
  sources: { x: number; w: number; color: string }[], t: number
) {
  ctx.globalCompositeOperation = "lighter";
  const depth = (h - hz) * 0.55;
  for (const s of sources) {
    const waver = Math.sin(t * 1.5 + s.x * 0.03) * 4;
    const g = ctx.createLinearGradient(0, hz, 0, hz + depth);
    g.addColorStop(0, s.color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(s.x - s.w / 2 + waver, hz, s.w, depth);
  }
  // horizontal ripples that break the reflection up
  S(ctx, "rgba(120,180,230,0.4)", 1, 6);
  for (let i = 0; i < 5; i++) {
    const y = hz + depth * (0.12 + i * 0.18);
    ctx.globalAlpha = 0.4 - i * 0.06;
    ctx.beginPath();
    for (let x = 0; x <= ctx.canvas.width; x += 24) {
      const yy = y + Math.sin(x * 0.05 + t * 2 + i) * 2;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function mailbox(ctx: CanvasRenderingContext2D, x: number, baseY: number, s: number, t: number) {
  S(ctx, "#fff0d0", 2.4, 14);
  ln(ctx, x, baseY, x, baseY - s * 1.4); // post
  rect(ctx, x - s * 0.6, baseY - s * 2.0, s * 1.2, s * 0.7); // box
  ln(ctx, x - s * 0.6, baseY - s * 1.85, x - s * 0.2, baseY - s * 1.65); // slot hint
  const flag = baseY - s * 1.95 + Math.sin(t * 2) * 1.5;
  poly(ctx, [[x + s * 0.6, flag], [x + s * 1.0, flag - s * 0.15], [x + s * 0.6, flag - s * 0.3]], true); // flag
}
function tree(ctx: CanvasRenderingContext2D, x: number, baseY: number, s: number, sway: number) {
  S(ctx, "#3f9a52", 2, 8);
  ln(ctx, x, baseY, x + sway, baseY - s); // trunk
  S(ctx, "#6bffa0", 2, 12);
  poly(ctx, [[x + sway, baseY - s * 1.7], [x + sway - s * 0.7, baseY - s * 0.9], [x + sway - s * 0.35, baseY - s * 0.7], [x + sway + s * 0.35, baseY - s * 0.7], [x + sway + s * 0.7, baseY - s * 0.9]], true);
}
function groundLine(ctx: CanvasRenderingContext2D, w: number, y: number, color = "#1f6a3a") {
  S(ctx, color, 1.5, 6);
  ctx.globalAlpha = 0.6;
  ln(ctx, 0, y, w, y);
  ctx.globalAlpha = 1;
}

// ---- interior stage -------------------------------------------------------
function room(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  // a simple one-point-perspective room box
  S(ctx, color, 1.6, 8);
  const l = w * 0.12, r = w * 0.88, top = h * 0.12, bot = h * 0.82;
  const il = w * 0.34, ir = w * 0.66, it = h * 0.3, ib = h * 0.58; // back wall
  rect(ctx, il, it, ir - il, ib - it); // back wall
  ln(ctx, l, top, il, it); ln(ctx, r, top, ir, it); // ceiling
  ln(ctx, l, bot, il, ib); ln(ctx, r, bot, ir, ib); // floor
  ctx.globalAlpha = 0.5; // floor boards
  for (let k = 1; k <= 4; k++) { const y = ib + (bot - ib) * (k / 5); ln(ctx, w * 0.5 - (w * 0.5 - l) * (k / 4), y, w * 0.5 + (r - w * 0.5) * (k / 4), y); }
  ctx.globalAlpha = 1;
  return { il, ir, it, ib, bot };
}

// ===========================================================================
// The ten scenes
// ===========================================================================
const SCENES: Record<string, SceneDraw> = {
  "WEST-OF-HOUSE": (ctx, w, h, t) => {
    bg(ctx, w, h, "#0b0726", "#05030f");
    const hz = h * 0.6, u = Math.min(w, h);
    // magenta city-glow on the horizon
    ctx.globalCompositeOperation = "lighter";
    const hg = ctx.createLinearGradient(0, hz - h * 0.35, 0, hz);
    hg.addColorStop(0, "rgba(0,0,0,0)"); hg.addColorStop(1, "rgba(180,40,140,0.22)");
    ctx.fillStyle = hg; ctx.fillRect(0, hz - h * 0.35, w, h * 0.35);
    stars(ctx, w, hz - h * 0.1, t, 40);
    clouds(ctx, w, h * 0.6, t);
    treeline(ctx, w, hz, "#5a2a7a");
    const hx = w * 0.58, mx = w * 0.3, my = hz + (h - hz) * 0.32;
    // horizon line
    S(ctx, "#ff5ad8", 2, 12); ln(ctx, 0, hz, w, hz);
    // the neon house + mailbox
    whiteHouse(ctx, hx, hz, u * 0.15, "door", t);
    mailbox(ctx, mx, my, u * 0.05, t);
    // a dark foreground rise with a faint neon rim, to frame the bottom
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#04030a";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += w / 16) ctx.lineTo(x, h - (h - hz) * 0.28 - Math.sin(x * 0.01) * 10);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    S(ctx, "rgba(255,90,200,0.5)", 1.5, 8);
    ctx.beginPath();
    for (let x = 0; x <= w; x += w / 16) { const y = h - (h - hz) * 0.28 - Math.sin(x * 0.01) * 10; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    fireflies(ctx, w, hz, t, 8, "#ff9ad8");
    rain(ctx, w, h, t);
    fog(ctx, w, hz + (h - hz) * 0.45, t);
  },
  "NORTH-OF-HOUSE": (ctx, w, h, t) => {
    bg(ctx, w, h);
    stars(ctx, w, h * 0.5, t);
    const hz = h * 0.66, u = Math.min(w, h);
    treeline(ctx, w, hz, "#2f8a4a");
    groundLine(ctx, w, hz);
    whiteHouse(ctx, w * 0.5, hz, u * 0.15, "windows", t);
    // a narrow path winding north into the trees
    S(ctx, "#caa46a", 2, 8);
    poly(ctx, [[w * 0.5, h * 0.95], [w * 0.52, hz + 30], [w * 0.5, hz + 6]]);
    vignette(ctx, w, h);
  },
  "SOUTH-OF-HOUSE": (ctx, w, h, t) => {
    bg(ctx, w, h);
    stars(ctx, w, h * 0.5, t);
    const hz = h * 0.66, u = Math.min(w, h);
    treeline(ctx, w, hz, "#2f8a4a");
    groundLine(ctx, w, hz);
    whiteHouse(ctx, w * 0.5, hz, u * 0.15, "windows", t);
    vignette(ctx, w, h);
  },
  "EAST-OF-HOUSE": (ctx, w, h, t) => {
    bg(ctx, w, h);
    stars(ctx, w, h * 0.5, t);
    const hz = h * 0.66, u = Math.min(w, h);
    treeline(ctx, w, hz, "#2f8a4a");
    groundLine(ctx, w, hz);
    whiteHouse(ctx, w * 0.5, hz, u * 0.15, "ajar", t);
    // path east to the clearing
    S(ctx, "#caa46a", 2, 8);
    poly(ctx, [[w, h * 0.86], [w * 0.74, hz + 14]]);
    vignette(ctx, w, h);
  },
  "FOREST-1": (ctx, w, h, t) => {
    bg(ctx, w, h, "#05100a", "#020703");
    stars(ctx, w, h * 0.35, t, 24);
    const hz = h * 0.74, u = Math.min(w, h);
    // sunlight breaking through to the east (right)
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(w * 0.9, h * 0.4, 0, w * 0.9, h * 0.4, w * 0.5);
    g.addColorStop(0, "rgba(255,224,120,0.28)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    groundLine(ctx, w, hz, "#244e22");
    // trees in all directions
    for (let i = 0; i < 9; i++) {
      const x = (i / 8) * w;
      tree(ctx, x, hz + ((i % 3) - 1) * 12, u * (0.16 + (i % 3) * 0.03), Math.sin(t * 0.6 + i) * 4);
    }
    vignette(ctx, w, h);
  },
  "PATH": (ctx, w, h, t) => {
    bg(ctx, w, h, "#05100a", "#020703");
    stars(ctx, w, h * 0.3, t, 18);
    const hz = h * 0.34, u = Math.min(w, h);
    // a path receding north to a vanishing point
    S(ctx, "#caa46a", 2, 8);
    ln(ctx, w * 0.36, h, w * 0.49, hz + 8);
    ln(ctx, w * 0.64, h, w * 0.51, hz + 8);
    for (let k = 1; k <= 5; k++) { const f = k / 6; const y = h - (h - hz) * f; const xl = w * 0.36 + (w * 0.49 - w * 0.36) * f, xr = w * 0.64 + (w * 0.51 - w * 0.64) * f; ctx.globalAlpha = 0.4; ln(ctx, xl, y, xr, y); ctx.globalAlpha = 1; }
    // flanking trees, and one great tree with low branches at the edge
    for (let i = 0; i < 5; i++) { tree(ctx, w * (0.08 + i * 0.04), h * 0.92, u * 0.12, 0); tree(ctx, w * (0.92 - i * 0.04), h * 0.92, u * 0.12, 0); }
    const gx = w * 0.78, gy = h * 0.95, gs = u * 0.34;
    S(ctx, "#3f9a52", 3, 10); ln(ctx, gx, gy, gx, gy - gs); // big trunk
    for (let b = 0; b < 4; b++) { const by = gy - gs * (0.3 + b * 0.16); ln(ctx, gx, by, gx + (b % 2 ? -1 : 1) * u * 0.16, by - u * 0.04); }
    S(ctx, "#6bffa0", 2.5, 14);
    poly(ctx, [[gx, gy - gs * 1.4], [gx - gs * 0.5, gy - gs * 0.8], [gx + gs * 0.5, gy - gs * 0.8]], true);
    vignette(ctx, w, h);
  },
  "UP-A-TREE": (ctx, w, h, t) => {
    bg(ctx, w, h, "#06120b", "#020703");
    stars(ctx, w, h * 0.4, t, 20);
    const u = Math.min(w, h);
    // big branches radiating from the trunk
    S(ctx, "#3f9a52", 3, 10);
    const tx = w * 0.5, ty = h * 0.6;
    ln(ctx, tx, h, tx, h * 0.2);
    for (let i = 0; i < 5; i++) { const a = -0.4 - i * 0.5; ln(ctx, tx, ty - i * 20, tx + Math.cos(a) * u * 0.4, ty - i * 20 + Math.sin(a) * u * 0.3); }
    // a bird's nest on a branch, with a glowing egg
    const nx = w * 0.66, ny = h * 0.45;
    S(ctx, "#caa46a", 2.5, 10);
    ctx.beginPath(); ctx.ellipse(nx, ny, u * 0.1, u * 0.05, 0, 0, Math.PI * 2); ctx.stroke();
    F(ctx, "#fff0c0", 18); ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(t * 2)); dot(ctx, nx, ny - u * 0.02, u * 0.035); ctx.globalAlpha = 1;
    // a songbird that flits
    const bx = w * 0.3 + Math.sin(t) * 12, by = h * 0.3 + Math.cos(t * 1.3) * 8;
    S(ctx, "#8fd0ff", 2, 10);
    const flap = Math.sin(t * 8) * u * 0.02;
    poly(ctx, [[bx - u * 0.04, by - flap], [bx, by + u * 0.01], [bx + u * 0.04, by - flap]]);
    vignette(ctx, w, h);
  },
  "KITCHEN": (ctx, w, h, t) => {
    bg(ctx, w, h, "#0c0803", "#040201");
    const r = room(ctx, w, h, "#caa050");
    // table with food on it
    S(ctx, "#e6c06a", 2.4, 12);
    const tx = w * 0.5, ty = h * 0.66;
    rect(ctx, tx - w * 0.1, ty, w * 0.2, h * 0.02);
    ln(ctx, tx - w * 0.08, ty + h * 0.02, tx - w * 0.08, ty + h * 0.1);
    ln(ctx, tx + w * 0.08, ty + h * 0.02, tx + w * 0.08, ty + h * 0.1);
    rect(ctx, tx - w * 0.04, ty - h * 0.03, w * 0.05, h * 0.03); // sack
    // window on the back wall, ajar, glowing
    S(ctx, "#9be8ff", 2.2, 14);
    rect(ctx, r.ir - w * 0.1, r.it + h * 0.05, w * 0.08, h * 0.12);
    // chimney + stairs up
    S(ctx, "#caa050", 2, 10);
    ln(ctx, r.il + w * 0.02, r.it, r.il + w * 0.02, r.ib);
    for (let k = 0; k < 4; k++) rect(ctx, r.ir - w * 0.02 - k * 4, r.ib - h * 0.04 - k * h * 0.03, w * 0.05, h * 0.03);
    void t;
    vignette(ctx, w, h);
  },
  "LIVING-ROOM": (ctx, w, h, t) => {
    bg(ctx, w, h, "#0c0803", "#040201");
    const r = room(ctx, w, h, "#caa050");
    // trophy case on the back wall (the focal point), softly pulsing
    S(ctx, "#ffe14a", 2.6, 12 + 6 * Math.abs(Math.sin(t * 1.5)));
    const cx = w * 0.5;
    rect(ctx, cx - w * 0.08, r.it + h * 0.04, w * 0.16, h * 0.2);
    ln(ctx, cx - w * 0.08, r.it + h * 0.11, cx + w * 0.08, r.it + h * 0.11);
    ln(ctx, cx - w * 0.08, r.it + h * 0.17, cx + w * 0.08, r.it + h * 0.17);
    // oriental rug + open trap door beneath
    S(ctx, "#c77a4a", 2, 10);
    poly(ctx, [[cx - w * 0.14, h * 0.74], [cx + w * 0.14, h * 0.74], [cx + w * 0.2, h * 0.86], [cx - w * 0.2, h * 0.86]], true);
    S(ctx, "#9be8ff", 2.2, 12);
    poly(ctx, [[cx - w * 0.05, h * 0.78], [cx + w * 0.05, h * 0.78], [cx + w * 0.07, h * 0.84], [cx - w * 0.07, h * 0.84]], true); // trap door
    // the gothic wooden door (west)
    S(ctx, "#caa050", 2.2, 10);
    poly(ctx, [[r.il + w * 0.01, r.ib], [r.il + w * 0.01, r.it + h * 0.06], [r.il + w * 0.06, r.it + h * 0.02], [r.il + w * 0.11, r.it + h * 0.06], [r.il + w * 0.11, r.ib]]);
    vignette(ctx, w, h);
  },
  "ATTIC": (ctx, w, h, t) => {
    bg(ctx, w, h, "#080604", "#020101");
    const u = Math.min(w, h);
    // sloped rafters of a cramped attic
    S(ctx, "#9a7a4a", 2, 8);
    poly(ctx, [[w * 0.1, h * 0.85], [w * 0.5, h * 0.12], [w * 0.9, h * 0.85]]);
    for (let k = -2; k <= 2; k++) ln(ctx, w * 0.5 + k * w * 0.12, h * 0.12 + Math.abs(k) * h * 0.14, w * 0.5 + k * w * 0.12, h * 0.85);
    // a thin shaft of moonlight
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(w * 0.5, 0, w * 0.5, h);
    g.addColorStop(0, "rgba(150,200,255,0.12)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(w * 0.4, 0, w * 0.2, h);
    // table, coil of rope, knife
    S(ctx, "#e6c06a", 2.2, 10);
    const tx = w * 0.42, ty = h * 0.72;
    rect(ctx, tx - w * 0.08, ty, w * 0.16, h * 0.018);
    ln(ctx, tx - w * 0.06, ty + h * 0.018, tx - w * 0.06, ty + h * 0.1);
    ln(ctx, tx + w * 0.06, ty + h * 0.018, tx + w * 0.06, ty + h * 0.1);
    S(ctx, "#ffcf8a", 2, 12); // coil of rope
    ctx.beginPath(); ctx.arc(w * 0.62, h * 0.7, u * 0.05, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w * 0.62, h * 0.7, u * 0.032, 0, Math.PI * 2); ctx.stroke();
    ln(ctx, tx - w * 0.02, ty - h * 0.005, tx + w * 0.03, ty - h * 0.005); // knife on the table
    void t;
    vignette(ctx, w, h);
  },
};

export function getRoomScene(id: string): SceneDraw | undefined {
  return SCENES[id];
}
