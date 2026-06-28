/*
 * titleScene.ts — the title-screen background, drawn from the heart of Zork.
 *
 * The Great Underground Empire is about the dark. Your brass lantern is the most
 * precious thing you own because light is survival: out in the black, grues lurk
 * — and they fear light. So the title is a lone, flickering lantern glow in an
 * endless cavern, ringed by pairs of pale grue-eyes that creep in from the dark
 * and shrink back whenever the flame flares. Light versus the dark — that is Zork.
 */
export function startTitleScene(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d")!;
  let raf = 0;
  let t = 0;
  let running = true;

  const resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  // Grue eyes lurking in the dark — angle, radius (fraction), blink + drift seeds.
  const EYES = 46;
  const eyes = Array.from({ length: EYES }, (_, i) => ({
    a: (i / EYES) * Math.PI * 2 + ((i * 41) % 17) / 17,
    d: 0.42 + ((i * 53) % 100) / 100 * 0.7, // 0.42..1.12 of the radius
    blink: ((i * 29) % 100) / 100 * Math.PI * 2,
    blinkRate: 1.5 + ((i * 13) % 100) / 100, // seconds-ish
    drift: 0.1 + ((i * 7) % 100) / 100 * 0.25,
    sep: 0.012 + ((i * 19) % 100) / 100 * 0.01, // eye separation
    hue: 70 + ((i * 23) % 30), // sickly yellow-green
  }));

  // Warm embers rising off the lantern.
  const embers = Array.from({ length: 26 }, (_, i) => ({
    x: ((i * 37) % 100) / 100,
    y: ((i * 61) % 100) / 100,
    s: 0.2 + ((i * 17) % 100) / 100 * 0.5,
  }));

  function draw() {
    if (!running) return;
    raf = requestAnimationFrame(draw);
    t += 0.016;

    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h * 0.46;
    const minDim = Math.min(w, h);

    // Deep cavern black with a slow trail.
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(2, 2, 4, 0.34)";
    ctx.fillRect(0, 0, w, h);

    // Lantern flame flicker (0..1).
    const flame =
      0.72 +
      Math.sin(t * 9) * 0.06 +
      Math.sin(t * 23.3) * 0.04 +
      Math.sin(t * 3.1) * 0.05;
    const lanternR = minDim * (0.16 + flame * 0.06);
    const darkEdge = lanternR * 1.18; // grues won't enter the lit circle

    ctx.globalCompositeOperation = "lighter";

    // The lantern's pool of warm light.
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, lanternR * 2.4);
    glow.addColorStop(0, `rgba(255, 226, 160, ${0.55 * flame})`);
    glow.addColorStop(0.25, `rgba(255, 180, 90, ${0.30 * flame})`);
    glow.addColorStop(0.6, "rgba(120, 70, 30, 0.06)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // The lantern flame core.
    ctx.beginPath();
    ctx.arc(cx, cy, 4 + flame * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 240, 200, ${flame})`;
    ctx.shadowColor = "#ffcf8a";
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Rising embers.
    for (const e of embers) {
      const yy = (e.y - t * e.s * 0.05) % 1;
      const py = cy + (yy < 0 ? yy + 1 : yy) * -minDim * 0.3 + minDim * 0.12;
      const px = cx + Math.sin(t * e.s + e.x * 9) * 18 + (e.x - 0.5) * 40;
      const op = (1 - Math.abs((yy < 0 ? yy + 1 : yy) - 0.3)) * 0.5 * flame;
      ctx.beginPath();
      ctx.arc(px, py, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 120, ${Math.max(0, op)})`;
      ctx.fill();
    }

    // Grue eyes, lurking just beyond the light.
    for (const eye of eyes) {
      const a = eye.a + Math.sin(t * eye.drift) * 0.25;
      // breathe in toward the light then shrink back, but never enter it
      const breathe = Math.sin(t * eye.drift * 1.7 + eye.blink) * 0.06;
      let d = (eye.d + breathe) * minDim * 0.62;
      const near = Math.max(0, 1 - (d - darkEdge) / (minDim * 0.5));
      // brighter when the flame is low (they grow bold in the dark)
      let openness = Math.sin(t * eye.blinkRate + eye.blink);
      openness = openness > -0.35 ? 1 : 0; // mostly open, an occasional blink
      const inDark = d > darkEdge ? 1 : 0;
      const op = inDark * openness * (0.4 + near * 0.6) * (1.15 - flame);
      if (op <= 0.02) continue;

      const ex = cx + Math.cos(a) * d;
      const ey = cy + Math.sin(a) * d;
      const sep = eye.sep * minDim;
      const tilt = a + Math.PI / 2;
      ctx.shadowColor = `hsl(${eye.hue}, 100%, 60%)`;
      ctx.shadowBlur = 8;
      for (const s of [-1, 1]) {
        const px = ex + Math.cos(tilt) * sep * s;
        const py = ey + Math.sin(tilt) * sep * s;
        ctx.beginPath();
        ctx.ellipse(px, py, sep * 0.9, sep * 0.45, tilt, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${eye.hue}, 100%, 70%, ${op})`;
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
  }
  draw();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}
