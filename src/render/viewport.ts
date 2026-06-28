/*
 * viewport.ts — the first-person vector view of the current room.
 *
 * Glowing neon line-art on black with a real bloom pass (no scanlines, no PS1).
 * A Geometry-Wars-style reactive grid warps underfoot and ripples on every
 * command; a particle field gives the void depth; the camera punches on action.
 * Rooms swap on change, placing the camera inside the doorway you came through.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { buildRoom, type BuiltRoom } from "./roomBuilder.ts";
import { ReactiveGrid } from "./reactiveGrid.ts";
import { ParticleField } from "./particles.ts";
import { animateGroup } from "./motion.ts";
import { getPalette, scaleColor } from "../config/regions.ts";
import type { Room } from "../engine/roomState.ts";

const OUTDOOR = new Set(["forest"]);

export class Viewport {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;

  private grid: ReactiveGrid;
  private particles: ParticleField;

  private current: BuiltRoom | null = null;
  private targetYaw = 0;
  private bobT = 0;
  private energy = 0; // action "juice", decays each frame
  private baseFov = 72;
  private clock = new THREE.Clock();
  private running = true;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(1);
    this.scene.background = new THREE.Color(0x000000);

    // Lights for solid (occluding) surfaces in landscape rooms. Line materials
    // ignore lighting, so the existing line-art rooms are unaffected.
    this.scene.add(new THREE.AmbientLight(0x1a2233, 1.1));
    const sun = new THREE.DirectionalLight(0xaac4e6, 1.6);
    sun.position.set(-1, 1.3, 0.4);
    this.scene.add(sun);

    this.camera = new THREE.PerspectiveCamera(this.baseFov, 16 / 9, 0.1, 140);
    this.camera.position.set(0, 1.6, 2);

    this.grid = new ReactiveGrid();
    this.scene.add(this.grid.object);
    this.particles = new ParticleField();
    this.scene.add(this.particles.object);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.4, 0.18);
    this.composer.addPass(this.bloom);
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

    if (built.camera) {
      // "View" rooms fix the camera so the vista is always framed correctly.
      this.camera.position.set(...built.camera.pos);
      this.camera.lookAt(...built.camera.look);
    } else {
      const { pos } = built.entryFacing(enteredFrom);
      this.camera.position.copy(pos);
      this.camera.lookAt(0, 1.4, 0);
    }
    this.targetYaw = this.camera.rotation.y;

    // "View" rooms are full 3D scenes — hide the abstract floor grid for them.
    this.grid.object.visible = !built.camera;
    // Fade the floor grid just outside the room footprint so it doesn't sprawl.
    const ext = Math.max(built.dims.W, built.dims.D) / 2;
    this.grid.setExtent(ext + 0.4, ext + (OUTDOOR.has(room.region) ? 5 : 2.5));

    const palette = getPalette(room.region);
    const isOutdoor = OUTDOOR.has(room.region);
    // Outdoor: cool sky-blue stars + a cool grid. Indoor: warm motes + region grid.
    this.grid.setColor(isOutdoor ? 0x2a5a8f : scaleColor(palette.primary, 0.5));
    this.particles.configure(
      isOutdoor ? 0x9fd8ff : scaleColor(palette.primary, 0.8),
      isOutdoor ? "stars" : "motes"
    );
    // Arriving in a room is itself an event.
    this.pulse(0.7);
  }

  /** React to a player action: ripple the grid and punch the camera/bloom. */
  pulse(strength = 1) {
    this.grid.pulse(this.bobT, 0, 0, strength);
    this.energy = Math.min(1.2, this.energy + strength);
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
    const dt = Math.min(0.05, this.clock.getDelta());
    this.bobT += dt;

    const sway = Math.sin(this.bobT * 0.7) * 0.012;
    this.camera.rotation.y = this.targetYaw + sway;
    this.camera.position.y = 1.6 + Math.sin(this.bobT * 1.4) * 0.02;

    // Action juice: brief FOV punch + bloom flare, decaying.
    this.energy = Math.max(0, this.energy - dt * 1.6);
    this.camera.fov = this.baseFov - this.energy * 5;
    this.camera.updateProjectionMatrix();
    this.bloom.strength = 0.7 + this.energy * 0.5;

    this.grid.update(this.bobT);
    this.particles.update(this.bobT);
    if (this.current) animateGroup(this.current.group, this.bobT); // tagged decor motion
    this.current?.animate?.(this.bobT); // hero bespoke motion
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
