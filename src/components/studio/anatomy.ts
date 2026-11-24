/**
 * The hand, built from anatomy rather than drawn as separate shapes.
 *
 * Each digit has a gently curved centre line (a quadratic Bezier from the
 * knuckle, or for the thumb from the wrist joint, to the fingertip) and a
 * width profile with joint bulges and a taper. One continuous silhouette is
 * then traced around the whole hand: wrist, thumb, the first web, each
 * finger with the webs between them, the little-finger side of the palm and
 * back to the wrist. Shading is clipped to that silhouette, so fingers and
 * palm are one surface with no seams.
 *
 * Coordinates are SVG user units; the framed view is VIEW in geometry.ts.
 */

export type Pt = [number, number];

export interface Digit {
  /** Knuckle (fingers) or wrist joint (thumb): where the centre line starts. */
  root: Pt;
  /** Degrees from vertical; negative leans left. */
  angle: number;
  len: number;
  /** Sideways bow of the centre line; positive bows towards the right. */
  bend: number;
  /** Half-widths along the centre line as [t, halfWidth], t from root (0) to tip (1). */
  widths: [number, number][];
  /** Joints, as t along the centre line: [middle, last] (thumb: [knuckle, last]). */
  joints: [number, number];
  /** Where the digit leaves the palm, as t (the web between fingers). */
  web: number;
}

/**
 * A right hand seen from the back, fingers relaxed and softly fanned.
 * Phalanges run about 1 : 0.6 : 0.45; the middle finger is longest, ring and
 * index nearly equal, the little finger ends near the ring finger's last joint.
 */
export const DIGITS: Digit[] = [
  // thumb: grows from the wrist, bows outwards, its pad (thenar) full at the base
  {
    root: [252, 700],
    angle: -33,
    len: 312,
    bend: -16,
    widths: [
      [0, 46],
      [0.22, 40],
      [0.42, 33.5],
      [0.58, 31],
      [0.74, 31],
      [0.88, 29],
      [1, 27],
    ],
    joints: [0.47, 0.76],
    web: 0.47,
  },
  // index
  {
    root: [238, 434],
    angle: -6,
    len: 268,
    bend: 5,
    widths: [
      [0, 26.5],
      [0.22, 24.6],
      [0.49, 23.6],
      [0.63, 21.6],
      [0.78, 21.4],
      [0.9, 20.8],
      [1, 20],
    ],
    joints: [0.49, 0.78],
    web: 0.27,
  },
  // middle
  {
    root: [291, 421],
    angle: -0.8,
    len: 298,
    bend: 1.5,
    widths: [
      [0, 27.5],
      [0.22, 25.6],
      [0.49, 24.6],
      [0.63, 22.6],
      [0.78, 22.3],
      [0.9, 21.6],
      [1, 20.8],
    ],
    joints: [0.49, 0.78],
    web: 0.26,
  },
  // ring
  {
    root: [343, 430],
    angle: 5,
    len: 280,
    bend: -3,
    widths: [
      [0, 25.5],
      [0.22, 23.8],
      [0.49, 22.9],
      [0.63, 21.1],
      [0.78, 20.8],
      [0.9, 20.2],
      [1, 19.4],
    ],
    joints: [0.49, 0.78],
    web: 0.27,
  },
  // little: grows from the palm's outer corner, lower than the ring finger
  // (the knuckles arc down), angled outwards as on a relaxed, open hand
  {
    root: [400, 477],
    angle: 20,
    len: 198,
    bend: -3,
    widths: [
      [0, 21.5],
      [0.22, 19.9],
      [0.49, 19],
      [0.63, 17.7],
      [0.78, 17.3],
      [0.9, 16.7],
      [1, 16],
    ],
    joints: [0.47, 0.77],
    web: 0.3,
  },
];

const rad = (deg: number) => (deg * Math.PI) / 180;
const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k];

