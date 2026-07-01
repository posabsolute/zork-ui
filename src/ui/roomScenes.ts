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

// A big soft light source with a glow pool (the homescreen's key move).
function moonGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.globalCompositeOperation = "lighter";
  const pulse = 1 + 0.04 * Math.sin(t * 0.5);
  const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 9 * pulse);
  halo.addColorStop(0, "rgba(170,200,255,0.40)");
  halo.addColorStop(0.12, "rgba(120,150,220,0.18)");
  halo.addColorStop(0.4, "rgba(60,80,150,0.06)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 9 * pulse, 0, Math.PI * 2); ctx.fill();
  F(ctx, "#eaf0ff", 30); dot(ctx, x, y, r);
  ctx.shadowBlur = 0; ctx.fillStyle = "rgba(8,12,28,0.5)"; dot(ctx, x + r * 0.35, y - r * 0.3, r * 0.7);
}
// Heavy drifting mist (atmosphere) low in the frame.
function mist(ctx: CanvasRenderingContext2D, w: number, y: number, t: number, tint = "rgba(90,120,170,0.10)") {
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5; i++) {
    const x = ((t * (8 + i * 5) + i * 420) % (w + 600)) - 300;
    const yy = y + Math.sin(i) * 18;
    const g = ctx.createRadialGradient(x, yy, 0, x, yy, 260);
    g.addColorStop(0, tint); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, yy, 260, 30, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// SILHOUETTE style (Limbo/Firewatch): the house is a solid dark shape, no outline.
// Depth comes from value layering, not lines. One warm window = the focal light.
function whiteHouse(ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, face: Face, t: number, fill = "#0a0d16") {
  const bw = s * 2.0, bh = s * 1.35, ov = s * 0.22, rh = s * 0.85;
  const x0 = cx - bw / 2, x1 = cx + bw / 2, yt = baseY - bh;
  const wingW = bw * 0.6, wingX = x0 - wingW, wingTop = baseY - bh * 0.62;
  const chx = cx + bw * 0.2, chy = yt - rh * 0.78;
  const pyTop = baseY - bh * 0.46;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = fill;
  ctx.beginPath(); // main block + gable
  ctx.moveTo(x0, baseY); ctx.lineTo(x0, yt); ctx.lineTo(x0 - ov, yt);
  ctx.lineTo(cx, yt - rh); ctx.lineTo(x1 + ov, yt); ctx.lineTo(x1, yt);
  ctx.lineTo(x1, baseY); ctx.closePath(); ctx.fill();
  ctx.beginPath(); // side wing + shed roof
  ctx.moveTo(wingX, baseY); ctx.lineTo(wingX, wingTop); ctx.lineTo(x0, wingTop - rh * 0.45);
  ctx.lineTo(x0, baseY); ctx.closePath(); ctx.fill();
  ctx.fillRect(chx, chy, s * 0.26, rh * 0.78); // chimney
  ctx.fillRect(cx - s * 0.85, pyTop, s * 1.7, s * 0.13); // porch roof
  ctx.fillRect(cx - s * 0.8, pyTop, s * 0.07, baseY - pyTop); // porch posts
  ctx.fillRect(cx + s * 0.73, pyTop, s * 0.07, baseY - pyTop);
  // the lit window — the one warm element (a glow, not an outline)
  const lit = (x: number, y: number, ws: number) => {
    ctx.globalCompositeOperation = "lighter";
    const fl = 0.75 + 0.25 * Math.abs(Math.sin(t * 3) + 0.4 * Math.sin(t * 7));
    const g = ctx.createRadialGradient(x + ws / 2, y + ws / 2, 0, x + ws / 2, y + ws / 2, ws * 2);
    g.addColorStop(0, `rgba(255,196,110,${0.6 * fl})`); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(x - ws, y - ws, ws * 3, ws * 3);
    ctx.fillStyle = `rgba(255,210,140,${0.9 * fl})`; ctx.fillRect(x, y, ws, ws * 1.2);
    ctx.fillStyle = fill; ctx.fillRect(x + ws * 0.45, y, ws * 0.1, ws * 1.2); // muntin
  };
  if (face === "windows") {
    // all dark/boarded — a couple of faintly moonlit panes, no warm light
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(120,150,210,0.10)";
    ctx.fillRect(cx - s * 0.55, yt + s * 0.45, s * 0.34, s * 0.4);
    ctx.fillRect(cx + s * 0.2, yt + s * 0.45, s * 0.34, s * 0.4);
  } else {
    lit(wingX + wingW * 0.28, wingTop + bh * 0.16, s * 0.4);
  }
}
// a bare, gnarled FOREGROUND tree as a solid dark silhouette (fills, not lines)
function bareTree(ctx: CanvasRenderingContext2D, x: number, baseY: number, hgt: number, t: number, fill = "#02030a") {
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = fill;
  ctx.lineCap = "round";
  const draw = (px: number, py: number, ang: number, len: number, depth: number, seed: number) => {
    if (depth > 4 || len < hgt * 0.04) return;
    const sway = Math.sin(t * 0.7 + depth + seed) * (0.02 + depth * 0.015);
    const wob = Math.sin(seed * 12.9) * 0.14;
    const ex = px + Math.cos(ang + sway) * len, ey = py + Math.sin(ang + sway) * len;
    ctx.lineWidth = Math.max(1, 9 - depth * 2);
    ln(ctx, px, py, ex, ey);
    draw(ex, ey, ang - 0.4 + wob, len * 0.74, depth + 1, seed + 1.7);
    draw(ex, ey, ang + 0.42 - wob, len * 0.72, depth + 1, seed + 3.1);
    if (depth < 2) draw(ex, ey, ang - 0.05, len * 0.8, depth + 1, seed + 5.3);
  };
  draw(x, baseY, -Math.PI / 2, hgt * 0.42, 0, x * 0.07);
}
// a filled silhouette ridge / hill line
function ridge(ctx: CanvasRenderingContext2D, w: number, h: number, baseY: number, amp: number, color: string, seed: number) {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += w / 40) {
    const y = baseY - (Math.sin(x * 0.004 + seed) * amp + Math.sin(x * 0.013 + seed * 2) * amp * 0.4 + amp);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
}
// a filled treeline silhouette (bumpy canopy)
function forestBand(ctx: CanvasRenderingContext2D, w: number, h: number, baseY: number, color: string, seed: number) {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += w / 60) {
    const y = baseY - (8 + Math.abs(Math.sin(x * 0.06 + seed)) * 26 + Math.abs(Math.sin(x * 0.21 + seed)) * 12);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
}
function coolWindow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, boarded = false) {
  S(ctx, "rgba(150,180,235,0.55)", 1.3, 6);
  rect(ctx, x, y, s, s);
  if (boarded) { ln(ctx, x, y + s * 0.33, x + s, y + s * 0.33); ln(ctx, x, y + s * 0.66, x + s, y + s * 0.66); }
  else { ln(ctx, x + s / 2, y, x + s / 2, y + s); ln(ctx, x, y + s / 2, x + s, y + s / 2); }
}
function warmWindow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, boarded = false, ajar = false) {
  // a faint warm glow leaking through — the focal warmth against the cold dark
  const flick = 0.7 + 0.3 * Math.abs(Math.sin(t * 3) + 0.4 * Math.sin(t * 7));
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x + s / 2, y + s / 2, 0, x + s / 2, y + s / 2, s * 1.6);
  g.addColorStop(0, `rgba(255,200,120,${0.5 * flick})`); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 3, s * 3);
  S(ctx, `rgba(255,210,140,${0.8 * flick})`, 1.4, 8);
  rect(ctx, x, y, s, s);
  if (boarded) { ln(ctx, x, y + s * 0.4, x + s, y + s * 0.4); }
  else { ln(ctx, x + s / 2, y, x + s / 2, y + s); }
  if (ajar) { S(ctx, "rgba(255,220,160,0.6)", 1.4, 8); poly(ctx, [[x + s, y], [x + s * 1.4, y - s * 0.15], [x + s * 1.4, y + s * 0.6], [x + s, y + s]]); }
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
// PIXEL-ART renderer (Elder Scrolls II: Daggerfall / Arena texture look):
// render into a tiny offscreen buffer, then nearest-neighbour upscale so every
// pixel is chunky. Ordered (Bayer) dithering + a tight palette = authentic 90s.
// ===========================================================================
const _bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dth = (x: number, y: number) => _bayer[(y & 3) * 4 + (x & 3)] / 16;
function mix(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function hash(x: number, y: number) { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }
// ordered-dither quantization of one channel to `levels` steps
function quant(v: number, th: number, levels: number) {
  const f = (v / 255) * (levels - 1);
  const base = Math.floor(f);
  const lvl = base + ((f - base) > th ? 1 : 0);
  return (lvl / (levels - 1)) * 255;
}
// posterize the VALUE to 8 dithered steps while preserving the hue exactly —
// per-channel grids fringe into rainbow speckle or wrong-hue camo bands.
function qcol(c: number[], th: number): number[] {
  const lum = Math.max(1, (c[0] + c[1] + c[2]) / 3), lf = (lum / 255) * 7, b = Math.floor(lf);
  const s = ((Math.min(7, b + (lf - b > th ? 1 : 0)) / 7) * 255) / lum;
  return [Math.min(255, c[0] * s), Math.min(255, c[1] * s), Math.min(255, c[2] * s)];
}
function sp(d: Uint8ClampedArray, pw: number, x: number, y: number, c: number[]) {
  const i = (y * pw + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
}
function fillDisc(p: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let y = -r; y <= r; y++) { const xw = Math.floor(Math.sqrt(r * r - y * y)); p.fillRect(cx - xw, cy + y, xw * 2 + 1, 1); }
}
// pixel-honest glow: plot warm pixels where falloff beats the Bayer threshold —
// a dithered halo (the retro way) instead of a smooth gaussian blur.
function ditherGlow(p: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, col: string, peak: number) {
  cx = Math.round(cx); cy = Math.round(cy);
  const RX = Math.ceil(rx), RY = Math.ceil(ry);
  p.fillStyle = col;
  for (let y = -RY; y <= RY; y++) for (let x = -RX; x <= RX; x++) {
    const d = Math.sqrt((x / rx) ** 2 + (y / ry) ** 2);
    if (d > 1) continue;
    if (peak * (1 - d) > dth(cx + x, cy + y)) p.fillRect(cx + x, cy + y, 1, 1);
  }
}
let _pbuf: HTMLCanvasElement | null = null, _pctx: CanvasRenderingContext2D | null = null;
function pixelStage(ctx: CanvasRenderingContext2D, w: number, h: number, pw: number, draw: (p: CanvasRenderingContext2D, pw: number, ph: number) => void) {
  const ph = Math.max(1, Math.round(pw * h / w));
  if (!_pbuf) { _pbuf = document.createElement("canvas"); _pctx = _pbuf.getContext("2d", { willReadFrequently: true }); }
  if (_pbuf.width !== pw || _pbuf.height !== ph) { _pbuf.width = pw; _pbuf.height = ph; }
  const p = _pctx!;
  p.globalCompositeOperation = "source-over"; p.globalAlpha = 1;
  p.clearRect(0, 0, pw, ph);
  draw(p, pw, ph);
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(_pbuf, 0, 0, pw, ph, 0, 0, w, h);
}

interface HouseOpts { door?: boolean; ajar?: boolean; face?: "front" | "back" | "end"; moonF?: number }
// The white house — an authentic Georgian/Federal COLONIAL, built around the real
// signatures (see refs): strict 5-BAY SYMMETRY, a steeply-pitched SIDE-GABLE roof
// punctuated by DORMERS, PAIRED chimneys at the gable ends, and a centred entrance
// with PILASTERS, PEDIMENT and a FANLIGHT. White clapboard, louvred shutters.
// Per face: front = the entrance + 5 bays; back = no door, one corner window ajar
// (the way in); ends = the steep gable wall, boarded. Always moonlit only — empty
// and boarded; never an interior light.
function housePixel(p: CanvasRenderingContext2D, pw: number, ph: number, horizon: number, t: number, cxFrac = 0.5, opts: HouseOpts = {}) {
  void t;
  const face = opts.face ?? (opts.door ? "front" : opts.ajar ? "back" : "end");
  const broad = face !== "end";
  const cx = Math.round(pw * cxFrac);
  const hw = Math.round(pw * (broad ? 0.4 : 0.22)), wallH = Math.round(ph * 0.26);
  const baseY = horizon + Math.round((ph - horizon) * 0.1);
  const x0 = cx - Math.floor(hw / 2), x1 = x0 + hw, wallTop = baseY - wallH;
  const wLit = "#c7ccd3", wMid = "#abb1ba", wDk = "#888e98", trim = "#e6eaef";
  const rBase = "#4a4759", rDark = "#383546", rLit = "#635f77", rEave = "#1b1a24";
  const shutter = "#2a2f39", glass = "#10141c", muntin = "#333b46", stone = "#6b6960";
  const doorW = "#3a2c1d", doorL = "#5a4630", board = "#3f3120";
  // ground shadow: a dithered dark pool hugging the footing (no smooth ellipse)
  for (let y = baseY - 1; y < baseY + 5; y++) for (let x = x0 - 8; x < x1 + 8; x++) {
    const ex = (x - cx) / (hw * 0.62), ey = (y - baseY - 1) / 3.2, dd = ex * ex + ey * ey;
    if (dd < 1 && (1 - dd) * 0.85 > dth(x, y)) { p.fillStyle = "#050806"; p.fillRect(x, y, 1, 1); }
  }
  // ---- a small reusable 4-pane shuttered window ----
  const ww = Math.max(5, Math.round(hw * (broad ? 0.075 : 0.13))), wh = Math.round(ww * 1.5);
  const win = (wcx: number, wy: number, mode: "boarded" | "ajar" | "open") => {
    const wx = Math.round(wcx - ww / 2);
    p.fillStyle = "#565c66"; p.fillRect(wx - 4, wy - 1, 1, wh + 2); // reveal shadow the shutters cast on the clapboard
    p.fillStyle = shutter; p.fillRect(wx - 3, wy, 2, wh); p.fillRect(wx + ww + 1, wy, 2, wh);
    for (let s = wy; s < wy + wh; s += 2) { p.fillStyle = "#1d222b"; p.fillRect(wx - 3, s, 2, 1); p.fillRect(wx + ww + 1, s, 2, 1); } // louvre lines
    p.fillStyle = trim; p.fillRect(wx - 1, wy - 1, ww + 2, wh + 2); p.fillStyle = glass; p.fillRect(wx, wy, ww, wh);
    p.fillStyle = "#0a0d13"; p.fillRect(wx, wy, ww, 1); // the lintel's shadow inside the reveal
    p.fillStyle = "#39465e"; p.fillRect(wx + 1, wy + 1, 2, 1); // the moon caught in the dark glass (a reflection, not a light)
    p.fillStyle = muntin; p.fillRect(wx + (ww >> 1), wy, 1, wh); p.fillRect(wx, wy + Math.round(wh / 2), ww, 1);
    p.fillStyle = trim; p.fillRect(wx - 2, wy + wh + 1, ww + 4, 1); // sill
    p.fillStyle = "#6a707a"; p.fillRect(wx - 2, wy + wh + 2, ww + 4, 1); // the sill's cast shadow
    if (mode === "boarded") { p.fillStyle = board; for (let k = 0; k < 2; k++) p.fillRect(wx - 1, wy + 2 + k * Math.round(wh * 0.5), ww + 2, 2); p.fillStyle = "#584832"; for (let k = 0; k < 2; k++) p.fillRect(wx - 1, wy + 2 + k * Math.round(wh * 0.5), ww + 2, 1); } // nailed planks, moon-caught top edge
    else if (mode === "ajar") { p.fillStyle = "#05070a"; p.fillRect(wx + 1, wy, ww - 2, 3); p.fillStyle = "#8aa0bd"; p.fillRect(wx, wy - 1, ww, 1); }
    else { p.fillStyle = "#05070a"; p.fillRect(wx, wy, ww, Math.round(wh * 0.6)); p.fillStyle = "#8aa0bd"; p.fillRect(wx, wy - Math.round(wh * 0.35), ww, 2); }
  };
  const chW = Math.max(3, Math.round(hw * (broad ? 0.06 : 0.12)));
  const chimney = (cxC: number, topY: number, hgt: number) => {
    p.fillStyle = "#3a3644"; p.fillRect(cxC, topY, chW, hgt);
    p.fillStyle = "#2c2935"; for (let yy = topY + 4; yy < topY + hgt; yy += 3) p.fillRect(cxC, yy, chW, 1); // brick courses
    p.fillStyle = "#565064"; p.fillRect(cxC + chW - 1, topY + 2, 1, hgt - 2); // moon-caught edge
    p.fillStyle = "#4a4658"; p.fillRect(cxC - 1, topY, chW + 2, 2); p.fillStyle = "#5a566c"; p.fillRect(cxC - 1, topY, chW + 2, 1); // corbelled cap
    p.fillStyle = "#15131c"; p.fillRect(cxC + 1, topY - 1, chW - 2, 1); // the cold flue mouth
  };
  const moonX = pw * (opts.moonF ?? 0.26), litLeft = moonX < cx; // which corner faces the moon
  // dithered flank shading: the wall turns away from the moonlight
  const flankShade = (x: number, yy: number) => {
    const f = litLeft ? (x - x0) / hw : (x1 - x) / hw; // 0 at lit corner → 1 at shadow corner
    return f > 0.55 && (f - 0.55) * 2.4 > dth(x, wallTop + yy);
  };
  if (broad) {
    // ---- body ----
    for (let yy = 0; yy < wallH; yy++) for (let x = x0; x < x1; x++) {
      const base = (yy % 3 === 2) ? wMid : wLit;
      p.fillStyle = yy < 2 ? wDk : yy < 4 && (yy + x) % 2 ? wDk : flankShade(x, yy) ? ((yy % 3 === 2) ? wDk : wMid) : base; // eave shadow melts down; flank falls into half-light
      p.fillRect(x, wallTop + yy, 1, 1);
    }
    p.fillStyle = wDk; p.fillRect(x0, baseY - 3, hw, 3);
    p.fillStyle = trim; p.fillRect(x0, wallTop, 2, wallH); p.fillStyle = litLeft ? "#b2b8c0" : trim; p.fillRect(x1 - 2, wallTop, 2, wallH); if (!litLeft) { p.fillStyle = "#b2b8c0"; p.fillRect(x0, wallTop, 2, wallH); } // corner boards: lit one bright, far one dimmed
    const midY = wallTop + Math.round(wallH * 0.5); p.fillStyle = trim; p.fillRect(x0, midY, hw, 1); p.fillStyle = "#8e949e"; p.fillRect(x0, midY + 1, hw, 1); // storey band + its shadow line
    p.fillStyle = "#46443e"; p.fillRect(x0 - 1, baseY - 2, hw + 2, 3);
    p.fillStyle = "#31302c"; p.fillRect(x0 - 1, baseY, hw + 2, 1); // footing sinking into shadow
    // ---- steep SIDE-GABLE roof (long ridge, modest eaves) ----
    const roofH = Math.round(wallH * 0.5), ov = Math.max(2, Math.round(hw * 0.04)), ridgeHalf = Math.round(hw * 0.43), eaveHalf = Math.round(hw / 2) + ov;
    for (let i = 0; i < roofH; i++) { const f = i / (roofH - 1), half = Math.round(eaveHalf * (1 - f) + ridgeHalf * f); p.fillStyle = (i % 3 === 0) ? rDark : rBase; p.fillRect(cx - half, wallTop - 1 - i, half * 2 + 1, 1); }
    p.fillStyle = rDark; // staggered slate ticks so the slopes read as shingles
    for (let i = 1; i < roofH; i++) { if (i % 3 === 0) continue; const f = i / (roofH - 1), half = Math.round(eaveHalf * (1 - f) + ridgeHalf * f); for (let x = cx - half + 2 + ((i % 2) * 3); x < cx + half - 2; x += 6) if (hash(x, i) > 0.4) p.fillRect(x, wallTop - 1 - i, 1, 1); }
    p.fillStyle = rLit; p.fillRect(cx - ridgeHalf, wallTop - roofH, ridgeHalf * 2 + 1, 1);
    p.fillStyle = "#7a7590"; for (let i = 1; i < roofH; i++) { const f = i / (roofH - 1), half = Math.round(eaveHalf * (1 - f) + ridgeHalf * f); p.fillRect(litLeft ? cx - half : cx + half, wallTop - 1 - i, 1, 1); } // moon skimming the raking edge
    p.fillStyle = rEave; p.fillRect(cx - eaveHalf, wallTop - 1, eaveHalf * 2 + 1, 1);
    p.fillStyle = "#9aa0aa"; for (let x = x0 + 2; x < x1 - 1; x += 4) p.fillRect(x, wallTop - 2, 1, 1); // dentil cornice, quiet in the gloom
    // paired chimneys near the ridge ends
    chimney(cx - Math.round(ridgeHalf * 0.82) - Math.round(chW / 2), wallTop - roofH - 7, roofH + 9);
    chimney(cx + Math.round(ridgeHalf * 0.82) - Math.round(chW / 2), wallTop - roofH - 7, roofH + 9);
    // two gable dormers on the front slope
    const dormer = (dcx: number) => {
      const dwd = Math.max(6, Math.round(hw * 0.08)), dyB = wallTop - Math.round(roofH * 0.5);
      for (let i = 0; i <= Math.round(dwd * 0.5) + 1; i++) { const hwid = Math.round(dwd * 0.5) + 1 - i; if (hwid >= 0) { p.fillStyle = rDark; p.fillRect(dcx - hwid, dyB - 3 - i, hwid * 2 + 1, 1); } } // little gable roof
      p.fillStyle = trim; p.fillRect(dcx - Math.round(dwd / 2), dyB - 2, dwd, 9); // dormer cheeks
      p.fillStyle = glass; p.fillRect(dcx - Math.round(dwd / 2) + 1, dyB, dwd - 2, 6); p.fillStyle = muntin; p.fillRect(dcx, dyB, 1, 6);
      p.fillStyle = board; p.fillRect(dcx - Math.round(dwd / 2) + 1, dyB + 1, dwd - 2, 1); p.fillRect(dcx - Math.round(dwd / 2) + 1, dyB + 4, dwd - 2, 1);
    };
    dormer(cx - Math.round(hw * 0.2)); dormer(cx + Math.round(hw * 0.2));
    // ---- façade windows ----
    const wyU = wallTop + Math.round(wallH * 0.13), wyL = midY + Math.round(wallH * 0.12);
    if (face === "front") {
      const bays = [0.1, 0.3, 0.5, 0.7, 0.9].map((f) => x0 + Math.round(hw * f)); // strict 5-bay
      for (const bx of bays) win(bx, wyU, "boarded"); // upper storey: 5 windows
      win(bays[0], wyL, "boarded"); win(bays[1], wyL, "boarded"); win(bays[3], wyL, "boarded"); win(bays[4], wyL, "boarded"); // 4 flanking the door
      // ---- the centred entrance: pilasters, pediment, fanlight, boarded door ----
      const dw = Math.max(8, Math.round(hw * 0.1)), dh = Math.round(wallH * 0.48), dx = cx - Math.round(dw / 2), dy = baseY - dh;
      p.fillStyle = stone; p.fillRect(dx - 3, baseY - 1, dw + 6, 2); p.fillStyle = "#54524a"; p.fillRect(dx - 1, baseY - 3, dw + 2, 2); // stone steps
      p.fillStyle = "#1d211c"; p.fillRect(dx - 4, baseY + 1, dw + 8, 1); // the steps' shadow on the grass
      p.fillStyle = "#262a32"; p.fillRect(dx - 2, dy - 1, 2, dh - 2); p.fillRect(dx + dw, dy - 1, 2, dh - 2); // the entry recess, sunk in shadow
      p.fillStyle = doorW; p.fillRect(dx, dy, dw, dh); p.fillStyle = doorL; for (let k = 0; k < 3; k++) p.fillRect(dx, dy + 4 + k * Math.round(dh * 0.26), dw, 2); p.fillStyle = "#241a10"; p.fillRect(cx, dy, 1, dh); // boarded door
      p.fillStyle = trim; p.fillRect(dx - 3, dy - 2, 1, dh + 2); p.fillRect(dx + dw + 2, dy - 2, 1, dh + 2); // pilasters
      const fr = Math.round(dw * 0.5) + 1, fcy = dy - 2;
      for (let yy = 0; yy < fr; yy++) { const hwd = Math.round(Math.sqrt(Math.max(0, fr * fr - yy * yy))); p.fillStyle = "#12161e"; p.fillRect(cx - hwd, fcy - yy, hwd * 2, 1); p.fillStyle = trim; p.fillRect(cx - hwd, fcy - yy, 1, 1); p.fillRect(cx + hwd - 1, fcy - yy, 1, 1); } // fanlight (half-round transom)
      p.fillStyle = "#39414c"; p.fillRect(cx, fcy - fr + 1, 1, fr); p.fillStyle = trim; p.fillRect(cx - fr - 1, fcy + 1, fr * 2 + 2, 1); // muntin + lintel
      for (let i = 0; i < Math.round(dw * 0.6) + 2; i++) { const half = Math.round(dw * 0.6) + 3 - i; if (half > 0) { p.fillStyle = trim; p.fillRect(cx - half, fcy - fr - 1 - i, half * 2, 1); } } // crowning pediment
    } else {
      // back: a simpler, well-spaced 3-bay × 2 grid; one corner window is ajar (the way in)
      const bays = [0.22, 0.5, 0.78].map((f) => x0 + Math.round(hw * f));
      for (const bx of bays) win(bx, wyU, "boarded"); // upper: 3 windows
      win(bays[0], wyL, "boarded"); win(bays[1], wyL, "boarded");
      const open = rf("EAST-OF-HOUSE", "windowOpen") || rf("KITCHEN", "windowOpen");
      win(bays[2], wyL, open ? "open" : "ajar");
    }
  } else {
    // ---- gable END: the steep triangular gable wall ----
    const peakH = Math.round(wallH * 0.72), ov = Math.round(hw * 0.06);
    for (let yy = 0; yy < wallH; yy++) for (let x = x0; x < x1; x++) {
      const base = (yy % 3 === 2) ? wMid : wLit;
      p.fillStyle = flankShade(x, yy) ? ((yy % 3 === 2) ? wDk : wMid) : base;
      p.fillRect(x, wallTop + yy, 1, 1);
    }
    p.fillStyle = wDk; p.fillRect(x0, baseY - 3, hw, 3);
    for (let i = 0; i <= peakH; i++) { const f = 1 - i / peakH, half = Math.round((hw / 2) * f); if (half > 0) for (let x = cx - half; x < cx + half; x++) { p.fillStyle = flankShade(x, 0) ? ((i % 3 === 2) ? wDk : wMid) : (i % 3 === 2) ? wMid : wLit; p.fillRect(x, wallTop - i, 1, 1); } } // clapboard triangle, shadow flank included
    for (let i = 0; i <= peakH; i++) { const f = 1 - i / peakH, half = Math.round((hw / 2) * Math.max(0, f)); p.fillStyle = rBase; p.fillRect(cx - half - ov, wallTop - i, 3, 1); p.fillRect(cx + half + ov - 2, wallTop - i, 3, 1); p.fillStyle = "#7a7590"; p.fillRect(litLeft ? cx - half - ov : cx + half + ov, wallTop - i, 1, 1); } // raking roof edges, moon skimming the lit rake
    p.fillStyle = trim; p.fillRect(x0, wallTop, 2, wallH); p.fillRect(x1 - 2, wallTop, 2, wallH); // corner boards
    p.fillStyle = litLeft ? "#b2b8c0" : trim; p.fillRect(x1 - 2, wallTop, 2, wallH); if (!litLeft) { p.fillStyle = "#b2b8c0"; p.fillRect(x0, wallTop, 2, wallH); } // dim the shadow-side corner board
    p.fillStyle = "#46443e"; p.fillRect(x0 - 1, baseY - 2, hw + 2, 3);
    p.fillStyle = "#31302c"; p.fillRect(x0 - 1, baseY, hw + 2, 1); // footing sinking into shadow
    chimney(cx - Math.round(chW / 2), wallTop - peakH - 6, Math.round(peakH * 0.55) + 8); // chimney at the ridge (the near end-chimney)
    const ay = wallTop - Math.round(peakH * 0.46); p.fillStyle = trim; p.fillRect(cx - 4, ay - 1, 8, 7); p.fillStyle = glass; p.fillRect(cx - 3, ay, 6, 5); p.fillStyle = muntin; p.fillRect(cx, ay, 1, 5); p.fillStyle = board; p.fillRect(cx - 3, ay + 1, 6, 1); p.fillRect(cx - 3, ay + 3, 6, 1); // boarded attic window in the gable
    const midY = wallTop + Math.round(wallH * 0.5); p.fillStyle = trim; p.fillRect(x0, midY, hw, 1);
    const e1 = x0 + Math.round(hw * 0.3), e2 = x0 + Math.round(hw * 0.7), wyU = wallTop + Math.round(wallH * 0.14), wyL = midY + Math.round(wallH * 0.14);
    win(e1, wyU, "boarded"); win(e2, wyU, "boarded"); win(e1, wyL, "boarded"); win(e2, wyL, "boarded");
  }
}
function mailboxPixel(p: CanvasRenderingContext2D, x: number, y: number) {
  p.fillStyle = "#23262d"; p.fillRect(x, y - 9, 2, 10); // post
  p.fillStyle = "#3c4452"; p.fillRect(x - 3, y - 14, 8, 5); // box body
  if (rf("WEST-OF-HOUSE", "mailboxOpen")) { // open — the little door is up and the leaflet shows
    p.fillStyle = "#15171c"; p.fillRect(x - 2, y - 13, 6, 4); // dark interior
    p.fillStyle = "#e8e0c0"; p.fillRect(x - 1, y - 13, 4, 3); // the leaflet
    p.fillStyle = "#3c4452"; p.fillRect(x - 4, y - 17, 8, 3); p.fillStyle = "#525b6a"; p.fillRect(x - 4, y - 17, 8, 1); // the open door, raised
  } else {
    p.fillStyle = "#525b6a"; p.fillRect(x - 3, y - 14, 8, 1); // lid highlight
    p.fillStyle = "#15171c"; p.fillRect(x - 3, y - 13, 1, 3); // slot
  }
  p.fillStyle = "#b03a2a"; p.fillRect(x + 5, y - 14, 1, 3); // flag
}
function fgTreePixel(p: CanvasRenderingContext2D, pw: number, ph: number, t: number) {
  const ink = "#04060a";
  const tx = Math.round(pw * 0.07), sway = Math.sin(t * 0.7);
  const leanAt = (y: number) => Math.round((1 - y / ph) * -5 + Math.sin(y * 0.1) * 1 + sway * (1 - y / ph) * 1.6);
  p.fillStyle = ink;
  for (let y = 0; y < ph; y++) {
    const f = y / ph, wd = 1 + Math.round(f * 3); // thick at the root, thin aloft
    p.fillRect(tx + leanAt(y), y, wd, 1);
  }
  p.fillStyle = "#1a2130"; for (let y = 8; y < ph; y += 3) if (hash(2, y) > 0.55) p.fillRect(tx + leanAt(y) + 1 + Math.round((y / ph) * 3), y, 1, 1); // moonlight down one edge of the bark
  // boughs that fork and taper to 1px twigs (not stubs)
  const bough = (by: number, dirx: number, len: number, seed: number) => {
    p.fillStyle = ink;
    let xx = tx + leanAt(by), yy = by;
    for (let k = 0; k < len; k++) {
      xx += dirx; if (hash(seed, k) > 0.42) yy -= 1;
      p.fillRect(xx, yy, k < len * 0.45 ? 2 : 1, 1);
      if (k === Math.round(len * 0.5)) { let ax = xx, ay = yy; for (let j = 0; j < 7; j++) { ax += dirx; if (j % 2) ay -= 1; p.fillRect(ax, ay, 1, 1); } } // upward twig
      if (k === Math.round(len * 0.75)) { let ax = xx, ay = yy; for (let j = 0; j < 5; j++) { ax += dirx; if (j % 2 === 0) ay += 1; p.fillRect(ax, ay, 1, 1); } } // drooping twig
    }
    for (let j = 0; j < 5; j++) { xx += dirx; if (j % 2) yy -= 1; p.fillRect(xx, yy, 1, 1); } // it thins away to nothing
  };
  bough(Math.round(ph * 0.14), 1, 15, 3);
  bough(Math.round(ph * 0.27), 1, 20, 4);
  bough(Math.round(ph * 0.22), -1, 8, 6);
  bough(Math.round(ph * 0.44), 1, 13, 5);
}
// The shared night backdrop for the above-ground house scenes: dithered sky +
// moon-glow pool, twinkling stars, the pixel moon, a distant treeline, dithered
// grass. Returns the horizon Y (pixel-space). `moonF` lets each face move the moon.
function pixelBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, moonF = 0.26) {
  const horizon = Math.round(ph * 0.6);
  const img = p.createImageData(pw, ph);
  const d = img.data;
  const SKYB: number[][] = [[5, 7, 18], [11, 15, 32], [18, 25, 48], [26, 34, 62]]; // committed night bands, dither only at the seams
  const glow = [150, 165, 222];
  const grndTop = [22, 30, 20], grndBot = [7, 11, 9];
  const mx = Math.round(pw * moonF), my = Math.round(ph * 0.22), mr = Math.max(3, Math.round(pw * 0.032));
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    let c: number[];
    const th = dth(x, y);
    if (y < horizon) {
      const f = (y / horizon) * (SKYB.length - 1), b = Math.floor(f);
      c = SKYB[Math.min(SKYB.length - 1, b + ((f - b) * 1.8 - 0.4 > th ? 1 : 0))];
      const dx = x - mx, dy = y - my, dist = Math.sqrt(dx * dx + dy * dy);
      const gl = Math.max(0, 1 - dist / (mr * 8));
      if (gl > 0) c = mix(c, glow, gl * gl * 0.85);
    } else {
      c = mix(grndTop, grndBot, (y - horizon) / (ph - horizon));
      const n = hash(x >> 1, y >> 1); // grass in TUFTS, not confetti
      if (n > 0.78) c = mix(c, [34, 44, 29], 0.5);
      else if (n < 0.1) c = mix(c, [5, 8, 6], 0.6);
      // the moon lays a soft pool on the lawn beneath it
      const dxm = (x - mx) / (pw * 0.3), dym = (y - (horizon + 8)) / ((ph - horizon) * 0.9);
      const pool = Math.max(0, 1 - Math.sqrt(dxm * dxm + dym * dym));
      if (pool > 0 && n > 0.35) c = mix(c, [64, 78, 92], pool * pool * 0.5);
      const fg = (y - ph * 0.82) / (ph * 0.18); // the near lawn falls out of the light
      if (fg > 0) c = mix(c, [3, 5, 4], Math.min(0.7, fg * 0.8));
    }
    sp(d, pw, x, y, qcol(c, th));
  }
  p.putImageData(img, 0, 0);
  for (let i = 0; i < 44; i++) {
    const sx = Math.floor(hash(i, 1) * pw), sy = Math.floor(hash(i, 2) * horizon * 0.92);
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
    if (tw > 0.62) { p.fillStyle = `rgba(200,214,240,${tw})`; p.fillRect(sx, sy, 1, 1); }
  }
  p.fillStyle = "#e8eaf2"; fillDisc(p, mx, my, mr);
  p.fillStyle = "#c2c6d6"; p.fillRect(mx + 1, my - 1, 2, 2); p.fillRect(mx - 2, my + 1, 1, 1);
  // distant hazy ridge — cooler, lower-contrast, taller; reads as far hills BEHIND
  // the near treeline. Irregular crests (hash-broken), not repeated sine humps.
  p.fillStyle = "#141d33";
  for (let x = 0; x < pw; x++) { const ty = horizon - (5 + Math.floor((Math.sin(x * 0.03 + 1.3) + Math.sin(x * 0.011) + 2) * 3.5 + (hash(x >> 4, 3) - 0.5) * 7)); p.fillRect(x, ty, 1, horizon - ty + 1); }
  // near treeline — near-black, ragged clumps of crowns (closer, higher contrast)
  p.fillStyle = "#08120e";
  for (let x = 0; x < pw; x++) { const clump = hash(x >> 3, 5), ty = horizon - (2 + Math.floor(Math.abs(Math.sin(x * 0.14 + clump * 4)) * (3 + clump * 7) + hash(x, 6) * 2)); p.fillRect(x, ty, 1, horizon - ty + 1); }
  p.fillStyle = "#122032"; for (let x = 0; x < pw; x += 2) if (hash(x >> 1, 8) > 0.72) p.fillRect(x, horizon - 1, 1, 1); // moonlight snagging a few crowns
  return horizon;
}
function rainPixel(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, n = 70) {
  p.fillStyle = "rgba(150,180,220,0.30)";
  for (let i = 0; i < n; i++) { const rx = Math.floor(hash(i, 7) * pw); const ry = Math.floor((t * 95 + i * 41) % (ph + 10)); p.fillRect(rx, ry, 1, 2); }
}
// a dithered dirt trail receding toward the treeline (north) or off to a side (east)
function pixelPath(p: CanvasRenderingContext2D, pw: number, ph: number, horizon: number, dir: "north" | "east") {
  const dirt = ["#4a3f28", "#3a3120", "#2a2416"];
  const pick = (x: number, y: number) => { const k = hash(x >> 1, y); return dirt[k > 0.7 ? 0 : k > 0.3 ? 1 : 2]; };
  if (dir === "north") {
    for (let y = horizon - 1; y < ph; y++) {
      const f = (y - horizon + 1) / (ph - horizon + 1);
      const half = 1.5 + f * f * pw * 0.09, cxp = pw * 0.5 + Math.sin(f * 2.4) * pw * 0.04; // it winds a little
      for (let x = Math.floor(cxp - half); x <= cxp + half; x++) {
        const ex = Math.abs(x - cxp) / half;
        if (ex > 0.8 && hash(x, y) > 0.5) continue; // ragged grassy edge
        p.fillStyle = pick(x, y); p.fillRect(x, y, 1, 1);
      }
      if (f > 0.3 && (y & 3) === 1) { p.fillStyle = "#241f12"; p.fillRect(Math.round(cxp - half * 0.3), y, 2, 1); p.fillRect(Math.round(cxp + half * 0.25), y, 2, 1); } // worn ruts
    }
  } else {
    const yBase = horizon + (ph - horizon) * 0.28;
    for (let x = Math.floor(pw * 0.5); x < pw; x++) {
      const f = (x - pw * 0.5) / (pw * 0.5);
      const half = (1.5 + (1 - f) * (ph - horizon) * 0.16) * Math.min(1, 0.15 + f * 5); // grows out of the grass, no hard cut
      const yc = yBase - f * (ph - horizon) * 0.12 + Math.sin(f * 3) * 2;
      for (let y = Math.floor(yc - half); y <= yc + half; y++) {
        const ey = Math.abs(y - yc) / half;
        if (ey > 0.8 && hash(x, y) > 0.5) continue;
        p.fillStyle = pick(x, y); p.fillRect(x, y, 1, 1);
      }
      if ((x & 3) === 1) { p.fillStyle = "#241f12"; p.fillRect(x, Math.round(yc - half * 0.3), 1, 2); p.fillRect(x, Math.round(yc + half * 0.25), 1, 2); }
    }
  }
}
function westOfHousePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = pixelBackdrop(p, pw, ph, t);
    housePixel(p, pw, ph, horizon, t, 0.56, { door: true, face: "front", moonF: 0.26 }); // colonial front: portico + boarded door, moonlit only
    mailboxPixel(p, Math.round(pw * 0.22), horizon + Math.round((ph - horizon) * 0.34));
    fgTreePixel(p, pw, ph, t);
    rainPixel(p, pw, ph, t);
  });
}
function northOfHousePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = pixelBackdrop(p, pw, ph, t, 0.74);
    pixelPath(p, pw, ph, horizon, "north"); // a path winds north into the forest
    housePixel(p, pw, ph, horizon, t, 0.64, { face: "end", moonF: 0.74 }); // north gable end: no door, boarded
    fgTreePixel(p, pw, ph, t);
    rainPixel(p, pw, ph, t);
  });
}
function southOfHousePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = pixelBackdrop(p, pw, ph, t, 0.2);
    housePixel(p, pw, ph, horizon, t, 0.5, { face: "end", moonF: 0.2 }); // south gable end: no door, boarded
    fgTreePixel(p, pw, ph, t);
    rainPixel(p, pw, ph, t);
  });
}
function behindHousePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = pixelBackdrop(p, pw, ph, t, 0.22);
    pixelPath(p, pw, ph, horizon, "east"); // a path leads east into the forest
    housePixel(p, pw, ph, horizon, t, 0.38, { ajar: true, face: "back", moonF: 0.22 }); // back façade: the small corner window, slightly ajar
    fgTreePixel(p, pw, ph, t);
    rainPixel(p, pw, ph, t);
  });
}

