/*
 * map.ts — "The Adventurer's Map": an auto-drawn graph-paper map, the way Zork
 * players actually mapped the Empire in 1980 — room names in boxes, ink lines
 * between them, U/D marks at stairways, and "?" at every exit not yet taken.
 *
 * Conventions (from IF hand-maps + dungeon-crawler automaps):
 *  - rooms are LABELLED BOXES on faint graph paper, laid out by real compass exits
 *  - one FLOOR at a time (tabs), like a crawler automap; ▲/▼ mark the stairs
 *  - untaken exits end in a gold "?" stub — the map is a to-do list
 *  - you are "@", pulsing, roguelike-style; the view auto-centres on you
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
  private floor = 0;            // which z-level is on screen
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
      <div class="map-legend"><span class="lg-at">@</span> you&nbsp;&nbsp;<span class="lg-q">?</span> untried&nbsp;&nbsp;<span class="lg-st">▲▼</span> stairs&nbsp;&nbsp;<span class="lg-it">◆</span> seen</div>
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
      else if (act === "reset") { this.userZoomed = false; this.followPlayer = true; this.panx = 0; this.pany = 0; if (this.current && this.nodes.has(this.current)) this.floor = this.nodes.get(this.current)!.z; }
      this.render();
    });
    this.floorsEl.addEventListener("click", (e) => {
      const z = (e.target as HTMLElement).getAttribute("data-z");
      if (z !== null) { this.floor = Number(z); this.followPlayer = false; this.panx = 0; this.pany = 0; this.render(); }
    });
    this.canvas.addEventListener("wheel", (e) => { e.preventDefault(); const f = e.deltaY < 0 ? 1.1 : 1 / 1.1; this.zoom = Math.max(0.45, Math.min(2.6, this.zoom * f)); this.userZoomed = true; this.render(); }, { passive: false });
    this.canvas.addEventListener("mousedown", (e) => { this.drag = { x: e.clientX, y: e.clientY, moved: false }; });
    window.addEventListener("mouseup", () => { setTimeout(() => { this.drag = null; }, 0); });
    this.canvas.addEventListener("mousemove", (e) => {
      if (this.drag) { const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y; if (Math.abs(dx) + Math.abs(dy) > 2) { this.drag.moved = true; this.followPlayer = false; this.panx += dx; this.pany += dy; this.drag.x = e.clientX; this.drag.y = e.clientY; this.tip.style.display = "none"; this.render(); } return; }
      this.onHover(e);
    });
    this.canvas.addEventListener("mouseleave", () => { this.tip.style.display = "none"; });
    this.canvas.addEventListener("click", (e) => { if (this.drag?.moved) return; const n = this.hit(e); if (n) { this.selected = n.id; this.render(); } });
    window.addEventListener("resize", () => this.render());
    this.load();
    this.relayout();
    if (this.current && this.nodes.has(this.current)) this.floor = this.nodes.get(this.current)!.z;
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
    this.floor = this.nodes.get(id)!.z; // the map follows you between floors
    if (this.followPlayer) { this.panx = 0; this.pany = 0; }
    this.save();
    this.render();
  }

  // Recompute grid position (x,y) and FLOOR (z) from the discovered exit graph.
  // Cardinal/diagonal exits move x,y on the same floor; UP/DOWN change floors.
  private relayout() {
    const ids = [...this.nodes.keys()]; if (!ids.length) return;
    const placed = new Map<string, { x: number; y: number; z: number }>();
    const occ = new Set<string>();
    const put = (id: string, x: number, y: number, z: number) => { placed.set(id, { x, y, z }); occ.add(`${x},${y},${z}`); };
    const free = (x: number, y: number, z: number, dx: number, dy: number): [number, number] => { let g = 0; while (occ.has(`${x},${y},${z}`) && g++ < 60) { x += dx || 1; y += dy; } return [x, y]; };
    const anchor = this.nodes.has("WEST-OF-HOUSE") ? "WEST-OF-HOUSE" : ids[0];
    put(anchor, 0, 0, 0);
    const q = [anchor];
    while (q.length) {
      const id = q.shift()!; const pos = placed.get(id)!; const room = this.rooms[id]; if (!room) continue;
      for (const dir of ORDER) {
        const e = room.exits[dir]; if (!e || !e.to) continue; const to = e.to;
        if (!this.nodes.has(to) || placed.has(to)) continue;
        if (dir === "UP" || dir === "DOWN") { const z = pos.z + (dir === "UP" ? -1 : 1); const [x, y] = free(pos.x, pos.y, z, 1, 0); put(to, x, y, z); q.push(to); }
        else { const d = DELTA[dir]; if (!d) continue; const [x, y] = free(pos.x + d[0], pos.y + d[1], pos.z, d[0] || 0, d[1]); put(to, x, y, pos.z); q.push(to); }
      }
    }
    // rooms only reachable backwards (one-way passages): hang them off any placed neighbour
    let changed = true, guard = 0;
    while (changed && guard++ < 12) {
      changed = false;
      for (const id of ids) {
        if (placed.has(id)) continue; const room = this.rooms[id]; let done = false;
        if (room) for (const dir of ORDER) { const e = room.exits[dir]; if (e?.to && placed.has(e.to)) { const pos = placed.get(e.to)!; const dz = dir === "UP" ? 1 : dir === "DOWN" ? -1 : 0; const d = DELTA[dir] || [0, 0]; const [x, y] = free(pos.x - d[0], pos.y - d[1], pos.z + dz, -(d[0] || 1), -d[1]); put(id, x, y, pos.z + dz); changed = done = true; break; } }
        if (done) continue;
        for (const pid of [...placed.keys()]) { const pr = this.rooms[pid]; if (!pr) continue; for (const dir of ORDER) { const e = pr.exits[dir]; if (e?.to === id) { const pos = placed.get(pid)!; const dz = dir === "UP" ? -1 : dir === "DOWN" ? 1 : 0; const d = DELTA[dir] || [0, 0]; const [x, y] = free(pos.x + d[0], pos.y + d[1], pos.z + dz, d[0] || 1, d[1]); put(id, x, y, pos.z + dz); changed = done = true; break; } } if (done) break; }
      }
    }
    // truly orphaned rooms (teleports): park them in a row just south of the map
    if (placed.size) {
      let maxy = 0; for (const p of placed.values()) maxy = Math.max(maxy, p.y);
      let fx = 0;
      for (const id of ids) { if (placed.has(id)) continue; const [x, y] = free(fx, maxy + 2, 0, 1, 0); put(id, x, y, 0); fx = x + 1; }
    }
    for (const [id, pos] of placed) { const n = this.nodes.get(id)!; n.x = pos.x; n.y = pos.y; n.z = pos.z; }
  }

  private hit(e: MouseEvent): MapNode | null {
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    let best: MapNode | null = null, bd = 26 * this.zoom;
    for (const n of this.nodes.values()) { if (n.z !== this.floor) continue; const [sx, sy] = this.proj(n); const d = Math.hypot(sx - mx, sy - my); if (d < bd) { bd = d; best = n; } }
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

  private floorName(z: number) { return z === 0 ? "SURF" : z > 0 ? `B${z}` : `+${-z}`; }

  private render() {
    const all = [...this.nodes.values()];
    (this.el.querySelector(".map-count") as HTMLElement).textContent = all.length ? `· ${all.length} found` : "";
    // ── floor tabs ──
    const floors = [...new Set(all.map((n) => n.z))].sort((a, b) => a - b);
    const curZ = this.current && this.nodes.has(this.current) ? this.nodes.get(this.current)!.z : 0;
    if (!floors.includes(this.floor)) this.floor = floors.includes(curZ) ? curZ : (floors[0] ?? 0);
    this.floorsEl.style.display = floors.length > 1 ? "flex" : "none";
    this.floorsEl.innerHTML = floors.map((z) =>
      `<button data-z="${z}" class="${z === this.floor ? "on" : ""}">${this.floorName(z)}${z === curZ ? ' <span class="fl-at">@</span>' : ""}</button>`).join("");

    const stage = this.canvas.parentElement as HTMLElement;
    const cw = stage.clientWidth, ch = stage.clientHeight, dpr = window.devicePixelRatio || 1;
    if (cw < 4 || ch < 4) return;
    this.canvas.width = Math.round(cw * dpr); this.canvas.height = Math.round(ch * dpr);
    this.canvas.style.width = `${cw}px`; this.canvas.style.height = `${ch}px`;
    const p = this.ctx; p.setTransform(dpr, 0, 0, dpr, 0, 0); p.imageSmoothingEnabled = false;
    p.clearRect(0, 0, cw, ch);
    const ns = all.filter((n) => n.z === this.floor);
    if (!all.length) { this.info.innerHTML = `<div class="map-dim">Explore to reveal the map.</div>`; return; }

    // ── scale: auto-fit this floor unless the player has taken over the zoom ──
    const minx = Math.min(...ns.map((n) => n.x)), maxx = Math.max(...ns.map((n) => n.x));
    const miny = Math.min(...ns.map((n) => n.y)), maxy = Math.max(...ns.map((n) => n.y));
    const cols = Math.max(1, maxx - minx + 1), rows = Math.max(1, maxy - miny + 1);
    const fit = Math.max(26, Math.min(64, Math.floor(Math.min((cw - 40) / cols, (ch - 40) / rows))));
    const cell = Math.round(fit * (this.userZoomed ? this.zoom : 1));
    if (!this.userZoomed) this.zoom = 1;
    const bw = Math.max(14, Math.round(cell * 0.72)), bh = Math.max(10, Math.round(cell * 0.44)); // room box
    const showLabels = cell >= 58; // room for a pencilled name under each box

    // centre on the player's room (follow) or the floor's cloud
    const centreNode = this.followPlayer && this.current && this.nodes.get(this.current)?.z === this.floor ? this.nodes.get(this.current)! : null;
    const rawx = (n: MapNode) => (n.x - minx) * cell, rawy = (n: MapNode) => (n.y - miny) * cell;
    let ox: number, oy: number;
    if (centreNode) { ox = cw / 2 - rawx(centreNode) + this.panx; oy = ch / 2 - rawy(centreNode) + this.pany; }
    else { ox = (cw - (maxx - minx) * cell) / 2 + this.panx; oy = (ch - (maxy - miny) * cell) / 2 + this.pany; }
    this.proj = (n: MapNode) => [Math.round(ox + rawx(n)), Math.round(oy + rawy(n))];

    // ── graph paper ──
    p.fillStyle = PAPER_GRID;
    const g = Math.max(8, cell >> 1);
    for (let x = ((ox % g) + g) % g; x < cw; x += g) p.fillRect(Math.round(x), 0, 1, ch);
    for (let y = ((oy % g) + g) % g; y < ch; y += g) p.fillRect(0, Math.round(y), cw, 1);

    const pulse = (Date.now() / 600) % 2 < 1; // slow heartbeat
    p.font = `bold ${Math.max(8, Math.min(10, Math.round(bh * 0.42)))}px "IBM Plex Mono", monospace`;
    p.textAlign = "center"; p.textBaseline = "middle";

    // ── ink lines between rooms (this floor) + "?" stubs + stair marks ──
    const drawn = new Set<string>();
    const hline = (x1: number, x2: number, y: number, c: string) => { p.fillStyle = c; p.fillRect(Math.round(Math.min(x1, x2)), Math.round(y) - 1, Math.round(Math.abs(x2 - x1)) + 2, 2); };
    const vline = (y1: number, y2: number, x: number, c: string) => { p.fillStyle = c; p.fillRect(Math.round(x) - 1, Math.round(Math.min(y1, y2)), 2, Math.round(Math.abs(y2 - y1)) + 2); };
    const elbow = (x1: number, y1: number, x2: number, y2: number, c: string) => { if (Math.abs(y1 - y2) < 2) hline(x1, x2, y1, c); else if (Math.abs(x1 - x2) < 2) vline(y1, y2, x1, c); else { hline(x1, x2, y1, c); vline(y1, y2, x2, c); } };
    const tri = (x: number, y: number, up: boolean, c: string) => { p.fillStyle = c; for (let r = 0; r < 3; r++) { const w = up ? r : 2 - r; p.fillRect(Math.round(x - w), Math.round(y + (up ? r - 1 : -r + 1)), w * 2 + 1, 1); } };

    for (const n of ns) {
      const room = this.rooms[n.id]; if (!room) continue;
      const [x1, y1] = this.proj(n);
      let stairUp = 0, stairDown = 0, qs = 0; // per-room marks
      for (const [dir, e] of Object.entries(room.exits)) {
        if (!e.to) continue;
        const vert = dir === "UP" || dir === "DOWN";
        const target = this.nodes.get(e.to);
        if (vert) { // stairs: mark the room corner; gold if the far side is unknown
          const known = !!target;
          if (dir === "UP") stairUp = known ? 1 : 2; else stairDown = known ? 1 : 2;
          continue;
        }
        const d = DELTA[dir]; if (!d) continue;
        if (target && target.z === n.z) {
          const key = [n.id, e.to].sort().join("|"); if (drawn.has(key)) continue; drawn.add(key);
          const [x2, y2] = this.proj(target);
          elbow(x1, y1, x2, y2, INK);
        } else if (!target) { // an exit not yet taken → short stub + "?"
          const sx = x1 + d[0] * (bw / 2 + 7), sy = y1 + d[1] * (bh / 2 + 7);
          elbow(x1, y1, x1 + d[0] * (bw / 2 + 4), y1 + d[1] * (bh / 2 + 4), INK_DIM);
          p.fillStyle = pulse ? GOLD : GOLD_DIM;
          p.fillText("?", Math.round(sx + d[0] * 3), Math.round(sy + d[1] * 3) + 1);
          qs++;
        }
        // exits to a room on another floor via a ramp (rare): leave to stairs marks
      }
      void qs; void stairUp; void stairDown;
      (n as MapNode & { _st?: [number, number] })._st = [stairUp, stairDown];
    }

    // ── the rooms: labelled boxes, hand-map style ──
    for (const n of ns) {
      const [x, y] = this.proj(n);
      const bx = Math.round(x - bw / 2), by = Math.round(y - bh / 2);
      const isHere = n.id === this.current, isSel = n.id === this.selected;
      p.fillStyle = "#02120a"; p.fillRect(bx - 2, by - 2, bw + 4, bh + 4); // paper shows through around the box
      p.fillStyle = isHere ? "#0a3a1e" : BOX_FILL; p.fillRect(bx, by, bw, bh);
      const edge = isHere ? HERE : isSel ? GOLD : bw >= 24 ? BOX_EDGE : BOX_EDGE_DIM;
      p.fillStyle = edge;
      p.fillRect(bx, by, bw, 2); p.fillRect(bx, by + bh - 2, bw, 2); p.fillRect(bx, by, 2, bh); p.fillRect(bx + bw - 2, by, 2, bh);
      // label: the room's name pencilled BENEATH the box (hand-map style).
      // Every room gets one when zoomed in; you/selection always do.
      if (showLabels || isHere || isSel) {
        const lines = abbrev(n.name, 11);
        const col = isHere ? HERE : isSel ? GOLD : LABEL_DIM;
        let ly = by + bh + 6;
        for (const ln of lines) {
          const tw = p.measureText(ln).width;
          p.fillStyle = "#02120a"; p.fillRect(Math.round(x - tw / 2) - 2, ly - 4, Math.round(tw) + 4, 9); // backing so ink lines don't cut the words
          p.fillStyle = col; p.fillText(ln, x, ly);
          ly += 9;
        }
      }
      // stair marks at the west edge; item pip at the east
      const st = (n as MapNode & { _st?: [number, number] })._st || [0, 0];
      if (st[0]) tri(bx + 5, by + 5, true, st[0] === 2 ? (pulse ? GOLD : GOLD_DIM) : LABEL_DIM);
      if (st[1]) tri(bx + 5, by + bh - 5, false, st[1] === 2 ? (pulse ? GOLD : GOLD_DIM) : LABEL_DIM);
      if (n.items.length) { p.fillStyle = GOLD; p.fillRect(bx + bw - 7, by + 3, 3, 3); p.fillStyle = "#fff0b0"; p.fillRect(bx + bw - 7, by + 3, 1, 1); }
      // the @: you are here
      if (isHere) {
        p.fillStyle = pulse ? "#eafff0" : "#8affb0";
        p.font = `bold ${Math.max(10, Math.round(bh * 0.62))}px "IBM Plex Mono", monospace`;
        p.fillText("@", x, y + 1);
        p.font = `bold ${Math.max(8, Math.min(10, Math.round(bh * 0.42)))}px "IBM Plex Mono", monospace`;
      }
    }

    // ── info panel ──
    const sel = this.selected ? this.nodes.get(this.selected) : null;
    if (!sel) { this.info.innerHTML = ""; return; }
    const room = this.rooms[sel.id];
    const exitDirs = room ? Object.keys(room.exits).filter((d) => room.exits[d].to) : [];
    const untried = room ? exitDirs.filter((d) => { const to = room.exits[d].to!; return !this.nodes.has(to); }) : [];
    const items = sel.items.length ? sel.items.map((i) => `<li>${esc(i)}</li>`).join("") : `<li class="map-dim">— nothing notable —</li>`;
    this.info.innerHTML = `
      <div class="map-here">${sel.id === this.current ? "@ " : ""}${esc(sel.name)}</div>
      <div class="map-sub">FOUND HERE</div>
      <ul class="map-items">${items}</ul>
      <div class="map-sub">EXITS</div>
      <div class="map-exits">${exitDirs.length ? exitDirs.map((d) => untried.includes(d) ? `<b class="map-untried">${d.toLowerCase()}?</b>` : d.toLowerCase()).join(" · ") : "—"}</div>`;
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
