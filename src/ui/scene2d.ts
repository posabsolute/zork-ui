/*
 * scene2d.ts — drives a full-screen 2D canvas overlay for rooms that have a
 * hand-composed scene (see roomScenes). When active it sits on top of the WebGL
 * viewport; when hidden the 3D view shows through.
 */
import type { SceneDraw } from "./roomScenes.ts";

export class Scene2D {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private t = 0;
  private running = false;
  private draw: SceneDraw | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  show(draw: SceneDraw) {
    this.draw = draw;
    this.canvas.style.display = "block";
    if (!this.running) {
      this.running = true;
      this.loop();
    }
  }

  hide() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.canvas.style.display = "none";
  }

  private fit() {
    const cw = this.canvas.clientWidth || 800;
    const ch = this.canvas.clientHeight || 450;
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
  }

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    this.t += 0.016;
    this.fit();
    if (this.draw) this.draw(this.ctx, this.canvas.width, this.canvas.height, this.t);
  };
}
