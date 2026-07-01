/*
 * map.ts — "The Adventurer's Map": an auto-drawn graph-paper map, the way Zork
 * players actually mapped the Empire in 1980 — room names in boxes, ink lines
 * between them, U/D marks at stairways, and "?" at every exit not yet taken.
 *
 * Conventions (from Infocom/Trizbort hand-maps + dungeon-crawler automaps):
 *  - rooms are LABELLED BOXES on faint graph paper, laid out by real compass
 *    exits — a north exit puts the far room NORTH, always (direction-true)
 *  - one FLOOR at a time (tabs), like a crawler automap; ▲/▼ mark the stairs
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
    const occ = new Map<string, string>(); // "x,y,z" -> room id
    const put = (id: string, x: number, y: number, z: number) => { placed.set(id, { x, y, z }); occ.set(`${x},${y},${z}`, id); };
    // walk FURTHER IN THE EXIT'S OWN DIRECTION until a cell is free — a north
    // exit must land north, never drift sideways
    const free = (x: number, y: number, z: number, dx: number, dy: number): [number, number] => {
      let sx = dx, sy = dy; if (!sx && !sy) sx = 1;
      let g = 0; while (occ.has(`${x},${y},${z}`) && g++ < 60) { x += sx; y += sy; }
      return [x, y];
    };
    const anchor = this.nodes.has("WEST-OF-HOUSE") ? "WEST-OF-HOUSE" : ids[0];
    put(anchor, 0, 0, 0);
    const q = [anchor];
    while (q.length) {
      const id = q.shift()!; const pos = placed.get(id)!; const room = this.rooms[id]; if (!room) continue;
      for (const dir of ORDER) {
        const e = room.exits[dir]; if (!e || !e.to) continue; const to = e.to;
        if (!this.nodes.has(to) || placed.has(to)) continue;
        if (dir === "UP" || dir === "DOWN") { const z = pos.z + (dir === "UP" ? -1 : 1); const [x, y] = free(pos.x, pos.y, z, 1, 0); put(to, x, y, z); q.push(to); }
        else { const d = DELTA[dir]; if (!d) continue; const [x, y] = free(pos.x + d[0], pos.y + d[1], pos.z, d[0], d[1]); put(to, x, y, pos.z); q.push(to); }
      }
    }
    // rooms only reachable backwards (one-way passages): hang them off any placed neighbour
    let changed = true, guard = 0;
    while (changed && guard++ < 12) {
      changed = false;
      for (const id of ids) {
        if (placed.has(id)) continue; const room = this.rooms[id]; let done = false;
        if (room) for (const dir of ORDER) { const e = room.exits[dir]; if (e?.to && placed.has(e.to)) { const pos = placed.get(e.to)!; const dz = dir === "UP" ? 1 : dir === "DOWN" ? -1 : 0; const d = DELTA[dir] || [0, 0]; const [x, y] = free(pos.x - d[0], pos.y - d[1], pos.z + dz, -d[0], -d[1]); put(id, x, y, pos.z + dz); changed = done = true; break; } }
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
    let best: MapNode | null = null, bd = 40 * this.zoom;
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
      `<button data-z="${z}" class="${z === this.floor ? "on" : ""}">${this.floorName(z)}${z === curZ ? ' <span class="fl-at">●</span>' : ""}</button>`).join("");

    const stage = this.canvas.parentElement as HTMLElement;
    const cw = stage.clientWidth, ch = stage.clientHeight, dpr = window.devicePixelRatio || 1;
    if (cw < 4 || ch < 4) return;
    this.canvas.width = Math.round(cw * dpr); this.canvas.height = Math.round(ch * dpr);
    this.canvas.style.width = `${cw}px`; this.canvas.style.height = `${ch}px`;
    const p = this.ctx; p.setTransform(dpr, 0, 0, dpr, 0, 0); p.imageSmoothingEnabled = false;
    p.clearRect(0, 0, cw, ch);
    const ns = all.filter((n) => n.z === this.floor);
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
    const centreNode = this.followPlayer && this.current && this.nodes.get(this.current)?.z === this.floor ? this.nodes.get(this.current)! : null;
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
    for (const n of ns) {
      const room = this.rooms[n.id]; if (!room) continue;
      let stairUp = 0, stairDown = 0;
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
          const [ax, ay] = anchorPt(n, d);
          // enter the far box on ITS reciprocal side when the way back exists
          const backRoom = this.rooms[e.to];
          const backDir = backRoom ? Object.entries(backRoom.exits).find(([bd2, ex]) => ex.to === n.id && DELTA[bd2])?.[0] : undefined;
          const rd: [number, number] = backDir ? DELTA[backDir] as [number, number] : [-d[0], -d[1]];
          const [tx2, ty2] = anchorPt(target, rd);
          const near = Math.abs(target.x - n.x) <= 1 && Math.abs(target.y - n.y) <= 1;
          line(ax, ay, tx2, ty2, near ? INK : INK_DIM, near ? 2 : 1, near ? undefined : [4, 4]);
          if (backRoom && !backDir && !Object.values(backRoom.exits).some((ex) => ex.to === n.id)) {
            // one-way passage → an arrowhead midway (Infocom hand-map convention)
            const mx = (ax + tx2) / 2, my2 = (ay + ty2) / 2, ang = Math.atan2(ty2 - ay, tx2 - ax);
            p.save(); p.translate(mx, my2); p.rotate(ang); p.fillStyle = near ? INK : INK_DIM;
            p.beginPath(); p.moveTo(4, 0); p.lineTo(-3, -3.5); p.lineTo(-3, 3.5); p.closePath(); p.fill(); p.restore();
          }
        } else if (!target) { // an exit not yet taken: a dashed line trailing off into the dark
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
        p.fillStyle = pulse ? "#2f8a4a" : "#256e3b"; p.fillRect(bx - 3, by - 3, bw + 6, bh + 6); // soft phosphor bleed
        p.fillStyle = pulse ? "#8affb0" : "#6fe89a"; p.fillRect(bx, by, bw, bh);
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
    const items = sel.items.length ? sel.items.map((i) => `<li>${esc(i)}</li>`).join("") : `<li class="map-dim">— nothing notable —</li>`;
    this.info.innerHTML = `
      <div class="map-here">${sel.id === this.current ? "► " : ""}${esc(sel.name)}</div>
      <div class="map-sub">FOUND HERE</div>
      <ul class="map-items">${items}</ul>
      <div class="map-sub">EXITS</div>
      <div class="map-exits">${exitDirs.length ? exitDirs.map((d) => untried.includes(d) ? `<b class="map-untried">${d.toLowerCase()}…</b>` : d.toLowerCase()).join(" · ") : "—"}</div>`;
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
