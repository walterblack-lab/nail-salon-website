import { memo, useId, type CSSProperties, type Ref } from 'react';
import type { Manicure, NailDesign, Target } from './model';
import { FINGER_SPECS, fingerPath, nailAnchor, nailLength, nailPath, VIEW, type FingerSpec } from './geometry';
import { Nail, StudioDefs } from './Nail';
import type { SkinTone } from './skin';

/** The palm and back of the hand, wrist running off the bottom edge. */
const PALM =
  'M236 800 C228 724 214 668 196 636 C182 612 176 560 182 500 C186 450 192 412 204 390' +
  ' C232 360 300 352 350 366 C392 378 424 398 430 430 C438 480 432 560 420 620 C408 690 392 744 384 800 Z';

const FINGER_PATHS = FINGER_SPECS.map(fingerPath);

/** Draw order: thumb first, middle finger last so it sits on top where knuckles meet. */
const ORDER = [0, 4, 3, 1, 2];

function SkinGradients({ g, skin }: { g: string; skin: SkinTone }) {
  return (
    <>
      <linearGradient id={`${g}-finger`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={skin.shadow} />
        <stop offset="0.2" stopColor={skin.mid} />
        <stop offset="0.5" stopColor={skin.light} />
        <stop offset="0.8" stopColor={skin.mid} />
        <stop offset="1" stopColor={skin.shadow} />
      </linearGradient>
      <radialGradient id={`${g}-palm`} cx="0.5" cy="0.28" r="0.8">
        <stop offset="0" stopColor={skin.light} />
        <stop offset="0.55" stopColor={skin.mid} />
        <stop offset="1" stopColor={skin.shadow} />
      </radialGradient>
    </>
  );
}

/** A finger in its local frame: skin, joint creases, the fingertip's warmth and the nail. */
function Finger({
  spec,
  path,
  index,
  design,
  g,
  skin,
  ring,
  onPick,
}: {
  spec: FingerSpec;
  path: string;
  index: number;
  design: NailDesign;
  g: string;
  skin: SkinTone;
  ring: 'none' | 'selected' | 'all' | 'target' | 'source';
  onPick?: (i: number) => void;
}) {
  const { len, widths } = spec;
  const anchor = nailAnchor(spec);
  const w = spec.nailW;
  const L = nailLength(w);
  const ringPath = nailPath(design.shape, w);
  const crease = (t: number, hw: number, n: number) =>
    Array.from({ length: n }, (_, k) => {
      const y = -t * len - k * 3.2;
      const s = hw * (0.55 - k * 0.12);
      return <path key={`${t}-${k}`} d={`M${-s} ${y + 1.2} Q0 ${y - 2.2} ${s} ${y + 1.2}`} />;
    });

  return (
    <g transform={`translate(${spec.x} ${spec.y}) rotate(${spec.angle})`}>
      <mask id={`${g}-fade-${index}`} maskUnits="userSpaceOnUse" x={-90} y={-len - 90} width={180} height={len + 160}>
        <linearGradient id={`${g}-fadeg-${index}`} gradientUnits="userSpaceOnUse" x1="0" y1={len * 0.12} x2="0" y2={-len * 0.1}>
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <rect x={-90} y={-len - 90} width={180} height={len + 160} fill={`url(#${g}-fadeg-${index})`} />
      </mask>

      <g mask={`url(#${g}-fade-${index})`}>
        <path d={path} fill={`url(#${g}-finger)`} />
        {/* Warmth at the fingertip and a soft light down the ridge */}
        <ellipse cx="0" cy={-len * 0.9} rx={widths[4] * 0.8} ry={widths[4] * 0.9} fill="#e07d7d" opacity="0.12" filter={`url(#${g}-softer)`} />
        <path
          d={`M${-widths[2] * 0.15} ${-len * 0.12} L${-widths[3] * 0.12} ${-len * 0.8}`}
          stroke={skin.light}
          strokeWidth={widths[2] * 0.5}
          strokeLinecap="round"
          opacity="0.35"
          filter={`url(#${g}-softer)`}
        />
        <g fill="none" stroke={skin.crease} strokeWidth="1.1" strokeLinecap="round" opacity="0.42" filter={`url(#${g}-hair)`}>
          {crease(0.4, widths[1], 3)}
          {crease(0.73, widths[3], 2)}
        </g>
      </g>

      <g
        className={`ns-finger-nail${onPick ? ' is-pickable' : ''}`}
        data-ring={ring}
        style={{ '--i': index } as CSSProperties}
        transform={`translate(${anchor.x} ${anchor.y})`}
        onClick={onPick ? () => onPick(index) : undefined}
      >
        {/* Cuticle fold: the skin is a touch darker and rosier where it meets the nail */}
        <path
          d={`M${-w * 0.47} ${-w * 0.2} C${-w * 0.3} ${w * 0.16} ${w * 0.3} ${w * 0.16} ${w * 0.47} ${-w * 0.2}`}
          fill="none"
          stroke={skin.crease}
          strokeWidth="3"
          opacity="0.5"
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
  const ringFor = (i: number) => {
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
        <filter id={`${g}-drop`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#1d0f1c" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter={`url(#${g}-drop)`}>
        <path d={PALM} fill={`url(#${g}-palm)`} />
        {/* Tendons and knuckles: the faint relief on the back of a hand */}
        <g stroke={skin.light} strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.22" filter={`url(#${g}-softer)`}>
          {FINGER_SPECS.slice(1).map((s, i) => (
            <path key={i} d={`M${s.x} ${s.y + 24} Q${(s.x + 306) / 2} ${(s.y + 700) / 2} ${306 + (i - 1.5) * 12} 790`} />
          ))}
        </g>
        <g fill={skin.shadow} opacity="0.28" filter={`url(#${g}-softer)`}>
          {[0, 1, 2].map((i) => {
            const a = FINGER_SPECS[i + 1];
            const b = FINGER_SPECS[i + 2];
            return <ellipse key={i} cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2 + 22} rx="9" ry="16" />;
          })}
        </g>

        {ORDER.map((i) => (
          <Finger
            key={i}
            spec={FINGER_SPECS[i]}
            path={FINGER_PATHS[i]}
            index={i}
            design={nails[i]}
            g={g}
            skin={skin}
            ring={ringFor(i)}
            onPick={onNailClick}
          />
        ))}

        {/* Knuckle highlights sit over the finger bases */}
        <g fill={skin.light} opacity="0.4" filter={`url(#${g}-softer)`}>
          {FINGER_SPECS.slice(1).map((s, i) => (
            <ellipse key={i} cx={s.x + 2} cy={s.y + 10} rx="15" ry="10" />
          ))}
        </g>
      </g>
    </svg>
  );
});

/** A single nail on a fingertip, for option tiles and the nail selector. */
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
  const spec: FingerSpec = { x: 0, y: 0, angle: 0, len: 100, widths: [25, 25, 25, 24.5, 24], nailW: 36 };
  const anchor = nailAnchor(spec);
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
      <path d={fingerPath(spec)} fill={`url(#${g}-finger)`} mask={`url(#${g}-stub)`} />
      <g transform={`translate(0 ${anchor.y})`}>
        <Nail design={design} w={spec.nailW} p={`${g}-n`} g={g} showGems={showGems} seed={seed} />
      </g>
    </svg>
  );
});