/** The digit's centre line and its frame at any t. */
export function digitFrame(d: Digit) {
  const a = rad(d.angle);
  const dir: Pt = [Math.sin(a), -Math.cos(a)];
  const right: Pt = [Math.cos(a), Math.sin(a)];
  const tip = add(d.root, dir, d.len);
  const mid = add(add(d.root, dir, d.len / 2), right, d.bend * 2);
  const p0 = d.root;

  const at = (t: number): Pt => {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * mid[0] + t * t * tip[0], u * u * p0[1] + 2 * u * t * mid[1] + t * t * tip[1]];
  };
  const tangent = (t: number): Pt => {
    const x = 2 * (1 - t) * (mid[0] - p0[0]) + 2 * t * (tip[0] - mid[0]);
    const y = 2 * (1 - t) * (mid[1] - p0[1]) + 2 * t * (tip[1] - mid[1]);
    const l = Math.hypot(x, y);
    return [x / l, y / l];
  };
  const normal = (t: number): Pt => {
    const [x, y] = tangent(t);
    return [-y, x];
  };
  const halfWidth = (t: number) => {
    const w = d.widths;
    if (t <= w[0][0]) return w[0][1];
    for (let i = 1; i < w.length; i++) {
      if (t <= w[i][0]) {
        const [t0, h0] = w[i - 1];
        const [t1, h1] = w[i];
        const k = (t - t0) / (t1 - t0);
        // ease between stations so the contour has no kinks
        const s = k * k * (3 - 2 * k);
        return h0 + (h1 - h0) * s;
      }
    }
    return w[w.length - 1][1];
  };
  /** Angle (deg) of the centre line at t, for rotating things that sit on the digit. */
  const angleAt = (t: number) => {
    const [x, y] = tangent(t);
    return (Math.atan2(x, -y) * 180) / Math.PI;
  };
  return { at, tangent, normal, halfWidth, angleAt };
}

/** Contour points of one digit, from `from` on the left side, round the tip, down to `to` on the right. */
export function digitContour(d: Digit, from: number, to: number, step = 0.04) {
  const f = digitFrame(d);
  const capR = f.halfWidth(1);
  const capT = 1 - (capR * 0.92) / d.len;
  const left: Pt[] = [];
  for (let t = from; t < capT; t += step) left.push(add(f.at(t), f.normal(t), -f.halfWidth(t)));
  // Rounded, slightly flattened fingertip
  const c = f.at(capT);
  const n = f.normal(capT);
  const tg = f.tangent(capT);
  const r = f.halfWidth(capT);
  const cap: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const phi = Math.PI - (i / 10) * Math.PI;
    cap.push(add(add(c, n, r * Math.cos(phi)), tg, r * Math.sin(phi) * 0.96));
  }
  const right: Pt[] = [];
  for (let t = capT - step / 2; t > to; t -= step) right.push(add(f.at(t), f.normal(t), f.halfWidth(t)));
  right.push(add(f.at(to), f.normal(to), f.halfWidth(to)));
  return [...left, ...cap, ...right];
}

const r2 = (n: number) => Math.round(n * 10) / 10;

