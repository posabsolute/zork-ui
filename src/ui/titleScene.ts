/*
 * titleScene.ts — the heart of Zork, done properly.
 *
 * A brass lantern hangs swaying in a pitch-black cavern, its flame guttering.
 * Its pool of light catches the rough stone floor; beyond it, pure dark. Out
 * there, grue-eyes surface as pairs of cold pinpricks — they fade up from the
 * black and edge inward when the flame dips, and shrink away the moment it flares.
 * Light versus the dark, the lantern as lifeline: the Great Underground Empire.
 */
export function startTitleScene(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d")!;
  let raf = 0;
  let running = true;
  let t = 0;

  const resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  type Eye = { a: number; d: number; life: number; dur: number; sep: number; blink: number };
  const eyes: Eye[] = [];
  function spawnEye(flame: number): Eye {
    return {
      a: Math.random() * Math.PI * 2,
      d: 0.32 + Math.random() * 0.42 + (1 - flame) * 0.06, // closer when dark
      life: 0,
      dur: 3 + Math.random() * 4,
      sep: 5 + Math.random() * 4,
      blink: Math.random() * 100,
    };
  }
  for (let i = 0; i < 11; i++) eyes.push(spawnEye(0.7));

  function drawLantern(cx: number, cy: number, scale: number, flame: number, sway: number) {
    ctx.save();
    ctx.translate(cx, cy - scale * 4.2);
    ctx.rotate(sway);
    ctx.translate(0, scale * 4.2);
    const amber = `rgba(255, 200, 120, ${0.7 + flame * 0.3})`;
    ctx.strokeStyle = amber;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = "#ffcf8a";
    ctx.shadowBlur = 10;
    // chain
    ctx.beginPath();
    ctx.moveTo(0, -scale * 4.2);
    ctx.lineTo(0, -scale * 1.5);
    ctx.stroke();
    // top ring + cap
    ctx.beginPath();
    ctx.arc(0, -scale * 1.6, scale * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    // cage body (tapered)
    ctx.beginPath();
    ctx.moveTo(-scale * 0.7, -scale * 1.2);
    ctx.lineTo(scale * 0.7, -scale * 1.2);
    ctx.lineTo(scale * 0.95, scale * 1.1);
    ctx.lineTo(-scale * 0.95, scale * 1.1);
    ctx.closePath();
    ctx.stroke();
    // bars
    ctx.beginPath();
    ctx.moveTo(-scale * 0.3, -scale * 1.2); ctx.lineTo(-scale * 0.45, scale * 1.1);
    ctx.moveTo(scale * 0.3, -scale * 1.2); ctx.lineTo(scale * 0.45, scale * 1.1);
    ctx.moveTo(-scale * 0.82, scale * 0.1); ctx.lineTo(scale * 0.82, scale * 0.1);
    ctx.stroke();
    // base
    ctx.beginPath();
    ctx.moveTo(-scale * 1.05, scale * 1.1); ctx.lineTo(scale * 1.05, scale * 1.1);
    ctx.stroke();
    // flame inside
    ctx.shadowBlur = 18;
    ctx.fillStyle = `rgba(255, 240, 200, ${flame})`;
    ctx.beginPath();
    ctx.moveTo(0, scale * 0.7);
    ctx.quadraticCurveTo(scale * 0.32, scale * 0.1, 0, -scale * (0.5 + flame * 0.4));
    ctx.quadraticCurveTo(-scale * 0.32, scale * 0.1, 0, scale * 0.7);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    return [cx, cy] as const; // flame world pos (approx; sway is small)
  }

  function draw() {
    if (!running) return;
    raf = requestAnimationFrame(draw);
    t += 0.016;
    const w = canvas.width, h = canvas.height;
    const minDim = Math.min(w, h);
    const cx = w / 2;
    const cy = h * 0.56; // lantern hangs below the title
    const scale = minDim * 0.05;

    // cavern black with a soft trail
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(2, 2, 4, 0.32)";
    ctx.fillRect(0, 0, w, h);

    // flame flicker
    const flame = 0.7 + Math.sin(t * 9) * 0.06 + Math.sin(t * 21.7) * 0.05 + Math.sin(t * 2.7) * 0.06;
    const lightR = minDim * (0.2 + flame * 0.07);
    const sway = Math.sin(t * 1.1) * 0.05;
    const fx = cx + Math.sin(sway) * scale * 4.2;
    const fy = cy;

    ctx.globalCompositeOperation = "lighter";

    // the lantern's pool of light (kept subtle so the dark dominates)
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, lightR * 1.9);
    glow.addColorStop(0, `rgba(255, 222, 160, ${0.22 * flame})`);
    glow.addColorStop(0.3, `rgba(255, 170, 90, ${0.09 * flame})`);
    glow.addColorStop(0.7, "rgba(110, 60, 25, 0.02)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // rough cavern floor revealed by the light (contour lines below the lantern)
    ctx.strokeStyle = `rgba(255, 180, 110, ${0.22 * flame})`;
    ctx.lineWidth = 1;
    for (let k = 1; k <= 5; k++) {
      const fyl = fy + scale * 1.4 + k * minDim * 0.045;
      const reach = lightR * (1.1 - k * 0.12);
      const op = Math.max(0, (1 - k / 6)) * 0.24 * flame;
      ctx.strokeStyle = `rgba(255, 180, 110, ${op})`;
      ctx.beginPath();
      let first = true;
      for (let x = -reach; x <= reach; x += reach / 6) {
        const jag = Math.sin(x * 0.06 + k * 1.7) * (4 + k);
        const px = fx + x, py = fyl + jag;
        if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // grue eyes out in the dark
    for (let i = 0; i < eyes.length; i++) {
      const e = eyes[i];
      e.life += 0.016 / e.dur;
      if (e.life >= 1) { eyes[i] = spawnEye(flame); continue; }
      const env = Math.sin(e.life * Math.PI); // fade in then out
      // blink: brief closes
      const open = Math.sin(t * 3 + e.blink) > -0.4 ? 1 : 0.05;
      const d = e.d * minDim;
      // only out in the dark, brighter as the flame dips, dimmer near the light
      const beyond = Math.max(0, (d - lightR * 1.1) / (minDim * 0.4));
      const op = env * open * Math.min(1, beyond + 0.15) * (1.25 - flame) * 0.95;
      if (op <= 0.02) continue;
      const ex = fx + Math.cos(e.a) * d;
      const ey = fy + Math.sin(e.a) * d * 0.8;
      ctx.fillStyle = `rgba(190, 255, 130, ${op})`;
      ctx.shadowColor = "rgba(150, 255, 90, 0.9)";
      ctx.shadowBlur = 7;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(ex + (Math.cos(e.a + Math.PI / 2) * e.sep * s), ey + (Math.sin(e.a + Math.PI / 2) * e.sep * s), 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    // the lantern itself
    drawLantern(cx, cy, scale, flame, sway);

    // vignette to crush the edges to true black
    ctx.globalCompositeOperation = "source-over";
    const vg = ctx.createRadialGradient(fx, fy, lightR * 0.5, fx, fy, Math.max(w, h) * 0.7);
    vg.addColorStop(0, "rgba(2,2,4,0)");
    vg.addColorStop(1, "rgba(2,2,4,0.92)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
  draw();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}