// ===========================================================================
// FOREST scenes (dim, textured pixel forest)
// ===========================================================================
function forestBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, lightDir: "east" | "soft" | "none") {
  const horizon = Math.round(ph * 0.72);
  // layered, committed values — sky gaps above, a canopy mass, undergrowth below.
  const img = p.createImageData(pw, ph), d = img.data;
  const SKY: number[][] = [[11, 16, 31], [21, 29, 50]];
  const CAN: number[][] = [[9, 15, 11], [14, 23, 15], [21, 33, 20]]; // canopy clumps, dark→lit (close values — no quilt)
  const GND: number[][] = [[6, 10, 7], [14, 20, 11], [22, 30, 17]];
  const WARM: number[][] = [[64, 50, 26], [110, 88, 46], [176, 146, 84]]; // the sunlight gap to the east (a real game hint)
  const COOL: number[][] = [[30, 38, 54], [52, 64, 88], [86, 100, 128]]; // moon-dapple for dim rooms
  const LIT = lightDir === "east" ? WARM : COOL;
  const edge = (x: number) => Math.round(ph * (0.1 + hash(x >> 3, 11) * 0.1 + hash(x >> 5, 7) * 0.06)); // bumpy canopy top
  const lx = pw * 1.02, lyv = ph * 0.5; // east glow origin
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    const th = dth(x, y);
    const e = edge(x);
    let c: number[];
    let gl = 0;
    if (lightDir === "east") { const dx = (x - lx) / (pw * 0.5), dy = (y - lyv) / (ph * 0.75); gl = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)); }
    else if (lightDir === "soft") { const dx = (x - pw * 0.5) / (pw * 0.62), dy = (y - ph * 0.3) / (ph * 0.8); gl = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) * 0.45; }
    // the sunlit opening to the east: a ragged clearing wedge, SOLID light —
    // trunks are drawn over it later as silhouettes (the classic forest-edge read)
    const gapEdge = lightDir === "east" ? pw * (0.8 + hash(y >> 3, 19) * 0.06) : pw * 9;
    if (x > gapEdge + (th - 0.5) * 10 && y > e - 4) {
      const fx = (x - gapEdge) / Math.max(1, pw - gapEdge);
      if (y < horizon) {
        c = WARM[fx > 0.7 ? 2 : fx > 0.28 ? 1 : 0];
        if (hash(x >> 1, y >> 1) > 0.88) c = CAN[1]; // leaf lace hanging across the light
      } else c = WARM[fx > 0.72 && y < horizon + (ph - horizon) * 0.5 ? 1 : 0];
    } else if (y < e - 2 + Math.round((th - 0.5) * 4)) {
      c = SKY[(1 - y / Math.max(1, e)) * 1.4 > th ? 0 : 1]; // night sky through the treetops
    } else if (y < horizon) {
      const k = hash(x >> 2, y >> 2); // 4px leaf clumps
      let i = k > 0.82 ? 2 : k > 0.38 ? 1 : 0;
      const fy = (y - e) / Math.max(1, horizon - e);
      if (fy > 0.75 && th > 0.4) i = Math.max(0, i - 1); // darker toward the trunks
      // moon-dapple, sparse, only through the smallest leaf gaps
      if (lightDir === "soft" && k > 0.74 && gl > 0.3 + (th - 0.5) * 0.14) c = COOL[gl > 0.75 ? 1 : 0];
      else c = CAN[i];
    } else {
      const fy = (y - horizon) / Math.max(1, ph - horizon);
      const k = hash(x >> 2, y >> 1); // undergrowth tufts, clustered
      let i = k > 0.86 ? 2 : k > 0.4 ? 1 : 0;
      if (fy > 0.6 && th > 0.35) i = Math.max(0, i - 1); // falls to dark at the frame edge
      c = lightDir === "soft" && k > 0.72 && gl > 0.36 + (th - 0.5) * 0.14 ? COOL[0] : GND[i]; // faint pools
    }
    sp(d, pw, x, y, c);
  }
  p.putImageData(img, 0, 0);
  // stars in the sky gaps, twinkling
  for (let i = 0; i < 10; i++) {
    const sx = Math.round(hash(i, 31) * pw), sy2 = Math.round(hash(i, 37) * ph * 0.09);
    if (sy2 < edge(sx) - 3 && Math.abs(Math.sin(t * 1.7 + i * 2.3)) > 0.45) { p.fillStyle = "#c8d2e8"; p.fillRect(sx, sy2, 1, 1); }
  }
  // far trunk band: flat, low-contrast verticals — black silhouettes where they
  // stand against the sunlit opening
  for (let i = 0; i < 11; i++) {
    const tx = Math.round((i + 0.2 + hash(i, 5) * 0.6) * pw / 11);
    const tw2 = 1 + (i % 2), ty = edge(tx) + 4 + Math.round(hash(i, 9) * 6);
    p.fillStyle = lightDir === "east" && tx > pw * 0.78 ? "#0a0f08" : "#0d1710";
    p.fillRect(tx, ty, tw2, horizon - ty + 2);
    if (lightDir === "east" && tx > pw * 0.78) { // branch stubs against the light
      p.fillStyle = "#0a0f08";
      p.fillRect(tx - 3, ty + 6 + (i % 3) * 4, 3, 1); p.fillRect(tx + tw2, ty + 10 + (i % 4) * 3, 4, 1);
    }
  }
  // ground mist: a thin, dithered cool band lying at the horizon
  p.fillStyle = "#333f56";
  for (let x = 0; x < pw; x++) for (let yy = -3; yy <= 1; yy++) {
    const my = horizon + yy + Math.round(Math.sin(x * 0.06 + t * 0.5) * 1.5 + (hash(x >> 3, 51) - 0.5) * 3);
    if ((0.22 - Math.abs(yy) * 0.06) > dth(x, my)) p.fillRect(x, my, 1, 1);
  }
  return horizon;
}
function pixelCanopy(p: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, greens: string[]) {
  // lobed leaf mass: overlapping clumps with a ragged dithered edge and
  // 4px-cluster colour picks — never single-pixel confetti
  const lobes = [[0, 0, 1], [-0.55, 0.18, 0.62], [0.55, 0.22, 0.66], [-0.22, -0.5, 0.56], [0.32, -0.44, 0.5]];
  const g0 = greens[0], g1 = greens[1], g2 = greens[2] || greens[1];
  for (let y = -Math.ceil(ry * 1.3); y <= ry * 1.1; y++) for (let x = -Math.ceil(rx * 1.4); x <= rx * 1.4; x++) {
    let dmin = 9;
    for (const [ox, oy, s] of lobes) { const dd = Math.sqrt(((x - ox * rx) / (rx * s)) ** 2 + ((y - oy * ry) / (ry * s)) ** 2); if (dd < dmin) dmin = dd; }
    if (dmin > 1) continue;
    const px = Math.round(cx + x), py = Math.round(cy + y);
    if ((1 - dmin) * 1.5 < dth(px, py) * 0.9) continue; // ragged rim
    const k = hash(px >> 2, py >> 2);
    p.fillStyle = y > ry * 0.25 ? (k > 0.5 ? g2 : g2) : k > 0.72 ? g0 : k > 0.3 ? g1 : g2; // lit crown, shadowed underside
    p.fillRect(px, py, 1, 1);
  }
}
function pixelTree(p: CanvasRenderingContext2D, x: number, baseY: number, hgt: number, w: number, t: number, far: boolean) {
  const sway = Math.sin(t * 0.5 + x * 0.3) * (far ? 0.6 : 1.4);
  const thick = Math.max(far ? 1 : 3, Math.round(w * 0.24));
  const bark = far ? ["#16241a", "#203420"] : ["#0a120a", "#16241a", "#28381e"]; // dark edge → mid → lit edge
  for (let y = 0; y < hgt; y++) {
    const tk = Math.max(1, Math.round(thick * (1 - (y / hgt) * 0.35))); // taper
    const xx = Math.round(x - tk / 2 + (y / hgt) * sway * 0.25);
    p.fillStyle = bark[far ? 1 : 1]; p.fillRect(xx, baseY - y, tk, 1);
    p.fillStyle = bark[0]; p.fillRect(xx, baseY - y, 1, 1);
    if (!far && tk > 2) { p.fillStyle = bark[2]; p.fillRect(xx + tk - 1, baseY - y, 1, 1); } // moon-caught edge
    if (!far && (y & 7) === 3 && hash(Math.round(x), y) > 0.5) { p.fillStyle = bark[0]; p.fillRect(xx + 1, baseY - y, Math.max(1, tk - 2), 1) } // bark rings
  }
  if (!far) { // root flare
    p.fillStyle = bark[1];
    p.fillRect(Math.round(x - thick / 2) - 2, baseY - 1, 2, 2); p.fillRect(Math.round(x + thick / 2), baseY - 1, 2, 2);
  }
  pixelCanopy(p, x + sway, baseY - hgt, w * 1.2, w, far ? ["#2a3c22", "#1e2e1a", "#141f12"] : ["#243a1a", "#182c14", "#0e1c0d"]);
}
function forest1Pixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = forestBackdrop(p, pw, ph, t, "east"); // sunlight to the east — the way out
    for (let i = 0; i < 5; i++) pixelTree(p, pw * (0.1 + i * 0.16), horizon + 4, ph * (0.3 + hash(i, 21) * 0.1), pw * 0.05, t, true);
    pixelTree(p, pw * 0.3, ph - 2, ph * 0.8, pw * 0.09, t, false);
    pixelTree(p, pw * 0.12, ph + 8, ph * 1.0, pw * 0.12, t, false); // near framing tree, off-centre
    // motes drifting in the eastern light shaft
    p.fillStyle = "#d8c48a";
    for (let i = 0; i < 10; i++) { const mx = pw * 0.72 + hash(i, 3) * pw * 0.26; const my = ph * 0.25 + ((t * 4 + i * 30) % (ph * 0.5)); if (hash(i, 4) > 0.4) p.fillRect(Math.round(mx), Math.round(my), 1, 1); }
  });
}
function pathPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function upATreePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    // egg: golden ovoid with a jewel glint (reflective sheen, NOT a light source)
    p.fillStyle = "#c9a23a"; for (let yy = -4; yy <= 4; yy++) { const xw = Math.floor(Math.sqrt(1 - (yy / 4.5) ** 2) * 3.4); p.fillRect(nx - xw, ny - 2 + yy, xw * 2 + 1, 1); }
    p.fillStyle = "#f0d878"; p.fillRect(nx - 1, ny - 4, 2, 2); // highlight
    if (Math.sin(t * 2) > 0.6) { p.fillStyle = "#fff4c0"; p.fillRect(nx - 1, ny - 4, 1, 1); } // glint
    p.fillStyle = "#8a6a22"; p.fillRect(nx - 2, ny + 1, 4, 1); // shadow band
  });
}