/** Smooth closed or open path through points (Catmull-Rom as cubic Beziers). */
export function smoothPath(points: Pt[], closed = true, tension = 1) {
  const n = points.length;
  const p = (i: number) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${r2(points[0][0])} ${r2(points[0][1])}`;
  const end = closed ? n : n - 1;
  for (let i = 0; i < end; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += ` C${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return closed ? d + ' Z' : d;
}

/** A web between two neighbouring fingers: a soft U a little below where they part. */
function web(a: Digit, b: Digit, uneven = false, ta = a.web): Pt[] {
  const fa = digitFrame(a);
  const fb = digitFrame(b);
  const pa = add(fa.at(ta), fa.normal(ta), fa.halfWidth(ta));
  const pb = add(fb.at(b.web), fb.normal(b.web), -fb.halfWidth(b.web));
  if (uneven) {
    // The fingers part at different heights (the little finger's knuckle sits lower):
    // the web's lowest point tucks just under the lower finger's edge.
    const [hi, lo] = pa[1] < pb[1] ? [pa, pb] : [pb, pa];
    return [[lo[0] + (hi[0] - lo[0]) * 0.3, lo[1] + 5]];
  }
  // Two points shape a rounded U rather than a slit.
  const low = Math.max(pa[1], pb[1]);
  const m: Pt = [(pa[0] + pb[0]) / 2, low + 7];
  const gap = Math.max(3, Math.abs(pb[0] - pa[0]) * 0.2);
  return [
    [m[0] - gap, m[1] - 1.5],
    [m[0] + gap, m[1] - 1.5],
  ];
}

/**
 * The ring finger parts from the little finger lower than from the middle
 * finger (the knuckles arc down), so its outer edge runs further down.
 */
export const RING_OUTER_WEB = 0.15;

/** The whole hand as one closed outline. */
export function handOutline(): string {
  const [thumb, index, middle, ring, little] = DIGITS;
  const ft = digitFrame(thumb);
  const fi = digitFrame(index);

  const pts: Pt[] = [];
  // Wrist, thumb side, rising into the thenar pad
  pts.push([238, 800], [230, 756]);
  pts.push(...digitContour(thumb, 0.08, thumb.web));
  // The first web: thumb to index, a broad concave sweep
  const thumbIn = add(ft.at(thumb.web), ft.normal(thumb.web), ft.halfWidth(thumb.web));
  const indexIn = add(fi.at(0.06), fi.normal(0.06), -fi.halfWidth(0.06));
  // The first web leaves the thumb heading into the palm, then sweeps up to the index finger.
  const pull: Pt = [(thumbIn[0] + indexIn[0]) / 2 + 36, thumbIn[1] - 18];
  for (let k = 1; k <= 4; k++) {
    const t = k / 5;
    const u = 1 - t;
    pts.push([
      u * u * thumbIn[0] + 2 * u * t * pull[0] + t * t * indexIn[0],
      u * u * thumbIn[1] + 2 * u * t * pull[1] + t * t * indexIn[1],
    ]);
  }
  pts.push(...digitContour(index, 0.06, index.web));
  pts.push(...web(index, middle));
  pts.push(...digitContour(middle, middle.web, middle.web));
  pts.push(...web(middle, ring));
  pts.push(...digitContour(ring, ring.web, RING_OUTER_WEB));
  pts.push(...web(ring, little, true, RING_OUTER_WEB));
  // The little finger's outer edge runs straight into the palm's outer corner
  pts.push(...digitContour(little, little.web, 0));
  // The outer palm (hypothenar): below the little finger's knuckle the edge eases
  // in slightly, swells around mid-palm, then narrows into the wrist
  // (evenly spaced points, so the curve joins the finger without a kink)
  pts.push([418.6, 497], [418.2, 511], [419, 526], [421.5, 547], [425, 571], [429.5, 598], [432.5, 628], [430, 684], [415, 739], [397, 784], [390, 800]);
  pts.push([310, 812]);
  return smoothPath(pts);
}

/** One digit's own outline (closed at its root), for shading and tap areas. */
export function digitOutline(d: Digit, from = 0) {
  return smoothPath(digitContour(d, from, from));
}

/** The nail's place on a digit: cuticle point and the digit's angle there. */
export function nailPlacement(d: Digit, nailW: number) {
  const f = digitFrame(d);
  const t = 1 - (nailW * 0.92) / d.len;
  const [x, y] = f.at(t);
  return { x, y, angle: f.angleAt(Math.min(1, t + 0.04)), t };
}

/** Nail width that suits a digit: about four fifths of a fingertip, a little less on the broad thumb. */
export const nailWidthFor = (d: Digit, thumb = false) => Math.round(digitFrame(d).halfWidth(0.9) * 2 * (thumb ? 0.74 : 0.8) * 10) / 10;

/** Short arcs across a digit at a joint, as wrinkle lines. */
export function jointCreases(d: Digit, t: number, count: number, spread = 3.4) {
  const f = digitFrame(d);
  const out: string[] = [];
  for (let k = 0; k < count; k++) {
    const tt = t + ((k - (count - 1) / 2) * spread) / d.len;
    const c = f.at(tt);
    const n = f.normal(tt);
    const tg = f.tangent(tt);
    const hw = f.halfWidth(tt) * (0.46 - Math.abs(k - (count - 1) / 2) * 0.1);
    const a = add(c, n, -hw);
    const b = add(c, n, hw);
    const m = add(c, tg, 2.2);
    out.push(`M${r2(a[0])} ${r2(a[1])} Q${r2(m[0])} ${r2(m[1])} ${r2(b[0])} ${r2(b[1])}`);
  }
  return out;
}

/** An open path along the centre line between two t values (for ridge light). */
export function centreLine(d: Digit, from: number, to: number) {
  const f = digitFrame(d);
  const pts: Pt[] = [];
  for (let t = from; t <= to + 1e-6; t += 0.05) pts.push(f.at(t));
  return smoothPath(pts, false);
}

/** A short upright fingertip for previews: same construction, smaller frame. */
export const PREVIEW_DIGIT: Digit = {
  root: [0, 0],
  angle: 0,
  len: 100,
  bend: 0,
  widths: [
    [0, 25],
    [0.6, 24.6],
    [1, 23.6],
  ],
  joints: [0.5, 0.78],
  web: 0,
};
