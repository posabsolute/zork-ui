/*
 * ambience.ts — a fully generative WebAudio soundscape. No audio files: every
 * mood is oscillators, filtered noise, and scheduled one-shot events, in the
 * same spirit as the code-drawn scenes. OFF by default; the toggle click is
 * the user gesture that unlocks the AudioContext.
 *
 * Moods (crossfaded ~2.5s on room change):
 *   surface     night wind + a rare owl-ish blip
 *   house       near-silence: room tone + occasional timber creak
 *   underground cavern drone + echoing drips (the default below ground)
 *   maze        the cavern drone, slowly detuning — subtly wrong on purpose
 *   temple      cavern + a faint bell partial now and then
 *   water       river bed of flowing noise (falls rooms run it louder + rumble)
 *   hades       low cluster drone + a distant moan
 *   dark        grue territory: everything ducked, a slow heartbeat
 * State cues: LOUD-ROOM echoes the bus until "echo"; troll/cyclops alive adds
 * a low tension thump.
 */

type Mood = "surface" | "house" | "underground" | "maze" | "temple" | "water" | "falls" | "hades" | "dark";

const SURFACE = /^(WEST|NORTH|SOUTH|EAST)-OF-HOUSE$|^FOREST|^PATH$|^CLEARING$|^GRATING-CLEARING$|^UP-A-TREE$|^MOUNTAINS$|^STONE-BARROW$|^CANYON-VIEW$/;
const HOUSE = /^(KITCHEN|LIVING-ROOM|ATTIC)$/;
const WATER = /^RESERVOIR|^STREAM|^RIVER|^IN-STREAM$|^DAM-|^SHORE$|^SANDY-BEACH$|^WHITE-CLIFFS|^CANYON-BOTTOM$|^CLIFF-MIDDLE$/;
const FALLS = /^ARAGAIN-FALLS$|^ON-RAINBOW$|^END-OF-RAINBOW$/;
const HADES = /^ENTRANCE-TO-HADES$|^LAND-OF-LIVING-DEAD$/;
const MAZE = /^MAZE-|^DEAD-END-/;
const TEMPLE = /^(NORTH|SOUTH)-TEMPLE$|^EGYPT-ROOM$|^TORCH-ROOM$|^DOME-ROOM$/;

function moodFor(roomId: string, dark: boolean): Mood {
  if (dark) return "dark";
  if (SURFACE.test(roomId)) return "surface";
  if (HOUSE.test(roomId)) return "house";
  if (FALLS.test(roomId)) return "falls";
  if (WATER.test(roomId)) return "water";
  if (HADES.test(roomId)) return "hades";
  if (MAZE.test(roomId)) return "maze";
  if (TEMPLE.test(roomId)) return "temple";
  return "underground";
}

