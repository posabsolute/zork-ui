/*
 * map.ts — "The Adventurer's Map": an auto-drawn graph-paper map, the way Zork
 * players actually mapped the Empire in 1980 — room names in boxes, ink lines
 * between them, U/D marks at stairways, and "?" at every exit not yet taken.
 *
 * Conventions (from Infocom/Trizbort hand-maps + dungeon-crawler automaps):
 *  - rooms are LABELLED BOXES on faint graph paper, laid out by real compass
 *    exits — a north exit puts the far room NORTH, always (direction-true)
 *  - one SECTION of the Empire at a time (tabs) — the map splits along the
 *    game's real geography (the cellar must never tug on the house); a
 *    labelled stub arrow marks a passage into another section
 *  - an exit not yet taken is a dashed line trailing off into the dark
 *  - your room is the INVERTED, glowing box (crawler-style highlight)
 *  - one-way passages get an arrowhead midway (Infocom convention)
 *  - gold ◆ pip = something notable was seen in that room
 * Scroll to zoom, drag to pan, hover for a tooltip, click to inspect.
 */
import type { Room, GameObject, RoomChange } from "../engine/roomState.ts";

interface MapNode { id: string; name: string; x: number; y: number; z: number; items: string[]; }

const DELTA: Record<string, [number, number]> = {
  NORTH: [0, -1], SOUTH: [0, 1], EAST: [1, 0], WEST: [-1, 0],
  NE: [1, -1], NW: [-1, -1], SE: [1, 1], SW: [-1, 1], IN: [1, 0], OUT: [-1, 0], LAND: [-1, 0],
};
const ORDER = ["NORTH", "SOUTH", "EAST", "WEST", "NE", "NW", "SE", "SW", "IN", "OUT", "LAND", "UP", "DOWN"];
const SAVE_KEY = "zork1:map";

