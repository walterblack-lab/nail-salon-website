/**
 * Hand and nail geometry. Coordinates are SVG user units in a 600 x 760 view.
 *
 * Each finger lives in its own local frame: the knuckle at (0, 0), the
 * fingertip at (0, -len). A nail lives in a frame of its own: cuticle at
 * (0, 0), free edge at (0, -L). Keeping these frames separate means one nail
 * renderer serves every finger, and patterns are drawn once per shape.
 */
import type { GemSpot, Shape } from './model';

/** The framed part of the drawing: the hand fills it, the wrist runs off the bottom. */
export const VIEW = { x: 20, y: 50, w: 480, h: 710 };

export interface FingerSpec {
  x: number; // knuckle position
  y: number;
  angle: number; // degrees from vertical; negative leans left
  len: number;
  /** Half-widths at the knuckle, the middle joint, between joints, the last joint and the pad. */
  widths: [number, number, number, number, number];
  nailW: number;
}

/** A right hand, back of the hand towards us, fingers relaxed and slightly fanned. */
export const FINGER_SPECS: FingerSpec[] = [
  // thumb
  { x: 220, y: 584, angle: -41, len: 206, widths: [44, 36, 32, 30.5, 28.5], nailW: 43 },
  // index
  { x: 226, y: 402, angle: -5, len: 246, widths: [31, 28, 26, 25.5, 24.5], nailW: 37 },
  // middle
  { x: 286, y: 384, angle: -0.5, len: 270, widths: [32, 29, 27, 26.5, 25.5], nailW: 39 },
  // ring
  { x: 345, y: 396, angle: 4.5, len: 252, widths: [30, 27.5, 25.5, 25, 24], nailW: 36.5 },
  // little
  { x: 398, y: 424, angle: 11.5, len: 196, widths: [26, 23.5, 22, 21.5, 20.5], nailW: 31 },
];

type Pt = [number, number];

/** Smooth path through points (Catmull-Rom converted to cubic Beziers). */
function smooth(points: Pt[], tension = 0.5) {
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2, p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2, p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

const f = (n: number) => Math.round(n * 100) / 100;

/** Finger outline in its local frame, extending a little below the knuckle so it tucks into the palm. */
export function fingerPath(spec: FingerSpec) {
  const { len, widths: w } = spec;
  // Stations along the finger (0 = knuckle, 1 = tip) and their half-widths.
  const stations: [number, number][] = [
    [-0.12, w[0] * 1.02],
    [0.08, w[0]],
    [0.42, w[1]], // middle joint, slightly fuller
    [0.58, w[2]],
    [0.74, w[3]], // last joint
    [0.88, w[4]],
  ];
  const left: Pt[] = stations.map(([t, hw]) => [-hw, -t * len]);
  const right: Pt[] = [...stations].reverse().map(([t, hw]) => [hw, -t * len]);
  const tipY = -len;
  const padW = w[4];
  const top = -0.88 * len;
  return (
    `M${f(left[0][0])} ${f(left[0][1])}` +
    smooth(left) +
    // Rounded fingertip: a soft, slightly flattened dome.
    ` C${f(-padW)} ${f(top - padW * 0.62)} ${f(-padW * 0.56)} ${f(tipY)} 0 ${f(tipY)}` +
    ` C${f(padW * 0.56)} ${f(tipY)} ${f(padW)} ${f(top - padW * 0.62)} ${f(padW)} ${f(top)}` +
    smooth(right) +
    ' Z'
  );
}

/** Where a finger's nail sits: the cuticle, in finger-local units. */
export function nailAnchor(spec: FingerSpec) {
  const bed = spec.nailW * 1.0;
  return { x: 0, y: -spec.len + bed * 0.9 };
}

/** Nail length (cuticle to free edge) for a nail of width w. */
export const nailLength = (w: number) => w * 1.78;

/**
 * Nail outline in the nail frame. Every shape uses the same seven cubic
 * segments, so the browser can morph between shapes with a `d` transition.
 */
export function nailPath(shape: Shape, w: number) {
  const h = w / 2;
  const L = nailLength(w);
  const c = w * 0.16; // depth of the cuticle curve
  const cx = h * 0.9;

  // Side shoulders and the free edge, per shape: [shoulderY, seg2 c1, seg2 c2, tipLeft, seg3 c1]
  const tips: Record<Shape, { s: number; a: Pt; b: Pt; t: Pt; m: Pt }> = {
    almond: { s: 0.5, a: [-h, 0.76], b: [-h * 0.42, 0.97], t: [-h * 0.12, 0.997], m: [-h * 0.04, 1.003] },
    oval: { s: 0.56, a: [-h, 0.84], b: [-h * 0.74, 1.0], t: [-h * 0.3, 1.0], m: [-h * 0.1, 1.004] },
    square: { s: 0.6, a: [-h * 1.005, 0.92], b: [-h * 0.98, 1.0], t: [-h * 0.78, 1.0], m: [-h * 0.3, 1.0] },
    coffin: { s: 0.48, a: [-h, 0.64], b: [-h * 0.64, 0.93], t: [-h * 0.5, 1.0], m: [-h * 0.2, 1.0] },
  };
  const k = tips[shape];
  const sy = -k.s * L;
  const P = (x: number, yFrac: number) => `${f(x)} ${f(-yFrac * L)}`;

  return [
    `M${f(-cx)} ${f(-c)}`,
    // left side up to the shoulder
    `C${f(-h)} ${f(-c - 0.12 * L)} ${f(-h)} ${f(sy * 0.6)} ${f(-h)} ${f(sy)}`,
    // shoulder to the left of the free edge
    `C${P(k.a[0], k.a[1])} ${P(k.b[0], k.b[1])} ${P(k.t[0], k.t[1])}`,
    // across the free edge
    `C${P(k.m[0], k.m[1])} ${P(-k.m[0], k.m[1])} ${P(-k.t[0], k.t[1])}`,
    // down to the right shoulder
    `C${P(-k.b[0], k.b[1])} ${P(-k.a[0], k.a[1])} ${f(h)} ${f(sy)}`,
    // right side down to the cuticle
    `C${f(h)} ${f(sy * 0.6)} ${f(h)} ${f(-c - 0.12 * L)} ${f(cx)} ${f(-c)}`,
    // the cuticle curve
    `C${f(h * 0.55)} ${f(c * 0.55)} ${f(-h * 0.55)} ${f(c * 0.55)} ${f(-cx)} ${f(-c)}`,
    'Z',
  ].join(' ');
}

/** Approximate usable half-width of a nail at a height (0 = cuticle, 1 = tip), for laying out stones. */
export function halfWidthAt(shape: Shape, w: number, t: number) {
  const h = w / 2;
  if (t < 0.55) return h * 0.88;
  const taper: Record<Shape, number> = { almond: 0.85, oval: 0.7, square: 0.1, coffin: 0.45 };
  return h * 0.88 * (1 - taper[shape] * ((t - 0.55) / 0.45) ** 1.6);
}

/** Centre of a decoration spot, as a fraction of the nail (x of half-width, y of length). */
export const SPOT_CENTRES: Record<GemSpot, { x: number; t: number }> = {
  cuticle: { x: 0, t: 0.2 },
  centre: { x: 0, t: 0.48 },
  tip: { x: 0, t: 0.76 },
  side: { x: 0.42, t: 0.42 },
};
