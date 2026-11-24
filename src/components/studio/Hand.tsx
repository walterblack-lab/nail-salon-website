import { memo, useId, type CSSProperties, type Ref } from 'react';
import type { Manicure, NailDesign, Target } from './model';
import { nailLength, nailPath, VIEW } from './geometry';
import {
  centreLine,
  DIGITS,
  digitFrame,
  digitOutline,
  handOutline,
  jointCreases,
  nailPlacement,
  nailWidthFor,
  PREVIEW_DIGIT,
  RING_OUTER_WEB,
} from './anatomy';
import { Nail, StudioDefs } from './Nail';
import type { SkinTone } from './skin';

/* The hand never changes shape, so its geometry is computed once. */
const OUTLINE = handOutline();
const NAIL_W = DIGITS.map((d, i) => nailWidthFor(d, i === 0));
const PLACES = DIGITS.map((d, i) => nailPlacement(d, NAIL_W[i]));
const DIGIT_OUTLINES = DIGITS.map((d, i) => digitOutline(d, i === 0 ? 0.42 : d.web));
const RIDGES = DIGITS.map((d, i) => centreLine(d, i === 0 ? 0.12 : 0.04, 0.86));
const CREASES = DIGITS.map((d) => [...jointCreases(d, d.joints[0], 3), ...jointCreases(d, d.joints[1], 2, 2.8)]);
const FRAMES = DIGITS.map(digitFrame);

/** Webs between neighbouring fingers, where a soft shadow gathers. */
const WEBS = [1, 2, 3].map((i) => {
  const a = DIGITS[i];
  const b = DIGITS[i + 1];
  const pa = FRAMES[i].at(i === 3 ? RING_OUTER_WEB : a.web);
  const pb = FRAMES[i + 1].at(b.web);
  return { x: (pa[0] + pb[0]) / 2, y: (pa[1] + pb[1]) / 2 + 4, angle: (a.angle + b.angle) / 2 };
});