// ── the Empire in sections, the way the Infocom hand-maps split it ──────────
// Every room belongs to exactly ONE section. Only same-section exits shape the
// layout; a passage to another section renders as a labelled stub instead, so
// the geometry of one region can never distort another.
type SectionId = "SURFACE" | "HOUSE" | "CELLAR" | "MAZE" | "DEPTHS" | "HADES" | "DAM" | "RIVER" | "MINE";
const SECTIONS: { id: SectionId; name: string }[] = [
  { id: "SURFACE", name: "SURFACE" }, { id: "HOUSE", name: "HOUSE" }, { id: "CELLAR", name: "CELLAR" },
  { id: "MAZE", name: "MAZE" }, { id: "DEPTHS", name: "DEPTHS" }, { id: "HADES", name: "HADES" },
  { id: "DAM", name: "DAM" }, { id: "RIVER", name: "RIVER" }, { id: "MINE", name: "MINE" },
];
// each section's canonical front door — used as the layout anchor when discovered
const ANCHORS: Record<SectionId, string> = {
  SURFACE: "WEST-OF-HOUSE", HOUSE: "LIVING-ROOM", CELLAR: "CELLAR", MAZE: "MAZE-1", DEPTHS: "ROUND-ROOM",
  HADES: "ENTRANCE-TO-HADES", DAM: "DAM-ROOM", RIVER: "RIVER-1", MINE: "SLIDE-ROOM",
};
const REGION: Record<string, SectionId> = {
  // surface
  "CANYON-VIEW": "SURFACE",
  "CLEARING": "SURFACE",
  "EAST-OF-HOUSE": "SURFACE",
  "FOREST-1": "SURFACE",
  "FOREST-2": "SURFACE",
  "FOREST-3": "SURFACE",
  "GRATING-CLEARING": "SURFACE",
  "MOUNTAINS": "SURFACE",
  "NORTH-OF-HOUSE": "SURFACE",
  "PATH": "SURFACE",
  "SOUTH-OF-HOUSE": "SURFACE",
  "STONE-BARROW": "SURFACE",
  "UP-A-TREE": "SURFACE",
  "WEST-OF-HOUSE": "SURFACE",
  // house
  "ATTIC": "HOUSE",
  "KITCHEN": "HOUSE",
  "LIVING-ROOM": "HOUSE",
  // cellar
  "CELLAR": "CELLAR",
  "EAST-OF-CHASM": "CELLAR",
  "GALLERY": "CELLAR",
  "STUDIO": "CELLAR",
  "TROLL-ROOM": "CELLAR",
  // maze
  "CYCLOPS-ROOM": "MAZE",
  "DEAD-END-1": "MAZE",
  "DEAD-END-2": "MAZE",
  "DEAD-END-3": "MAZE",
  "DEAD-END-4": "MAZE",
  "GRATING-ROOM": "MAZE",
  "MAZE-1": "MAZE",
  "MAZE-10": "MAZE",
  "MAZE-11": "MAZE",
  "MAZE-12": "MAZE",
  "MAZE-13": "MAZE",
  "MAZE-14": "MAZE",
  "MAZE-15": "MAZE",
  "MAZE-2": "MAZE",
  "MAZE-3": "MAZE",
  "MAZE-4": "MAZE",
  "MAZE-5": "MAZE",
  "MAZE-6": "MAZE",
  "MAZE-7": "MAZE",
  "MAZE-8": "MAZE",
  "MAZE-9": "MAZE",
  "STRANGE-PASSAGE": "MAZE",
  "TREASURE-ROOM": "MAZE",
  // depths
  "CHASM-ROOM": "DEPTHS",
  "DAMP-CAVE": "DEPTHS",
  "DEEP-CANYON": "DEPTHS",
  "DOME-ROOM": "DEPTHS",
  "EGYPT-ROOM": "DEPTHS",
  "ENGRAVINGS-CAVE": "DEPTHS",
  "EW-PASSAGE": "DEPTHS",
  "LOUD-ROOM": "DEPTHS",
  "MIRROR-ROOM-2": "DEPTHS",
  "NARROW-PASSAGE": "DEPTHS",
  "NORTH-TEMPLE": "DEPTHS",
  "NS-PASSAGE": "DEPTHS",
  "ROUND-ROOM": "DEPTHS",
  "SOUTH-TEMPLE": "DEPTHS",
  "TINY-CAVE": "DEPTHS",
  "TORCH-ROOM": "DEPTHS",
  "WINDING-PASSAGE": "DEPTHS",
  // hades
  "ENTRANCE-TO-HADES": "HADES",
  "LAND-OF-LIVING-DEAD": "HADES",
  // dam
  "DAM-BASE": "DAM",
  "DAM-LOBBY": "DAM",
  "DAM-ROOM": "DAM",
  "IN-STREAM": "DAM",
  "MAINTENANCE-ROOM": "DAM",
  "RESERVOIR": "DAM",
  "RESERVOIR-NORTH": "DAM",
  "RESERVOIR-SOUTH": "DAM",
  "STREAM-VIEW": "DAM",
  // river
  "ARAGAIN-FALLS": "RIVER",
  "CANYON-BOTTOM": "RIVER",
  "CLIFF-MIDDLE": "RIVER",
  "END-OF-RAINBOW": "RIVER",
  "ON-RAINBOW": "RIVER",
  "RIVER-1": "RIVER",
  "RIVER-2": "RIVER",
  "RIVER-3": "RIVER",
  "RIVER-4": "RIVER",
  "RIVER-5": "RIVER",
  "SANDY-BEACH": "RIVER",
  "SANDY-CAVE": "RIVER",
  "SHORE": "RIVER",
  "WHITE-CLIFFS-NORTH": "RIVER",
  "WHITE-CLIFFS-SOUTH": "RIVER",
  // mine
  "ATLANTIS-ROOM": "MINE",
  "BAT-ROOM": "MINE",
  "COLD-PASSAGE": "MINE",
  "DEAD-END-5": "MINE",
  "GAS-ROOM": "MINE",
  "LADDER-BOTTOM": "MINE",
  "LADDER-TOP": "MINE",
  "LOWER-SHAFT": "MINE",
  "MACHINE-ROOM": "MINE",
  "MINE-1": "MINE",
  "MINE-2": "MINE",
  "MINE-3": "MINE",
  "MINE-4": "MINE",
  "MINE-ENTRANCE": "MINE",
  "MIRROR-ROOM-1": "MINE",
  "SHAFT-ROOM": "MINE",
  "SLIDE-ROOM": "MINE",
  "SMALL-CAVE": "MINE",
  "SMELLY-ROOM": "MINE",
  "SQUEEKY-ROOM": "MINE",
  "TIMBER-ROOM": "MINE",
  "TWISTING-PASSAGE": "MINE",
};
const secOf = (id: string): SectionId => REGION[id] ?? "SURFACE";
// passages the game resolves in code ("routine" exits with no target in the
// data) that players still expect on a map — the classics, hand-curated. The
// maze's one-way drops are deliberately left out; the maze is meant to disorient.
const PORTALS: [string, string, string][] = [
  ["LIVING-ROOM", "DOWN", "CELLAR"],            // the trap door
  ["GRATING-CLEARING", "DOWN", "GRATING-ROOM"], // the grating
  ["STUDIO", "UP", "KITCHEN"],                  // up the chimney
];
// stairs flattened onto the page as diagonals (each section is ONE sheet now)
const VDELTA: Record<string, [number, number]> = { UP: [1, -1], DOWN: [1, 1] };
const delta = (dir: string): [number, number] | undefined => DELTA[dir] ?? VDELTA[dir];

