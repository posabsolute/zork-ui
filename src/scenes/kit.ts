// scenes/kit.ts — the pixel toolkit: stage/dither/palette primitives, shared
// backdrops (cave, stone room, house, river...), sprites, and every helper used
// by more than one region's scenes.

import { rf } from "./state.ts";

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
export function ridge(ctx: CanvasRenderingContext2D, w: number, h: number, baseY: number, amp: number, color: string, seed: number) {
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

export const dth = (x: number, y: number) => _bayer[(y & 3) * 4 + (x & 3)] / 16;

export function mix(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function hash(x: number, y: number) { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }

// ordered-dither quantization of one channel to `levels` steps
function quant(v: number, th: number, levels: number) {
  const f = (v / 255) * (levels - 1);
  const base = Math.floor(f);
  const lvl = base + ((f - base) > th ? 1 : 0);
  return (lvl / (levels - 1)) * 255;
}

// posterize the VALUE to 8 dithered steps while preserving the hue exactly —
// per-channel grids fringe into rainbow speckle or wrong-hue camo bands.
export function qcol(c: number[], th: number): number[] {
  const lum = Math.max(1, (c[0] + c[1] + c[2]) / 3), lf = (lum / 255) * 7, b = Math.floor(lf);
  const s = ((Math.min(7, b + (lf - b > th ? 1 : 0)) / 7) * 255) / lum;
  return [Math.min(255, c[0] * s), Math.min(255, c[1] * s), Math.min(255, c[2] * s)];
}

export function sp(d: Uint8ClampedArray, pw: number, x: number, y: number, c: number[]) {
  const i = (y * pw + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
}

export function fillDisc(p: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let y = -r; y <= r; y++) { const xw = Math.floor(Math.sqrt(r * r - y * y)); p.fillRect(cx - xw, cy + y, xw * 2 + 1, 1); }
}

// pixel-honest glow: plot warm pixels where falloff beats the Bayer threshold —
// a dithered halo (the retro way) instead of a smooth gaussian blur.
export function ditherGlow(p: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, col: string, peak: number) {
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

export function pixelStage(ctx: CanvasRenderingContext2D, w: number, h: number, pw: number, draw: (p: CanvasRenderingContext2D, pw: number, ph: number) => void) {
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
export function housePixel(p: CanvasRenderingContext2D, pw: number, ph: number, horizon: number, t: number, cxFrac = 0.5, opts: HouseOpts = {}) {
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
      win(bays[0], wyU, "boarded"); win(bays[1], wyU, "boarded"); win(bays[3], wyU, "boarded"); win(bays[4], wyU, "boarded"); // upper storey: 4 windows, clear clapboard above the door
      win(bays[0], wyL, "boarded"); win(bays[1], wyL, "boarded"); win(bays[3], wyL, "boarded"); win(bays[4], wyL, "boarded"); // 4 flanking the door
      // ---- the centred entrance: pilasters, pediment, fanlight, boarded door ----
      const dw = Math.max(8, Math.round(hw * 0.1)), dh = Math.round(wallH * 0.48), dx = cx - Math.round(dw / 2), dy = baseY - dh;
      p.fillStyle = stone; p.fillRect(dx - 3, baseY - 1, dw + 6, 2); p.fillStyle = "#54524a"; p.fillRect(dx - 1, baseY - 3, dw + 2, 2); // stone steps
      p.fillStyle = "#1d211c"; p.fillRect(dx - 4, baseY + 1, dw + 8, 1); // the steps' shadow on the grass
      p.fillStyle = "#262a32"; p.fillRect(dx - 2, dy - 1, 2, dh - 2); p.fillRect(dx + dw, dy - 1, 2, dh - 2); // the entry recess, sunk in shadow
      p.fillStyle = doorW; p.fillRect(dx, dy, dw, dh); p.fillStyle = doorL; for (let k = 0; k < 3; k++) p.fillRect(dx, dy + 4 + k * Math.round(dh * 0.26), dw, 2); p.fillStyle = "#241a10"; p.fillRect(cx, dy, 1, dh); // boarded door
      p.fillStyle = trim; p.fillRect(dx - 3, dy - 2, 1, dh + 2); p.fillRect(dx + dw + 2, dy - 2, 1, dh + 2); // pilasters
      p.fillStyle = trim; p.fillRect(dx - 3, dy - 3, dw + 6, 1); p.fillStyle = "#565c66"; p.fillRect(dx - 3, dy - 2, dw + 6, 1); // plain flat lintel, nothing above it
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

export function mailboxPixel(p: CanvasRenderingContext2D, x: number, y: number) {
  // dithered shadow pool so it sits ON the lawn instead of dissolving into it
  for (let yy = y - 1; yy < y + 3; yy++) for (let xx = x - 8; xx < x + 10; xx++) { const ex = (xx - x) / 8, ey = (yy - y) / 2.2, dd = ex * ex + ey * ey; if (dd < 1 && (1 - dd) * 0.8 > dth(xx, yy)) { p.fillStyle = "#040604"; p.fillRect(xx, yy, 1, 1); } }
  p.fillStyle = "#101216"; p.fillRect(x - 1, y - 11, 4, 12); // post, near-black
  p.fillStyle = "#2e333c"; p.fillRect(x, y - 11, 1, 12); // its moonlit edge
  // the box: a real mailbox loaf — dark outline, moon-caught rounded lid
  p.fillStyle = "#0c0e12"; p.fillRect(x - 6, y - 19, 13, 8); // sel-out mass
  p.fillStyle = "#3c4452"; p.fillRect(x - 5, y - 18, 11, 6); // body
  p.fillStyle = "#788699"; p.fillRect(x - 5, y - 18, 11, 1); p.fillRect(x - 4, y - 19, 9, 1); // rounded lid, bright in the moon
  p.fillStyle = "#232830"; p.fillRect(x + 4, y - 17, 2, 5); // shadowed end
  if (rf("WEST-OF-HOUSE", "mailboxOpen")) { // open — the little door is up and the leaflet shows
    p.fillStyle = "#15171c"; p.fillRect(x - 4, y - 16, 8, 4); // dark interior
    p.fillStyle = "#e8e0c0"; p.fillRect(x - 3, y - 16, 6, 3); // the leaflet
    p.fillStyle = "#4c5665"; p.fillRect(x - 6, y - 22, 11, 3); p.fillStyle = "#8a98ac"; p.fillRect(x - 6, y - 22, 11, 1); // the door, thrown up
  } else {
    p.fillStyle = "#15171c"; p.fillRect(x - 5, y - 16, 1, 3); // the front-door seam
    p.fillStyle = "#525b6a"; p.fillRect(x - 4, y - 15, 2, 1); // latch
  }
  p.fillStyle = "#c8432e"; p.fillRect(x + 7, y - 19, 2, 4); p.fillRect(x + 7, y - 19, 4, 2); // the little red flag, up
}

export function fgTreePixel(p: CanvasRenderingContext2D, pw: number, ph: number, t: number) {
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
export function pixelBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, moonF = 0.26) {
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

// fireflies drifting between the trunks — blink on, drift, wink out
export function fireflies(p: CanvasRenderingContext2D, pw: number, ph: number, horizon: number, t: number, n = 3) {
  for (let i = 0; i < n; i++) {
    const on = Math.sin(t * 1.6 + i * 2.9) > 0.45; if (!on) continue;
    const fx = Math.round(pw * (0.14 + i * 0.32) + Math.sin(t * 0.37 + i * 2.4) * pw * 0.09);
    const fy = Math.round(horizon + (ph - horizon) * (0.2 + 0.18 * Math.sin(t * 0.21 + i * 1.7)));
    p.fillStyle = "#3e5a22"; p.fillRect(fx - 1, fy, 3, 1); p.fillRect(fx, fy - 1, 1, 3); // faint green cross
    p.fillStyle = "#c2ff8a"; p.fillRect(fx, fy, 1, 1); // the spark
  }
}

export function rainPixel(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, n = 70) {
  p.fillStyle = "rgba(150,180,220,0.30)";
  for (let i = 0; i < n; i++) { const rx = Math.floor(hash(i, 7) * pw); const ry = Math.floor((t * 95 + i * 41) % (ph + 10)); p.fillRect(rx, ry, 1, 2); }
}

// a dithered dirt trail receding toward the treeline (north) or off to a side (east)
export function pixelPath(p: CanvasRenderingContext2D, pw: number, ph: number, horizon: number, dir: "north" | "east") {
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

// ===========================================================================
// FOREST scenes (dim, textured pixel forest)
// ===========================================================================
export function forestBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, lightDir: "east" | "soft" | "none") {
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

export function pixelCanopy(p: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, greens: string[]) {
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

export function pixelTree(p: CanvasRenderingContext2D, x: number, baseY: number, hgt: number, w: number, t: number, far: boolean) {
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

export function interiorBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, o: RoomOpts, t = 0) {
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

export function trapDoor(p: CanvasRenderingContext2D, cx: number, cy: number, open: boolean) {
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

export function treasureIcon(p: CanvasRenderingContext2D, name: string, x: number, y: number) {
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

export function swordMounted(p: CanvasRenderingContext2D, cx: number, y: number, len: number) {
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

export function lanternIcon(p: CanvasRenderingContext2D, x: number, y: number) {
  p.fillStyle = "#0c0c10"; p.fillRect(x - 1, y - 2, 9, 12); // outline
  p.fillStyle = "#9a7a30"; p.fillRect(x + 2, y - 2, 3, 2); // ring handle
  p.fillStyle = "#caa24a"; p.fillRect(x, y, 7, 2); p.fillRect(x, y + 8, 7, 2); // brass top/bottom
  p.fillStyle = "#7a5e22"; p.fillRect(x, y + 2, 7, 6); // cage frame
  p.fillStyle = "#241f14"; p.fillRect(x + 1, y + 2, 5, 6); // dark glass (unlit)
  p.fillStyle = "#caa24a"; p.fillRect(x + 2, y + 2, 1, 6); p.fillRect(x + 4, y + 2, 1, 6); // bars
}

export function gothicDoor(p: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number) {
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

export function orientalRug(p: CanvasRenderingContext2D, cx: number, cy: number, rw: number, rh: number) {
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

// ===========================================================================
// HAND-CRAFTED landmark rooms (best ones first), each composed from its text.
// These share the pixel toolkit (caveBackdrop/canyonBackdrop/etc.) but the
// composition is deliberate per room, not generic.
// ===========================================================================
export function lampPal(region: string, pw: number, ph: number, peak = 0.85): CavePal {
  const pal = pickPal(region, "");
  pal.light = { x: pw * 0.5, y: ph * 0.98, rx: pw * 0.75, ry: ph, col: [222, 168, 92], peak };
  return pal;
}

// A detailed, shaded troll: hunched green brute, heavy brow, fanged underbite,
// big belly, defined limbs, the bloody axe. Drawn in a 64-tall design grid
// (gx from centre, gy up from the feet) scaled to H, lit from the upper-left,
// sel-out shadow edges so the masses separate instead of merging into a blob.
export function trollSprite(p: CanvasRenderingContext2D, cx: number, floorY: number, H: number, t: number) {
  cx = Math.round(cx); const s = H / 64;
  const X = (gx: number) => Math.round(cx + gx * s), Y = (gy: number) => Math.round(floorY - gy * s);
  const disc = (gx: number, gy: number, gr: number, c: string) => { p.fillStyle = c; fillDisc(p, X(gx), Y(gy), Math.max(1, Math.round(gr * s))); };
  const rect = (gx: number, gy: number, gw: number, gh: number, c: string) => { p.fillStyle = c; p.fillRect(X(gx), Y(gy + gh), Math.max(1, Math.round(gw * s)), Math.max(1, Math.round(gh * s))); };
  const ink = "#121808", c0 = "#1e2a12", c1 = "#33471d", c2 = "#4a6428", c3 = "#617e34", hi = "#7a984b";
  const cloth = "#5a3f22", clothd = "#3a2814", bone = "#e8dec2", blood = "#811414", steel = "#b2b8c2", steelD = "#787f88", steelHi = "#e6ecf2", wood = "#4a3526", woodHi = "#6a4f38";
  const heave = Math.round(Math.abs(Math.sin(t * 1.4)) * s); // his chest heaves
  // dithered ground shadow rooting him to the flags
  for (let y = Y(0) - 1; y < Y(0) + Math.max(2, Math.round(3 * s)); y++) for (let x = X(-21); x < X(21); x++) { const ex = (x - X(0)) / (20 * s), ey = (y - Y(0)) / (2.6 * s); const dd = ex * ex + ey * ey; if (dd < 1 && (1 - dd) * 0.8 > dth(x, y)) { p.fillStyle = "#0a0d06"; p.fillRect(x, y, 1, 1); } }
  // wide-stance legs — thick columns, dark outer edge, lit inner shin
  rect(-15, 2, 10, 15, c1); rect(5, 2, 10, 15, c1);
  rect(-15, 2, 3, 15, c0); rect(12, 2, 3, 15, c0);
  rect(-8, 3, 2, 12, c2); rect(6, 3, 2, 12, c2);
  // splayed feet + bone claws
  rect(-18, 0, 13, 3, c0); rect(5, 0, 13, 3, c0);
  for (const fx of [-18, -15, -12]) rect(fx, 0, 2, 2, bone); for (const fx of [7, 10, 13]) rect(fx, 0, 2, 2, bone);
  // ragged loincloth
  rect(-13, 13, 26, 9, cloth); rect(-13, 20, 26, 2, "#6e4e2a");
  for (let i = 0; i < 6; i++) rect(-12 + i * 4.2, 10 + (i % 2) * 2, 2, 4, clothd); // torn fringe
  // the gut — a great sagging belly, lit upper-left, falling into shadow right
  disc(1, 29 + (heave ? 1 : 0), 15, c2);
  disc(9, 28, 10, c1); disc(-4, 31, 10, c3); disc(-7, 34, 5, hi); // form shading
  rect(-14, 22, 30, 1, ink); // sel-out under the overhang
  disc(1, 24, 3, c1); rect(0, 23, 2, 2, c0); // navel
  // chest + hunched shoulders
  disc(0, 44 + heave, 12, c2); disc(-9, 47, 7, c1); disc(10, 47, 7, c1); disc(-4, 46, 6, c3);
  // LEFT ARM — hangs to the knee: shoulder, long forearm, huge knuckled fist
  disc(-15, 45, 6, c2); rect(-21, 26, 7, 17, c1); rect(-21, 26, 2, 17, c0); rect(-16, 28, 2, 14, c2);
  disc(-18, 23, 6, c1); disc(-19, 24, 3, c2); // fist, lit knuckle
  for (const k of [-22, -19, -16]) rect(k, 19, 2, 2, bone); // claws
  // RIGHT ARM — raised, gripping the haft
  disc(14, 46, 6, c2); rect(15, 47, 6, 7, c1); disc(19, 54, 5, c1); disc(18, 55, 2, c2); // fist on the haft
  // bull neck + the great head, thrust forward
  rect(-6, 50, 12, 4, c1);
  disc(0, 59, 11, c2); disc(-4, 61, 6, c3); // skull, moon of a brow
  disc(-13, 59, 3, c1); disc(13, 59, 3, c1); rect(-14, 60, 2, 3, c0); rect(13, 60, 2, 3, c0); // pointed ears
  rect(-10, 59, 20, 2, ink); // the heavy brow ridge, a black shelf
  rect(-8, 56, 4, 2, "#f4e63c"); rect(4, 56, 4, 2, "#f4e63c"); rect(-6, 56, 1, 2, ink); rect(6, 56, 1, 2, ink); // baleful eyes beneath it
  disc(0, 54, 3, c3); rect(-1, 52, 3, 1, c1); // squashed nose
  rect(-9, 47, 18, 5, c1); rect(-9, 47, 18, 1, c0); rect(-8, 49, 16, 2, "#160c08"); // jaw + open maw
  rect(-7, 48, 2, 4, bone); rect(5, 48, 2, 4, bone); rect(-1, 48, 2, 3, bone); // underbite fangs
  p.fillStyle = c0; for (const [wx, wy] of [[-7, 37], [5, 26], [9, 41], [-11, 30]] as const) p.fillRect(X(wx), Y(wy), Math.max(1, Math.round(s)), Math.max(1, Math.round(s))); // warts
  // THE AXE — haft rising past his fist, a big pixel-stepped blade at the top
  rect(19, 24, 3, 34, wood); rect(19, 24, 1, 34, woodHi);
  rect(17, 51, 8, 2, "#2a1f16"); // grip wrap
  for (let r = 0; r < 11; r++) { // convex cutting edge, stepped — no smooth polygon
    const wRow = Math.round(5 + Math.sin((r / 10) * Math.PI) * 8);
    rect(22, 52 + r, wRow, 1, r < 3 ? steelD : steel);
    rect(22 + wRow - 1, 52 + r, 1, 1, steelHi); // gleam along the edge
    if (r > 2 && r < 9 && hash(r, 5) > 0.45) rect(22 + wRow - 2, 52 + r, 1, 1, blood); // old blood at the edge
  }
  rect(21, 54, 2, 7, "#5a5f66"); // the dark socket at the haft
}

// tiny helper: put one solid pixel from an rgb triplet (used by hand-built scenes)
export function sp2(p: CanvasRenderingContext2D, x: number, y: number, c: number[]) {
  p.fillStyle = `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`; p.fillRect(x, y, 1, 1);
}

// ---- batch 2: underground showpieces ----
export function waterFill(p: CanvasRenderingContext2D, pw: number, topY: number, botY: number, t: number, hi: string, lo: string) {
  for (let y = topY; y < botY; y++) for (let x = 0; x < pw; x++) { const v = Math.sin(x * 0.12 + t * 1.5 + y * 0.3) * 0.5 + 0.5; if (v * 0.65 > dth(x, y)) { p.fillStyle = ((x + y) & 1) ? lo : hi; p.fillRect(x, y, 1, 1); } }
}

// ---- batch 4: the coal mine & machine ----
export function mineTimbers(p: CanvasRenderingContext2D, pw: number, ph: number, floorY: number) {
  p.fillStyle = "#4a3a24"; p.fillRect(Math.round(pw * 0.08), Math.round(ph * 0.1), Math.round(pw * 0.84), 5); p.fillStyle = "#2a2012"; p.fillRect(Math.round(pw * 0.08), Math.round(ph * 0.1), Math.round(pw * 0.84), 1); // top cross-beam
  for (const fx of [0.12, 0.88]) { const x = Math.round(pw * fx); p.fillStyle = "#3a2c1c"; p.fillRect(x - 3, Math.round(ph * 0.1), 6, floorY - Math.round(ph * 0.1)); p.fillStyle = "#241a0e"; for (let y = Math.round(ph * 0.1); y < floorY; y += 5) p.fillRect(x - 3, y, 6, 1); } // shoring posts
}

export function coalVeins(p: CanvasRenderingContext2D, pw: number, floorY: number) {
  p.fillStyle = "#08080a"; for (let i = 0; i < 26; i++) { const x = Math.floor(hash(i, 3) * pw), y = Math.floor(hash(i, 4) * floorY); p.fillRect(x, y, 2, 2); }
  p.fillStyle = "#33333c"; for (let i = 0; i < 14; i++) { const x = Math.floor(hash(i, 5) * pw), y = Math.floor(hash(i, 6) * floorY); p.fillRect(x, y, 1, 1); } // anthracite glints
}

// a wooden mine ladder with real rails, lit stiles, and shadowed rungs
export function mineLadder(p: CanvasRenderingContext2D, lx: number, topY: number, botY: number, lean = 0) {
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
export function rockStairs(p: CanvasRenderingContext2D, cx: number, baseY: number, steps: number, dirx = 1, w0 = 13) {
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

// ---- batch 5: the maze & dead-ends ----
export function mazePal(pw: number, ph: number, seed = 0): CavePal {
  const lx = pw * (0.42 + (hash(seed, 41) * 0.16)); // the lamp pool wanders a little room to room
  return { wallTop: [44, 44, 52], wallBot: [18, 18, 24], wallHi: [62, 62, 72], floorTop: [40, 40, 46], floorBot: [14, 14, 18], floorHi: [58, 58, 66], ceil: "#070709", light: { x: lx, y: ph * 0.98, rx: pw * 0.7, ry: ph, col: [222, 168, 92], peak: 0.82 } };
}

// "a maze of twisty little passages, all alike" — one family look, but every
// room's ARRANGEMENT differs: openings vary between tall slots, low crawls and
// arches; rubble and old scratches shift; the cracks are pixel-walks, not strokes
export function mazeShell(p: CanvasRenderingContext2D, pw: number, ph: number, seed: number, t = 0) {
  const floorY = caveBackdrop(p, pw, ph, mazePal(pw, ph, seed), t); const rim = "rgb(62,62,72)";
  const r = (n: number) => hash(seed * 3.1 + n, 7);
  const xs = [0.09, 0.3, 0.5, 0.7, 0.91];
  for (let i = 0; i < xs.length; i++) {
    if (r(i) <= 0.34) continue;
    const fx = xs[i] + (r(i + 10) - 0.5) * 0.05;
    const kind = Math.floor(r(i + 40) * 3); // 0 arch · 1 tall slot · 2 low crawl
    const wFrac = kind === 1 ? 0.045 : kind === 2 ? 0.1 : 0.07;
    const hh = ph * (kind === 1 ? 0.26 + r(i + 20) * 0.08 : kind === 2 ? 0.09 + r(i + 20) * 0.04 : 0.16 + r(i + 20) * 0.1);
    const wpx = Math.round(pw * wFrac), x = Math.round(pw * fx - wpx / 2), y = floorY - Math.round(hh);
    darkArch(p, x, y, wpx, Math.round(hh), rim);
    if (kind === 2) { p.fillStyle = "#2c2c34"; p.fillRect(x - 2, y - 2, wpx + 4, 2); } // a heavy brow of rock over the crawl
  }
  // twisty cracks: jittering 1px pixel-walks branching through the rock
  p.fillStyle = "#0d0d11";
  for (let i = 0; i < 4; i++) {
    let xx = Math.round(r(i + 30) * (pw - 30)) + 15;
    for (let y = Math.round(ph * 0.13); y < floorY - 2; y += 2) {
      xx += Math.round((hash(xx, y + seed) - 0.5) * 4);
      p.fillRect(xx, y, 1, 2);
      if (hash(y, xx) > 0.86) p.fillRect(xx + (hash(xx, y) > 0.5 ? 1 : -2), y, 2, 1); // a side shoot
    }
  }
  // rubble fallen from the ceiling — a shaded mound or two, never the same spot
  for (let m = 0; m < 1 + Math.floor(r(50) * 2); m++) {
    const mx = Math.round(pw * (0.16 + r(51 + m * 3) * 0.68)), my = floorY + Math.round((ph - floorY) * (0.25 + r(52 + m * 3) * 0.5));
    const mw = 5 + Math.round(r(53 + m * 3) * 6);
    p.fillStyle = "#0c0c10"; p.fillRect(mx - mw, my + 2, mw * 2, 2); // its shadow
    for (let yy = 0; yy < 4; yy++) { const ww = Math.round(mw * (1 - yy / 4)); for (let x = mx - ww; x <= mx + ww; x++) { const k = hash(x, yy + seed); p.fillStyle = k > 0.7 ? "#3e3e48" : k < 0.25 ? "#17171d" : "#2a2a32"; p.fillRect(x, my - yy, 1, 1); } }
    p.fillStyle = "#4c4c58"; p.fillRect(mx - 1, my - 4, 2, 1); // lamplight catching the top block
  }
  // scratches left by the luckless dead — faint tally marks beside an opening
  if (r(60) > 0.5) {
    const sx = Math.round(pw * (0.2 + r(61) * 0.6)), sy = Math.round(ph * (0.3 + r(62) * 0.12));
    p.fillStyle = "#55555f";
    for (let k = 0; k < 3 + Math.floor(r(63) * 3); k++) p.fillRect(sx + k * 3, sy + ((k + seed) % 2), 1, 5);
    if (r(64) > 0.6) for (let k = 0; k < 5; k++) p.fillRect(sx - 2 + k * 3, sy + 4 - k, 2, 1); // one struck through
  }
  return floorY;
}

// ---- batch 6: the finale (all remaining rooms) ----
export function litCave(region: string, ld: string, pw: number, ph: number, peak = 0.82): CavePal {
  const pal = pickPal(region, ld); pal.light = { x: pw * 0.5, y: ph * 0.98, rx: pw * 0.72, ry: ph, col: [222, 168, 92], peak };
  return pal;
}

export function arches(p: CanvasRenderingContext2D, pw: number, ph: number, floorY: number, rim: string, dirs: string[]) {
  for (const dir of dirs) { const pos = DIRPOS[dir]; if (!pos) continue; const [fx, kind] = pos; const x = Math.round(pw * fx);
    if (kind === 0) darkArch(p, x - Math.round(pw * 0.035), floorY - Math.round(ph * 0.22), Math.round(pw * 0.07), Math.round(ph * 0.22), rim);
    else if (kind === 2) darkArch(p, x - Math.round(pw * 0.06), ph - Math.round(ph * 0.12), Math.round(pw * 0.12), Math.round(ph * 0.12), rim);
    else if (kind === -1) darkArch(p, x - Math.round(pw * 0.05), 2, Math.round(pw * 0.1), Math.round(ph * 0.12), rim);
  }
}

// -- cellar / chasm --
// A built room as a one-point-perspective BOX: back wall + receding side walls +
// floor + ceiling, each plane its own value (so it reads 3D), with masonry
// courses on the walls and a flagstone grid on the floor. Returns the back-wall
// rect for placing exits/props. This is for man-made rooms (cellar, passages…),
// distinct from the natural caveBackdrop.
interface StonePal { back: number[]; left: number[]; right: number[]; ceil: number[]; floor: number[]; mortar: string; light: { x: number; y: number; rx: number; ry: number; col: number[]; peak: number }; }

export function stoneRoom(p: CanvasRenderingContext2D, pw: number, ph: number, o: StonePal, t: number) {
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

export function builtRoom(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, kind: keyof typeof STONE_PALS = "stone", peak = 0.72, col = [222, 170, 100]) {
  const base = STONE_PALS[kind];
  return stoneRoom(p, pw, ph, { ...base, light: { x: pw * 0.5, y: ph * 0.92, rx: pw * 0.66, ry: ph * 0.85, col, peak } }, t);
}

// cut exits into the box: doorway in the back wall (N), holes in the floor (S/DOWN),
// openings in the side walls (E/W and diagonals), an opening high up (UP).
export function exitsBox(p: CanvasRenderingContext2D, pw: number, ph: number, lay: { bx0: number; by0: number; bx1: number; by1: number }, dirs: string[]) {
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

// ===========================================================================
// The scene registry
// ===========================================================================
export function pal0(p: CanvasRenderingContext2D, _x: number, _ph: number) { void p; return "#1c1814"; }

// ===========================================================================
// PROCEDURAL COMPOSER — every remaining room, built from its real description.
// Reads region + ldesc keywords + object list + exits and renders a pixel scene
// in the established style. Dark rooms still show darknessScene until lit.
// ===========================================================================
interface CavePal { wallTop: number[]; wallBot: number[]; wallHi: number[]; floorTop: number[]; floorBot: number[]; floorHi: number[]; ceil: string; light?: { x: number; y: number; rx: number; ry: number; col: number[]; peak: number }; }

export function caveBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, pal: CavePal, t = 0) {
  const floorY = Math.round(ph * 0.6);
  const flick = 0.95 + 0.05 * (0.5 + 0.5 * Math.sin(t * 9 + Math.sin(t * 23) * 1.6)); // the lamp breathes, faintly
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
    if (pal.light) { const dx = (x - pal.light.x) / pal.light.rx, dy = (y - pal.light.y) / pal.light.ry, dd = Math.sqrt(dx * dx + dy * dy), gl = Math.max(0, 1 - dd); if (gl > 0) c = mix(c, pal.light.col, gl * gl * pal.light.peak * flick); }
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
export function ambiance(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, light?: { x: number; y: number; peak: number }) {
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
export function canyonBackdrop(p: CanvasRenderingContext2D, pw: number, ph: number, water: boolean, ledge = true) {
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
export function whiteCliff(p: CanvasRenderingContext2D, x0: number, x1: number, topY: number, botY: number) {
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
export function sandBand(p: CanvasRenderingContext2D, x0: number, x1: number, topY: number, botY: number) {
  for (let x = x0; x < x1; x++) {
    const yt = topY + Math.round(Math.sin(x * 0.13) * 1.5 + hash(x >> 2, 5) * 3); // a real shoreline, not a box edge
    for (let y = yt; y < botY; y++) { const n = hash(x >> 1, y >> 1); p.fillStyle = n > 0.76 ? "#dccb92" : n < 0.2 ? "#a8975f" : "#cab87a"; p.fillRect(x, y, 1, 1); }
    p.fillStyle = "#e8dcaa"; p.fillRect(x, yt, 1, 1); // the wet lip of the sand
  }
}

// the open river filling the lower frame (rough = whitecaps & faster shimmer)
export function riverBase(p: CanvasRenderingContext2D, pw: number, ph: number, t: number, rough: boolean) {
  canyonBackdrop(p, pw, ph, false, false);
  const wy = Math.round(ph * 0.48);
  for (let y = wy; y < ph; y++) for (let x = 0; x < pw; x++) { const v = Math.sin(x * 0.1 + t * (rough ? 3 : 1.2) + y * 0.3) * 0.5 + 0.5; if (v * 0.65 > dth(x, y)) { p.fillStyle = ((x + y) & 1) ? "#234e6c" : "#356a8c"; p.fillRect(x, y, 1, 1); } if (rough && v > 0.86 && hash(x, y + Math.floor(t * 4)) > 0.6) { p.fillStyle = "#c4d8e4"; p.fillRect(x, y, 1, 1); } }
  return wy;
}

export function rainbowArc(p: CanvasRenderingContext2D, pw: number, ph: number, solid = false) {
  const cols = ["#d8504a", "#e0913a", "#e8d24a", "#5ab85a", "#4a8ad8", "#6a4ad8", "#a04ad8"];
  const cx = pw * 0.5, cy = ph * 1.25, R = ph * 1.05;
  const th = solid ? 1.01 : 0.75; // solid: every pixel commits — you could walk on it
  for (let b = 0; b < 7; b++) { const r = R - b * 2.5; for (let a = Math.PI * 1.04; a < Math.PI * 1.96; a += 0.008) { const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r); if (y >= 0 && y < ph && x >= 0 && x < pw && th > dth(x, y)) { p.fillStyle = cols[b]; p.fillRect(x, y, 1, 1); } } }
  if (solid) { p.fillStyle = "#fff6d8"; const r = R + 1.5; for (let a = Math.PI * 1.04; a < Math.PI * 1.96; a += 0.02) { const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r); if (y >= 0 && y < ph && x >= 0 && x < pw && hash(x, 3) > 0.5) p.fillRect(x, y, 1, 1); } } // a hard glinting upper edge
}

export function waterfall(p: CanvasRenderingContext2D, x: number, wd: number, topY: number, botY: number, t: number) {
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

export function darkArch(p: CanvasRenderingContext2D, x: number, y: number, w: number, hh: number, rim: string) {
  tunnel(p, x, y, w, hh, rim);
}

// a stairwell DOWN: the near step (bottom, by your feet) is widest & lit; steps
// recede up-screen, narrowing and DARKENING as they descend into the shaft.
export function stairsDown(p: CanvasRenderingContext2D, x: number, y: number, wd: number, hh: number, frame: string) {
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
export function stairsUp(p: CanvasRenderingContext2D, x: number, y: number, wd: number, hh: number, frame: string) {
  tunnel(p, x, y, wd, hh, frame); // the arched mouth it climbs into
  ditherGlow(p, x + wd / 2, y + 2, wd * 0.5, hh * 0.4, "#9ab0c4", 0.14); // a faint spill of light from above
  const n = 5, sh = hh / n;
  for (let i = 0; i < n; i++) { // i=0 nearest/bottom, i high = far/up
    const f = i / (n - 1), inset = Math.round(wd * 0.36 * f), sx = x + inset, sw = wd - inset * 2;
    const sy = Math.round(y + hh - (i + 1) * sh); if (sw < 3) break;
    const v = Math.round(42 + 46 * f); p.fillStyle = `rgb(${v},${v},${v + 4})`; p.fillRect(sx, sy, sw, Math.round(sh)); // tread, brighter higher
    p.fillStyle = `rgb(${Math.min(255, v + 26)},${Math.min(255, v + 26)},${Math.min(255, v + 30)})`; p.fillRect(sx, sy, sw, 1); // lit top edge
  }
}

const DIRPOS: Record<string, [number, number]> = { NORTH: [0.5, 0], NE: [0.72, 0], NW: [0.28, 0], EAST: [0.93, 0], WEST: [0.07, 0], SOUTH: [0.5, 1], SE: [0.78, 1], SW: [0.22, 1], UP: [0.5, -1], DOWN: [0.5, 2], IN: [0.6, 0], OUT: [0.4, 1] };

export function drawExitsCave(p: CanvasRenderingContext2D, pw: number, ph: number, floorY: number, room: any, rim: string) {
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
export const TREASURE = /gold|chalice|trident|scarab|bracelet|figurine|bar|skull|coin|jewel|pot|sceptre|scepter|emerald|diamond|torch|crown|jade|sapphire|crystal|chest|treasure|chalice|trunk|coffin|egg|scarab|bauble|canary/i;

export function treasureGlint(p: CanvasRenderingContext2D, x: number, y: number, t: number, col: string) {
  // a classic 4-point star sparkle (no dotted glow box)
  p.fillStyle = col; p.fillRect(x, y - 2, 1, 5); p.fillRect(x - 2, y, 5, 1);
  const tw = Math.sin(t * 3 + x);
  p.fillStyle = "#ffffff";
  if (tw > 0.2) p.fillRect(x, y, 1, 1);
  if (tw > 0.65) { p.fillRect(x + 3, y - 3, 1, 1); } // a stray twinkle wandering off the facet
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

export function thiefOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  if (!_thiefFlash) return;
  if (_thiefT0 < 0 || t < _thiefT0) _thiefT0 = t; // (< guards a clock swap, e.g. the __scene preview)
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

// The cyclops: a mountain of ochre muscle on a 64-grid, one huge amber eye
// under a single black brow, jaw open ("prepared to eat horses"), lit from
// the lamp at lower-left with sel-out edges.
export function cyclopsSprite(p: CanvasRenderingContext2D, cx: number, floorY: number, H: number, t: number) {
  cx = Math.round(cx); const s = H / 64;
  const X = (gx: number) => Math.round(cx + gx * s), Y = (gy: number) => Math.round(floorY - gy * s);
  const disc = (gx: number, gy: number, gr: number, c: string) => { p.fillStyle = c; fillDisc(p, X(gx), Y(gy), Math.max(1, Math.round(gr * s))); };
  const rect = (gx: number, gy: number, gw: number, gh: number, c: string) => { p.fillStyle = c; p.fillRect(X(gx), Y(gy + gh), Math.max(1, Math.round(gw * s)), Math.max(1, Math.round(gh * s))); };
  const ink = "#1c1206", d0 = "#3e2c18", d1 = "#5a4226", d2 = "#755733";
  const fur = "#4a3418", furD = "#32220e", bone = "#e8dec2";
  // ground shadow
  for (let y = Y(0) - 1; y < Y(0) + Math.max(2, Math.round(3 * s)); y++) for (let x = X(-22); x < X(22); x++) { const ex = (x - X(0)) / (21 * s), ey = (y - Y(0)) / (2.6 * s); const dd = ex * ex + ey * ey; if (dd < 1 && (1 - dd) * 0.8 > dth(x, y)) { p.fillStyle = "#0c0a06"; p.fillRect(x, y, 1, 1); } }
  // tree-trunk legs
  rect(-16, 2, 12, 18, d1); rect(4, 2, 12, 18, d1);
  rect(-16, 2, 3, 18, d0); rect(13, 2, 3, 18, d0);
  rect(-8, 3, 2, 15, d2); rect(6, 3, 2, 15, d2); // lamplit shins
  rect(-18, 0, 14, 3, d0); rect(4, 0, 14, 3, d0); // flat feet
  for (const fx of [-17, -14, -11] as const) rect(fx, 0, 2, 1, bone); for (const fx of [6, 9, 12] as const) rect(fx, 0, 2, 1, bone); // toenails
  // matted fur loincloth with a torn fringe
  rect(-15, 16, 30, 9, fur); for (let i = 0; i < 7; i++) rect(-15 + i * 4.2, 13 + (i % 2), 2, 4, furD);
  // the torso: a slab, tapering slightly to the hips, lit low-left
  for (let gy = 25; gy < 47; gy++) { const f = (gy - 25) / 22, half = Math.round(15 + f * 3); rect(-half, gy, half * 2, 1, d1); rect(-half, gy, 5, 1, d2); rect(half - 4, gy, 4, 1, d0); }
  rect(-10, 40, 8, 1, d2); rect(-9, 34, 7, 1, d2); rect(2, 38, 6, 1, d0); // pectoral / rib forms
  disc(0, 26, 2, d0); // navel
  rect(-16, 24, 33, 1, ink); // sel-out under the torso slab
  // LEFT ARM hanging, knuckles by the knee
  disc(-19, 45, 7, d1); rect(-25, 26, 8, 17, d1); rect(-25, 26, 2, 17, d0); rect(-19, 28, 2, 13, d2);
  disc(-21, 22, 6, d1); disc(-22, 23, 3, d2); for (const k of [-25, -22, -19] as const) rect(k, 18, 2, 2, d0); // heavy fist
  // RIGHT ARM half-raised, open grasping hand — he means to pick you up
  disc(19, 45, 7, d1); rect(17, 34, 8, 11, d0);
  disc(23, 31, 6, d1); for (let f2 = 0; f2 < 4; f2++) rect(20 + f2 * 3, 24 - (f2 % 2), 2, 5, d1); rect(20, 24, 2, 5, d2); // splayed fingers
  // short bull neck, then the enormous head
  rect(-7, 47, 14, 4, d0);
  disc(0, 57, 12, d1); disc(-4, 55, 7, d2); // skull, lamplit cheek
  rect(-12, 63, 24, 3, furD); for (let i = 0; i < 6; i++) rect(-12 + i * 4, 62, 2, 2, fur); // matted hair
  disc(-13, 56, 3, d0); disc(13, 56, 3, d0); // ears
  // THE EYE — one, huge, amber, dead centre
  rect(-6, 55, 12, 5, "#ded8c8"); // sclera
  const look = Math.round(Math.sin(t * 0.6) * 2); // it tracks you slowly
  rect(-2 + look, 55, 5, 5, "#c87820"); rect(-1 + look, 56, 3, 3, "#140c06"); rect(-1 + look, 58, 1, 1, "#f4e8d0"); // iris, pupil, wet glint
  rect(-8, 60, 16, 2, ink); // the single heavy brow, a black bar
  if (Math.abs(Math.sin(t * 0.9)) > 0.97) rect(-6, 55, 12, 5, d1); // a slow blink
  disc(0, 52, 3, d2); rect(-1, 50, 3, 1, d0); // broad nose
  // the mouth — open, hungry, teeth top and bottom
  rect(-8, 45, 16, 4, "#2a1208"); rect(-8, 48, 16, 1, d0);
  for (let i = 0; i < 4; i++) rect(-7 + i * 4, 47, 2, 2, bone); // upper teeth
  rect(-5, 45, 2, 2, bone); rect(3, 45, 2, 2, bone); // lower snags
  rect(-8, 44, 16, 1, ink); // chin sel-out
  p.fillStyle = d0; for (const [wx, wy] of [[-9, 38], [7, 30], [-6, 20]] as const) p.fillRect(X(wx), Y(wy), Math.max(1, Math.round(s)), Math.max(1, Math.round(s))); // scars
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

export function drawProp(p: CanvasRenderingContext2D, name: string, x: number, floorY: number, ph: number, t: number) {
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

export function pickPal(region: string, ldesc: string): CavePal {
  const lamp = { x: 0.5, y: 0.98, rx: 0.72, ry: 1.0, col: [222, 168, 92], peak: 0.8 };
  const L = (pw = 1, ph = 1) => ({ x: lamp.x * pw, y: lamp.y * ph, rx: lamp.rx * pw, ry: lamp.ry * ph, col: lamp.col, peak: lamp.peak });
  void L;
  if (region === "hades") return { wallTop: [48, 20, 20], wallBot: [18, 6, 6], wallHi: [80, 28, 24], floorTop: [40, 16, 14], floorBot: [12, 4, 4], floorHi: [70, 24, 20], ceil: "#0a0202" };
  if (region === "mine") return { wallTop: [40, 34, 28], wallBot: [16, 13, 10], wallHi: [56, 48, 38], floorTop: [34, 28, 20], floorBot: [10, 8, 6], floorHi: [50, 42, 30], ceil: "#080604" };
  if (region === "temple") return { wallTop: [62, 56, 44], wallBot: [30, 26, 20], wallHi: [82, 74, 58], floorTop: [54, 48, 38], floorBot: [22, 19, 14], floorHi: [74, 66, 50], ceil: "#0c0a06" };
  if (/water|stream|river|reservoir|damp/.test(ldesc)) return { wallTop: [34, 44, 52], wallBot: [12, 18, 24], wallHi: [48, 60, 70], floorTop: [24, 40, 54], floorBot: [8, 16, 26], floorHi: [40, 64, 84], ceil: "#05080c" };
  return { wallTop: [50, 48, 54], wallBot: [22, 21, 26], wallHi: [68, 66, 74], floorTop: [44, 42, 46], floorBot: [16, 15, 18], floorHi: [62, 60, 66], ceil: "#070708" }; // generic stone (cellar/dungeon/maze)
}