// ===========================================================================
// INTERIOR scenes (textured room box; lit per the game — Attic is dark)
// ===========================================================================
interface RoomOpts { wallTop: number[]; wallBot: number[]; floorTop: number[]; floorBot: number[]; floorHi: number[]; plank: string; seam: string; light?: { x: number; y: number; rx: number; ry: number; col: number[]; peak: number }; }
// A short material ramp with the classic hue bend: shadow steps cool toward
// blue, lit steps warm toward yellow. Committed colours — the dither picks
// BETWEEN adjacent steps, never invents new hues (that read as rainbow static).
function ramp4(dark: number[], light: number[], n = 4): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1), c = mix(dark, light, f), bend = (f - 0.5) * 2;
    out.push([c[0] * (1 + 0.07 * bend), c[1] * (1 + 0.02 * bend), c[2] * (1 - 0.07 * bend)]);
  }
  return out;
}
function interiorBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, o: RoomOpts, t = 0) {
  const floorY = Math.round(ph * 0.6);
  const ceilY = Math.round(ph * 0.05);
  const wallRamp = ramp4(o.wallBot, o.wallTop);
  const floorRamp = ramp4(o.floorBot, o.floorTop, 5);
  const L = o.light;
  const litWall = L ? wallRamp.map((c) => mix(c, L.col, 0.38)) : wallRamp;
  const litFloor = L ? floorRamp.map((c) => mix(c, L.col, 0.38)) : floorRamp;
  const vx = Math.round(pw * 0.5); // vanishing x for the plank fan
  const img = p.createImageData(pw, ph), d = img.data;
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    const th = dth(x, y);
    let f: number, ramp: number[][], lit: number[][];
    if (y < floorY) {
      f = 0.8 - (y / floorY) * 0.42; // plaster, lighter up top
      const n = hash(x >> 2, y >> 2); // clustered stains, never lone pixels
      if (n > 0.91) f -= 0.09; else if (n < 0.06) f += 0.07;
      ramp = wallRamp; lit = litWall;
    } else {
      const fy = (y - floorY) / Math.max(1, ph - floorY);
      f = 0.72 - fy * 0.4; // boards fall off toward the viewer
      const g = hash(Math.floor((x - vx) / 4), y >> 1); // grain along the boards
      if (g > 0.88) f += 0.12; else if (g < 0.08) f -= 0.1;
      ramp = floorRamp; lit = litFloor;
    }
    let gl = 0;
    if (L) { const dx = (x - L.x) / L.rx, dy = (y - L.y) / L.ry; gl = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)); }
    f += gl * gl * (L ? L.peak : 0) * 0.5;
    const n = ramp.length, fi = Math.max(0, Math.min(1, f)) * (n - 1), b = Math.floor(fi);
    const idx = Math.min(n - 1, b + (fi - b > th ? 1 : 0)); // dithered ramp pick
    const c = L && gl * L.peak > 0.32 + (th - 0.5) * 0.12 ? lit[idx] : ramp[idx]; // narrow dither band — most of the surface stays a solid ramp step
    sp(d, pw, x, y, c);
  }
  p.putImageData(img, 0, 0);
  // ceiling strip + crown shadow — caps the room so it reads enclosed
  p.fillStyle = "#0c0906"; p.fillRect(0, 0, pw, ceilY);
  p.fillStyle = "#251b10"; p.fillRect(0, ceilY, pw, 1);
  // perspective floor: seam rows widen toward the viewer; board joints fan
  // out from the vanishing point, staggered every other course like real boards
  const rows: number[] = []; let ly = floorY, k = 1;
  p.fillStyle = o.plank;
  while (ly < ph) { rows.push(ly); p.fillRect(0, ly, pw, 1); ly = floorY + Math.round(k * k * 0.6); k++; }
  rows.push(ph);
  p.fillStyle = o.seam;
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r], y1 = Math.min(ph, rows[r + 1]);
    const sp2 = 12 + ((y0 - floorY) / Math.max(1, ph - floorY)) * 26;
    const off = (r % 2) * sp2 * 0.5;
    for (let j = -14; j <= 14; j++) {
      const xb = vx + j * sp2 + off;
      for (let y2 = y0 + 1; y2 < y1; y2++) {
        const dd2 = (y2 - floorY) / Math.max(1, ph - floorY);
        const xx = Math.round(vx + (xb - vx) * (0.4 + dd2 * 0.6));
        if (xx >= 0 && xx < pw) p.fillRect(xx, y2, 1, 1);
      }
    }
  }
  p.fillRect(0, floorY, pw, 1);
  ambiance(p, pw, ph, t, o.light);
  return floorY;
}
function tablePixel(p: CanvasRenderingContext2D, cx: number, topY: number, wdt: number, legH: number, wood: string, woodDk: string) {
  const x0 = Math.round(cx - wdt / 2);
  p.fillStyle = wood; p.fillRect(x0, topY, wdt, 3); p.fillStyle = woodDk; p.fillRect(x0, topY, wdt, 1);
  p.fillStyle = woodDk; p.fillRect(x0 + 1, topY + 3, 2, legH); p.fillRect(x0 + wdt - 3, topY + 3, 2, legH);
}
function kitchenPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    // the brown sack, lumpy with a gathered neck
    const scx = tx0 + 7, sy = tty - 8;
    p.fillStyle = "#1c1408"; p.fillRect(scx - 1, sy, 12, 8); // outline mass
    p.fillStyle = "#6a5230"; p.fillRect(scx, sy + 1, 10, 7);
    p.fillStyle = "#7e6338"; p.fillRect(scx + 1, sy + 1, 4, 3); // lit shoulder
    p.fillStyle = "#4a3820"; p.fillRect(scx + 6, sy + 3, 4, 5); p.fillRect(scx + 2, sy + 6, 8, 2); // folds
    p.fillStyle = "#3a2c16"; p.fillRect(scx + 3, sy - 2, 4, 3); p.fillStyle = "#8a7040"; p.fillRect(scx + 3, sy - 1, 4, 1); // gathered neck + tie
    // the glass bottle of water — clear glass, water line, moon glint
    const bx = tx0 + tw - 10, by = tty - 10;
    p.fillStyle = "#101418"; p.fillRect(bx - 1, by, 5, 10); // outline
    p.fillStyle = "#3c5660"; p.fillRect(bx, by + 1, 3, 9);
    p.fillStyle = "#2a4048"; p.fillRect(bx, by - 2, 3, 3); p.fillStyle = "#4a6a74"; p.fillRect(bx, by - 3, 3, 1); // neck + lip
    p.fillStyle = "#54808c"; p.fillRect(bx, by + 5, 3, 4); // water inside
    p.fillStyle = "#bcd4e0"; p.fillRect(bx + 2, by + 1, 1, 8); // moonlit glass edge
    if (Math.sin(t * 2.4) > 0.55) { p.fillStyle = "#e8f4fa"; p.fillRect(bx + 2, by + 2, 1, 2); } // glint
  });
}
// ── Interactive room states (PER ROOM) ───────────────────────────────────
// Rooms that have interactive elements the scene reflects, and their flags:
//   WEST-OF-HOUSE : mailboxOpen
//   EAST-OF-HOUSE : windowOpen          (the small window you climb through)
//   KITCHEN       : windowOpen
//   LIVING-ROOM   : rugMoved, trapOpen, caseOpen, treasures[]
//   TROLL-ROOM    : trollDead
//   CYCLOPS-ROOM  : cyclopsGone
//   GRATING-ROOM  : gratingOpen
//   DAM-ROOM      : gatesOpen
//   RESERVOIR     : drained
//   EGYPT-ROOM    : coffinOpen
//   MIRROR-ROOM-1/2 : broken          (break the mirror → it shatters)
//   DOME-ROOM     : ropeTied          (tie the rope to the railing → it hangs down)
//   GRATING-CLEARING : leavesMoved    (move the leaves → the grating is exposed)
//   ENTRANCE-TO-HADES : spiritsGone   (exorcise the evil spirits)
//   TORCH-ROOM    : torchTaken        (take the torch off the pedestal)
type RoomFlags = { [k: string]: boolean | string[] };
export const roomState: Record<string, RoomFlags> = {
  "WEST-OF-HOUSE": { mailboxOpen: false },
  "EAST-OF-HOUSE": { windowOpen: false },
  "KITCHEN": { windowOpen: false },
  "LIVING-ROOM": { rugMoved: false, trapOpen: false, caseOpen: false, treasures: [] },
  "TROLL-ROOM": { trollDead: false },
  "CYCLOPS-ROOM": { cyclopsGone: false },
  "GRATING-ROOM": { gratingOpen: false },
  "DAM-ROOM": { gatesOpen: false },
  "RESERVOIR": { drained: false },
  "EGYPT-ROOM": { coffinOpen: false },
  "MIRROR-ROOM-1": { broken: false },
  "MIRROR-ROOM-2": { broken: false },
  "DOME-ROOM": { ropeTied: false },
  "GRATING-CLEARING": { leavesMoved: false },
  "ENTRANCE-TO-HADES": { spiritsGone: false },
  "TORCH-ROOM": { torchTaken: false },
  "SANDY-CAVE": { dug: false },
  "LOUD-ROOM": { echoFixed: false },
  "SHAFT-ROOM": { basketLowered: false }, // the basket on the chain (shared with LOWER-SHAFT)
};
export function setRoomFlag(room: string, key: string, val: boolean | string[]) { (roomState[room] ||= {})[key] = val; }
function rf(room: string, key: string): boolean { return roomState[room]?.[key] === true; }
function treasuresOf(room: string): string[] { const v = roomState[room]?.treasures; return Array.isArray(v) ? v : []; }
function trapDoor(p: CanvasRenderingContext2D, cx: number, cy: number, open: boolean) {
  const wd = 22, hd = 14, x0 = Math.round(cx - wd / 2), y0 = Math.round(cy - hd / 2);
  p.fillStyle = "#0c0806"; p.fillRect(x0 - 2, y0 - 2, wd + 4, hd + 4); // frame outline
  p.fillStyle = "#2c2014"; p.fillRect(x0 - 1, y0 - 1, wd + 2, hd + 2); // stone/wood curb
  if (open) {
    p.fillStyle = "#030304"; p.fillRect(x0, y0, wd, hd); // the hole down to the cellar
    p.fillStyle = "#191007"; p.fillRect(x0 + 2, y0 + 2, wd - 4, 2); p.fillStyle = "#241708"; p.fillRect(x0 + 4, y0 + 5, wd - 8, 2); // top rungs of the ladder, fading
    p.fillStyle = "#0e0904"; p.fillRect(x0 + 6, y0 + 9, wd - 12, 1);
    // the lifted lid, thrown back above the hole
    p.fillStyle = "#160f08"; p.fillRect(x0 - 2, y0 - 7, wd + 4, 6);
    p.fillStyle = "#43301a"; p.fillRect(x0 - 1, y0 - 6, wd + 2, 4);
    p.fillStyle = "#5f4626"; p.fillRect(x0 - 1, y0 - 6, wd + 2, 1); // lit lid edge
    p.fillStyle = "#241810"; p.fillRect(x0 + Math.round(wd / 3), y0 - 5, 1, 3); p.fillRect(x0 + Math.round(wd * 2 / 3), y0 - 5, 1, 3); // lid planks
    p.fillStyle = "#caa24a"; p.fillRect(x0 + (wd >> 1) - 1, y0 - 4, 3, 2); // ring on the lid
  } else {
    p.fillStyle = "#3a2a18"; p.fillRect(x0, y0, wd, hd);
    p.fillStyle = "#54401f"; p.fillRect(x0, y0, wd, 1); // lit top edge
    p.fillStyle = "#241810"; for (let i = 1; i < 4; i++) p.fillRect(x0 + Math.round(i * wd / 4), y0, 1, hd); // planks
    p.fillStyle = "#4a3820"; for (let i = 0; i < 4; i++) p.fillRect(x0 + 2 + Math.round(i * wd / 4), y0 + hd - 3, 1, 1); // plank nails
    p.fillStyle = "#2e261c"; p.fillRect(x0 + wd - 7, y0 + (hd >> 1) - 1, 5, 3); // ring plate
    p.fillStyle = "#caa24a"; p.fillRect(x0 + wd - 6, y0 + (hd >> 1), 3, 2); p.fillStyle = "#e8cc7a"; p.fillRect(x0 + wd - 6, y0 + (hd >> 1), 2, 1); // iron ring, glinting
  }
}
function treasureIcon(p: CanvasRenderingContext2D, name: string, x: number, y: number) {
  const n = name.toLowerCase();
  const col = /gold|coin|coffin|sceptre|scepter|chalice|\bbar\b|bell|bauble|canary|torch|brass|crown/.test(n) ? "#e8c24a"
    : /sapphire|diamond|crystal|trident|skull|aquamarine|bracelet/.test(n) ? "#7fe0ff"
      : /emerald|jade/.test(n) ? "#6affa0"
        : /egg|scarab|figurine|ivory|pearl|painting|trunk/.test(n) ? "#e8dcc0" : "#ff8ad8";
  p.fillStyle = "#0a0a0c"; p.fillRect(x - 1, y - 1, 7, 8); // outline
  p.fillStyle = col; p.fillRect(x, y, 5, 6);
  p.fillStyle = "rgba(0,0,0,0.32)"; p.fillRect(x + 3, y + 1, 2, 5); // shaded facet
  p.fillStyle = "#ffffff"; p.fillRect(x + 1, y, 1, 1); // glint
}
function swordMounted(p: CanvasRenderingContext2D, cx: number, y: number, len: number) {
  const x0 = Math.round(cx - len / 2);
  p.fillStyle = "#241a0e"; p.fillRect(x0 + 4, y - 2, 2, 7); p.fillRect(x0 + len - 8, y - 2, 2, 7); // mounting pegs
  p.fillStyle = "#0c0c10"; p.fillRect(x0 - 4, y - 1, len - 4, 5); // outline
  p.fillStyle = "#c6d2e2"; p.fillRect(x0 - 3, y + 1, len - 13, 1); p.fillRect(x0, y, len - 13, 3); // blade
  p.fillStyle = "#eef4fc"; p.fillRect(x0, y, len - 15, 1); // top shine
  p.fillStyle = "#8fb0d8"; p.fillRect(x0, y + 2, len - 14, 1); // elvish blue lower edge
  const hx = x0 + len - 11; p.fillStyle = "#0c0c10"; p.fillRect(hx - 1, y - 3, 3, 9);
  p.fillStyle = "#8a6a32"; p.fillRect(hx, y - 2, 2, 7); // crossguard
  p.fillStyle = "#a8823e"; p.fillRect(hx + 2, y, 6, 3); // grip
  p.fillStyle = "#d8b25a"; p.fillRect(hx + 8, y, 2, 3); // pommel
}
function lanternIcon(p: CanvasRenderingContext2D, x: number, y: number) {
  p.fillStyle = "#0c0c10"; p.fillRect(x - 1, y - 2, 9, 12); // outline
  p.fillStyle = "#9a7a30"; p.fillRect(x + 2, y - 2, 3, 2); // ring handle
  p.fillStyle = "#caa24a"; p.fillRect(x, y, 7, 2); p.fillRect(x, y + 8, 7, 2); // brass top/bottom
  p.fillStyle = "#7a5e22"; p.fillRect(x, y + 2, 7, 6); // cage frame
  p.fillStyle = "#241f14"; p.fillRect(x + 1, y + 2, 5, 6); // dark glass (unlit)
  p.fillStyle = "#caa24a"; p.fillRect(x + 2, y + 2, 1, 6); p.fillRect(x + 4, y + 2, 1, 6); // bars
}
function gothicDoor(p: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number) {
  const arch = Math.round(dw * 0.5);
  p.fillStyle = "#0c0a06"; p.fillRect(dx - 1, dy + arch - 1, dw + 2, dh - arch + 2); // outline
  p.beginPath(); p.arc(dx + dw / 2, dy + arch, dw / 2 + 1, Math.PI, 0); p.fill();
  p.fillStyle = "#3a2a1a"; p.fillRect(dx, dy + arch, dw, dh - arch);
  p.beginPath(); p.arc(dx + dw / 2, dy + arch, dw / 2, Math.PI, 0); p.fill(); // arched top
  p.fillStyle = "#4e3a24"; for (let i = 0; i < 4; i++) p.fillRect(dx + Math.round(i * dw / 4) + 1, dy + Math.round(arch * 0.5), 1, dh - Math.round(arch * 0.5)); // plank lit edges
  p.fillStyle = "#221610"; for (let i = 1; i < 4; i++) p.fillRect(dx + Math.round(i * dw / 4), dy + Math.round(arch * 0.5), 1, dh - Math.round(arch * 0.5)); // plank seams
  for (const by of [Math.round(dh * 0.48), Math.round(dh * 0.78)]) { // iron strap hinges, dark with a worn shine
    p.fillStyle = "#26221c"; p.fillRect(dx, dy + by, dw, 3);
    p.fillStyle = "#413a30"; p.fillRect(dx, dy + by, dw, 1);
    p.fillStyle = "#5c503c"; p.fillRect(dx + 2, dy + by + 1, 1, 1); p.fillRect(dx + dw - 3, dy + by + 1, 1, 1); p.fillRect(dx + (dw >> 1), dy + by + 1, 1, 1); // bolt heads
  }
  p.fillStyle = "#1a120c"; for (let i = 0; i < 5; i++) p.fillRect(dx + 2 + Math.round(i * (dw - 5) / 4), dy + Math.round(arch * 0.62), 1, 1); // nail studs along the arch — nailed shut
}
function orientalRug(p: CanvasRenderingContext2D, cx: number, cy: number, rw: number, rh: number) {
  const x0 = Math.round(cx - rw / 2), y0 = Math.round(cy - rh / 2);
  p.fillStyle = "#0c0606"; p.fillRect(x0 - 1, y0 - 1, rw + 2, rh + 2); // outline
  for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) { // woven two-tone field
    p.fillStyle = (xx + yy * 2) % 4 < 2 ? "#78231b" : "#671d15";
    p.fillRect(x0 + xx, y0 + yy, 1, 1);
  }
  p.fillStyle = "#caa24a"; p.fillRect(x0, y0, rw, 2); p.fillRect(x0, y0 + rh - 2, rw, 2); p.fillRect(x0, y0, 2, rh); p.fillRect(x0 + rw - 2, y0, 2, rh); // gold border
  p.fillStyle = "#8a6a2c"; for (let xx = x0 + 2; xx < x0 + rw - 2; xx += 2) { p.fillRect(xx, y0 + 1, 1, 1); p.fillRect(xx + 1, y0 + rh - 2, 1, 1); } // border knot ticks
  p.fillStyle = "#243a6a"; p.fillRect(x0 + 3, y0 + 3, rw - 6, 1); p.fillRect(x0 + 3, y0 + rh - 4, rw - 6, 1); // navy inner stripe
  p.fillStyle = "#4a5a8a"; for (let xx = x0 + 5; xx < x0 + rw - 5; xx += 6) { p.fillRect(xx, y0 + 3, 1, 1); p.fillRect(xx + 3, y0 + rh - 4, 1, 1); } // stripe beading
  for (let i = -7; i <= 7; i++) { const wd = 7 - Math.abs(i); p.fillStyle = "#1a2a5a"; p.fillRect(Math.round(cx - wd), cy + i, wd * 2, 1); } // medallion (navy diamond)
  p.fillStyle = "#2e4478"; for (let i = -5; i <= 5; i += 2) { const wd = 5 - Math.abs(i); p.fillRect(Math.round(cx - wd), cy + i, 1, 1); p.fillRect(Math.round(cx + wd), cy + i, 1, 1); } // inner diamond lattice
  for (let i = -3; i <= 3; i++) { const wd = 3 - Math.abs(i); p.fillStyle = "#caa24a"; p.fillRect(Math.round(cx - wd), cy + i, wd * 2, 1); } // gold centre
  p.fillStyle = "#c9b98a"; for (let yy = y0 + 1; yy < y0 + rh - 1; yy += 3) { p.fillRect(x0 - 3, yy, 2, 1); p.fillRect(x0 + rw + 1, yy, 2, 1); } // fringe at the ends
  // corner rosettes
  p.fillStyle = "#caa24a"; for (const [rx2, ry2] of [[x0 + 5, y0 + 6], [x0 + rw - 6, y0 + 6], [x0 + 5, y0 + rh - 7], [x0 + rw - 6, y0 + rh - 7]] as const) { p.fillRect(rx2, ry2 - 1, 1, 3); p.fillRect(rx2 - 1, ry2, 3, 1); }
}
function livingRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    swordMounted(p, Math.round(pw * 0.5), Math.round(ph * 0.085), Math.round(pw * 0.22));
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
    lanternIcon(p, cx + Math.round(cw * 0.28), cyT - 8);
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
      trapDoor(p, Math.round(pw * 0.46), rcy, rf("LIVING-ROOM", "trapOpen")); // the revealed trap door
    }
    void t;
  });
}
function atticPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    // the nasty-looking knife, on the table
    const kx = tcx - 2;
    p.fillStyle = "#11141a"; p.fillRect(kx - 1, tty - 3, 12, 3); // outline
    p.fillStyle = "#aab4c2"; p.fillRect(kx, tty - 2, 7, 1); p.fillStyle = "#d8e2ec"; p.fillRect(kx, tty - 3, 6, 1); // wicked blade
    p.fillStyle = "#4a3016"; p.fillRect(kx + 7, tty - 3, 3, 2); p.fillStyle = "#2a1a0c"; p.fillRect(kx + 9, tty - 3, 1, 2); // handle
    if (Math.sin(t * 3.1) > 0.72) { p.fillStyle = "#ffffff"; p.fillRect(kx + 1, tty - 3, 1, 1); } // mean little glint
    // ── the large coil of rope, lying in the corner (right, half in shadow) ──
    const rcx2 = Math.round(pw * 0.85), rcy2 = Math.round(ph * 0.78);
    p.fillStyle = "#100c06"; for (let yy = -6; yy <= 6; yy++) { const xw = Math.floor(Math.sqrt(Math.max(0, 1 - (yy / 6.5) ** 2)) * 13); p.fillRect(rcx2 - xw, rcy2 + yy, xw * 2 + 1, 1); } // outline mass
    for (let ring = 11; ring >= 3; ring -= 3) { // coiled loops, flattened ellipses
      for (let a = 0; a < 64; a++) { const ang = (a / 64) * Math.PI * 2; const xx = rcx2 + Math.round(Math.cos(ang) * ring), yy = rcy2 + Math.round(Math.sin(ang) * ring * 0.45);
        p.fillStyle = (a & 2) ? "#7a6234" : "#5c4826"; p.fillRect(xx, yy, 1, 1); }
    }
    p.fillStyle = "#8a7040"; p.fillRect(rcx2 - 13, rcy2 - 3, 2, 1); p.fillRect(rcx2 - 14, rcy2 - 2, 2, 2); // the loose end
    // faint lamp flicker on the nearest floor
    const fl = 0.85 + 0.15 * Math.abs(Math.sin(t * 4) + 0.3 * Math.sin(t * 9));
    p.globalAlpha = (fl - 0.85) * 0.6; p.fillStyle = "#caa24e"; for (let i = 0; i < 40; i++) { const gx = pw * 0.5 + (hash(i, 5) - 0.5) * pw * 0.5, gy = ph * 0.82 + hash(i, 6) * ph * 0.14; if (hash(i, 7) > 0.5) p.fillRect(Math.round(gx), Math.round(gy), 1, 1); }
    p.globalAlpha = 1;
  });
}