class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private echoWet: GainNode | null = null; // LOUD-ROOM feedback delay send
  private moodGains = new Map<Mood, GainNode>();
  private stops: Array<() => void> = [];
  private timers: number[] = [];
  private mood: Mood | null = null;
  private roomId = "";
  private flags: Record<string, Record<string, boolean | string[]>> = {};
  enabled = false;

  setFlags(f: Record<string, Record<string, boolean | string[]>>) { this.flags = f; }

  toggle(on: boolean) {
    this.enabled = on;
    if (on) { this.boot(); this.apply(); }
    else if (this.master && this.ctx) { this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6); }
  }

  setRoom(roomId: string, dark: boolean) {
    this.roomId = roomId;
    const next = moodFor(roomId, dark);
    if (!this.enabled || !this.ctx) { this.mood = next; return; }
    if (next !== this.mood) { this.mood = next; this.apply(); }
    else this.applyEcho(); // same mood, but LOUD-ROOM/echo status may differ
  }

  // ── engine ────────────────────────────────────────────────────────────────
  private boot() {
    if (this.ctx) { void this.ctx.resume(); this.master!.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 1.2); return; }
    const ctx = new AudioContext();
    this.ctx = ctx;
    const master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);
    this.master = master;
    // the LOUD-ROOM echo: a feedback delay the mood bus can be sent through
    const delay = ctx.createDelay(1); delay.delayTime.value = 0.29;
    const fb = ctx.createGain(); fb.gain.value = 0.55;
    delay.connect(fb); fb.connect(delay);
    const wet = ctx.createGain(); wet.gain.value = 0;
    wet.connect(delay); delay.connect(master);
    this.echoWet = wet;
  }

  private clear() {
    for (const s of this.stops) { try { s(); } catch { /* node already dead */ } }
    for (const id of this.timers) clearTimeout(id);
    this.stops = []; this.timers = [];
    for (const [, g] of this.moodGains) { try { g.gain.linearRampToValueAtTime(0.0001, this.ctx!.currentTime + 2.5); } catch { /* ok */ } }
    this.moodGains.clear();
  }

  private bus(level: number): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain(); g.gain.value = 0;
    g.connect(this.master!); g.connect(this.echoWet!);
    g.gain.linearRampToValueAtTime(level, ctx.currentTime + 2.5); // fade the new mood in
    this.moodGains.set(this.mood!, g);
    return g;
  }

  private noiseSrc(): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // brown-ish
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    return src;
  }

  private drone(bus: GainNode, freqs: number[], cutoff: number, wobble = 0.06) {
    const ctx = this.ctx!;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = cutoff; lp.connect(bus);
    const lfo = ctx.createOscillator(); lfo.frequency.value = wobble;
    const lfoG = ctx.createGain(); lfoG.gain.value = cutoff * 0.3;
    lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
    const all: OscillatorNode[] = [];
    const oscs = freqs.map((f, i) => {
      // fundamental + two octave partials so the drone survives laptop speakers
      // (a bare 55Hz sine is inaudible on most of them)
      let root: OscillatorNode | null = null;
      for (const [mult, amp] of [[1, 1], [2, 0.45], [4, 0.16]] as const) {
        const o = ctx.createOscillator(); o.type = i ? "triangle" : "sine"; o.frequency.value = f * mult;
        const g = ctx.createGain(); g.gain.value = amp / freqs.length;
        o.connect(g); g.connect(lp); o.start();
        all.push(o); if (mult === 1) root = o;
      }
      return root!;
    });
    this.stops.push(() => { all.forEach((o) => o.stop()); lfo.stop(); });
    return oscs;
  }

  private noiseBed(bus: GainNode, type: BiquadFilterType, freq: number, q: number, level: number, wobble = 0.1) {
    const ctx = this.ctx!;
    const src = this.noiseSrc();
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = level;
    const lfo = ctx.createOscillator(); lfo.frequency.value = wobble;
    const lfoG = ctx.createGain(); lfoG.gain.value = level * 0.4;
    lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start();
    src.connect(f); f.connect(g); g.connect(bus); src.start();
    this.stops.push(() => { src.stop(); lfo.stop(); });
  }

  // a short one-shot: sine blip with pitch glide + exponential decay
  private blip(bus: GainNode, f0: number, f1: number, dur: number, level: number, type: OscillatorType = "sine") {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(bus); o.start(); o.stop(ctx.currentTime + dur + 0.05);
  }

  private every(minMs: number, maxMs: number, fn: () => void) {
    const tick = () => { fn(); this.timers.push(window.setTimeout(tick, minMs + Math.random() * (maxMs - minMs))); };
    this.timers.push(window.setTimeout(tick, minMs + Math.random() * (maxMs - minMs)));
  }

  // ── the moods ─────────────────────────────────────────────────────────────
  private apply() {
    if (!this.ctx || !this.enabled || !this.mood) return;
    this.clear();
    const m = this.mood;
    if (m === "surface") {
      const b = this.bus(0.11);
      this.noiseBed(b, "bandpass", 320, 0.6, 0.5, 0.07); // night wind
      this.every(9000, 22000, () => this.blip(b, 620, 540, 0.5, 0.05)); // something calls, far off
    } else if (m === "house") {
      const b = this.bus(0.1);
      this.noiseBed(b, "lowpass", 220, 0.5, 0.55, 0.04); // empty-house room tone
      this.drone(b, [82.5], 300, 0.03); // the hush of the old walls
      this.every(9000, 20000, () => this.blip(b, 130, 60, 0.4, 0.5, "sawtooth")); // a timber settles
    } else if (m === "water" || m === "falls") {
      const b = this.bus(m === "falls" ? 0.2 : 0.12);
      this.noiseBed(b, "bandpass", 700, 0.4, 0.7, 0.16); // running water
      if (m === "falls") this.noiseBed(b, "lowpass", 90, 0.7, 0.8, 0.05); // the plunge rumble
      this.drone(b, [55], 120, 0.03);
    } else if (m === "hades") {
      const b = this.bus(0.13);
      this.drone(b, [48.99, 51.91, 98], 380, 0.05); // a minor-second cluster, uneasy
      this.every(12000, 28000, () => this.blip(b, 300, 150, 2.2, 0.06)); // a distant moan
    } else if (m === "maze") {
      const b = this.bus(0.11);
      const oscs = this.drone(b, [55, 82.5], 420, 0.05);
      const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.045; // ~20s cycle
      const lg = this.ctx.createGain(); lg.gain.value = 1.4; // ± cents of wrongness
      lfo.connect(lg); lg.connect(oscs[1].detune); lfo.start();
      this.stops.push(() => lfo.stop());
      this.every(5000, 12000, () => this.blip(b, 1100 + Math.random() * 500, 350, 0.5, 0.12)); // drips
    } else if (m === "temple") {
      const b = this.bus(0.11);
      this.drone(b, [55, 110.3], 420, 0.04);
      this.every(14000, 30000, () => this.blip(b, 523, 519, 3.5, 0.05, "triangle")); // a bell partial hangs in the air
    } else if (m === "dark") {
      const b = this.bus(0.12);
      this.every(2100, 2500, () => { // the slow heartbeat of something hungry
        this.blip(b, 58, 40, 0.14, 0.5);
        this.timers.push(window.setTimeout(() => this.blip(b, 52, 38, 0.12, 0.35), 260));
      });
    } else {
      const b = this.bus(0.11); // underground
      this.drone(b, [55, 82.5], 420, 0.05);
      this.every(4500, 11000, () => this.blip(b, 1200 + Math.random() * 400, 380, 0.5, 0.12)); // cave drips
    }
    // tension: a monster alive in this very room
    const rs = this.flags;
    const tense = (this.roomId === "TROLL-ROOM" && !rs["TROLL-ROOM"]?.trollDead)
      || (this.roomId === "CYCLOPS-ROOM" && !rs["CYCLOPS-ROOM"]?.cyclopsGone && !rs["CYCLOPS-ROOM"]?.cyclopsAsleep);
    if (tense) {
      const tb = this.bus(0.1);
      this.every(1050, 1250, () => this.blip(tb, 62, 45, 0.16, 0.45));
    }
    this.applyEcho();
  }

  private applyEcho() {
    if (!this.ctx || !this.echoWet) return;
    const echoing = this.roomId === "LOUD-ROOM" && !this.flags["LOUD-ROOM"]?.echoFixed;
    this.echoWet.gain.linearRampToValueAtTime(echoing ? 0.8 : 0, this.ctx.currentTime + 1);
  }
}

export const ambience = new Ambience();
