/*
 * Per-region art direction. Each Zork region gets a palette and lighting mood so
 * procedurally-built rooms feel like the place the text describes.
 */
export interface RegionStyle {
  floor: number;
  wall: number;
  ceiling: number;
  ambient: number;
  fog: number;
  /** Light tint for the room's lamp/torch. */
  light: number;
  fogDensity: number;
}

export const REGIONS: Record<string, RegionStyle> = {
  forest: {
    floor: 0x2c3a1a, wall: 0x3a4a22, ceiling: 0x17341f,
    ambient: 0x4a6a3a, fog: 0x0d1a10, light: 0xbfe08a, fogDensity: 0.05,
  },
  house: {
    floor: 0x4a3526, wall: 0x6b4a32, ceiling: 0x2c1d12,
    ambient: 0x8a7a55, fog: 0x1a120a, light: 0xffd9a0, fogDensity: 0.06,
  },
  cellar: {
    floor: 0x2a2622, wall: 0x39332c, ceiling: 0x16130f,
    ambient: 0x5a4f42, fog: 0x0a0805, light: 0xffcf8a, fogDensity: 0.09,
  },
  dungeon: {
    floor: 0x24262b, wall: 0x33363d, ceiling: 0x121316,
    ambient: 0x4a4f5a, fog: 0x070809, light: 0xd8e0ff, fogDensity: 0.1,
  },
  maze: {
    floor: 0x2b2622, wall: 0x40382f, ceiling: 0x14110d,
    ambient: 0x554b3d, fog: 0x080604, light: 0xffce8a, fogDensity: 0.12,
  },
  temple: {
    floor: 0x4d4636, wall: 0x6a6048, ceiling: 0x2a261b,
    ambient: 0x8f8460, fog: 0x12100a, light: 0xffe9b0, fogDensity: 0.05,
  },
  river: {
    floor: 0x1b2e33, wall: 0x274047, ceiling: 0x0e1d22,
    ambient: 0x3f6b74, fog: 0x081518, light: 0xa8e6ff, fogDensity: 0.07,
  },
  hades: {
    floor: 0x2a1414, wall: 0x3d1d1d, ceiling: 0x140808,
    ambient: 0x6a2a2a, fog: 0x0a0303, light: 0xff7a5a, fogDensity: 0.11,
  },
  mine: {
    floor: 0x201d1a, wall: 0x2e2926, ceiling: 0x100e0c,
    ambient: 0x453d34, fog: 0x060504, light: 0xffd07a, fogDensity: 0.13,
  },
};

export function regionStyle(region: string): RegionStyle {
  return REGIONS[region] ?? REGIONS.dungeon;
}

/*
 * Vector-display phosphor palette — one luminous hue per region. Tight and bold,
 * the way a limited-palette era forced designers to be. These bloom on black.
 */
export const VECTOR_COLORS: Record<string, number> = {
  forest: 0x5dff8a, // phosphor green
  house: 0xffc862, // amber
  cellar: 0xff9a52, // ember orange
  dungeon: 0x62d0ff, // cold cyan
  maze: 0xc79bff, // violet
  temple: 0xffe27a, // gold
  river: 0x5cf2ff, // bright cyan
  hades: 0xff5a52, // red
  mine: 0xffb24a, // amber-orange
};

export function vectorColor(region: string): number {
  return VECTOR_COLORS[region] ?? VECTOR_COLORS.dungeon;
}