// ===========================================================================
// HAND-CRAFTED landmark rooms (best ones first), each composed from its text.
// These share the pixel toolkit (caveBackdrop/canyonBackdrop/etc.) but the
// composition is deliberate per room, not generic.
// ===========================================================================
function lampPal(region: string, pw: number, ph: number, peak = 0.85): CavePal {
  const pal = pickPal(region, "");
  pal.light = { x: pw * 0.5, y: ph * 0.98, rx: pw * 0.75, ry: ph, col: [222, 168, 92], peak };
  return pal;
}
function trollRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
// A detailed, shaded troll: hunched green brute, heavy brow, fanged underbite,
// big belly, muscular arms, the bloody axe. Drawn in a 64-tall design grid
// (gx from centre, gy up from the feet) scaled to H, lit from the upper-left.
function trollSprite(p: CanvasRenderingContext2D, cx: number, floorY: number, H: number, t: number) {
  cx = Math.round(cx); const s = H / 64;
  const X = (gx: number) => Math.round(cx + gx * s), Y = (gy: number) => Math.round(floorY - gy * s);
  const disc = (gx: number, gy: number, gr: number, c: string) => { p.fillStyle = c; fillDisc(p, X(gx), Y(gy), Math.max(1, Math.round(gr * s))); };
  const rect = (gx: number, gy: number, gw: number, gh: number, c: string) => { p.fillStyle = c; p.fillRect(X(gx), Y(gy + gh), Math.max(1, Math.round(gw * s)), Math.max(1, Math.round(gh * s))); };
  const c0 = "#26331a", c1 = "#384a22", c2 = "#4c6230", c3 = "#647c3e", belly = "#6a7e3c", cloth = "#5a3f22", clothd = "#3a281493", bone = "#e8dec2", blood = "#811414", steel = "#b2b8c2", steelD = "#787f88", wood = "#4a3526";
  void t;
  // feet + bone claws
  rect(-14, 0, 9, 4, c0); rect(5, 0, 9, 4, c0); disc(-9, 3, 4, c1); disc(9, 3, 4, c1);
  for (const fx of [-14, -11, -8]) rect(fx, 0, 2, 2, bone); for (const fx of [6, 9, 12]) rect(fx, 0, 2, 2, bone);
  // short thick legs
  rect(-12, 4, 8, 15, c1); rect(4, 4, 8, 15, c1); rect(9, 4, 3, 15, c0); rect(-12, 4, 2, 15, c0);
  // hunched body — big belly + chest, lit on the left
  disc(0, 27, 16, c2); disc(0, 41, 14, c2); disc(-3, 28, 11, belly); disc(8, 30, 9, c1);
  disc(-13, 47, 8, c1); disc(13, 47, 8, c1); disc(0, 50, 9, c2); // raised shoulders
  // loincloth
  rect(-12, 15, 24, 10, cloth); for (let i = 0; i < 7; i++) rect(-12 + i * 3.4, 11, 2, 5, clothd);
  // left arm hanging — bicep, forearm, fist
  disc(-15, 44, 6, c1); rect(-20, 26, 8, 18, c1); rect(-20, 26, 3, 18, c0); disc(-16, 25, 5, c2);
  // right arm hoisting the axe
  disc(15, 47, 6, c1); rect(13, 36, 8, 13, c2); disc(18, 36, 5, c2);
  // neck + big hunched head
  rect(-5, 50, 10, 5, c1);
  disc(0, 59, 12, c2); disc(-4, 61, 6, c3); // skull, lit brow
  disc(-12, 58, 3, c1); disc(12, 58, 3, c1); // ears
  rect(-10, 59, 20, 2, c0); // heavy brow ridge
  rect(-7, 56, 4, 2, "#f4e63c"); rect(3, 56, 4, 2, "#f4e63c"); rect(-6, 56, 1, 2, "#c63418"); rect(5, 56, 1, 2, "#c63418"); // angry eyes
  disc(0, 53, 3, c3); rect(-1, 51, 2, 2, c1); // bulbous nose
  rect(-8, 48, 16, 4, c1); rect(-8, 48, 16, 1, c0); rect(-7, 50, 14, 1, "#160c08"); // jutting jaw + mouth
  rect(-6, 49, 2, 3, bone); rect(4, 49, 2, 3, bone); rect(-1, 48, 2, 2, bone); // fangs (underbite)
  // the bloody axe (handle up the right arm, blade at the top)
  rect(20, 28, 2, 30, wood);
  const bx = X(19), by = Y(56);
  p.fillStyle = steel; p.beginPath(); p.moveTo(bx - 9 * s, by - 2 * s); p.lineTo(bx + 6 * s, by - 5 * s); p.lineTo(bx + 6 * s, by + 9 * s); p.lineTo(bx - 9 * s, by + 6 * s); p.closePath(); p.fill();
  p.fillStyle = steelD; p.beginPath(); p.moveTo(bx - 9 * s, by + 2 * s); p.lineTo(bx + 6 * s, by + 4 * s); p.lineTo(bx + 6 * s, by + 9 * s); p.lineTo(bx - 9 * s, by + 6 * s); p.closePath(); p.fill();
  p.fillStyle = blood; p.fillRect(Math.round(bx - 9 * s), Math.round(by - 2 * s), Math.round(14 * s), Math.max(1, Math.round(2 * s)));
}
function roundRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function cyclopsRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone"); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["UP", "NE"]);
    if (rf("CYCLOPS-ROOM", "cyclopsGone")) {
      // the cyclops has fled, smashing a ragged hole through the east (back-right) wall
      const hx = lay.bx1 - Math.round((lay.bx1 - lay.bx0) * 0.36), hy = lay.by0 + 4, hw = Math.round((lay.bx1 - lay.bx0) * 0.34), hh = lay.by1 - lay.by0 - 6;
      p.fillStyle = "#040405"; for (let yy = 0; yy < hh; yy++) { const jag = Math.round((hash(yy, 3) - 0.5) * 6); p.fillRect(hx + jag, hy + yy, hw - jag, 1); }
      p.fillStyle = "#5a5e66"; for (let yy = 0; yy < hh; yy += 2) { const jag = Math.round((hash(yy, 3) - 0.5) * 6); p.fillRect(hx + jag - 1, hy + yy, 1, 2); } // rubble edge
      p.fillStyle = "#1a1a1f"; for (let i = 0; i < 6; i++) p.fillRect(hx - 6 + Math.floor(hash(i, 5) * 14), floorY + Math.floor(hash(i, 6) * 8), 2, 2); // fallen rubble
    } else {
      // the cyclops — a huge one-eyed giant looming over the room
      const H = Math.round(ph * 0.56);
      creature(p, pw * 0.5, floorY + Math.round((ph - floorY) * 0.45), H, Math.round(H * 0.5), "#4a3e2e", "#322a1e", "#ff8a4a", true, t);
    }
  });
}
function damRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
// tiny helper: put one solid pixel from an rgb triplet (used by hand-built scenes)
function sp2(p: CanvasRenderingContext2D, x: number, y: number, c: number[]) {
  p.fillStyle = `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`; p.fillRect(x, y, 1, 1);
}
function egyptRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "temple", 0.7, [224, 188, 120]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["WEST"]); // ascending stair west
    // hieroglyph bands across the tomb's back wall
    p.fillStyle = "#7a6a44"; for (let r = 0; r < 2; r++) { const yy = lay.by0 + 6 + r * Math.round((lay.by1 - lay.by0) * 0.35); for (let x = lay.bx0 + 4; x < lay.bx1 - 4; x += 7) { p.fillRect(x, yy, 1, 5); p.fillRect(x + 2, yy + 1, 3, 1); p.fillRect(x + 3, yy + 3, 1, 2); } }
    // the solid-gold coffin (sarcophagus), the focal treasure
    const cx = Math.round(pw * 0.54), cy = floorY + Math.round((ph - floorY) * 0.5), CL = 24; // sarcophagus centred; CL = head→foot length
    ditherGlow(p, cx, cy, 28, 17, "#e8c24a", 0.4);
    // a mummiform case: narrow head (top) & foot, widest at the shoulders
    const halfW = (yy: number) => { const f = (yy + CL / 2) / CL; return Math.max(2, Math.round(11 * (0.5 + 0.5 * Math.sin(f * Math.PI)) * (f < 0.18 ? 0.72 : 1))); };
    for (let yy = -CL / 2; yy <= CL / 2; yy++) { const hw = halfW(yy); p.fillStyle = "#c9a23a"; p.fillRect(cx - hw, cy + yy, hw * 2, 1); p.fillStyle = "#e8c860"; p.fillRect(cx - hw, cy + yy, 2, 1); p.fillStyle = "#8a6a20"; p.fillRect(cx + hw - 2, cy + yy, 2, 1); } // body + lit/shadowed edges
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
function galleryPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const floorY = interiorBackdrop(p, pw, ph, { wallTop: [46, 40, 34], wallBot: [28, 24, 20], floorTop: [60, 46, 30], floorBot: [30, 22, 14], floorHi: [78, 60, 38], plank: "#241a10", seam: "#170f08", light: { x: pw * 0.5, y: ph * 0.32, rx: pw * 0.8, ry: ph * 0.9, col: [160, 150, 140], peak: 0.34 } }, t);
    // empty frames where vandals stole the art, and one remaining painting
    p.fillStyle = "#6a5436"; for (const fx of [0.16, 0.34, 0.84]) { const x = Math.round(pw * fx); p.fillRect(x - 10, Math.round(ph * 0.16), 20, Math.round(ph * 0.2)); p.fillStyle = pal0(p, x, ph); p.fillRect(x - 8, Math.round(ph * 0.16) + 2, 16, Math.round(ph * 0.2) - 4); p.fillStyle = "#6a5436"; }
    // the surviving painting (focal) — a small framed landscape, gilt-framed
    const gx = Math.round(pw * 0.55), gy = Math.round(ph * 0.16), iw = 24, ih = Math.round(ph * 0.22) - 4, ix = gx - iw / 2, iy = gy + 2;
    p.fillStyle = "#8a6a3a"; p.fillRect(gx - iw / 2 - 3, gy, iw + 6, Math.round(ph * 0.22)); p.fillStyle = "#c8a24a"; p.fillRect(gx - iw / 2 - 3, gy, iw + 6, 2); p.fillStyle = "#5a431f"; p.fillRect(gx - iw / 2 - 3, gy + Math.round(ph * 0.22) - 2, iw + 6, 2); // gilt frame
    for (let yy = 0; yy < Math.round(ih * 0.58); yy++) { const f = yy / (ih * 0.58); p.fillStyle = f < 0.5 ? "#9cbcd6" : "#d2e2dc"; p.fillRect(ix, iy + yy, iw, 1); } // sky
    p.fillStyle = "#f0d878"; fillDisc(p, ix + iw - 6, iy + 5, 3); // sun
    p.fillStyle = "#6f9050"; for (let xx = 0; xx < iw; xx++) { const hy = Math.round(ih * 0.5 + Math.sin(xx * 0.45) * 2); p.fillRect(ix + xx, iy + hy, 1, ih - hy); } // far hills
    p.fillStyle = "#4d6e34"; for (let xx = 0; xx < iw; xx++) { const hy = Math.round(ih * 0.68 + Math.sin(xx * 0.3 + 2) * 2); p.fillRect(ix + xx, iy + hy, 1, ih - hy); } // near hills
    p.fillStyle = "#3a2a18"; p.fillRect(ix + 5, iy + ih - 9, 1, 5); p.fillStyle = "#3e5e2a"; fillDisc(p, ix + 5, iy + ih - 10, 3); // a little tree
    darkArch(p, Math.round(pw * 0.04), floorY - Math.round(ph * 0.26), Math.round(pw * 0.08), Math.round(ph * 0.26), "#3a342c"); // west
    void t;
  });
}
function southTemplePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    // the large black book, lying open-side out in the centre of the altar
    p.fillStyle = "#0c0a10"; p.fillRect(ax - 5, ay - 8, 10, 6); // black cover
    p.fillStyle = "#26222e"; p.fillRect(ax - 5, ay - 8, 10, 1); p.fillRect(ax - 5, ay - 8, 1, 6); // its lamplit spine edge
    p.fillStyle = "#d8d0b4"; p.fillRect(ax - 4, ay - 3, 8, 1); // pale page edges under the cover
    for (const dx of [-11, 11]) { const fl = Math.sin(t * 8 + dx) > 0 ? 1 : 0; p.fillStyle = "#e8e0c0"; p.fillRect(ax + dx - 1, ay - 9, 2, 7); ditherGlow(p, ax + dx, ay - 11, 8, 10, "#ffce6a", 0.55); p.fillStyle = "#fff0c0"; p.fillRect(ax + dx, ay - 11 - fl, 1, 2); } // two burning candles at the ends
    // the hole down into the dark: a recessed pit, not a flat patch
    const hx = Math.round(pw * 0.82), hy2 = ph - Math.round(ph * 0.08);
    p.fillStyle = "#7a7058"; p.fillRect(hx - 12, hy2 - 2, 24, 2); // worn stone lip
    for (let d = 0; d < 4; d++) { const v = Math.max(3, 14 - d * 4); p.fillStyle = `rgb(${v + 3},${v + 1},${v - 1})`; p.fillRect(hx - 12 + d * 2, hy2 + d * 2, 24 - d * 4, ph); }
  });
}
function onRainbowPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    canyonBackdrop(p, pw, ph, true);
    // a waterfall in the distance (Aragain Falls)
    waterfall(p, Math.round(pw * 0.7), Math.round(pw * 0.1), Math.round(ph * 0.18), Math.round(ph * 0.5), t);
    // the rainbow you stand upon — a broad band sweeping across, foreground as a road
    const cols = ["#d8504a", "#e0913a", "#e8d24a", "#5ab85a", "#4a8ad8", "#6a4ad8", "#a04ad8"];
    for (let b = 0; b < 7; b++) { p.fillStyle = cols[b]; for (let x = 0; x < pw; x++) { const y = Math.round(ph * 0.7 + b * 4 + Math.sin(x * 0.012) * ph * 0.06); for (let yy = y; yy < y + 4; yy++) if (0.85 > dth(x, yy)) p.fillRect(x, yy, 1, 1); } }
    ditherGlow(p, pw * 0.5, ph * 0.78, pw * 0.5, ph * 0.12, "#fff0c0", 0.25); // luminous sheen
  });
}

