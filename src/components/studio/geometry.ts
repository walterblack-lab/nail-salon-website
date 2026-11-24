/**
 * Nail geometry. A nail lives in its own frame: cuticle at (0, 0), free edge
 * at (0, -L). The hand (anatomy.ts) places and rotates that frame on each
 * fingertip, so one nail renderer serves every finger and every shape.
 */
import type { GemSpot, Shape } from './model';

/** The framed part of the drawing: the hand fills it, the wrist runs off the bottom. */
export const VIEW = { x: 20, y: 50, w: 480, h: 710 };

const f = (n: number) => Math.round(n * 100) / 100;
type Pt = [number, number];

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