function SkinGradients({ g, skin }: { g: string; skin: SkinTone }) {
  return (
    <>
      <linearGradient id={`${g}-finger`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={skin.shadow} />
        <stop offset="0.22" stopColor={skin.mid} />
        <stop offset="0.5" stopColor={skin.light} />
        <stop offset="0.78" stopColor={skin.mid} />
        <stop offset="1" stopColor={skin.shadow} />
      </linearGradient>
      <radialGradient id={`${g}-palm`} gradientUnits="userSpaceOnUse" cx="300" cy="560" r="230">
        <stop offset="0" stopColor={skin.light} stopOpacity="0.9" />
        <stop offset="0.6" stopColor={skin.light} stopOpacity="0.25" />
        <stop offset="1" stopColor={skin.light} stopOpacity="0" />
      </radialGradient>
    </>
  );
}

type Ring = 'none' | 'selected' | 'all' | 'target' | 'source';

/** One nail on its digit: cuticle shading, the nail, its selection ring and a generous tap area. */
function NailOnDigit({
  index,
  design,
  g,
  skin,
  ring,
  onPick,
}: {
  index: number;
  design: NailDesign;
  g: string;
  skin: SkinTone;
  ring: Ring;
  onPick: (i: number) => void;
}) {
  const w = NAIL_W[index];
  const L = nailLength(w);
  const place = PLACES[index];
  const ringPath = nailPath(design.shape, w);
  return (
    <g
      className="ns-finger-nail is-pickable"
      data-ring={ring}
      style={{ '--i': index } as CSSProperties}
      transform={`translate(${place.x.toFixed(2)} ${place.y.toFixed(2)}) rotate(${place.angle.toFixed(2)})`}
      onClick={() => onPick(index)}
    >
      {/* Eponychium: skin a touch rosier and darker where it folds over the nail */}
      <path
        d={`M${-w * 0.5} ${-w * 0.22} C${-w * 0.32} ${w * 0.17} ${w * 0.32} ${w * 0.17} ${w * 0.5} ${-w * 0.22}`}
        fill="none"
        stroke={skin.crease}
        strokeWidth="3.2"
        opacity="0.45"
        filter={`url(#${g}-soft)`}
      />
      {/* Side walls: a faint shadow where the skin meets the nail's edges */}
      <path
        d={`M${-w * 0.55} ${-w * 0.08} L${-w * 0.55} ${-w * 0.58} M${w * 0.55} ${-w * 0.08} L${w * 0.55} ${-w * 0.58}`}
        stroke={skin.shadow}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.35"
        filter={`url(#${g}-soft)`}
      />
      <Nail design={design} w={w} p={`${g}-n${index}`} g={g} seed={index + 3} />
      <path
        className="ns-shape ns-ring"
        data-export="hide"
        d={ringPath}
        style={{ d: `path("${ringPath}")` } as CSSProperties}
        transform={`translate(0 ${-L / 2}) scale(1.24 1.16) translate(0 ${L / 2})`}
        vectorEffect="non-scaling-stroke"
      />
      <ellipse data-export="hide" className="ns-hit" cx="0" cy={-L * 0.42} rx={w * 1.0} ry={L * 0.78} />
    </g>
  );
}

interface HandProps {
  nails: Manicure;
  target: Target;
  skin: SkinTone;
  pasteFrom: number | null;
  onNailClick: (i: number) => void;
  label: string;
  svgRef?: Ref<SVGSVGElement>;
}

export const Hand = memo(function Hand({ nails, target, skin, pasteFrom, onNailClick, label, svgRef }: HandProps) {
  const g = 'nsh';
  const ringFor = (i: number): Ring => {
    if (pasteFrom !== null) return i === pasteFrom ? 'source' : 'target';
    if (target === 'all') return 'all';
    return target === i ? 'selected' : 'none';
  };

  return (
    <svg
      ref={svgRef}
      className="ns-hand"
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <StudioDefs g={g} />
        <SkinGradients g={g} skin={skin} />
        <clipPath id={`${g}-clip`}>
          <path d={OUTLINE} />
        </clipPath>
        <filter id={`${g}-drop`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#1d0f1c" floodOpacity="0.5" />
        </filter>
        <filter id={`${g}-rim`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${g}-wide`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <g filter={`url(#${g}-drop)`}>
        {/* One continuous skin surface */}
        <path d={OUTLINE} fill={skin.mid} />

        <g clipPath={`url(#${g}-clip)`}>
          {/* Light falls on the back of the hand from above */}
          <rect x="120" y="330" width="380" height="470" fill={`url(#${g}-palm)`} />

          {/* Each digit is a rounded form: light along its ridge */}
          <g fill="none" stroke={skin.light} strokeLinecap="round" filter={`url(#${g}-softer)`}>
            {RIDGES.map((d, i) => (
              <path key={i} d={d} strokeWidth={DIGITS[i].widths[2][1] * (i === 0 ? 1 : 0.95)} opacity={i === 0 ? 0.45 : 0.55} />
            ))}
          </g>

          {/* Thumb pad and the tendons fanning from the wrist */}
          <ellipse cx="214" cy="640" rx="34" ry="62" fill={skin.light} opacity="0.4" transform="rotate(-30 214 640)" filter={`url(#${g}-wide)`} />
          <g stroke={skin.light} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.2" filter={`url(#${g}-softer)`}>
            {DIGITS.slice(1).map((d, i) => (
              <path key={i} d={`M${d.root[0]} ${d.root[1] + 22} Q${(d.root[0] + 306) / 2} ${(d.root[1] + 700) / 2} ${300 + (i - 1.5) * 13} 790`} />
            ))}
          </g>

          {/* Knuckles: a soft rise over each joint, small hollows between */}
          <g fill={skin.light} opacity="0.34" filter={`url(#${g}-softer)`}>
            {DIGITS.slice(1).map((d, i) => (
              <ellipse key={i} cx={d.root[0]} cy={d.root[1] + 6} rx="14" ry="10" transform={`rotate(${d.angle} ${d.root[0]} ${d.root[1] + 6})`} />
            ))}
          </g>
          <g fill={skin.shadow} opacity="0.45" filter={`url(#${g}-softer)`}>
            {WEBS.map((w, i) => (
              <ellipse key={i} cx={w.x} cy={w.y} rx="7" ry="17" transform={`rotate(${w.angle} ${w.x} ${w.y})`} />
            ))}
          </g>

          {/* Joint creases: faint, short, the way they look on a cared-for hand */}
          <g fill="none" stroke={skin.crease} strokeWidth="0.9" strokeLinecap="round" opacity="0.32" filter={`url(#${g}-hair)`}>
            {CREASES.map((list, i) => list.map((d, k) => <path key={`${i}-${k}`} d={d} />))}
          </g>

          {/* Warmth in the fingertips */}
          <g fill="#e0807d" opacity="0.14" filter={`url(#${g}-softer)`}>
            {DIGITS.map((_, i) => {
              const [x, y] = FRAMES[i].at(0.94);
              const r = FRAMES[i].halfWidth(0.94);
              return <circle key={i} cx={x} cy={y} r={r * 0.85} />;
            })}
          </g>

          {/* Turning edges: every contour darkens as it rounds away from the light */}
          <path d={OUTLINE} fill="none" stroke={skin.shadow} strokeWidth="20" opacity="0.85" filter={`url(#${g}-rim)`} />
          <path d={OUTLINE} fill="none" stroke={skin.crease} strokeWidth="2.2" opacity="0.35" filter={`url(#${g}-hair)`} />
        </g>

        {/* Tapping anywhere on a finger picks its nail */}
        <g data-export="hide">
          {DIGIT_OUTLINES.map((d, i) => (
            <path key={i} d={d} className="ns-finger-hit" onClick={() => onNailClick(i)} />
          ))}
        </g>

        {DIGITS.map((_, i) => (
          <NailOnDigit key={i} index={i} design={nails[i]} g={g} skin={skin} ring={ringFor(i)} onPick={onNailClick} />
        ))}
      </g>
    </svg>
  );
});

/** A single nail on a fingertip, for option tiles and the nail selector. */
const PREVIEW_W = 36;
const PREVIEW_OUTLINE = digitOutline(PREVIEW_DIGIT, -0.2);
const PREVIEW_PLACE = nailPlacement(PREVIEW_DIGIT, PREVIEW_W);

export const NailPreview = memo(function NailPreview({
  design,
  skin,
  showGems = true,
  seed = 1,
}: {
  design: NailDesign;
  skin: SkinTone;
  showGems?: boolean;
  seed?: number;
}) {
  const g = 'nsp' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg className="ns-preview" viewBox="-34 -140 68 112" aria-hidden="true" focusable="false">
      <defs>
        <StudioDefs g={g} />
        <SkinGradients g={g} skin={skin} />
        <linearGradient id={`${g}-stubfade`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.45" stopColor="#fff" />
        </linearGradient>
        <mask id={`${g}-stub`} maskUnits="userSpaceOnUse" x="-40" y="-140" width="80" height="112">
          <rect x="-40" y="-140" width="80" height="112" fill={`url(#${g}-stubfade)`} />
        </mask>
      </defs>
      <path d={PREVIEW_OUTLINE} fill={`url(#${g}-finger)`} mask={`url(#${g}-stub)`} />
      <g transform={`translate(0 ${PREVIEW_PLACE.y.toFixed(2)})`}>
        <Nail design={design} w={PREVIEW_W} p={`${g}-n`} g={g} showGems={showGems} seed={seed} />
      </g>
    </svg>
  );
});