// ---- batch 2: underground showpieces ----
function waterFill(p: CanvasRenderingContext2D, pw: number, topY: number, botY: number, t: number, hi: string, lo: string) {
  for (let y = topY; y < botY; y++) for (let x = 0; x < pw; x++) { const v = Math.sin(x * 0.12 + t * 1.5 + y * 0.3) * 0.5 + 0.5; if (v * 0.65 > dth(x, y)) { p.fillStyle = ((x + y) & 1) ? lo : hi; p.fillRect(x, y, 1, 1); } }
}
function reservoirPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function loudRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    treasureGlint(p, Math.round(pw * 0.5), floorY + Math.round((ph - floorY) * 0.45), t, "#cfe0ea"); // platinum bar
    p.fillStyle = "#cfe0ea"; p.fillRect(Math.round(pw * 0.5) - 5, floorY + Math.round((ph - floorY) * 0.45), 10, 3);
  });
}
function domeRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("dungeon", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    p.strokeStyle = rim; p.lineWidth = 1; for (let k = 0; k < 3; k++) { p.beginPath(); p.ellipse(pw * 0.5, ph * 0.04, pw * (0.44 - k * 0.04), ph * (0.42 - k * 0.04), 0, 0.05, Math.PI - 0.05); p.stroke(); } // the dome
    p.fillStyle = "#040406"; p.fillRect(0, floorY, pw, ph - floorY); // precipitous drop below
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
function torchRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "temple", 0.6, [240, 180, 92]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["DOWN", "SOUTH"]);
    p.strokeStyle = "#3a3a46"; p.beginPath(); p.ellipse(pw * 0.5, lay.by0 - ph * 0.08, (lay.bx1 - lay.bx0) * 0.7, (lay.by1 - lay.by0) * 0.8, 0, 0.1, Math.PI - 0.1); p.stroke(); // the dome up above
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
      ditherGlow(p, px, py - 8, 14, 14, "#ffcf6a", 0.6 * fl); // firelight
      p.fillStyle = "#d8ccb0"; p.fillRect(px - 1, py - 6, 3, 7); // the ivory torch handle
      p.fillStyle = "#8a5a2a"; p.fillRect(px - 2, py - 7, 5, 2); // its socket wrap
      p.fillStyle = "#ff9a3a"; p.fillRect(px - 2, py - 11, 5, 4); p.fillRect(px - 1, py - 13, 3, 2); // flame body
      p.fillStyle = "#fff0c0"; p.fillRect(px - 1 + Math.round(Math.sin(t * 9)), py - 12 - Math.round(fl), 2, 4); // dancing core
    } // torch taken — the bare pedestal stands in the gloom
  });
}
function treasureRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone"); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["DOWN"]);
    for (let i = 0; i < 6; i++) { const x = Math.round(pw * (0.2 + i * 0.1)); p.fillStyle = "#4a3a26"; fillDisc(p, x, floorY + Math.round((ph - floorY) * 0.46), 3); p.fillStyle = "#2e2415"; p.fillRect(x - 1, floorY + Math.round((ph - floorY) * 0.46), 2, 2); } // crumbling bags on the floor
    // the silver chalice (focal treasure): a goblet — bowl, stem, flared foot
    const cx = Math.round(pw * 0.42), cy = floorY + Math.round((ph - floorY) * 0.4); treasureGlint(p, cx, cy - 6, t, "#e6eef4");
    p.fillStyle = "#cfdae4"; p.fillRect(cx - 4, cy - 13, 8, 1); for (let yy = 0; yy < 4; yy++) { const ww = 4 - yy; p.fillRect(cx - ww, cy - 12 + yy, ww * 2, 1); } // bowl rim + tapering cup
    p.fillStyle = "#9fb0be"; p.fillRect(cx + 2, cy - 12, 2, 3); // shadowed side of the bowl
    p.fillStyle = "#cfdae4"; p.fillRect(cx - 1, cy - 8, 2, 6); p.fillRect(cx - 4, cy - 1, 8, 1); p.fillRect(cx - 3, cy, 6, 1); // stem + flared foot
    p.fillStyle = "#ffffff"; p.fillRect(cx - 3, cy - 12, 1, 3); // a bright highlight
  });
}
function northTemplePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "temple", 0.5, [228, 206, 150]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["SOUTH", "EAST", "DOWN"]);
    for (const fx of [0.18, 0.82]) { const x = Math.round(pw * fx); p.fillStyle = "#8a8270"; p.fillRect(x - 4, Math.round(ph * 0.08), 8, floorY + Math.round((ph - floorY) * 0.5) - Math.round(ph * 0.08)); p.fillStyle = "#6a6454"; for (let y = Math.round(ph * 0.08); y < floorY; y += 4) p.fillRect(x - 4, y, 8, 1); p.fillStyle = "#a89e84"; p.fillRect(x - 6, Math.round(ph * 0.08), 12, 3); } // marble pillars (framing)
    p.fillStyle = "#7a7058"; for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 4; xx++) p.fillRect(lay.bx1 - 14 + xx * 3, lay.by0 + 6 + yy * 4, 2, 2); // prayer inscription on the back wall
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
function entranceToHadesPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("hades", ""); pal.light = { x: pw * 0.5, y: ph * 0.6, rx: pw * 0.85, ry: ph, col: [190, 70, 44], peak: 0.5 };
    const floorY = caveBackdrop(p, pw, ph, pal, t);
    const gx = Math.round(pw * 0.5), gw = Math.round(pw * 0.3), gtop = Math.round(ph * 0.18);
    ditherGlow(p, gx, floorY, gw * 0.7, ph * 0.4, "#ff5a2a", 0.45); // hellfire beyond
    p.fillStyle = "#160404"; p.fillRect(gx - gw / 2, gtop, gw, floorY - gtop); // dark gateway
    p.fillStyle = "#3a2420"; p.fillRect(gx - gw / 2 - 4, gtop - 4, gw + 8, 4); p.fillRect(gx - gw / 2 - 4, gtop - 4, 4, floorY - gtop + 4); p.fillRect(gx + gw / 2, gtop - 4, 4, floorY - gtop + 4); // gate frame
    p.fillStyle = "#caa24a"; for (let i = 0; i < 16; i++) p.fillRect(gx - gw / 2 + 2 + i * Math.round((gw - 4) / 16), gtop - 9, 2, 2); // inscription
    if (!rf("ENTRANCE-TO-HADES", "spiritsGone")) {
      for (let i = 0; i < 3; i++) { // the evil spirits — wailing wisps, hooded heads trailing into tattered, dissolving shrouds
        const fx = Math.round(gx - gw * 0.28 + i * gw * 0.28), fy = Math.round(floorY - 18 + Math.sin(t + i * 2) * 5);
        p.globalAlpha = 0.42 + 0.2 * Math.sin(t * 2 + i);
        ditherGlow(p, fx, fy - 4, 9, 13, "#7affb8", 0.4); // eerie aura
        const bh = 22; for (let k = 0; k < bh; k++) { const f = k / bh, wob = Math.round(Math.sin(t * 2 + k * 0.5 + i) * f * 3);
          if (f < 0.62) { const ww = Math.max(1, Math.round(5 - f * 1.5)); p.fillStyle = "#7df0b0"; p.fillRect(fx - ww + wob, fy - 10 + k, ww * 2, 1); } // shroud
          else { p.fillStyle = "#5ad090"; for (const sx of [-3, 0, 3]) p.fillRect(fx + sx + wob, fy - 10 + k, 1, 1); } // dissolving tail
        }
        p.fillStyle = "#aaffce"; fillDisc(p, fx, fy - 9, 4); // hooded head
        p.fillStyle = "#06200f"; p.fillRect(fx - 2, fy - 10, 1, 2); p.fillRect(fx + 1, fy - 10, 1, 2); p.fillRect(fx, fy - 6, 1, 2); // hollow eyes + wailing mouth
      }
      p.globalAlpha = 1;
    } // exorcised → the gateway stands empty and quiet
  });
}
function landOfLivingDeadPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("hades", ""); pal.light = { x: pw * 0.5, y: ph * 0.5, rx: pw * 0.8, ry: ph, col: [150, 90, 80], peak: 0.45 };
    const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
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
    // the crystal skull — a real skull in ice-clear crystal, softly alight
    const sx = Math.round(pw * 0.58), sy = floorY + Math.round((ph - floorY) * 0.34);
    ditherGlow(p, sx, sy - 1, 9, 7, "#7fe0ff", 0.4);
    p.fillStyle = "#d4eeff"; fillDisc(p, sx, sy - 2, 4); // cranium
    p.fillRect(sx - 3, sy + 1, 7, 2); p.fillRect(sx - 2, sy + 3, 5, 1); // cheeks + jaw
    p.fillStyle = "#2a4a5a"; p.fillRect(sx - 2, sy - 2, 2, 2); p.fillRect(sx + 1, sy - 2, 2, 2); p.fillRect(sx, sy + 1, 1, 1); // sockets + nasal
    p.fillStyle = "#8ab4c4"; for (let j = -2; j <= 2; j++) if (j % 2 === 0) p.fillRect(sx + j, sy + 3, 1, 1); // teeth
    p.fillStyle = "#ffffff"; if (Math.sin(t * 2.2) > 0.4) p.fillRect(sx - 2, sy - 4, 1, 1); // crystal glint
    darkArch(p, Math.round(pw * 0.46), floorY - Math.round(ph * 0.22), Math.round(pw * 0.08), Math.round(ph * 0.22), rim); // north
  });
}
function atlantisRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "ancient", 0.55, [180, 210, 230]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["UP", "SOUTH"]);
    p.fillStyle = "rgba(140,190,210,0.12)"; for (let i = 0; i < 7; i++) { const y = lay.by0 + Math.round((lay.by1 - lay.by0) * (0.1 + i * 0.12)); for (let x = lay.bx0; x < lay.bx1; x += 2) p.fillRect(x, y + Math.round(Math.sin(x * 0.1 + i + t * 0.5) * 2), 1, 1); } // water-caustic shimmer on the ancient back wall
    const tx = Math.round(pw * 0.52), ty = floorY + Math.round((ph - floorY) * 0.34); ditherGlow(p, tx, ty - 6, 10, 14, "#7fe0ff", 0.5);
    p.fillStyle = "#bfeaf5"; p.fillRect(tx - 1, ty - 16, 2, 18); p.fillRect(tx - 5, ty - 16, 2, 7); p.fillRect(tx + 3, ty - 16, 2, 7); p.fillRect(tx - 5, ty - 16, 12, 2); // crystal trident
  });
}
function engravingsCavePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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

// ---- batch 3: river & canyon vistas ----
function aragainFallsPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    rainbowArc(p, pw, ph); // the famous rainbow, spanning the falls
    void t;
  });
}
function endOfRainbowPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const hz = canyonBackdrop(p, pw, ph, false, false);
    whiteCliff(p, Math.round(pw * 0.84), pw, Math.round(ph * 0.08), Math.round(ph * 0.78)); // White Cliffs
    waterFill(p, pw, Math.round(ph * 0.5), Math.round(ph * 0.74), t, "#356a8c", "#234e6c"); // river
    sandBand(p, 0, pw, Math.round(ph * 0.74), ph); // rocky beach
    const cols = ["#d8504a", "#e0913a", "#e8d24a", "#5ab85a", "#4a8ad8", "#6a4ad8", "#a04ad8"];
    for (let b = 0; b < 7; b++) { p.fillStyle = cols[b]; for (let a = Math.PI * 1.05; a < Math.PI * 1.5; a += 0.01) { const x = Math.round(pw * 1.05 + Math.cos(a) * (ph * 0.85 - b * 2.5)), y = Math.round(ph * 1.1 + Math.sin(a) * (ph * 0.85 - b * 2.5)); if (y >= 0 && y < ph && x >= 0 && x < pw && 0.8 > dth(x, y)) p.fillRect(x, y, 1, 1); } } // rainbow east
    // (no pot of gold here — it only appears once the sceptre is waved; the
    // engine adds it to the room's objects and the composer/props render it)
    void hz;
  });
}
function canyonViewPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function canyonBottomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function cliffMiddlePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function riverScene(rough: boolean, eastCliff: boolean, westBeach: boolean, buoy: boolean, eastBeach: boolean, t: number) {
  return (p: CanvasRenderingContext2D, pw: number, ph: number) => {
    const wy = riverBase(p, pw, ph, t, rough);
    if (eastCliff) whiteCliff(p, Math.round(pw * 0.86), pw, Math.round(ph * 0.1), wy + 6);
    if (westBeach) { sandBand(p, 0, Math.round(pw * 0.14), wy - 4, wy + 8); p.fillStyle = "#356a8c"; for (let y = wy - 4; y < wy + 8; y++) if (hash(9, y) > 0.4) p.fillRect(Math.round(pw * 0.14) - 1 - Math.round(hash(y, 3) * 3), y, 2, 1); } // waterline laps into the sand
    if (eastBeach) { sandBand(p, Math.round(pw * 0.86), pw, wy - 4, wy + 10); p.fillStyle = "#356a8c"; for (let y = wy - 4; y < wy + 10; y++) if (hash(11, y) > 0.4) p.fillRect(Math.round(pw * 0.86) + Math.round(hash(y, 7) * 3), y, 2, 1); }
    if (buoy) { const bx = Math.round(pw * 0.5), byy = wy + Math.round((ph - wy) * 0.3); p.fillStyle = "#c83a2a"; fillDisc(p, bx, byy, 4); p.fillStyle = "#7a1f14"; fillDisc(p, bx, byy, 2); p.fillStyle = "#e8e0c0"; p.fillRect(bx, byy - 7, 1, 3); }
  };
}
function damBasePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    // the folded pile of plastic (the boat, deflated) on the near bank
    const bx2 = Math.round(pw * 0.44), by2 = ph - 8;
    p.fillStyle = "#3a2a44"; p.fillRect(bx2 - 2, by2 - 1, 16, 5);
    p.fillStyle = "#7a5a8a"; p.fillRect(bx2, by2, 12, 3); p.fillStyle = "#9a7aac"; p.fillRect(bx2, by2, 12, 1); p.fillStyle = "#54406a"; p.fillRect(bx2 + 4, by2 + 1, 2, 2); // folds
  });
}
function damLobbyPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const floorY = interiorBackdrop(p, pw, ph, { wallTop: [56, 56, 60], wallBot: [34, 34, 38], floorTop: [62, 60, 58], floorBot: [32, 31, 30], floorHi: [80, 78, 76], plank: "#26252a", seam: "#1a1a1e", light: { x: pw * 0.5, y: ph * 0.3, rx: pw * 0.85, ry: ph, col: [170, 175, 185], peak: 0.4 } }, t);
    // two doorways marked "Private" (north + east)
    for (const fx of [0.24, 0.86]) { const x = Math.round(pw * fx); darkArch(p, x - Math.round(pw * 0.05), Math.round(ph * 0.2), Math.round(pw * 0.1), Math.round(ph * 0.4), "#6a6a72"); p.fillStyle = "#caa24a"; p.fillRect(x - 8, Math.round(ph * 0.16), 16, 2); p.fillStyle = "#7a6228"; p.fillRect(x - 8, Math.round(ph * 0.17), 16, 1); } // "PRIVATE" plates
    // the visitors' display: a framed diagram of mighty FCD#3
    const dxp = Math.round(pw * 0.52), dyp = Math.round(ph * 0.22), dwp = 46, dhp = 26;
    p.fillStyle = "#3a3e44"; p.fillRect(dxp - 2, dyp - 2, dwp + 4, dhp + 4); p.fillStyle = "#14181e"; p.fillRect(dxp, dyp, dwp, dhp); // frame + field
    p.fillStyle = "#46586a"; p.fillRect(dxp + 3, dyp + 4, dwp - 6, 6); // the reservoir, in diagram blue
    p.fillStyle = "#8a8e9a"; for (let yy = 0; yy < 12; yy++) p.fillRect(dxp + 18 - (yy >> 2), dyp + 10 + yy, 8 + (yy >> 1), 1); // the dam wedge
    p.fillStyle = "#5a7a96"; p.fillRect(dxp + 30, dyp + 18, dwp - 33, 3); // the river below
    p.fillStyle = "#caa24a"; p.fillRect(dxp + 4, dyp + dhp - 5, 14, 2); // caption bar
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
function shorePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const wy = riverBase(p, pw, ph, t, false);
    sandBand(p, 0, pw, wy + Math.round((ph - wy) * 0.45), ph); // east shore
    // a worn dirt path running north–south along the shore (a textured band, not a box)
    const py = wy + Math.round((ph - wy) * 0.66);
    for (let x = 0; x < pw; x++) { const edge = Math.round(Math.sin(x * 0.07) * 2 + Math.sin(x * 0.21) * 1); for (let y = py - 6 + edge; y < py + 7 + edge; y++) { const n = hash(x, y); if (n > 0.28) { p.fillStyle = n > 0.74 ? "#54442e" : ((x + y) & 1) ? "#3f3221" : "#322717"; p.fillRect(x, y, 1, 1); } } }
    for (let i = 0; i < 24; i++) { const x = Math.round(hash(i, 5) * pw); p.fillStyle = "#6a5a3a"; p.fillRect(x, py - 5 + Math.round(hash(i, 6) * 11), 1, 1); } // scattered pebbles
  });
}
function sandyBeachPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const wy = riverBase(p, pw, ph, t, false);
    sandBand(p, 0, pw, wy + Math.round((ph - wy) * 0.3), ph); // large sandy beach
    darkArch(p, Math.round(pw * 0.8), wy - 2, Math.round(pw * 0.1), Math.round(ph * 0.12), "#a8975f"); // passage half-buried in sand (NE)
    // the shovel, planted blade-down in the sand
    const sx = Math.round(pw * 0.45), sy = ph - Math.round(ph * 0.14);
    p.fillStyle = "#6a4a2a"; p.fillRect(sx, sy - 16, 2, 12); // wooden shaft
    p.fillStyle = "#8a6a3a"; p.fillRect(sx - 3, sy - 18, 8, 2); p.fillStyle = "#54401f"; p.fillRect(sx - 3, sy - 16, 2, 1); p.fillRect(sx + 3, sy - 16, 2, 1); // T-grip
    p.fillStyle = "#9aa0a8"; for (let k = 0; k < 5; k++) p.fillRect(sx - 3 + (k >> 1), sy - 4 + k, 8 - k, 1); // steel blade, biting in
    p.fillStyle = "#c8ccd2"; p.fillRect(sx - 3, sy - 4, 1, 2); // edge glint
    p.fillStyle = "#b8a86a"; p.fillRect(sx - 5, sy + 1, 12, 2); // kicked-up sand at the blade
  });
}
function sandyCavePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function whiteCliffsBeach(north: boolean, t: number) {
  return (p: CanvasRenderingContext2D, pw: number, ph: number) => {
    const wy = riverBase(p, pw, ph, t, false);
    whiteCliff(p, north ? Math.round(pw * 0.0) : Math.round(pw * 0.7), north ? Math.round(pw * 0.7) : pw, 0, wy + 6); // the White Cliffs
    sandBand(p, 0, pw, wy + Math.round((ph - wy) * 0.4), ph); // narrow beach
    if (north) darkArch(p, Math.round(pw * 0.3), wy - 4, Math.round(pw * 0.08), Math.round(ph * 0.14), "#9c968a"); // tight passage into the cliffs (west)
  };
}

