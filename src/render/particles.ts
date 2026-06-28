/*
 * particles.ts — drifting, twinkling points that give the void depth and life.
 * Stars for outdoor rooms (high, wide), motes/embers for interiors (lower).
 */
import * as THREE from "three";

export class ParticleField {
  readonly object: THREE.Points;
  private mat: THREE.PointsMaterial;
  private baseY: Float32Array;
  private geo: THREE.BufferGeometry;
  private count: number;

  constructor(count = 220, color = 0xfff0d0) {
    this.count = count;
    const pos = new Float32Array(count * 3);
    this.baseY = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      const y = 2 + Math.random() * 14;
      pos[i * 3 + 1] = y;
      this.baseY[i] = y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.PointsMaterial({
      color,
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.object = new THREE.Points(this.geo, this.mat);
  }

  /** mode "stars" sits high and wide; "motes" hangs low and close. */
  configure(color: number, mode: "stars" | "motes") {
    this.mat.color.setHex(color);
    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.count; i++) {
      if (mode === "stars") {
        const y = 6 + Math.random() * 12;
        pos.setY(i, y);
        this.baseY[i] = y;
        this.mat.size = 0.1;
      } else {
        const y = 0.5 + Math.random() * 3.5;
        pos.setY(i, y);
        this.baseY[i] = y;
        this.mat.size = 0.07;
      }
    }
    pos.needsUpdate = true;
  }

  update(t: number) {
    // Slow drift + collective twinkle.
    this.object.rotation.y = t * 0.01;
    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.count; i++) {
      pos.setY(i, this.baseY[i] + Math.sin(t * 0.6 + i) * 0.06);
    }
    pos.needsUpdate = true;
    this.mat.opacity = 0.7 + 0.3 * Math.abs(Math.sin(t * 1.3));
  }
}