// palette — terminal green "ink" family + one gold accent
const INK = "#2f8a4a";        // connection ink
const INK_DIM = "#1b5330";    // grid-adjacent dark ink
const PAPER_GRID = "#07240f"; // graph-paper lines
const BOX_FILL = "#052113";
const BOX_EDGE = "#2f8a4a";
const BOX_EDGE_DIM = "#17492a";
const LABEL = "#7dffa6";
const LABEL_DIM = "#3fa863";
const GOLD = "#e8c24a";
const GOLD_DIM = "#8a6f2a";
const HERE = "#b9ffd0";

export class GameMap {
  private nodes = new Map<string, MapNode>();
  private current: string | null = null;
  private selected: string | null = null;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private info!: HTMLElement;
  private tip!: HTMLElement;
  private floorsEl!: HTMLElement;
  private zoom = 1;
  private userZoomed = false;
  private panx = 0;
  private pany = 0;
  private sec: SectionId = "SURFACE"; // which section of the Empire is on screen
  private stubs: { x: number; y: number; w: number; h: number; sec: SectionId; target: string }[] = [];
  private followPlayer = true;  // auto-centre until the player pans
  private proj: (n: MapNode) => [number, number] = () => [0, 0];
  private drag: { x: number; y: number; moved: boolean } | null = null;
  private raf = 0;

