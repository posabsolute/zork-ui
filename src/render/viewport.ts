/*
 * viewport.ts — the first-person vector view of the current room.
 *
 * Glowing line-art on black. The only post-processing is a genuine bloom pass
 * (the phosphor glow of a vector monitor) plus OutputPass for correct colour —
 * no scanlines, no chromatic aberration, no PS1 jitter. Rooms swap on change,
 * placing the camera inside the doorway the player came through.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { buildRoom, type BuiltRoom } from "./roomBuilder.ts";
import type { Room } from "../engine/roomState.ts";

export class Viewport {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;

  private current: BuiltRoom | null = null;
  private targetYaw = 0;
  private bobT = 0;
  private clock = new THREE.Clock();
  private running = true;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(1);
    this.scene.background = new THREE.Color(0x000000); // true void

    this.camera = new THREE.PerspectiveCamera(72, 16 / 9, 0.1, 120);
    this.camera.position.set(0, 1.6, 2);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.45, // strength — restrained glow
      0.3, // radius — tight halo, not a wash
      0.25 // threshold — only the bright line cores bloom; the void stays black
    );
    this.composer.addPass(bloom);
    this.composer.addPass(new OutputPass());

    document.addEventListener("visibilitychange", () => {
      this.running = !document.hidden;
      if (this.running) this.loop();
    });
    window.addEventListener("resize", () => this.resize());
    this.resize();
    this.loop();
  }

  showRoom(room: Room, enteredFrom?: string) {
    if (this.current) {
      this.scene.remove(this.current.group);
      disposeGroup(this.current.group);
    }
    const built = buildRoom(room);
    this.scene.add(built.group);
    this.current = built;

    const { pos } = built.entryFacing(enteredFrom);
    this.camera.position.copy(pos);
    this.camera.lookAt(0, 1.4, 0);
    this.targetYaw = this.camera.rotation.y;
  }

  private resize() {
    const parent = this.canvas.parentElement;
    const w = parent?.clientWidth || 640;
    const h = parent?.clientHeight || 360;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private loop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    const dt = this.clock.getDelta();
    this.bobT += dt;

    const sway = Math.sin(this.bobT * 0.7) * 0.012;
    this.camera.rotation.y = this.targetYaw + sway;
    this.camera.position.y = 1.6 + Math.sin(this.bobT * 1.4) * 0.02;

    this.composer.render();
  };
}

function disposeGroup(group: THREE.Group) {
  group.traverse((o: any) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m: any) => m.dispose());
      else o.material.dispose();
    }
  });
}
