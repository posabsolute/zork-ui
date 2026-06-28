/*
 * compass.ts — a small vector compass HUD. It lights the directions the current
 * room actually has exits for, so you always know what n/s/e/w/up/down will do
 * without having to picture the cardinal layout yourself.
 */
import type { Room } from "../engine/roomState.ts";

const SVGNS = "http://www.w3.org/2000/svg";

const DIRS: { key: string; label: string; angle: number }[] = [
  { key: "NORTH", label: "N", angle: 0 },
  { key: "NE", label: "NE", angle: 45 },
  { key: "EAST", label: "E", angle: 90 },
  { key: "SE", label: "SE", angle: 135 },
  { key: "SOUTH", label: "S", angle: 180 },
  { key: "SW", label: "SW", angle: 225 },
  { key: "WEST", label: "W", angle: 270 },
  { key: "NW", label: "NW", angle: 315 },
];

export class Compass {
  private labels = new Map<string, SVGTextElement>();
  private ticks = new Map<string, SVGLineElement>();
  private up: HTMLElement;
  private down: HTMLElement;

  constructor(container: HTMLElement) {
    const wrap = document.createElement("div");
    wrap.id = "compass";

    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    const cx = 50, cy = 50;

    const ring = document.createElementNS(SVGNS, "circle");
    ring.setAttribute("cx", `${cx}`);
    ring.setAttribute("cy", `${cy}`);
    ring.setAttribute("r", "34");
    ring.setAttribute("class", "cmp-ring");
    svg.appendChild(ring);

    for (const d of DIRS) {
      const rad = (d.angle * Math.PI) / 180;
      const sx = cx + Math.sin(rad) * 26, sy = cy - Math.cos(rad) * 26;
      const ex = cx + Math.sin(rad) * 34, ey = cy - Math.cos(rad) * 34;
      const tick = document.createElementNS(SVGNS, "line");
      tick.setAttribute("x1", `${sx}`); tick.setAttribute("y1", `${sy}`);
      tick.setAttribute("x2", `${ex}`); tick.setAttribute("y2", `${ey}`);
      tick.setAttribute("class", "cmp-tick");
      svg.appendChild(tick);
      this.ticks.set(d.key, tick);

      const lx = cx + Math.sin(rad) * 44, ly = cy - Math.cos(rad) * 44;
      const text = document.createElementNS(SVGNS, "text");
      text.setAttribute("x", `${lx}`); text.setAttribute("y", `${ly + 3}`);
      text.setAttribute("class", "cmp-label");
      text.textContent = d.label;
      svg.appendChild(text);
      this.labels.set(d.key, text);
    }

    wrap.appendChild(svg);

    const vert = document.createElement("div");
    vert.className = "cmp-vert";
    this.up = document.createElement("span");
    this.up.textContent = "↑ up";
    this.down = document.createElement("span");
    this.down.textContent = "↓ down";
    vert.appendChild(this.up);
    vert.appendChild(this.down);
    wrap.appendChild(vert);

    container.appendChild(wrap);
  }

  update(room: Room) {
    const open = (k: string) => {
      const e = room.exits[k];
      return !!e && e.kind !== "blocked";
    };
    // Diagonals/IN/OUT fold onto cardinals so the rose still reads true.
    const lit = new Set<string>();
    for (const d of DIRS) if (open(d.key)) lit.add(d.key);
    if (open("IN") || open("OUT")) {
      // show as the nearest available — leave to UP/DOWN chips otherwise
    }
    for (const [key, text] of this.labels) {
      const on = lit.has(key);
      text.classList.toggle("on", on);
      this.ticks.get(key)!.classList.toggle("on", on);
    }
    this.up.classList.toggle("on", open("UP"));
    this.down.classList.toggle("on", open("DOWN"));
  }
}