  constructor(
    private el: HTMLElement,
    private rooms: Record<string, Room>,
    private objects: Record<string, GameObject>,
    private saveKey = SAVE_KEY,
  ) {
    this.el.innerHTML = `
      <div class="map-head">◆ MAP <span class="map-count"></span>
        <span class="map-ctrl">
          <button data-act="out" title="zoom out">−</button><button data-act="in" title="zoom in">+</button><button data-act="reset" title="re-centre">⌂</button>
        </span>
      </div>
      <div class="map-floors"></div>
      <div class="map-stage"><canvas></canvas></div>
      <div class="map-legend"><span class="lg-at">█</span> you&nbsp;&nbsp;<span class="lg-q">╌╌</span> unexplored&nbsp;&nbsp;<span class="lg-st">▲▼</span> stairs&nbsp;&nbsp;<span class="lg-it">◆</span> seen</div>
      <div class="map-info"></div>
      <div class="map-tip" style="display:none"></div>`;
    this.canvas = this.el.querySelector(".map-stage canvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.info = this.el.querySelector(".map-info") as HTMLElement;
    this.tip = this.el.querySelector(".map-tip") as HTMLElement;
    this.floorsEl = this.el.querySelector(".map-floors") as HTMLElement;

    this.el.querySelector(".map-ctrl")!.addEventListener("click", (e) => {
      const act = (e.target as HTMLElement).getAttribute("data-act"); if (!act) return;
      if (act === "in") { this.zoom = Math.min(2.6, this.zoom * 1.25); this.userZoomed = true; }
      else if (act === "out") { this.zoom = Math.max(0.45, this.zoom / 1.25); this.userZoomed = true; }
      else if (act === "reset") { this.userZoomed = false; this.followPlayer = true; this.panx = 0; this.pany = 0; if (this.current) this.sec = secOf(this.current); }
      this.render();
    });
    this.floorsEl.addEventListener("click", (e) => {
      const sec = (e.target as HTMLElement).closest("[data-sec]")?.getAttribute("data-sec");
      if (sec) { this.sec = sec as SectionId; this.followPlayer = false; this.panx = 0; this.pany = 0; this.render(); }
    });
    this.canvas.addEventListener("wheel", (e) => { e.preventDefault(); const f = e.deltaY < 0 ? 1.1 : 1 / 1.1; this.zoom = Math.max(0.45, Math.min(2.6, this.zoom * f)); this.userZoomed = true; this.render(); }, { passive: false });
    // Pointer events cover mouse AND touch (a finger never fires mousemove
    // while dragging); touch-action:none stops the browser eating the gesture.
    this.canvas.style.touchAction = "none";
    const pts = new Map<number, { x: number; y: number }>();
    let pinchD = 0;
    this.canvas.addEventListener("pointerdown", (e) => {
      try { this.canvas.setPointerCapture(e.pointerId); } catch { /* synthetic events have no live pointer */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) this.drag = { x: e.clientX, y: e.clientY, moved: false };
      else { // a second finger switches from pan to pinch-zoom
        this.drag = null;
        const [a, b] = [...pts.values()];
        pinchD = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchD > 0 && d > 0) { this.zoom = Math.max(0.45, Math.min(2.6, this.zoom * (d / pinchD))); this.userZoomed = true; pinchD = d; this.tip.style.display = "none"; this.render(); }
        return;
      }
      if (this.drag) { const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y; if (Math.abs(dx) + Math.abs(dy) > 2) { this.drag.moved = true; this.followPlayer = false; this.panx += dx; this.pany += dy; this.drag.x = e.clientX; this.drag.y = e.clientY; this.tip.style.display = "none"; this.render(); } return; }
      if (e.pointerType === "mouse") this.onHover(e);
    });
    const endPointer = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinchD = 0;
      if (pts.size === 0) setTimeout(() => { this.drag = null; }, 0);
    };
    this.canvas.addEventListener("pointerup", endPointer);
    this.canvas.addEventListener("pointercancel", endPointer);
    this.canvas.addEventListener("mouseleave", () => { this.tip.style.display = "none"; });
    this.canvas.addEventListener("click", (e) => {
      if (this.drag?.moved) return;
      const r = this.canvas.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top;
      const stub = this.stubs.find((st) => mx >= st.x && mx <= st.x + st.w && my >= st.y && my <= st.y + st.h);
      if (stub) { this.sec = stub.sec; this.selected = stub.target; this.followPlayer = false; this.panx = 0; this.pany = 0; this.render(); return; }
      const n = this.hit(e); if (n) { this.selected = n.id; this.render(); }
    });
    window.addEventListener("resize", () => this.render());
    this.load();
    this.relayout();
    if (this.current) this.sec = secOf(this.current);
    this.render();
    // the @ pulses — a slow, cheap heartbeat redraw
    const beat = () => { this.render(); this.raf = window.setTimeout(beat, 600) as unknown as number; };
    beat();
  }

  destroy() { clearTimeout(this.raf); }
  visited(): Set<string> { return new Set(this.nodes.keys()); }

  discover(c: RoomChange) {
    const id = c.room.id;
    if (!this.nodes.has(id)) this.nodes.set(id, { id, name: c.room.name, x: 0, y: 0, z: 0, items: [] });
    const node = this.nodes.get(id)!;
    const found = c.contents.map((oid) => this.objects[oid]?.name ?? oid.toLowerCase().replace(/-/g, " ")).filter(Boolean);
    node.items = Array.from(new Set([...node.items, ...found]));
    this.current = id;
    this.selected = id;
    this.relayout();
    this.sec = secOf(id); // the map follows you between sections
    if (this.followPlayer) { this.panx = 0; this.pany = 0; }
    this.save();
    this.render();
  }

  // Recompute grid positions (x,y) from the discovered exit graph — one BFS
  // PER SECTION over same-section edges only. Stairs are flattened onto the
  // sheet as diagonals; cross-section passages don't constrain layout at all.
  private relayout() {
    const ids = [...this.nodes.keys()]; if (!ids.length) return;
    const placed = new Map<string, { x: number; y: number }>();
    const occ = new Map<string, string>(); // "sec:x,y" -> room id
    const put = (id: string, x: number, y: number) => { placed.set(id, { x, y }); occ.set(`${secOf(id)}:${x},${y}`, id); };
    // walk FURTHER IN THE EXIT'S OWN DIRECTION until a cell is free — a north
    // exit must land north, never drift sideways
    const free = (sec: string, x: number, y: number, dx: number, dy: number): [number, number] => {
      let sx = dx, sy = dy; if (!sx && !sy) sx = 1;
      let g = 0; while (occ.has(`${sec}:${x},${y}`) && g++ < 60) { x += sx; y += sy; }
      return [x, y];
    };
    const bfs = (from: string) => {
      const sec = secOf(from); const q = [from];
      while (q.length) {
        const id = q.shift()!; const pos = placed.get(id)!; const room = this.rooms[id]; if (!room) continue;
        for (const dir of ORDER) {
          const e = room.exits[dir]; if (!e || !e.to) continue; const to = e.to;
          if (!this.nodes.has(to) || placed.has(to) || secOf(to) !== sec) continue;
          const d = delta(dir); if (!d) continue;
          const [x, y] = free(sec, pos.x + d[0], pos.y + d[1], d[0], d[1]); put(to, x, y); q.push(to);
        }
      }
    };
    // each discovered section grows from its canonical front door (or, before
    // that door is found, from the first room seen there)
    const bySec = new Map<string, string[]>();
    for (const id of ids) { const sec = secOf(id); if (!bySec.has(sec)) bySec.set(sec, []); bySec.get(sec)!.push(id); }
    for (const [sec, list] of bySec) {
      const anchor = list.includes(ANCHORS[sec as SectionId]) ? ANCHORS[sec as SectionId] : list[0];
      put(anchor, 0, 0); bfs(anchor);
    }
    // rooms only reachable backwards (one-way passages): hang them off a placed
    // SAME-SECTION neighbour, then grow from them
    let changed = true, guard = 0;
    while (changed && guard++ < 12) {
      changed = false;
      for (const id of ids) {
        if (placed.has(id)) continue; const sec = secOf(id); const room = this.rooms[id]; let done = false;
        if (room) for (const dir of ORDER) { const e = room.exits[dir]; if (e?.to && placed.has(e.to) && secOf(e.to) === sec) { const pos = placed.get(e.to)!; const d = delta(dir) || [0, 0]; const [x, y] = free(sec, pos.x - d[0], pos.y - d[1], -d[0], -d[1]); put(id, x, y); bfs(id); changed = done = true; break; } }
        if (done) continue;
        for (const pid of [...placed.keys()]) { if (secOf(pid) !== sec) continue; const pr = this.rooms[pid]; if (!pr) continue; for (const dir of ORDER) { const e = pr.exits[dir]; if (e?.to === id) { const pos = placed.get(pid)!; const d = delta(dir) || [1, 0]; const [x, y] = free(sec, pos.x + d[0], pos.y + d[1], d[0] || 1, d[1]); put(id, x, y); bfs(id); changed = done = true; break; } } if (done) break; }
      }
    }
    // truly orphaned rooms (teleports): park them just south of their section
    for (const [sec, list] of bySec) {
      const pl = list.filter((id) => placed.has(id));
      let maxy = 0; for (const id of pl) maxy = Math.max(maxy, placed.get(id)!.y);
      let fx = 0;
      for (const id of list) { if (placed.has(id)) continue; const [x, y] = free(sec, fx, maxy + 2, 1, 0); put(id, x, y); fx = x + 1; }
    }
    for (const [id, pos] of placed) { const n = this.nodes.get(id)!; n.x = pos.x; n.y = pos.y; n.z = 0; }
  }

  private hit(e: MouseEvent): MapNode | null {
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    let best: MapNode | null = null, bd = 40 * this.zoom;
    for (const n of this.nodes.values()) { if (secOf(n.id) !== this.sec) continue; const [sx, sy] = this.proj(n); const d = Math.hypot(sx - mx, sy - my); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  private onHover(e: MouseEvent) {
    const n = this.hit(e);
    if (!n) { this.tip.style.display = "none"; return; }
    this.tip.textContent = `${n.name}${n.items.length ? ` · ${n.items.length} seen` : ""}`;
    const r = this.el.getBoundingClientRect();
    this.tip.style.display = "block";
    let x = e.clientX - r.left + 12; const y = e.clientY - r.top + 12;
    x = Math.min(x, r.width - this.tip.offsetWidth - 6);
    this.tip.style.left = `${Math.max(4, x)}px`; this.tip.style.top = `${y}px`;
  }

  private render() {
    const all = [...this.nodes.values()];
    (this.el.querySelector(".map-count") as HTMLElement).textContent = all.length ? `· ${all.length} found` : "";
    // ── section tabs: only regions the player has actually entered ──
    const secsSeen = SECTIONS.filter((sc) => all.some((n) => secOf(n.id) === sc.id));
    const curSec = this.current ? secOf(this.current) : "SURFACE";
    if (!secsSeen.some((sc) => sc.id === this.sec)) this.sec = secsSeen.some((sc) => sc.id === curSec) ? curSec : (secsSeen[0]?.id ?? "SURFACE");
    this.floorsEl.style.display = secsSeen.length > 1 ? "flex" : "none";
    this.floorsEl.innerHTML = secsSeen.map((sc) =>
      `<button data-sec="${sc.id}" class="${sc.id === this.sec ? "on" : ""}">${sc.name}${sc.id === curSec ? ' <span class="fl-at">●</span>' : ""}</button>`).join("");
    const ns = all.filter((n) => secOf(n.id) === this.sec);
    if (!ns.length) { this.info.innerHTML = ""; return; }

    const stage = this.canvas.parentElement as HTMLElement;
    const cw = stage.clientWidth, ch = stage.clientHeight, dpr = window.devicePixelRatio || 1;
    if (cw < 4 || ch < 4) return;
    this.canvas.width = Math.round(cw * dpr); this.canvas.height = Math.round(ch * dpr);
    this.canvas.style.width = `${cw}px`; this.canvas.style.height = `${ch}px`;
    const p = this.ctx; p.setTransform(dpr, 0, 0, dpr, 0, 0); p.imageSmoothingEnabled = false;
    p.clearRect(0, 0, cw, ch);
    if (!all.length) { this.info.innerHTML = `<div class="map-dim">Explore to reveal the map.</div>`; return; }

    // ── scale: auto-fit this floor, but NEVER below legibility — every box
    // always shows its name (the whole point of a map); overflow pans instead
    const minx = Math.min(...ns.map((n) => n.x)), maxx = Math.max(...ns.map((n) => n.x));
    const miny = Math.min(...ns.map((n) => n.y)), maxy = Math.max(...ns.map((n) => n.y));
    const cols = Math.max(1, maxx - minx + 1), rows = Math.max(1, maxy - miny + 1);
    const fit = Math.max(52, Math.min(84, Math.floor(Math.min((cw - 30) / cols, (ch - 30) / rows))));
    const cell = Math.round(fit * (this.userZoomed ? this.zoom : 1));
    if (!this.userZoomed) this.zoom = 1;
    const bw = Math.max(38, Math.round(cell * 0.86)), bh = Math.max(22, Math.round(cell * 0.52)); // room box, sized for its name

    // centre on the player's room (follow) or the floor's cloud
    const centreNode = this.followPlayer && this.current && this.nodes.has(this.current) && secOf(this.current) === this.sec ? this.nodes.get(this.current)! : null;
    const rawx = (n: MapNode) => (n.x - minx) * cell, rawy = (n: MapNode) => (n.y - miny) * cell;
    let ox: number, oy: number;
    if (centreNode) { ox = cw / 2 - rawx(centreNode) + this.panx; oy = ch / 2 - rawy(centreNode) + this.pany; }
    else { ox = (cw - (maxx - minx) * cell) / 2 + this.panx; oy = (ch - (maxy - miny) * cell) / 2 + this.pany; }
    this.proj = (n: MapNode) => [Math.round(ox + rawx(n)), Math.round(oy + rawy(n))];

    // ── graph paper ──
    p.fillStyle = PAPER_GRID;
    const g = Math.max(10, cell >> 1);
    for (let x = ((ox % g) + g) % g; x < cw; x += g) p.fillRect(Math.round(x), 0, 1, ch);
    for (let y = ((oy % g) + g) % g; y < ch; y += g) p.fillRect(0, Math.round(y), cw, 1);

    const pulse = (Date.now() / 600) % 2 < 1; // slow heartbeat
    const fontPx = Math.max(7, Math.min(10, Math.round(bh * 0.34)));
    p.font = `bold ${fontPx}px "IBM Plex Mono", monospace`;
    p.textAlign = "center"; p.textBaseline = "middle";

    // ── ink lines between rooms, Trizbort-style: straight, from box EDGE to
    // box EDGE on the true compass side. Neighbours get firm ink; a passage
    // that wraps a long way is thin and dashed so it can't dominate the page.
    const anchorPt = (node: MapNode, d: [number, number]): [number, number] => {
      const [x, y] = this.proj(node);
      return [x + Math.sign(d[0]) * (bw / 2 + 1), y + Math.sign(d[1]) * (bh / 2 + 1)];
    };
    const line = (x1: number, y1: number, x2: number, y2: number, c: string, wpx: number, dash?: number[]) => {
      p.strokeStyle = c; p.lineWidth = wpx; p.setLineDash(dash ?? []);
      p.beginPath(); p.moveTo(x1 + 0.5, y1 + 0.5); p.lineTo(x2 + 0.5, y2 + 0.5); p.stroke();
      p.setLineDash([]);
    };
    const tri = (x: number, y: number, up: boolean, c: string) => { p.fillStyle = c; for (let r = 0; r < 3; r++) { const w = up ? r : 2 - r; p.fillRect(Math.round(x - w), Math.round(y + (up ? r - 1 : -r + 1)), w * 2 + 1, 1); } };

    const drawn = new Set<string>();
    this.stubs = [];
    // a short labelled arrow marking a passage into ANOTHER section — the far
    // side's name only once you've actually been through (the map is a diary)
    const stubTo = (n: MapNode, d: [number, number], toSec: SectionId, target: string) => {
      const [ax, ay] = anchorPt(n, d);
      const len = Math.hypot(d[0], d[1]), ux = d[0] / len, uy = d[1] / len;
      const tx2 = ax + ux * 9, ty2 = ay + uy * 9;
      line(ax, ay, tx2, ty2, INK, 2);
      p.save(); p.translate(tx2, ty2); p.rotate(Math.atan2(uy, ux)); p.fillStyle = INK;
      p.beginPath(); p.moveTo(5, 0); p.lineTo(-2, -3.5); p.lineTo(-2, 3.5); p.closePath(); p.fill(); p.restore();
      const name = SECTIONS.find((sc) => sc.id === toSec)?.name ?? toSec;
      const tw = name.length * fontPx * 0.62;
      const lx = tx2 + ux * (7 + tw / 2), ly = ty2 + uy * 8 + (uy === 0 ? -6 : 0);
      p.fillStyle = LABEL; p.fillText(name, Math.round(lx), Math.round(ly));
      this.stubs.push({ x: lx - tw / 2 - 4, y: ly - 8, w: tw + 8, h: 16, sec: toSec, target });
    };
    for (const n of ns) {
      const room = this.rooms[n.id]; if (!room) continue;
      let stairUp = 0, stairDown = 0;
      const exits: [string, { to?: string }][] = Object.entries(room.exits);
      for (const [from, pdir, pto] of PORTALS) if (from === n.id && !room.exits[pdir]?.to) exits.push([pdir, { to: pto }]);
      for (const [dir, e] of exits) {
        if (!e.to) continue;
        const vert = dir === "UP" || dir === "DOWN";
        const target = this.nodes.get(e.to);
        const toSec = secOf(e.to);
        if (vert) { // stairs: mark the room corner; gold if the far side is unknown
          const known = !!target;
          if (dir === "UP") stairUp = known ? 1 : 2; else stairDown = known ? 1 : 2;
          if (target && toSec !== this.sec) stubTo(n, VDELTA[dir], toSec, e.to); // stairs into another region
          if (!target || toSec !== this.sec) continue; // known same-section stairs fall through and draw as a diagonal
        }
        const d = delta(dir); if (!d) continue;
        if (target && toSec !== this.sec) { if (!vert) stubTo(n, d, toSec, e.to); continue; }
        if (target) {
          const key = [n.id, e.to].sort().join("|"); if (drawn.has(key)) continue; drawn.add(key);
          const [ax, ay] = anchorPt(n, d);
          // enter the far box on ITS reciprocal side when the way back exists
          const backRoom = this.rooms[e.to];
          const backDir = backRoom ? Object.entries(backRoom.exits).find(([bd2, ex]) => ex.to === n.id && delta(bd2))?.[0] : undefined;
          const rd: [number, number] = backDir ? delta(backDir) as [number, number] : [-d[0], -d[1]];
          const [tx2, ty2] = anchorPt(target, rd);
          const near = Math.abs(target.x - n.x) <= 1 && Math.abs(target.y - n.y) <= 1;
          line(ax, ay, tx2, ty2, near ? INK : INK_DIM, near ? 2 : 1, near ? undefined : [4, 4]);
          if (backRoom && !backDir && !Object.values(backRoom.exits).some((ex) => ex.to === n.id)) {
            // one-way passage → an arrowhead midway (Infocom hand-map convention)
            const mx = (ax + tx2) / 2, my2 = (ay + ty2) / 2, ang = Math.atan2(ty2 - ay, tx2 - ax);
            p.save(); p.translate(mx, my2); p.rotate(ang); p.fillStyle = near ? INK : INK_DIM;
            p.beginPath(); p.moveTo(4, 0); p.lineTo(-3, -3.5); p.lineTo(-3, 3.5); p.closePath(); p.fill(); p.restore();
          }
        } else if (!target && !vert) { // an exit not yet taken: a dashed line trailing off into the dark
          const [ax, ay] = anchorPt(n, d);
          const len = Math.hypot(d[0], d[1]);
          const ux = d[0] / len, uy = d[1] / len;
          const fade = [INK, INK_DIM, "#0d3018"];
          for (let s2 = 0; s2 < 3; s2++) line(ax + ux * (2 + s2 * 6), ay + uy * (2 + s2 * 6), ax + ux * (5 + s2 * 6), ay + uy * (5 + s2 * 6), fade[s2], 2);
        }
      }
      (n as MapNode & { _st?: [number, number] })._st = [stairUp, stairDown];
    }

    // ── the rooms: labelled boxes, hand-map style ──
    for (const n of ns) {
      const [x, y] = this.proj(n);
      const bx = Math.round(x - bw / 2), by = Math.round(y - bh / 2);
      const isHere = n.id === this.current, isSel = n.id === this.selected;
      p.fillStyle = "#02120a"; p.fillRect(bx - 2, by - 2, bw + 4, bh + 4); // paper shows through around the box
      if (isHere) { // crawler-style highlight: YOUR room is the inverted, glowing cell
        p.fillStyle = "#2f8a4a"; p.fillRect(bx - 3, by - 3, bw + 6, bh + 6); // soft phosphor bleed
        p.fillStyle = "#8affb0"; p.fillRect(bx, by, bw, bh); // steady — the inverted box already says "you are here"
        p.fillStyle = "#eafff0";
        p.fillRect(bx, by, bw, 2); p.fillRect(bx, by + bh - 2, bw, 2); p.fillRect(bx, by, 2, bh); p.fillRect(bx + bw - 2, by, 2, bh);
      } else {
        p.fillStyle = BOX_FILL; p.fillRect(bx, by, bw, bh);
        const edge = isSel ? GOLD : bw >= 24 ? BOX_EDGE : BOX_EDGE_DIM;
        p.fillStyle = edge;
        p.fillRect(bx, by, bw, 2); p.fillRect(bx, by + bh - 2, bw, 2); p.fillRect(bx, by, 2, bh); p.fillRect(bx + bw - 2, by, 2, bh);
      }
      // label: the room's name INSIDE the box, Trizbort-style — always readable
      const chars = Math.max(5, Math.floor((bw - 8) / (fontPx * 0.62)));
      const lines = abbrev(n.name, chars).slice(0, 2);
      const col = isHere ? "#03180c" : isSel ? GOLD : LABEL;
      p.fillStyle = col;
      if (lines.length === 1) p.fillText(lines[0], x, y + 1);
      else { p.fillText(lines[0], x, y - Math.round(fontPx * 0.55)); p.fillText(lines[1], x, y + Math.round(fontPx * 0.62)); }
      // stair marks at the west edge; item pip at the east
      const st = (n as MapNode & { _st?: [number, number] })._st || [0, 0];
      const stCol = (v: number) => (isHere ? "#04140a" : v === 2 ? (pulse ? GOLD : GOLD_DIM) : LABEL_DIM);
      if (st[0]) tri(bx + 5, by + 5, true, stCol(st[0]));
      if (st[1]) tri(bx + 5, by + bh - 5, false, stCol(st[1]));
      if (n.items.length) { p.fillStyle = isHere ? "#7a5f16" : GOLD; p.fillRect(bx + bw - 7, by + 3, 3, 3); if (!isHere) { p.fillStyle = "#fff0b0"; p.fillRect(bx + bw - 7, by + 3, 1, 1); } }
    }

    // ── info panel ──
    const sel = this.selected ? this.nodes.get(this.selected) : null;
    if (!sel) { this.info.innerHTML = ""; return; }
    const room = this.rooms[sel.id];
    const exitDirs = room ? Object.keys(room.exits).filter((d) => room.exits[d].to) : [];
    const untried = room ? exitDirs.filter((d) => { const to = room.exits[d].to!; return !this.nodes.has(to); }) : [];
    // NOTE: room contents are deliberately NOT listed — discovering what a place
    // holds is the game; the clue command is the sanctioned nudge.
    // exits are TAPPABLE when you're looking at the room you're standing in —
    // tapping one walks that way (dispatches a zork-go the main loop submits)
    const walkable = sel.id === this.current;
    const exitHtml = exitDirs.map((d) => {
      const cls = (untried.includes(d) ? "map-untried" : "") + (walkable ? " map-go" : "");
      return `<span class="${cls.trim()}"${walkable ? ` data-go="${d.toLowerCase()}"` : ""}>${d.toLowerCase()}</span>`;
    }).join(" · ");
    this.info.innerHTML = `
      <div class="map-here">${sel.id === this.current ? "► " : ""}${esc(sel.name)}</div>
      <div class="map-sub">EXITS</div>
      <div class="map-exits">${exitDirs.length ? exitHtml : "—"}</div>`;
    this.info.querySelectorAll<HTMLElement>("[data-go]").forEach((el) => {
      el.onclick = () => window.dispatchEvent(new CustomEvent("zork-go", { detail: el.dataset.go }));
    });
  }

  private save() { try { localStorage.setItem(this.saveKey, JSON.stringify({ current: this.current, nodes: [...this.nodes.values()].map((n) => ({ id: n.id, name: n.name, items: n.items })) })); } catch { /* quota */ } }
  private load() {
    try {
      const raw = localStorage.getItem(this.saveKey); if (!raw) return;
      const data = JSON.parse(raw);
      for (const n of data.nodes ?? []) this.nodes.set(n.id, { id: n.id, name: n.name, items: n.items ?? [], x: 0, y: 0, z: 0 });
      this.current = data.current ?? null; this.selected = this.current;
    } catch { /* ignore */ }
  }
}

// squeeze a room name into 1-2 pencil lines of at most `w` chars
function abbrev(name: string, w: number): string[] {
  const words = name.toUpperCase().split(/\s+/).filter((s) => s !== "OF" && s !== "THE" && s !== "TO" && s !== "A");
  const cut = (s: string) => (s.length > w ? s.slice(0, Math.max(2, w - 1)) + "." : s);
  if (!words.length) return [cut(name.toUpperCase())];
  if (words.length === 1) return [cut(words[0])];
  const one = words.join(" ");
  if (one.length <= w) return [one];
  const l2 = words.slice(1).join(" ");
  return [cut(words[0]), cut(l2)];
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}
