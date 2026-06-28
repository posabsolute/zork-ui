/*
 * objectIcons.ts — recognizable vector silhouettes for game objects.
 *
 * Instead of a generic floating diamond+label, each object is drawn as a small
 * line-art icon of what it actually is (a mailbox on a post, a sword, a lantern,
 * a window with panes...) and tagged with where it belongs: on the floor, flat on
 * the ground, or mounted on a wall. Placement then puts floor items on the floor
 * and fixtures on walls — no more props hovering in mid-air.
 */
import { type Seg, line, rectXY, boxEdges, zigzag } from "./lineKit.ts";

export type IconKind = "floor" | "wall" | "flat";
export interface ObjectIcon {
  segs: Seg; // local coords: x right, y up, z 0 (front-facing)
  kind: IconKind;
  height: number; // for label placement
}

function poly(a: Seg, pts: [number, number][], close = true) {
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    line(a, p[0], p[1], 0, q[0], q[1], 0);
  }
  if (close && pts.length > 2) {
    const p = pts[pts.length - 1], q = pts[0];
    line(a, p[0], p[1], 0, q[0], q[1], 0);
  }
}

type Builder = () => ObjectIcon;

const ICONS: Record<string, Builder> = {
  mailbox: () => {
    const a: Seg = [];
    line(a, 0, 0, 0, 0, 0.7, 0); // post
    rectXY(a, -0.22, 0.7, 0.22, 1.02, 0); // body
    line(a, 0.22, 0.78, 0, 0.42, 0.78, 0); // flag pole
    poly(a, [[0.42, 0.78], [0.42, 0.95], [0.3, 0.86]]); // flag
    return { segs: a, kind: "floor", height: 1.05 };
  },
  door: () => {
    const a: Seg = [];
    rectXY(a, -0.45, 0, 0.45, 2.2, 0);
    line(a, 0.3, 1.0, 0, 0.3, 1.15, 0); // knob
    return { segs: a, kind: "wall", height: 2.2 };
  },
  window: () => {
    const a: Seg = [];
    rectXY(a, -0.5, 1.2, 0.5, 2.2, 0);
    line(a, 0, 1.2, 0, 0, 2.2, 0);
    line(a, -0.5, 1.7, 0, 0.5, 1.7, 0);
    return { segs: a, kind: "wall", height: 2.3 };
  },
  lantern: () => {
    const a: Seg = [];
    poly(a, [[-0.2, 0], [0.2, 0], [0.15, 0.5], [-0.15, 0.5]]);
    poly(a, [[-0.15, 0.5], [0, 0.7], [0.15, 0.5]], false); // handle
    line(a, 0, 0.1, 0, 0, 0.45, 0); // flame core
    return { segs: a, kind: "floor", height: 0.7 };
  },
  torch: () => {
    const a: Seg = [];
    line(a, 0, 0, 0, 0, 0.6, 0);
    zigzag(a, 0, 0.6, 0, 0.95, 0.12, 4);
    return { segs: a, kind: "floor", height: 0.95 };
  },
  sword: () => {
    const a: Seg = [];
    line(a, 0, 0.0, 0, 0, 0.18, 0); // pommel/hilt
    line(a, -0.18, 0.18, 0, 0.18, 0.18, 0); // crossguard
    poly(a, [[-0.06, 0.18], [0.06, 0.18], [0, 1.0]]); // blade
    return { segs: a, kind: "floor", height: 1.0 };
  },
  blade: () => {
    const a: Seg = [];
    line(a, -0.12, 0.1, 0, 0.12, 0.1, 0);
    poly(a, [[-0.05, 0.1], [0.05, 0.1], [0, 0.5]]);
    return { segs: a, kind: "floor", height: 0.5 };
  },
  rug: () => {
    const a: Seg = [];
    // flat rectangle drawn in XZ at ground level
    const w = 1.3, d = 0.9;
    line(a, -w, 0, -d, w, 0, -d); line(a, w, 0, -d, w, 0, d);
    line(a, w, 0, d, -w, 0, d); line(a, -w, 0, d, -w, 0, -d);
    for (let i = -2; i <= 2; i++) line(a, (i * w) / 3, 0, -d, (i * w) / 3, 0, d);
    return { segs: a, kind: "flat", height: 0.2 };
  },
  trophyCase: () => {
    const a: Seg = [];
    boxEdges(a, 0, 0.7, 0, 1.0, 1.4, 0.4);
    rectXY(a, -0.45, 0.5, 0.45, 0.5, 0); // shelves (approx in front plane)
    rectXY(a, -0.45, 1.0, 0.45, 1.0, 0);
    return { segs: a, kind: "floor", height: 1.4 };
  },
  bottle: () => {
    const a: Seg = [];
    poly(a, [
      [-0.12, 0], [0.12, 0], [0.12, 0.3], [0.06, 0.4],
      [0.06, 0.55], [-0.06, 0.55], [-0.06, 0.4], [-0.12, 0.3],
    ]);
    return { segs: a, kind: "floor", height: 0.55 };
  },
  sack: () => {
    const a: Seg = [];
    poly(a, [[-0.25, 0], [0.25, 0], [0.18, 0.45], [-0.18, 0.45]]);
    line(a, -0.18, 0.45, 0, 0.18, 0.45, 0); // cinch
    return { segs: a, kind: "floor", height: 0.5 };
  },
  book: () => {
    const a: Seg = [];
    poly(a, [[-0.25, 0.0], [0, 0.08], [0.25, 0.0], [0.25, 0.06], [0, 0.14], [-0.25, 0.06]]);
    line(a, 0, 0.08, 0, 0, 0.14, 0);
    return { segs: a, kind: "flat", height: 0.3 };
  },
  coffin: () => {
    const a: Seg = [];
    boxEdges(a, 0, 0.25, 0, 0.7, 0.5, 1.6);
    return { segs: a, kind: "floor", height: 0.6 };
  },
  skull: () => {
    const a: Seg = [];
    poly(a, [[0, 0.5], [0.25, 0.3], [0.15, 0.05], [-0.15, 0.05], [-0.25, 0.3]]);
    line(a, -0.15, 0.05, 0, 0.15, 0.05, 0);
    return { segs: a, kind: "floor", height: 0.5 };
  },
  egg: () => {
    const a: Seg = [];
    poly(a, [[0, 0.4], [0.18, 0.22], [0.14, 0.04], [-0.14, 0.04], [-0.18, 0.22]]);
    return { segs: a, kind: "floor", height: 0.4 };
  },
  boat: () => {
    const a: Seg = [];
    poly(a, [[-0.8, 0.3], [0.8, 0.3], [0.55, 0.0], [-0.55, 0.0]]);
    return { segs: a, kind: "floor", height: 0.4 };
  },
  grate: () => {
    const a: Seg = [];
    const s = 0.5;
    line(a, -s, 0.02, -s, s, 0.02, -s); line(a, s, 0.02, -s, s, 0.02, s);
    line(a, s, 0.02, s, -s, 0.02, s); line(a, -s, 0.02, s, -s, 0.02, -s);
    for (let i = -1; i <= 1; i++) {
      line(a, (i * s) / 2, 0.02, -s, (i * s) / 2, 0.02, s);
      line(a, -s, 0.02, (i * s) / 2, s, 0.02, (i * s) / 2);
    }
    return { segs: a, kind: "flat", height: 0.2 };
  },
  crate: () => {
    const a: Seg = [];
    boxEdges(a, 0, 0.25, 0, 0.5, 0.5, 0.5);
    line(a, -0.25, 0.25, 0.25, 0.25, 0.25, 0.25);
    return { segs: a, kind: "floor", height: 0.5 };
  },
};

const KEYWORDS: [RegExp, string][] = [
  [/mailbox/, "mailbox"],
  [/trophy|cabinet|case/, "trophyCase"],
  [/window/, "window"],
  [/door|trap-door|gate|slide/, "door"],
  [/lantern|lamp|brass/, "lantern"],
  [/torch|candle|match/, "torch"],
  [/sword|elvish/, "sword"],
  [/knife|axe|stiletto|rusty/, "blade"],
  [/rug|carpet/, "rug"],
  [/bottle|water|flask/, "bottle"],
  [/sack|bag|garlic|lunch/, "sack"],
  [/leaflet|book|paper|manual|guide|map|scroll/, "book"],
  [/coffin/, "coffin"],
  [/skeleton|bones|skull|body/, "skull"],
  [/egg|jewel|jewels|diamond|emerald|sapphire|ruby/, "egg"],
  [/boat|raft/, "boat"],
  [/grat|grate|grating|trap/, "grate"],
];

export function buildObjectIcon(id: string, name: string): ObjectIcon {
  const key = (id + " " + name).toLowerCase();
  for (const [re, icon] of KEYWORDS) {
    if (re.test(key)) return ICONS[icon]();
  }
  return ICONS.crate();
}
