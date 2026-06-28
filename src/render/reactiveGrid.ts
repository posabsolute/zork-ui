/*
 * reactiveGrid.ts — a Geometry-Wars-style warping floor grid.
 *
 * A wide mesh of glowing lines that gently undulates and ripples outward when
 * the player acts. It fades to black with distance (per-vertex colour falloff +
 * additive blending) so it dissolves softly into the void instead of ending at a
 * hard edge — no grid poking through walls, a clean horizon outdoors.
 */
import * as THREE from "three";

interface Pulse {
  t0: number;
  x: number;
  z: number;
  strength: number;
}

export class ReactiveGrid {
  readonly object: THREE.LineSegments;
  private cols: number;
  private rows: number;
  private xs: number[] = [];
  private zs: number[] = [];
  private segIndex: [number, number, number, number][] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private geo: THREE.BufferGeometry;
  private mat: THREE.LineBasicMaterial;
  private pulses: Pulse[] = [];
  private hue = new THREE.Color(0x224466);
  private rInner: number;
  private rOuter: number;

  constructor(size = 44, spacing = 1.4, color = 0x224466) {
    this.cols = Math.floor(size / spacing);
    this.rows = this.cols;
    for (let i = 0; i <= this.cols; i++) this.xs[i] = -size / 2 + i * spacing;
    for (let j = 0; j <= this.rows; j++) this.zs[j] = -size / 2 + j * spacing;
    this.rInner = size * 0.16;
    this.rOuter = size * 0.46;

    for (let i = 0; i <= this.cols; i++) {
      for (let j = 0; j <= this.rows; j++) {
        if (i < this.cols) this.segIndex.push([i, j, i + 1, j]);
        if (j < this.rows) this.segIndex.push([i, j, i, j + 1]);
      }
    }
    this.positions = new Float32Array(this.segIndex.length * 6);
    this.colors = new Float32Array(this.segIndex.length * 6);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.object = new THREE.LineSegments(this.geo, this.mat);
    this.hue.setHex(color);
    this.computeColors();
    this.write(0);
  }

  setColor(color: number) {
    this.hue.setHex(color);
    this.computeColors();
  }

  /** Set where the grid starts fading and where it reaches black. */
  setExtent(rInner: number, rOuter: number) {
    this.rInner = rInner;
    this.rOuter = rOuter;
    this.computeColors();
  }

  pulse(t: number, x = 0, z = 0, strength = 1) {
    this.pulses.push({ t0: t, x, z, strength });
    if (this.pulses.length > 6) this.pulses.shift();
  }

  update(t: number) {
    this.write(t);
  }

  /** Smooth radial falloff: 1 near the centre, 0 past rOuter. */
  private fade(x: number, z: number): number {
    const d = Math.hypot(x, z);
    if (d <= this.rInner) return 1;
    if (d >= this.rOuter) return 0;
    const u = 1 - (d - this.rInner) / (this.rOuter - this.rInner);
    return u * u * (3 - 2 * u); // smoothstep
  }

  private computeColors() {
    const col = this.colors;
    let k = 0;
    const r = this.hue.r, g = this.hue.g, b = this.hue.b;
    for (const [i1, j1, i2, j2] of this.segIndex) {
      const f1 = this.fade(this.xs[i1], this.zs[j1]);
      const f2 = this.fade(this.xs[i2], this.zs[j2]);
      col[k++] = r * f1; col[k++] = g * f1; col[k++] = b * f1;
      col[k++] = r * f2; col[k++] = g * f2; col[k++] = b * f2;
    }
    this.geo.attributes.color.needsUpdate = true;
  }

  private heightAt(x: number, z: number, t: number): number {
    let h = Math.sin(x * 0.35 + t * 0.9) * 0.05 + Math.cos(z * 0.4 + t * 0.7) * 0.05;
    for (const p of this.pulses) {
      const age = t - p.t0;
      if (age < 0 || age > 3.2) continue;
      const d = Math.hypot(x - p.x, z - p.z);
      const front = age * 7.0;
      const band = d - front;
      const amp = p.strength * 0.7 * Math.exp(-(band * band) / 1.5) * Math.exp(-age * 1.1);
      h += Math.cos(band * 2.0) * amp;
    }
    return h;
  }

  private write(t: number) {
    const pos = this.positions;
    let k = 0;
    for (const [i1, j1, i2, j2] of this.segIndex) {
      const x1 = this.xs[i1], z1 = this.zs[j1];
      const x2 = this.xs[i2], z2 = this.zs[j2];
      pos[k++] = x1; pos[k++] = this.heightAt(x1, z1, t); pos[k++] = z1;
      pos[k++] = x2; pos[k++] = this.heightAt(x2, z2, t); pos[k++] = z2;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}