// ---- batch 4: the coal mine & machine ----
function mineTimbers(p: CanvasRenderingContext2D, pw: number, ph: number, floorY: number) {
  p.fillStyle = "#4a3a24"; p.fillRect(Math.round(pw * 0.08), Math.round(ph * 0.1), Math.round(pw * 0.84), 5); p.fillStyle = "#2a2012"; p.fillRect(Math.round(pw * 0.08), Math.round(ph * 0.1), Math.round(pw * 0.84), 1); // top cross-beam
  for (const fx of [0.12, 0.88]) { const x = Math.round(pw * fx); p.fillStyle = "#3a2c1c"; p.fillRect(x - 3, Math.round(ph * 0.1), 6, floorY - Math.round(ph * 0.1)); p.fillStyle = "#241a0e"; for (let y = Math.round(ph * 0.1); y < floorY; y += 5) p.fillRect(x - 3, y, 6, 1); } // shoring posts
}
function coalVeins(p: CanvasRenderingContext2D, pw: number, floorY: number) {
  p.fillStyle = "#08080a"; for (let i = 0; i < 26; i++) { const x = Math.floor(hash(i, 3) * pw), y = Math.floor(hash(i, 4) * floorY); p.fillRect(x, y, 2, 2); }
  p.fillStyle = "#33333c"; for (let i = 0; i < 14; i++) { const x = Math.floor(hash(i, 5) * pw), y = Math.floor(hash(i, 6) * floorY); p.fillRect(x, y, 1, 1); } // anthracite glints
}
function mineEntrancePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = lampPal("mine", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    coalVeins(p, pw, floorY); mineTimbers(p, pw, ph, floorY);
    p.fillStyle = "#040404"; p.fillRect(0, floorY - Math.round(ph * 0.3), Math.round(pw * 0.16), Math.round(ph * 0.3));
    p.fillStyle = "#4a3a24"; p.fillRect(0, floorY - Math.round(ph * 0.3), Math.round(pw * 0.16), 4); p.fillRect(Math.round(pw * 0.14), floorY - Math.round(ph * 0.3), 3, Math.round(ph * 0.3)); // timber-framed shaft, west wall
    darkArch(p, Math.round(pw * 0.46), ph - Math.round(ph * 0.12), Math.round(pw * 0.08), Math.round(ph * 0.12), rim); // south exit
    void t;
  });
}
function shaftRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
// a wooden mine ladder with real rails, lit stiles, and shadowed rungs
function mineLadder(p: CanvasRenderingContext2D, lx: number, topY: number, botY: number, lean = 0) {
  for (let y = topY; y < botY; y++) {
    const off = Math.round(((y - topY) / Math.max(1, botY - topY)) * lean);
    p.fillStyle = "#6a4f2c"; p.fillRect(lx - 6 + off, y, 2, 1); p.fillRect(lx + 4 + off, y, 2, 1); // rails
    p.fillStyle = "#8a6a3a"; p.fillRect(lx - 6 + off, y, 1, 1); p.fillRect(lx + 4 + off, y, 1, 1); // lamplit stile edges
  }
  for (let y = topY + 3; y < botY - 1; y += 6) {
    const off = Math.round(((y - topY) / Math.max(1, botY - topY)) * lean);
    p.fillStyle = "#5a4326"; p.fillRect(lx - 4 + off, y, 8, 2);
    p.fillStyle = "#7a5a32"; p.fillRect(lx - 4 + off, y, 8, 1); // lit rung tops
    if (hash(lx, y) > 0.8) { p.fillStyle = "#3a2c1a"; p.fillRect(lx - 1 + off, y, 3, 2); } // a split rung — rickety
  }
}
// a stairway CUT into the cave wall: a dark ragged-edged opening with treads
// climbing back and up inside it, each lip catching the lamp less as it recedes
function rockStairs(p: CanvasRenderingContext2D, cx: number, baseY: number, steps: number, dirx = 1, w0 = 13) {
  const topY = baseY - steps * 6 - 10;
  for (let y = topY; y < baseY; y++) { // the cut mouth, receding to black at the top
    const f = (y - topY) / (baseY - topY);
    const ww = Math.round(w0 * (0.5 + 0.5 * f)) + Math.round((hash(3, y >> 1) - 0.5) * 3);
    const xc = cx + Math.round(dirx * (1 - f) * w0 * 0.4);
    const v = Math.max(2, Math.round(2 + f * 9));
    p.fillStyle = `rgb(${v + 2},${v + 1},${v})`; p.fillRect(xc - ww, y, ww * 2, 1);
  }
  p.fillStyle = "#3e382e"; // worn jambs where the cut meets the cave wall
  for (let y = topY + 6; y < baseY; y += 2) {
    const f = (y - topY) / (baseY - topY);
    const ww = Math.round(w0 * (0.5 + 0.5 * f)) + 1, xc = cx + Math.round(dirx * (1 - f) * w0 * 0.4);
    if (hash(xc, y) > 0.45) p.fillRect(xc - ww - 1, y, 1, 2);
    if (hash(xc + 7, y) > 0.45) p.fillRect(xc + ww, y, 1, 2);
  }
  for (let s = 0; s < steps; s++) { // the treads, climbing away from the lamp
    const f = s / steps, y = baseY - 2 - s * 5;
    const ww = Math.round(w0 * (0.92 - f * 0.42)), xc = cx + Math.round(dirx * f * w0 * 0.4);
    const lit = Math.round(60 * (1 - f * 0.72));
    p.fillStyle = `rgb(${Math.round(lit * 0.42)},${Math.round(lit * 0.4)},${Math.round(lit * 0.34)})`; p.fillRect(xc - ww, y, ww * 2, 5); // riser in shadow
    p.fillStyle = `rgb(${lit},${Math.max(0, lit - 6)},${Math.max(0, lit - 14)})`; p.fillRect(xc - ww, y - 1, ww * 2, 2); // lamplit tread lip
    if (hash(s, 9) > 0.6) { p.fillStyle = "#0e0c0a"; p.fillRect(xc - ww + 2 + Math.round(hash(s, 10) * ww * 1.4), y - 1, 2, 1); } // a chipped lip
  }
  p.fillStyle = "#11100d"; p.fillRect(cx - w0 - 2, baseY, w0 * 2 + 4, 2); // its shadow at the cave floor
}
function gasRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    // the sapphire-encrusted bracelet: a pixel-honest gold hoop with blue stones
    const bx = Math.round(pw * 0.5), by = floorY + Math.round((ph - floorY) * 0.42);
    treasureGlint(p, bx, by - 3, t, "#5a9aff");
    p.fillStyle = "#caa24a"; p.fillRect(bx - 5, by - 1, 10, 1); p.fillRect(bx - 6, by, 12, 2); p.fillRect(bx - 5, by + 2, 10, 1); // the hoop, seen at a shallow angle
    p.fillStyle = "#8a6a24"; p.fillRect(bx - 4, by + 1, 8, 1); // its dark inner rim
    p.fillStyle = "#4a8aff"; for (const dx of [-5, -2, 1, 4]) p.fillRect(bx + dx, by, 1, 1); // sapphires
    p.fillStyle = "#bfe0ff"; p.fillRect(bx - 2, by, 1, 1); // one catching the lamp
  });
}
function ladderTopPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function ladderBottomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function timberRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function lowerShaftPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function machineRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function coalMinePixel(seed: number) {
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
function slideRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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

// ---- batch 5: the maze & dead-ends ----
function mazePal(pw: number, ph: number): CavePal {
  return { wallTop: [44, 44, 52], wallBot: [18, 18, 24], wallHi: [62, 62, 72], floorTop: [40, 40, 46], floorBot: [14, 14, 18], floorHi: [58, 58, 66], ceil: "#070709", light: { x: pw * 0.5, y: ph * 0.98, rx: pw * 0.7, ry: ph, col: [222, 168, 92], peak: 0.82 } };
}
// twisty passage openings + criss-crossing wall edges = "all alike" maze
function mazeShell(p: CanvasRenderingContext2D, pw: number, ph: number, seed: number, t = 0) {
  const floorY = caveBackdrop(p, pw, ph, mazePal(pw, ph), t); const rim = "rgb(62,62,72)";
  const r = (n: number) => hash(seed * 3.1 + n, 7);
  const xs = [0.09, 0.3, 0.5, 0.7, 0.91];
  for (let i = 0; i < xs.length; i++) if (r(i) > 0.34) { const fx = xs[i] + (r(i + 10) - 0.5) * 0.05, hh = ph * (0.16 + r(i + 20) * 0.12); darkArch(p, Math.round(pw * fx - pw * 0.035), floorY - Math.round(hh), Math.round(pw * 0.07), Math.round(hh), rim); }
  p.strokeStyle = rim; p.lineWidth = 1; p.globalAlpha = 0.5; // twisty cracks in the rock
  for (let i = 0; i < 4; i++) { const x0 = Math.round(r(i + 30) * pw); p.beginPath(); p.moveTo(x0, Math.round(ph * 0.13)); for (let y = Math.round(ph * 0.13); y < floorY; y += 6) p.lineTo(x0 + Math.round((hash(x0, y) - 0.5) * 10), y); p.stroke(); }
  p.globalAlpha = 1;
  return floorY;
}
function mazePixel(seed: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => { mazeShell(p, pw, ph, seed, t); });
}
function maze5Pixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const floorY = mazeShell(p, pw, ph, 5, t);
    const sx = Math.round(pw * 0.4), sy = floorY + Math.round((ph - floorY) * 0.55);
    // the luckless adventurer's skeleton
    p.fillStyle = "#d8d2c0"; fillDisc(p, sx, sy - 3, 4); p.fillStyle = "#2a2620"; p.fillRect(sx - 2, sy - 3, 1, 1); p.fillRect(sx + 1, sy - 3, 1, 1); // skull
    p.fillStyle = "#c8c2b0"; for (let i = 0; i < 5; i++) p.fillRect(sx + 4 + i * 4, sy - 1, 3, 1); // spine
    for (let i = 0; i < 4; i++) { p.fillRect(sx + 5 + i * 4, sy - 4, 1, 6); } // ribs
    // its scattered gear: burned-out lantern, bag of coins, rusty knife, skeleton key
    p.fillStyle = "#4a4640"; p.fillRect(sx + 24, sy - 4, 5, 5); p.fillStyle = "#2a2824"; p.fillRect(sx + 24, sy - 4, 5, 1); // dead lantern
    treasureGlint(p, sx + 36, sy, t, "#e8c24a"); p.fillStyle = "#6a4f2c"; p.fillRect(sx + 33, sy - 1, 7, 4); // bag of coins
    p.fillStyle = "#9a7a5a"; p.fillRect(sx - 14, sy + 2, 8, 1); p.fillStyle = "#6a4a2a"; p.fillRect(sx - 6, sy + 1, 2, 3); // rusty knife
    p.fillStyle = "#c8a84a"; p.fillRect(sx - 22, sy, 4, 2); p.fillRect(sx - 22, sy - 2, 2, 4); // skeleton key
  });
}
function gratingRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function deadEndPixel(mine: boolean, seed: number) {
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

// ---- batch 6: the finale (all remaining rooms) ----
function litCave(region: string, ld: string, pw: number, ph: number, peak = 0.82): CavePal {
  const pal = pickPal(region, ld); pal.light = { x: pw * 0.5, y: ph * 0.98, rx: pw * 0.72, ry: ph, col: [222, 168, 92], peak };
  return pal;
}
function arches(p: CanvasRenderingContext2D, pw: number, ph: number, floorY: number, rim: string, dirs: string[]) {
  for (const dir of dirs) { const pos = DIRPOS[dir]; if (!pos) continue; const [fx, kind] = pos; const x = Math.round(pw * fx);
    if (kind === 0) darkArch(p, x - Math.round(pw * 0.035), floorY - Math.round(ph * 0.22), Math.round(pw * 0.07), Math.round(ph * 0.22), rim);
    else if (kind === 2) darkArch(p, x - Math.round(pw * 0.06), ph - Math.round(ph * 0.12), Math.round(pw * 0.12), Math.round(ph * 0.12), rim);
    else if (kind === -1) darkArch(p, x - Math.round(pw * 0.05), 2, Math.round(pw * 0.1), Math.round(ph * 0.12), rim);
  }
}
// -- forest --
function forestDimPixel(seed: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = forestBackdrop(p, pw, ph, t, "none");
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
function mountainsPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function clearingPixel(grating: boolean) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const horizon = forestBackdrop(p, pw, ph, t, "soft");
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
function stoneBarrowPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
// -- cellar / chasm --
// A built room as a one-point-perspective BOX: back wall + receding side walls +
// floor + ceiling, each plane its own value (so it reads 3D), with masonry
// courses on the walls and a flagstone grid on the floor. Returns the back-wall
// rect for placing exits/props. This is for man-made rooms (cellar, passages…),
// distinct from the natural caveBackdrop.
interface StonePal { back: number[]; left: number[]; right: number[]; ceil: number[]; floor: number[]; mortar: string; light: { x: number; y: number; rx: number; ry: number; col: number[]; peak: number }; }
function stoneRoom(p: CanvasRenderingContext2D, pw: number, ph: number, o: StonePal, t: number) {
  const bx0 = Math.round(pw * 0.27), bx1 = Math.round(pw * 0.73), by0 = Math.round(ph * 0.18), by1 = Math.round(ph * 0.6);
  const img = p.createImageData(pw, ph), d = img.data;
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    let base: number[];
    const inX = x >= bx0 && x <= bx1, inY = y >= by0 && y <= by1;
    if (inX && inY) base = o.back;
    else { const lx = x < bx0 ? (bx0 - x) / bx0 : -1, rx = x > bx1 ? (x - bx1) / (pw - bx1) : -1, ty = y < by0 ? (by0 - y) / by0 : -1, byv = y > by1 ? (y - by1) / (ph - by1) : -1; const m = Math.max(lx, rx, ty, byv); base = m === byv ? o.floor : m === ty ? o.ceil : m === lx ? o.left : o.right; }
    let c = base.slice();
    const n = hash(Math.floor(x / 3), Math.floor(y / 3)); if (n > 0.86) c = mix(c, [c[0] + 22, c[1] + 22, c[2] + 24], 0.4); else if (n < 0.12) c = mix(c, [0, 0, 0], 0.22); // subtle grain
    const dx = (x - o.light.x) / o.light.rx, dy = (y - o.light.y) / o.light.ry, gl = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)); if (gl > 0) c = mix(c, o.light.col, gl * gl * o.light.peak);
    const th = dth(x, y); sp(d, pw, x, y, qcol(c, th));
  }
  p.putImageData(img, 0, 0);
  const line = (x0: number, y0: number, x1: number, y1: number) => { const st = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let s = 0; s <= st; s++) { p.fillRect(Math.round(x0 + (x1 - x0) * s / st), Math.round(y0 + (y1 - y0) * s / st), 1, 1); } };
  p.fillStyle = o.mortar;
  // back-wall ashlar courses (offset every other row)
  for (let y = by0 + 6; y < by1; y += 6) line(bx0, y, bx1, y);
  for (let y = by0; y < by1; y += 6) { const off = ((y / 6) & 1) ? 6 : 0; for (let x = bx0 + off; x < bx1; x += 12) p.fillRect(x, y, 1, 6); }
  // the four corner seams of the box
  line(0, 0, bx0, by0); line(pw - 1, 0, bx1, by0); line(0, ph - 1, bx0, by1); line(pw - 1, ph - 1, bx1, by1);
  // floor flagstones in perspective: depth lines (widening) + width lines (fanning out)
  const span = (y: number) => { const f = (y - by1) / (ph - by1); return [Math.round(bx0 * (1 - f)), Math.round(bx1 + (pw - bx1) * f)]; };
  let fy = by1 + 3, step = 4, k = 1; while (fy < ph) { const [l, r] = span(fy); line(l, fy, r, fy); fy += step; step = Math.round(4 + k * 1.1); k++; }
  for (let i = 1; i < 6; i++) { const bxp = bx0 + (bx1 - bx0) * i / 6, fxp = (i / 6) * pw; line(bxp, by1, fxp, ph - 1); }
  // ceiling beams (low cellar)
  p.fillStyle = mixHex(o.ceil, -10); for (let i = 1; i < 5; i++) { const bxp = bx0 + (bx1 - bx0) * i / 5, fxp = (i / 5) * pw; line(bxp, by0, fxp, 0); }
  return { bx0, by0, bx1, by1 };
}
function mixHex(c: number[], dv: number) { return `rgb(${Math.max(0, c[0] + dv)},${Math.max(0, c[1] + dv)},${Math.max(0, c[2] + dv)})`; }
// palette presets + a convenience wrapper for built (walled) rooms
const STONE_PALS: Record<string, Omit<StonePal, "light">> = {
  stone: { back: [50, 54, 60], left: [32, 35, 41], right: [44, 47, 53], ceil: [20, 22, 27], floor: [48, 46, 42], mortar: "#23252b" },
  temple: { back: [64, 58, 46], left: [40, 36, 28], right: [58, 52, 41], ceil: [24, 21, 16], floor: [60, 54, 42], mortar: "#2a2418" },
  ancient: { back: [40, 52, 58], left: [24, 34, 40], right: [36, 48, 54], ceil: [16, 22, 26], floor: [36, 48, 54], mortar: "#1c2a30" },
  concrete: { back: [78, 80, 86], left: [50, 52, 58], right: [68, 70, 76], ceil: [34, 36, 41], floor: [66, 68, 72], mortar: "#3a3c43" },
};
function builtRoom(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, kind: keyof typeof STONE_PALS = "stone", peak = 0.72, col = [222, 170, 100]) {
  const base = STONE_PALS[kind];
  return stoneRoom(p, pw, ph, { ...base, light: { x: pw * 0.5, y: ph * 0.92, rx: pw * 0.66, ry: ph * 0.85, col, peak } }, t);
}
// cut exits into the box: doorway in the back wall (N), holes in the floor (S/DOWN),
// openings in the side walls (E/W and diagonals), an opening high up (UP).
function exitsBox(p: CanvasRenderingContext2D, pw: number, ph: number, lay: { bx0: number; by0: number; bx1: number; by1: number }, dirs: string[]) {
  const { bx0, by0, bx1, by1 } = lay, frame = "#5a5e66";
  const door = (x: number, y: number, wd: number, hh: number) => tunnel(p, x, y, wd, hh, frame); // an arched, receding passage
  const hole = (x: number, y: number, wd: number, hh: number) => { // a recessed crawlway mouth (lit stone lip + an arched dark opening receding to black)
    p.fillStyle = "#6a6e76"; p.fillRect(x - 2, y - 3, wd + 4, 3); // lit lintel catching the lamp
    p.fillStyle = "#4a4e55"; p.fillRect(x - 2, y - 3, 2, hh + 3); p.fillStyle = "#2e3138"; p.fillRect(x + wd, y - 3, 2, hh + 3); // stone jambs (lit left / shadowed right)
    const cols = ["#1a1d22", "#0e1014", "#070809", "#020203"], rmax = Math.min(Math.round(wd * 0.42), hh);
    for (let i = 0; i < cols.length; i++) { const f = i / cols.length, ox = x + Math.round(wd * 0.22 * f), ow = wd - Math.round(wd * 0.44 * f), oy = y + Math.round(hh * 0.28 * f), r = Math.round(rmax * (1 - f * 0.5)); p.fillStyle = cols[i];
      for (let a = 0; a < ow; a++) { const rel = (a - ow / 2) / (ow / 2), top = oy + Math.round((1 - Math.sqrt(Math.max(0, 1 - rel * rel))) * r); if (top < y + hh) p.fillRect(ox + a, top, 1, y + hh - top); } // arched opening receding inward
    }
  };
  const wallH = by1 - by0;
  for (const d of dirs) {
    if (d === "NORTH" || d === "IN") { const wd = Math.round((bx1 - bx0) * 0.3), hh = Math.round(wallH * 0.76); door(Math.round((bx0 + bx1) / 2 - wd / 2), by1 - hh, wd, hh); }
    else if (d === "SOUTH" || d === "OUT") { const wd = Math.round(pw * 0.16); hole(Math.round(pw * 0.5 - wd / 2), ph - Math.round(ph * 0.1), wd, Math.round(ph * 0.1)); } // a crawlway at the front
    else if (d === "DOWN") { const wd = Math.round(pw * 0.18); stairsDown(p, Math.round(pw * 0.5 - wd / 2), ph - Math.round(ph * 0.18), wd, Math.round(ph * 0.18), frame); }
    else if (d === "UP") { const wd = Math.round((bx1 - bx0) * 0.26); stairsUp(p, Math.round((bx0 + bx1) / 2 - wd / 2), by0 + 2, wd, Math.round(wallH * 0.5), frame); }
    else if (d === "EAST" || d === "NE" || d === "SE") { const dw = Math.round(pw * 0.08), bx = pw - dw, base = by1 + Math.round((ph - by1) * ((bx - bx1) / (pw - bx1))), hh = Math.round(wallH * 0.78); door(bx, base - hh, dw, hh); } // grounded to the floor at the east edge
    else if (d === "WEST" || d === "NW" || d === "SW" || d === "LAND") { const dw = Math.round(pw * 0.08), base = by1 + Math.round((ph - by1) * ((bx0 - dw) / bx0)), hh = Math.round(wallH * 0.78); door(0, base - hh, dw, hh); } // grounded to the floor at the west edge
  }
}
function cellarPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
    // the steep metal ramp on the WEST — bolted up the left wall toward the back, too steep to climb
    const r0x = Math.round(pw * 0.02), r0y = Math.round(ph * 0.9), r1x = bx0 - 2, r1y = by0 + Math.round((by1 - by0) * 0.3);
    const steps = Math.max(Math.abs(r1x - r0x), Math.abs(r1y - r0y));
    for (let s = 0; s <= steps; s++) { const f = s / steps, x = Math.round(r0x + (r1x - r0x) * f), y = Math.round(r0y + (r1y - r0y) * f); p.fillStyle = "#565b63"; p.fillRect(x, y - 4, 4, 9); p.fillStyle = "#787d86"; p.fillRect(x, y - 4, 4, 1); p.fillStyle = "#3a3e45"; p.fillRect(x, y + 4, 4, 1); }
    for (let s = 0; s <= steps; s += 7) { const f = s / steps, x = Math.round(r0x + (r1x - r0x) * f), y = Math.round(r0y + (r1y - r0y) * f); p.fillStyle = "#43474e"; p.fillRect(x - 1, y - 4, 2, 9); p.fillStyle = "#9aa0aa"; p.fillRect(x + 1, y - 2, 1, 1); } // struts + rivets
    // the low crawlway SOUTH — a small dark hole at the front of the floor
    p.fillStyle = "#43474e"; p.fillRect(Math.round(pw * 0.5) - Math.round(pw * 0.09), ph - Math.round(ph * 0.1) - 1, Math.round(pw * 0.18), 2);
    p.fillStyle = "#050608"; p.fillRect(Math.round(pw * 0.5) - Math.round(pw * 0.08), ph - Math.round(ph * 0.1), Math.round(pw * 0.16), Math.round(ph * 0.1));
    // puddles glinting on the flagstones + slow drips
    p.fillStyle = "#34505e"; for (let i = 0; i < 5; i++) { const px = Math.round(pw * (0.34 + hash(i, 2) * 0.5)), py = by1 + Math.round((ph - by1) * (0.4 + hash(i, 3) * 0.5)); p.fillRect(px, py, 5, 1); p.fillStyle = "#4e7283"; p.fillRect(px + 1, py, 2, 1); p.fillStyle = "#34505e"; }
    p.fillStyle = "#9ac0d4"; for (let i = 0; i < 4; i++) { const dx2 = bx0 + Math.round(hash(i, 8) * (bx1 - bx0)), drip = by0 + (t * 24 + i * 40) % (by1 - by0); p.fillRect(dx2, Math.round(drip), 1, 2); }
    ambiance(p, pw, ph, t, { x: pw * 0.5, y: ph * 0.92, peak: 0.7 });
  });
}
function chasmPixel(eastEdge: boolean) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = litCave("cellar", "", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    // a bottomless chasm: a far rock ledge across a black gulf, and the near ledge
    // you stand on. (chasm-room's gulf runs at a slight SW→NE diagonal.)
    const tilt = eastEdge ? 0 : 1;
    const farLip = (x: number) => floorY + Math.round((hash(Math.floor(x / 4), 3) - 0.5) * 4) - tilt * Math.round((x / pw) * ph * 0.08);
    const nearLip = (x: number) => ph - Math.round((ph - floorY) * 0.26) + Math.round((hash(Math.floor(x / 4), 7) - 0.5) * 4) - tilt * Math.round((x / pw) * ph * 0.05);
    for (let x = 0; x < pw; x++) {
      const fl = farLip(x), nl = nearLip(x);
      // the gulf: rock fading down 3 steps into true black — depth you can read
      p.fillStyle = "#0e0c09"; p.fillRect(x, fl, 1, 2);
      p.fillStyle = "#070605"; p.fillRect(x, fl + 2, 1, 3);
      p.fillStyle = "#020203"; p.fillRect(x, fl + 5, 1, Math.max(0, nl - fl - 5)); // bottom cannot be seen
      if (hash(x >> 2, 5) > 0.78) { p.fillStyle = "#12100c"; p.fillRect(x, fl + 4, 1, Math.round((nl - fl) * 0.25)); } // a few fissure striations
      p.fillStyle = "#2c2720"; p.fillRect(x, fl - 2, 1, 3); p.fillStyle = "#453d30"; p.fillRect(x, fl - 2, 1, 1); // far lip, lamp-caught
      for (let y2 = nl - 2; y2 < ph; y2++) { const k = hash(x >> 1, y2 >> 1); p.fillStyle = k > 0.75 ? "#332e26" : k > 0.3 ? "#28241d" : "#1d1a15"; p.fillRect(x, y2, 1, 1); } // the near ledge, textured rock
      p.fillStyle = "#4c4336"; p.fillRect(x, nl - 2, 1, 1); // its lit lip
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
function studioPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
// -- dungeon passages & rooms --
function strangePassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function mirrorRoomPixel(lit: boolean, roomId: string) {
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
function smallCavePixel(forbidding: boolean) {
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
function coldPassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function narrowPassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function windingPassagePixel(seed: number) {
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
function ewPassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function nsPassagePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone"); exitsBox(p, pw, ph, lay, ["NORTH", "NE", "SOUTH"]);
    // a HIGH passage: the walls run up out of sight — tall shadow streaks above
    p.fillStyle = "#0b0b0f"; p.fillRect(0, 0, pw, lay.by0 - 2);
    for (let x = 4; x < pw; x += 9) { const hgt2 = Math.round(lay.by0 * (0.4 + hash(x, 9) * 0.6)); p.fillStyle = "#17171d"; p.fillRect(x, lay.by0 - hgt2, 2, hgt2); } // ribs of rock vanishing upward
    p.fillStyle = "#26262e"; for (let x = 0; x < pw; x += 2) if (hash(x, 5) > 0.5) p.fillRect(x, lay.by0 - 2, 2, 2); // broken upper edge
    void t;
  });
}
function maintenanceRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const lay = builtRoom(p, pw, ph, t, "stone", 0.6, [170, 180, 195]); const floorY = lay.by1; exitsBox(p, pw, ph, lay, ["WEST", "SOUTH"]);
    const px = Math.round(pw * 0.5), py = Math.round((lay.by0 + lay.by1) / 2); p.fillStyle = "#2a2c32"; p.fillRect(px - 26, py - 10, 52, 22); // control panel on the back wall
    const bc = ["#3a6ad8", "#caa24a", "#8a5a2a", "#c83a2a"]; for (let i = 0; i < 4; i++) { p.fillStyle = bc[i]; p.fillRect(px - 20 + i * 12, py - 2, 7, 7); p.fillStyle = "#101216"; p.fillRect(px - 20 + i * 12, py - 2, 7, 1); } // blue/yellow/brown/red buttons
    p.fillStyle = "#7a8a92"; p.fillRect(px + 14, floorY + Math.round((ph - floorY) * 0.4), 10, 2); p.fillStyle = "#6a5030"; p.fillRect(px - 24, floorY + Math.round((ph - floorY) * 0.5), 8, 2); // wrench + screwdriver (ransacked)
    void t;
  });
}
function squeekyRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function batRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = litCave("dungeon", "", pw, ph); const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    const bx = Math.round(pw * 0.5 + Math.sin(t * 1.2) * pw * 0.1), by = Math.round(ph * 0.22 + Math.cos(t * 1.6) * ph * 0.06), flap = Math.round(Math.sin(t * 10) * 4); // the deranged vampire bat, flitting
    p.fillStyle = "#1a1016";
    p.fillRect(bx - 1, by, 3, 5); p.fillRect(bx - 1, by - 2, 1, 2); p.fillRect(bx + 1, by - 2, 1, 2); // body + ears
    for (let k = 0; k < 8; k++) { const wy2 = by + flap + Math.round(Math.abs(k - 3.5) * (flap > 0 ? 0.5 : -0.5)); p.fillRect(bx - 10 + k, wy2, 1, 2); p.fillRect(bx + 3 + k, wy2, 1, 2); } // membranous wings, angling with the beat
    p.fillStyle = "#4a2a34"; p.fillRect(bx, by + 1, 1, 1); // its mad little eye
    treasureGlint(p, Math.round(pw * 0.5), floorY + Math.round((ph - floorY) * 0.4), t, "#6affa0"); // jade figurine
    arches(p, pw, ph, floorY, rim, ["SOUTH", "EAST"]);
  });
}
function smellyRoomPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
// -- river (underground stream / reservoir shores) --
function reservoirShorePixel(north: boolean) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("dungeon", "water"); pal.light = { x: pw * 0.5, y: ph * 0.96, rx: pw * 0.8, ry: ph, col: [222, 168, 92], peak: 0.6 };
    caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    // the water fills the MIDDLE distance only — you stand on a real shore
    const wTop = Math.round(ph * 0.44), wBot = Math.round(ph * 0.72);
    waterFill(p, pw, wTop, wBot, t, "#31607e", "#1e4460");
    p.fillStyle = "#0e2334"; p.fillRect(0, wTop - 1, pw, 1); // far waterline against the rock
    // your lamplit shore: wet rock shelving into the reservoir
    for (let y = wBot; y < ph; y++) for (let x = 0; x < pw; x++) {
      const k = hash(x >> 1, y >> 1), f = (y - wBot) / Math.max(1, ph - wBot);
      p.fillStyle = k > 0.78 ? (f < 0.3 ? "#4a4438" : "#3e382c") : k > 0.3 ? "#332e24" : "#26221a";
      p.fillRect(x, y, 1, 1);
    }
    p.fillStyle = "#5c6f7e"; for (let x = 0; x < pw; x += 2) if (Math.sin(x * 0.2 + t * 2.4) > 0.4) p.fillRect(x, wBot + (x % 2), 2, 1); // the reservoir lapping the shore
    arches(p, pw, ph, ph - 6, rim, north ? ["NORTH"] : ["EAST", "WEST"]);
    if (north) { // the hand-held air pump, abandoned on the north shore
      const ax = Math.round(pw * 0.62), ay = ph - Math.round((ph - wBot) * 0.5);
      p.fillStyle = "#101216"; p.fillRect(ax - 7, ay - 6, 15, 9);
      p.fillStyle = "#3a3a42"; p.fillRect(ax - 6, ay - 5, 12, 7); p.fillStyle = "#5a5a64"; p.fillRect(ax - 6, ay - 5, 12, 1); // the barrel
      p.fillStyle = "#8a8a92"; p.fillRect(ax - 2, ay - 9, 2, 4); p.fillRect(ax - 5, ay - 10, 8, 2); // plunger handle
      p.fillStyle = "#6a6a72"; p.fillRect(ax + 6, ay - 2, 5, 2); p.fillRect(ax + 10, ay - 3, 2, 2); // the hose
    }
  });
}
function streamViewPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function inStreamPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  pixelStage(ctx, w, h, 256, (p, pw, ph) => {
    const pal = pickPal("dungeon", "water"); pal.light = { x: pw * 0.5, y: ph * 0.9, rx: pw * 0.85, ry: ph, col: [190, 205, 225], peak: 0.5 };
    const floorY = caveBackdrop(p, pw, ph, pal, t); const rim = `rgb(${pal.wallHi.join(",")})`;
    waterFill(p, pw, Math.round(ph * 0.42), ph, t, "#3a6c8e", "#234e6c"); // you're on the stream
    sandBand(p, 0, Math.round(pw * 0.16), Math.round(ph * 0.42) - 2, Math.round(ph * 0.5)); // narrow beach to land
    arches(p, pw, ph, Math.round(ph * 0.42), rim, ["EAST"]);
    void t;
  });
}
function dampCavePixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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
function deepCanyonPixel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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

// ===========================================================================
// The scene registry
// ===========================================================================
function pal0(p: CanvasRenderingContext2D, _x: number, _ph: number) { void p; return "#1c1814"; }
const SCENES: Record<string, SceneDraw> = {
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

// ===========================================================================
// PROCEDURAL COMPOSER — every remaining room, built from its real description.
// Reads region + ldesc keywords + object list + exits and renders a pixel scene
// in the established style. Dark rooms still show darknessScene until lit.
// ===========================================================================
interface CavePal { wallTop: number[]; wallBot: number[]; wallHi: number[]; floorTop: number[]; floorBot: number[]; floorHi: number[]; ceil: string; light?: { x: number; y: number; rx: number; ry: number; col: number[]; peak: number }; }
function caveBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, pal: CavePal, t = 0) {
  const floorY = Math.round(ph * 0.6);
  // an UNEVEN rock floor edge (not a straight seam) — organic, not architectural
  const floorEdge = (x: number) => floorY + Math.round((Math.sin(x * 0.05) + Math.sin(x * 0.13 + 2)) * ph * 0.018 + (hash(Math.floor(x / 5), 9) - 0.5) * ph * 0.035);
  const img = p.createImageData(pw, ph), d = img.data;
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    let c: number[]; const th = dth(x, y); const fe = floorEdge(x);
    if (y < fe) { // rough rock wall — fuzzy multi-scale mottling, not a flat gradient
      c = mix(pal.wallTop, pal.wallBot, y / floorY);
      const n6 = hash(Math.floor(x / 6), Math.floor(y / 6)), n3 = hash(Math.floor(x / 3), Math.floor(y / 3));
      if (n6 > 0.68) c = mix(c, pal.wallHi, 0.2); else if (n6 < 0.26) c = mix(c, [0, 0, 0], 0.24); // big rock blotches
      if (n3 > 0.86) c = mix(c, pal.wallHi, 0.16); else if (n3 < 0.12) c = mix(c, [0, 0, 0], 0.16); // fine grain
    } else { c = mix(pal.floorTop, pal.floorBot, (y - fe) / (ph - fe)); const n = hash(Math.floor(x / 4), Math.floor(y / 4)); if (n > 0.82) c = mix(c, pal.floorHi, 0.22); else if (n < 0.12) c = mix(c, [0, 0, 0], 0.28); }
    if (pal.light) { const dx = (x - pal.light.x) / pal.light.rx, dy = (y - pal.light.y) / pal.light.ry, dd = Math.sqrt(dx * dx + dy * dy), gl = Math.max(0, 1 - dd); if (gl > 0) c = mix(c, pal.light.col, gl * gl * pal.light.peak); }
    sp(d, pw, x, y, qcol(c, th));
  }
  p.putImageData(img, 0, 0);
  p.fillStyle = pal.ceil;
  // jagged rock ceiling + hanging stalactites (varied, tapering to points)
  for (let x = 0; x < pw; x++) { const ty = Math.round(6 + Math.abs(Math.sin(x * 0.08) + Math.sin(x * 0.037)) * 8); p.fillRect(x, 0, 1, ty); }
  for (let i = 0; i < 7; i++) { const sxp = Math.round(hash(i, 11) * pw), len = Math.round(ph * (0.06 + hash(i, 12) * 0.16)); for (let yy = 0; yy < len; yy++) { const wd = Math.max(1, Math.round((1 - yy / len) * 4)); p.fillRect(sxp - wd, 4 + yy, wd * 2 + 1, 1); } }
  // dark rock intruding from the sides — frames the view, makes it feel enclosed
  for (let y = 0; y < ph; y++) { const lw = Math.round(6 + Math.abs(Math.sin(y * 0.06)) * 12 + (hash(7, Math.floor(y / 5)) - 0.5) * 8); p.fillRect(0, y, Math.max(0, lw), 1); const rw = Math.round(6 + Math.abs(Math.sin(y * 0.05 + 1)) * 12 + (hash(8, Math.floor(y / 5)) - 0.5) * 8); p.fillRect(pw - Math.max(0, rw), y, Math.max(0, rw), 1); }
  // stalagmites rising from the rocky floor — shaded columns, lamp-lit on the
  // side facing pal.light, dark core away from it (not flat black bells)
  const lampX = pal.light ? pal.light.x : pw * 0.5;
  const smDark = mix(pal.floorBot, [0, 0, 0], 0.5), smMid = mix(pal.floorTop, pal.floorBot, 0.55), smLit = mix(pal.floorTop, pal.floorHi, 0.35);
  for (let i = 0; i < 4; i++) {
    const sxp = Math.round((0.15 + hash(i, 13) * 0.7) * pw), fe = floorEdge(sxp);
    const h2 = Math.round(ph * (0.05 + hash(i, 14) * 0.09)), bw = 3 + Math.round(hash(i, 15) * 3);
    const litLeft = sxp > lampX; // which flank catches the lamp
    for (let yy = 0; yy < h2; yy++) {
      const f = yy / h2, wd = Math.max(1, Math.round((1 - f * f) * bw + (hash(i, yy >> 2) - 0.5) * 1.2)); // convex taper, knobby edge
      const y = fe - yy, x0 = sxp - wd, x1 = sxp + wd;
      for (let x = x0; x <= x1; x++) {
        const flank = litLeft ? (x1 - x) / (wd * 2 + 1) : (x - x0) / (wd * 2 + 1); // 0 = shadow side, 1 = lit side
        const c = flank > 0.72 ? smLit : flank > 0.38 ? smMid : smDark;
        p.fillStyle = `rgb(${qcol(c, dth(x, y)).join(",")})`; p.fillRect(x, y, 1, 1);
      }
    }
    p.fillStyle = `rgb(${smDark.join(",")})`; p.fillRect(sxp - bw - 1, fe, bw * 2 + 3, 1); // rooted in its own floor shadow
  }
  ambiance(p, pw, ph, t, pal.light);
  return floorY;
}
// per-scene mood: a soft vignette that frames the lit subject + dust motes
// drifting through the light. Adds depth/atmosphere without the static noise.
function ambiance(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, light?: { x: number; y: number; peak: number }) {
  p.globalCompositeOperation = "source-over";
  const cxv = light ? light.x : pw * 0.5, cyv = light ? Math.min(ph * 0.7, light.y) : ph * 0.5;
  const g = p.createRadialGradient(cxv, cyv, ph * 0.28, cxv, cyv, ph * 0.95);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(2,2,5,0.55)");
  p.fillStyle = g; p.fillRect(0, 0, pw, ph);
  for (let i = 0; i < 16; i++) { // floating dust motes catching the light
    const mx = cxv + Math.sin(t * 0.35 + i * 1.7) * pw * 0.22 + (hash(i, 1) - 0.5) * pw * 0.5;
    const my = ((t * 4 + i * 37) % ph);
    const fl = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.6 + i));
    p.globalAlpha = fl * 0.4; p.fillStyle = "#d8c594"; p.fillRect(Math.round(mx), Math.round(my), 1, 1);
  }
  p.globalAlpha = 1;
}
// open-air canyon / river-gorge vista: dusk sky, layered hazy cliff walls, rocky
// floor. Atmospheric perspective via value layering. Returns the horizon Y.
function canyonBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, water: boolean, ledge = true) {
  const horizon = Math.round(ph * 0.46);
  const img = p.createImageData(pw, ph), d = img.data;
  const rock = [76, 62, 52], rockLo = [28, 22, 18];
  const SKYR: number[][] = [[34, 48, 84], [74, 76, 106], [116, 106, 128], [150, 138, 150]]; // dusk, 4 committed bands
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    let c: number[]; const th = dth(x, y);
    if (y < horizon) { const f = Math.pow(y / horizon, 1.3) * (SKYR.length - 1), b = Math.floor(f); c = SKYR[Math.min(SKYR.length - 1, b + ((f - b) * 1.8 - 0.4 > th ? 1 : 0))]; } // solid band centres, dither only at the seams
    else { c = mix(rock, rockLo, (y - horizon) / (ph - horizon)); const n = hash(x, y); if (n > 0.8) c = mix(c, [98, 86, 72], 0.4); else if (n < 0.16) c = mix(c, [0, 0, 0], 0.3); }
    sp(d, pw, x, y, [quant(c[0], th, 6), quant(c[1], th, 6), quant(c[2], th, 6)]);
  }
  p.putImageData(img, 0, 0);
  // a few stars/dusk specks
  p.fillStyle = "#cdd6ea"; for (let i = 0; i < 16; i++) if (hash(i, 2) > 0.5) p.fillRect(Math.floor(hash(i, 1) * pw), Math.floor(hash(i, 3) * horizon * 0.7), 1, 1);
  // layered canyon walls (far=lighter/bluer, near=darker) — drawn far→near
  const ridge = (baseY: number, amp: number, seed: number, col: string) => { p.fillStyle = col; for (let x = 0; x < pw; x++) { const crest = Math.round(baseY - (Math.sin(x * 0.018 + seed) + 0.5 * Math.sin(x * 0.006 + seed * 1.7)) * amp - amp * 0.2); p.fillRect(x, crest, 1, ph - crest); } };
  ridge(horizon + ph * 0.04, ph * 0.05, 0.4, "#5e6e8a");
  ridge(horizon + ph * 0.16, ph * 0.08, 2.1, "#44506a");
  ridge(horizon + ph * 0.30, ph * 0.11, 4.3, "#2e3850");
  if (water) { // a river ribbon winding along the gorge floor
    const ry = Math.round(horizon + ph * 0.2);
    for (let y = ry; y < ry + ph * 0.16; y++) for (let x = 0; x < pw; x++) { const band = Math.sin(x * 0.02 + 1) * ph * 0.04; if (Math.abs(y - (ry + ph * 0.06 + band)) < ph * 0.05) { const v = Math.sin(x * 0.2 + (y) * 0.4) * 0.5 + 0.5; if (v * 0.7 > dth(x, y)) { p.fillStyle = v > 0.7 ? "#5a86a6" : "#34566e"; p.fillRect(x, y, 1, 1); } } }
  }
  if (ledge) { p.fillStyle = "#161210"; for (let x = 0; x < pw; x++) { const yy = ph - Math.round(ph * 0.1 + Math.abs(Math.sin(x * 0.05)) * ph * 0.04); p.fillRect(x, yy, 1, ph - yy); } } // foreground ledge
  return horizon;
}
// a pale chalk White-Cliffs face filling a column of the frame
function whiteCliff(p: CanvasRenderingContext2D, x0: number, x1: number, topY: number, botY: number) {
  for (let y = topY; y < botY; y++) for (let x = x0; x < x1; x++) {
    const k = hash(x >> 1, y >> 2); // chalk in clustered patches, not confetti
    p.fillStyle = k > 0.74 ? "#cfc9bd" : k < 0.16 ? "#a09a8e" : "#bbb4a6";
    p.fillRect(x, y, 1, 1);
    if ((y % 11) === 5 && hash(x >> 3, y) > 0.6) { p.fillStyle = "#948e82"; p.fillRect(x, y, 1, 1); } // sparse bedding strata
  }
  p.fillStyle = "#8a8478";
  for (let x = x0 + 5; x < x1; x += 13) for (let y = topY; y < botY; y++) if (hash(x, y >> 3) > 0.62) p.fillRect(x, y, 1, 1); // a few broken striations
}
// a tan sand band
function sandBand(p: CanvasRenderingContext2D, x0: number, x1: number, topY: number, botY: number) {
  for (let x = x0; x < x1; x++) {
    const yt = topY + Math.round(Math.sin(x * 0.13) * 1.5 + hash(x >> 2, 5) * 3); // a real shoreline, not a box edge
    for (let y = yt; y < botY; y++) { const n = hash(x >> 1, y >> 1); p.fillStyle = n > 0.76 ? "#dccb92" : n < 0.2 ? "#a8975f" : "#cab87a"; p.fillRect(x, y, 1, 1); }
    p.fillStyle = "#e8dcaa"; p.fillRect(x, yt, 1, 1); // the wet lip of the sand
  }
}
// the open river filling the lower frame (rough = whitecaps & faster shimmer)
function riverBase(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, rough: boolean) {
  canyonBackdrop(p, pw, ph, false, false);
  const wy = Math.round(ph * 0.48);
  for (let y = wy; y < ph; y++) for (let x = 0; x < pw; x++) { const v = Math.sin(x * 0.1 + t * (rough ? 3 : 1.2) + y * 0.3) * 0.5 + 0.5; if (v * 0.65 > dth(x, y)) { p.fillStyle = ((x + y) & 1) ? "#234e6c" : "#356a8c"; p.fillRect(x, y, 1, 1); } if (rough && v > 0.86 && hash(x, y + Math.floor(t * 4)) > 0.6) { p.fillStyle = "#c4d8e4"; p.fillRect(x, y, 1, 1); } }
  return wy;
}
function rainbowArc(p: CanvasRenderingContext2D, pw: number, ph: number) {
  const cols = ["#d8504a", "#e0913a", "#e8d24a", "#5ab85a", "#4a8ad8", "#6a4ad8", "#a04ad8"];
  const cx = pw * 0.5, cy = ph * 1.25, R = ph * 1.05;
  for (let b = 0; b < 7; b++) { const r = R - b * 2.5; for (let a = Math.PI * 1.04; a < Math.PI * 1.96; a += 0.008) { const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r); if (y >= 0 && y < ph && x >= 0 && x < pw && 0.75 > dth(x, y)) { p.fillStyle = cols[b]; p.fillRect(x, y, 1, 1); } } }
}
function waterfall(p: CanvasRenderingContext2D, x: number, wd: number, topY: number, botY: number, t: number) {
  const H = Math.max(1, botY - topY);
  // a falling SHEET (not static): a dithered blue gradient base, then bright foam
  // streaks running vertically down clustered columns, their highlights scrolling
  // downward so the water reads as plunging.
  for (let y = topY; y < botY; y++) { const depth = (y - topY) / H;
    for (let xx = 0; xx < wd; xx++) { const base = 0.52 - depth * 0.16 + 0.1 * Math.sin(xx * 0.16); p.fillStyle = base > dth(xx, y) ? "#6f9ec0" : "#42708f"; p.fillRect(x + xx, y, 1, 1); }
  }
  for (let col = 1; col < wd - 1; col += 3) { const phase = hash(col, 1) * 6.283, ww = hash(col, 2) > 0.55 ? 2 : 1; // foam streaks in ~2px columns
    for (let y = topY; y < botY; y++) { const m = Math.sin(y * 0.5 - t * 11 + phase); if (m > 0.32) { p.fillStyle = m > 0.74 ? "#eef5fb" : "#bcd8ea"; p.fillRect(x + col, y, ww, 1); } }
  }
  for (let i = 0; i < Math.round(wd * 0.7); i++) { if (hash(i, Math.floor(t * 6)) > 0.45) { p.fillStyle = "#f2f8fc"; p.fillRect(x + Math.round((i * 1.7) % wd), topY + (Math.floor(hash(i, 3) * 4)), 1, 1); } } // churning foam at the lip
  ditherGlow(p, x + wd / 2, botY, wd * 0.7, 11, "#dfeef6", 0.55); // mist boiling up from the plunge pool
}
// a dark passage opening with a faint rim (an exit)
// an arched passage mouth that recesses into darkness (a real opening with depth,
// not a flat black rectangle): concentric arches stepping back toward a vanishing
// point + a carved stone frame around the mouth.
function tunnel(p: CanvasRenderingContext2D, x: number, y: number, wd: number, hh: number, frame: string) {
  const cols = ["#23262d", "#171a1f", "#0d0f13", "#07080a", "#020203"];
  const vx = x + wd / 2, vy = y + hh * 0.5;
  const archRect = (ox: number, oy: number, ow: number, oh: number, c: string) => {
    if (ow < 1 || oh < 1) return; const r = Math.min(Math.round(ow / 2), Math.round(oh * 0.55));
    p.fillStyle = c; p.fillRect(Math.round(ox), Math.round(oy + r), Math.round(ow), Math.round(oh - r));
    for (let a = 0; a < ow; a++) { const rel = (a - ow / 2) / (ow / 2); const top = oy + r - Math.round(Math.sqrt(Math.max(0, 1 - rel * rel)) * r); p.fillRect(Math.round(ox + a), Math.round(top), 1, Math.round(oy + r - top) + 1); }
  };
  for (let i = 0; i < cols.length; i++) { const f = i / cols.length; archRect(x + (vx - x) * f * 0.75, y + (vy - y) * f * 0.6, wd * (1 - f * 0.75), hh * (1 - f * 0.5), cols[i]); } // recede to black
  // carved stone frame: arched lintel + jambs
  const r = Math.min(Math.round(wd / 2), Math.round(hh * 0.55));
  p.fillStyle = frame;
  p.fillRect(x - 2, y + r, 2, hh - r); p.fillRect(x + wd, y + r, 2, hh - r); // jambs
  for (let a = -2; a < wd + 2; a++) { const rel = (a - wd / 2) / (wd / 2 + 2); const top = y + r - Math.round(Math.sqrt(Math.max(0, 1 - rel * rel)) * r); p.fillRect(x + a, top - 2, 1, 2); } // lintel
}
function darkArch(p: CanvasRenderingContext2D, x: number, y: number, w: number, hh: number, rim: string) {
  tunnel(p, x, y, w, hh, rim);
}
// a stairwell DOWN: the near step (bottom, by your feet) is widest & lit; steps
// recede up-screen, narrowing and DARKENING as they descend into the shaft.
function stairsDown(p: CanvasRenderingContext2D, x: number, y: number, wd: number, hh: number, frame: string) {
  p.fillStyle = frame; p.fillRect(x - 1, y - 1, wd + 2, 2); p.fillRect(x - 1, y, 1, hh); p.fillRect(x + wd, y, 1, hh); // stone rim at the floor lip
  p.fillStyle = "#040405"; p.fillRect(x, y, wd, hh); // the dark shaft
  const n = 5, sh = hh / n;
  for (let i = 0; i < n; i++) { // i=0 nearest/top-of-stairs, i high = deep
    const f = i / (n - 1), inset = Math.round(wd * 0.42 * f), sx = x + inset, sw = wd - inset * 2;
    const sy = Math.round(y + hh - (i + 1) * sh); if (sw < 3) break;
    const v = Math.round(46 - 38 * f); p.fillStyle = `rgb(${v},${v},${v + 5})`; p.fillRect(sx, sy, sw, Math.round(sh)); // tread, darker deeper
    p.fillStyle = `rgb(${v + 28},${v + 28},${v + 34})`; p.fillRect(sx, sy + Math.round(sh) - 1, sw, 1); // lit front nosing
  }
}
// a stairway UP: steps rise up-screen toward an arched opening and a hint of light
// from above (brightening as they climb).
function stairsUp(p: CanvasRenderingContext2D, x: number, y: number, wd: number, hh: number, frame: string) {
  tunnel(p, x, y, wd, hh, frame); // the arched mouth it climbs into
  ditherGlow(p, x + wd / 2, y + 2, wd * 0.6, hh * 0.5, "#9ab0c4", 0.3); // daylight/torchlight spilling from above
  const n = 5, sh = hh / n;
  for (let i = 0; i < n; i++) { // i=0 nearest/bottom, i high = far/up
    const f = i / (n - 1), inset = Math.round(wd * 0.36 * f), sx = x + inset, sw = wd - inset * 2;
    const sy = Math.round(y + hh - (i + 1) * sh); if (sw < 3) break;
    const v = Math.round(42 + 46 * f); p.fillStyle = `rgb(${v},${v},${v + 4})`; p.fillRect(sx, sy, sw, Math.round(sh)); // tread, brighter higher
    p.fillStyle = `rgb(${Math.min(255, v + 26)},${Math.min(255, v + 26)},${Math.min(255, v + 30)})`; p.fillRect(sx, sy, sw, 1); // lit top edge
  }
}
const DIRPOS: Record<string, [number, number]> = { NORTH: [0.5, 0], NE: [0.72, 0], NW: [0.28, 0], EAST: [0.93, 0], WEST: [0.07, 0], SOUTH: [0.5, 1], SE: [0.78, 1], SW: [0.22, 1], UP: [0.5, -1], DOWN: [0.5, 2], IN: [0.6, 0], OUT: [0.4, 1] };
function drawExitsCave(p: CanvasRenderingContext2D, pw: number, ph: number, floorY: number, room: any, rim: string) {
  for (const [dir, e] of Object.entries(room.exits || {})) {
    const ex = e as any; if (!ex || ex.kind === "blocked" || !DIRPOS[dir]) continue;
    const [fx, kind] = DIRPOS[dir];
    const x = Math.round(pw * fx);
    if (kind === 0) darkArch(p, x - Math.round(pw * 0.035), floorY - Math.round(ph * 0.26), Math.round(pw * 0.07), Math.round(ph * 0.26), rim); // wall passage
    else if (kind === 2) darkArch(p, x - Math.round(pw * 0.06), ph - Math.round(ph * 0.12), Math.round(pw * 0.12), Math.round(ph * 0.12), rim); // hole down
    else if (kind === -1) darkArch(p, x - Math.round(pw * 0.05), 2, Math.round(pw * 0.1), Math.round(ph * 0.12), rim); // opening up
  }
}
// ---- keyword-driven props ----
const TREASURE = /gold|chalice|trident|scarab|bracelet|figurine|bar|skull|coin|jewel|pot|sceptre|scepter|emerald|diamond|torch|crown|jade|sapphire|crystal|chest|treasure|chalice|trunk|coffin|egg|scarab|bauble|canary/i;
function treasureGlint(p: CanvasRenderingContext2D, x: number, y: number, t: number, col: string) {
  ditherGlow(p, x, y, 7, 7, col, 0.5);
  p.fillStyle = col; p.fillRect(x - 1, y - 1, 3, 3);
  if (Math.sin(t * 3 + x) > 0.5) { p.fillStyle = "#fff"; p.fillRect(x, y - 1, 1, 1); }
}
// The THIEF — a seedy gentleman robber: a dark cloak, a feathered cap, a gaunt
// moustachioed face with cold glinting eyes, a wicked stiletto, and a bulging
// sack of stolen loot. Drawn at a given height in pixel space.
function thiefSprite(p: CanvasRenderingContext2D, cx: number, baseY: number, H: number, t: number) {
  cx = Math.round(cx); baseY = Math.round(baseY); H = Math.round(H);
  const w = Math.round(H * 0.4), sway = Math.round(Math.sin(t * 4) * 1);
  const shoulderY = Math.round(baseY - H * 0.6);
  // long dark cloak, flaring to the floor
  p.fillStyle = "#16141d";
  for (let y = shoulderY; y < baseY; y++) { const f = (y - shoulderY) / (baseY - shoulderY); const ww = Math.round(w * (0.46 + 0.62 * f)); const ox = Math.round(sway * (1 - f)); p.fillRect(cx - Math.floor(ww / 2) + ox, y, ww, 1); }
  p.fillStyle = "#0c0b12"; for (let i = 0; i < 3; i++) p.fillRect(cx - Math.round(w * 0.2) + i * Math.round(w * 0.2), shoulderY + 3, 1, Math.round(H * 0.54)); // cloak folds
  p.fillStyle = "#23212e"; p.fillRect(cx - Math.round(w * 0.42), shoulderY + 2, 1, Math.round(H * 0.5)); // a lit cloak edge
  // the bulging sack of loot at his side, a glint of stolen treasure poking out
  const bx = cx + Math.round(w * 0.5), by = Math.round(baseY - H * 0.34);
  p.fillStyle = "#5a4326"; fillDisc(p, bx, by, Math.round(H * 0.16)); p.fillStyle = "#3e2e18"; fillDisc(p, bx + 1, by + 2, Math.round(H * 0.11));
  p.fillStyle = "#6e5430"; p.fillRect(bx - Math.round(H * 0.1), by - Math.round(H * 0.17), Math.round(H * 0.2), 2); // tied neck of the sack
  treasureGlint(p, bx, by - Math.round(H * 0.12), t, "#e8c24a");
  // head — pale, gaunt
  const hy = shoulderY - Math.round(H * 0.12);
  p.fillStyle = "#b89a7a"; fillDisc(p, cx + sway, hy, Math.round(H * 0.1));
  p.fillStyle = "#0a0a0c"; p.fillRect(cx + sway - 3, hy - 1, 2, 1); p.fillRect(cx + sway + 1, hy - 1, 2, 1); // eye sockets
  p.fillStyle = "#9affb0"; p.fillRect(cx + sway - 2, hy - 1, 1, 1); p.fillRect(cx + sway + 2, hy - 1, 1, 1); // a cold glint in his eyes
  p.fillStyle = "#2a1f16"; p.fillRect(cx + sway - 3, hy + 2, 7, 1); // thin moustache
  p.fillStyle = "#241622"; p.fillRect(cx + sway - 4, hy - Math.round(H * 0.1), 9, 3); p.fillRect(cx + sway - 2, hy - Math.round(H * 0.15), 6, 2); // feathered cap
  p.fillStyle = "#7a2030"; p.fillRect(cx + sway + 4, hy - Math.round(H * 0.16), 4, 1); p.fillRect(cx + sway + 6, hy - Math.round(H * 0.19), 3, 1); // red feather
  // the stiletto, a thin bright blade catching the light, angled up
  const ax = cx - Math.round(w * 0.5), ay = Math.round(baseY - H * 0.42);
  p.fillStyle = "#1a1822"; p.fillRect(ax, ay, Math.round(w * 0.3), 2); // sleeve / forearm
  const bl = Math.round(H * 0.22); p.fillStyle = "#cfd6e0"; for (let k = 0; k < bl; k++) p.fillRect(ax - k, ay - k, 1, 1);
  p.fillStyle = "#ffffff"; p.fillRect(ax - bl, ay - bl, 1, 1); // tip glint
}
let _obuf: HTMLCanvasElement | null = null, _octx: CanvasRenderingContext2D | null = null;
let _thiefFlash = false, _thiefT0 = -1;
// Called from the game loop when the thief's theft message appears; he strides
// through the current room for a few seconds, then is gone.
export function flashThief() { _thiefFlash = true; _thiefT0 = -1; }
function thiefOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  if (!_thiefFlash) return;
  if (_thiefT0 < 0) _thiefT0 = t;
  const dt = t - _thiefT0; const DUR = 4.5;
  if (dt > DUR) { _thiefFlash = false; return; }
  const a = dt < 0.6 ? dt / 0.6 : dt > DUR - 1.3 ? Math.max(0, (DUR - dt) / 1.3) : 1; // fade in, stride, fade out
  const pw = 256, ph = Math.max(1, Math.round(pw * h / w));
  if (!_obuf) { _obuf = document.createElement("canvas"); _octx = _obuf.getContext("2d"); }
  if (_obuf.width !== pw || _obuf.height !== ph) { _obuf.width = pw; _obuf.height = ph; }
  const p = _octx!; p.globalCompositeOperation = "source-over"; p.globalAlpha = 1; p.clearRect(0, 0, pw, ph);
  const cx = Math.round(pw * (0.18 + (dt / DUR) * 0.64)); // he crosses the room as he passes through
  thiefSprite(p, cx, Math.round(ph * 0.84), Math.round(ph * 0.52), t);
  ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = a;
  ctx.drawImage(_obuf, 0, 0, pw, ph, 0, 0, w, h); ctx.globalAlpha = 1;
}
function figureProp(p: CanvasRenderingContext2D, x: number, baseY: number, hh: number, body: string, eye: string, oneEye: boolean) {
  p.fillStyle = body; p.fillRect(x - Math.round(hh * 0.18), baseY - hh, Math.round(hh * 0.36), hh); // torso
  p.fillStyle = body; fillDisc(p, x, baseY - hh - Math.round(hh * 0.12), Math.round(hh * 0.16)); // head
  p.fillStyle = eye; if (oneEye) p.fillRect(x - 1, baseY - hh - Math.round(hh * 0.13), 2, 2); else { p.fillRect(x - 3, baseY - hh - Math.round(hh * 0.13), 2, 1); p.fillRect(x + 2, baseY - hh - Math.round(hh * 0.13), 2, 1); }
}
// a proper pixel humanoid creature: legs, tapered torso, arms, head, eyes/blink
function creature(p: CanvasRenderingContext2D, cx: number, floorY: number, H: number, wd: number, body: string, bodyDk: string, eye: string, oneEye: boolean, t: number) {
  cx = Math.round(cx); H = Math.round(H); wd = Math.round(wd);
  const top = floorY - H, headR = Math.max(3, Math.round(H * 0.17)), headCy = top + headR;
  const torsoTop = headCy + headR - 1, torsoBot = Math.round(floorY - H * 0.24);
  p.fillStyle = bodyDk; // legs
  p.fillRect(cx - Math.round(wd * 0.3), torsoBot, Math.round(wd * 0.22), floorY - torsoBot);
  p.fillRect(cx + Math.round(wd * 0.08), torsoBot, Math.round(wd * 0.22), floorY - torsoBot);
  const breathe = Math.round(Math.sin(t * 1.4) * 1); // slow heave of the chest
  for (let y = torsoTop; y < torsoBot; y++) { // torso: shaded mass, not stripes
    const f = (y - torsoTop) / Math.max(1, torsoBot - torsoTop);
    const hw = Math.round(wd * (0.52 - 0.14 * f)) + (y < torsoTop + 4 ? breathe : 0);
    p.fillStyle = body; p.fillRect(cx - hw, y, hw * 2, 1);
    p.fillStyle = bodyDk; p.fillRect(cx - hw, y, Math.max(1, Math.round(hw * 0.6)), 1); // shadow side
    if (hash(cx, y) > 0.85) { p.fillStyle = bodyDk; p.fillRect(cx + Math.round(hw * 0.3), y, 2, 1); } // hide blotches
  }
  p.fillStyle = bodyDk; p.fillRect(cx - Math.round(wd * 0.5), torsoBot - 2, wd, 3); // ragged loincloth line
  p.fillStyle = bodyDk; // arms, with heavy fists
  p.fillRect(cx - Math.round(wd * 0.52) - 3, torsoTop + 2, 4, Math.round(H * 0.32));
  p.fillRect(cx + Math.round(wd * 0.52) - 1, torsoTop + 2, 4, Math.round(H * 0.32));
  p.fillStyle = body;
  p.fillRect(cx - Math.round(wd * 0.52) - 4, torsoTop + 2 + Math.round(H * 0.32), 5, 4);
  p.fillRect(cx + Math.round(wd * 0.52) - 2, torsoTop + 2 + Math.round(H * 0.32), 5, 4);
  p.fillStyle = body; fillDisc(p, cx, headCy, headR);
  p.fillStyle = bodyDk; p.fillRect(cx - headR, headCy + headR - 1, headR * 2, 1); // jaw shadow
  p.fillRect(cx - headR + 1, headCy - Math.round(headR * 0.4) - 1, headR * 2 - 2, 2); // the heavy brow
  const blink = Math.sin(t * 0.8 + cx) > -0.9;
  if (blink) {
    if (oneEye) { // ONE baleful eye under the brow — small, mean, glinting
      const er = Math.max(2, Math.round(headR * 0.3));
      p.fillStyle = eye; fillDisc(p, cx, headCy, er);
      p.fillStyle = "#1c0c06"; p.fillRect(cx, headCy, 1, Math.max(1, er - 1)); // slit pupil
      if (Math.sin(t * 2.6) > 0.5) { p.fillStyle = "#ffe2c8"; p.fillRect(cx - 1, headCy - er + 1, 1, 1); } // glint
    } else { p.fillStyle = eye; p.fillRect(cx - Math.round(headR * 0.55), headCy - 1, 2, 2); p.fillRect(cx + Math.round(headR * 0.25), headCy - 1, 2, 2); }
  } else { p.fillStyle = bodyDk; p.fillRect(cx - headR + 2, headCy, headR * 2 - 4, 1); }
  // tusks at the jaw
  if (oneEye) { p.fillStyle = "#e8dcc0"; p.fillRect(cx - Math.round(headR * 0.5), headCy + headR - 2, 1, 2); p.fillRect(cx + Math.round(headR * 0.5), headCy + headR - 2, 1, 2); }
}
function drawProp(p: CanvasRenderingContext2D, name: string, x: number, floorY: number, ph: number, t: number) {
  const n = name.toLowerCase();
  const baseY = floorY + Math.round((ph - floorY) * 0.42);
  if (/wooden door|stone door|\bdoor\b/.test(n)) { p.fillStyle = "#3a2a1a"; p.fillRect(x - 6, baseY - 22, 12, 22); p.fillStyle = "#241810"; p.fillRect(x - 6, baseY - 22, 12, 1); p.fillStyle = "#6a5436"; p.fillRect(x + 3, baseY - 12, 1, 1); return; }
  if (/table|pedestal|altar/.test(n)) { tablePixel(p, x, baseY - 6, 22, 8, "#6a4f2c", "#3e2e19"); if (/altar/.test(n)) { p.fillStyle = "#caa24a"; p.fillRect(x - 2, baseY - 12, 4, 6); } return; }
  if (/candle/.test(n)) { p.fillStyle = "#e8e0c0"; p.fillRect(x - 3, baseY - 8, 2, 8); p.fillRect(x + 1, baseY - 8, 2, 8); const fl = Math.sin(t * 8) > 0 ? 1 : 0; ditherGlow(p, x, baseY - 10, 8, 9, "#ffce6a", 0.5 + fl * 0.1); p.fillStyle = "#ffe9a8"; p.fillRect(x - 2, baseY - 10 - fl, 1, 2); p.fillRect(x + 2, baseY - 10, 1, 2); return; }
  if (/skeleton|remains|bones|souls/.test(n)) { p.fillStyle = "#d8d2c0"; fillDisc(p, x, baseY - 8, 3); p.fillRect(x - 1, baseY - 9, 1, 1); p.fillRect(x + 1, baseY - 9, 1, 1); p.fillStyle = "#b8b2a0"; for (let i = 0; i < 4; i++) p.fillRect(x - 4 + i * 2, baseY - 4, 1, 4); return; }
  if (/mirror/.test(n)) { p.fillStyle = "#2a2e36"; p.fillRect(x - 8, baseY - 30, 16, 30); p.fillStyle = "#3a4a5a"; for (let yy = 0; yy < 28; yy++) for (let xx = 0; xx < 14; xx++) if (((xx + yy) % 5) === 0) p.fillRect(x - 7 + xx, baseY - 29 + yy, 1, 1); p.fillStyle = "#6a5436"; p.fillRect(x - 9, baseY - 31, 18, 1); return; }
  if (/machine|panel|switch|button|pump|tool|wrench|screwdriver/.test(n)) { p.fillStyle = "#3a4048"; p.fillRect(x - 9, baseY - 16, 18, 16); p.fillStyle = "#22262c"; p.fillRect(x - 7, baseY - 14, 14, 12); for (let i = 0; i < 3; i++) { p.fillStyle = ["#c83a2a", "#caa24a", "#3a8a4a"][i]; p.fillRect(x - 5 + i * 5, baseY - 11, 2, 2); } return; }
  if (/ladder/.test(n)) { p.fillStyle = "#6a4f2c"; p.fillRect(x - 5, baseY - 30, 2, 30); p.fillRect(x + 3, baseY - 30, 2, 30); for (let r = 0; r < 6; r++) p.fillRect(x - 5, baseY - 28 + r * 5, 10, 1); return; }
  if (/painting/.test(n)) { p.fillStyle = "#8a6a3a"; p.fillRect(x - 12, baseY - 34, 24, 22); p.fillStyle = "#2a3a4a"; p.fillRect(x - 10, baseY - 32, 20, 18); p.fillStyle = "#6a8a6a"; p.fillRect(x - 8, baseY - 24, 16, 8); return; }
  if (/bell/.test(n)) { p.fillStyle = "#b8902a"; for (let yy = 0; yy < 8; yy++) { const ww = 2 + yy; p.fillRect(x - ww, baseY - 16 + yy, ww * 2, 1); } p.fillStyle = "#6a5018"; p.fillRect(x - 1, baseY - 8, 2, 2); return; }
  if (/bat\b/.test(n)) { const by = baseY - 30 + Math.round(Math.sin(t * 2) * 4); p.fillStyle = "#1a1014"; const flap = Math.sin(t * 9) * 3; p.fillRect(x - 1, by, 2, 3); p.fillRect(x - 6, by + Math.round(flap), 5, 1); p.fillRect(x + 1, by + Math.round(flap), 5, 1); return; }
  if (/cyclops/.test(n)) { figureProp(p, x, baseY, 40, "#3a2e22", "#ff5a3a", true); return; }
  if (/thief|ghost|spirit|gnome|vampire/.test(n)) { figureProp(p, x, baseY, 30, "#1c1c24", "#9affb0", false); return; }
  if (/leak|water|stream/.test(n)) { p.fillStyle = "#3a6a8a"; for (let i = 0; i < 5; i++) p.fillRect(x - 4 + i * 2, baseY - hash(i, x) * 6, 1, 2); return; }
  if (/leaves|leaf/.test(n)) { for (let i = 0; i < 10; i++) { p.fillStyle = ["#6a5a2a", "#4a3a1a", "#7a6a3a"][i % 3]; p.fillRect(x - 8 + (i * 3 % 16), baseY - 2 - (i % 2), 2, 1); } return; }
  if (TREASURE.test(n)) { const col = /gold|coin|bar|chalice|coffin|pot|bell|brass/.test(n) ? "#e8c24a" : /sapphire|crystal|diamond|trident/.test(n) ? "#7fe0ff" : /jade|emerald/.test(n) ? "#6affa0" : /scarab|skull|figurine/.test(n) ? "#d8d0b0" : "#ff8ad8"; treasureGlint(p, x, baseY - 4, t, col); return; }
  // generic small object on the floor (a crate/rock)
  p.fillStyle = "#3a342c"; p.fillRect(x - 4, baseY - 5, 8, 5); p.fillStyle = "#4a443a"; p.fillRect(x - 4, baseY - 5, 8, 1);
}
function pickPal(region: string, ldesc: string): CavePal {
  const lamp = { x: 0.5, y: 0.98, rx: 0.72, ry: 1.0, col: [222, 168, 92], peak: 0.8 };
  const L = (pw = 1, ph = 1) => ({ x: lamp.x * pw, y: lamp.y * ph, rx: lamp.rx * pw, ry: lamp.ry * ph, col: lamp.col, peak: lamp.peak });
  void L;
  if (region === "hades") return { wallTop: [48, 20, 20], wallBot: [18, 6, 6], wallHi: [80, 28, 24], floorTop: [40, 16, 14], floorBot: [12, 4, 4], floorHi: [70, 24, 20], ceil: "#0a0202" };
  if (region === "mine") return { wallTop: [40, 34, 28], wallBot: [16, 13, 10], wallHi: [56, 48, 38], floorTop: [34, 28, 20], floorBot: [10, 8, 6], floorHi: [50, 42, 30], ceil: "#080604" };
  if (region === "temple") return { wallTop: [62, 56, 44], wallBot: [30, 26, 20], wallHi: [82, 74, 58], floorTop: [54, 48, 38], floorBot: [22, 19, 14], floorHi: [74, 66, 50], ceil: "#0c0a06" };
  if (/water|stream|river|reservoir|damp/.test(ldesc)) return { wallTop: [34, 44, 52], wallBot: [12, 18, 24], wallHi: [48, 60, 70], floorTop: [24, 40, 54], floorBot: [8, 16, 26], floorHi: [40, 64, 84], ceil: "#05080c" };
  return { wallTop: [50, 48, 54], wallBot: [22, 21, 26], wallHi: [68, 66, 74], floorTop: [44, 42, 46], floorBot: [16, 15, 18], floorHi: [62, 60, 66], ceil: "#070708" }; // generic stone (cellar/dungeon/maze)
}
function composeRoom(room: any, objects: any): SceneDraw {
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
