import { memo, type CSSProperties, type ReactNode } from 'react';
import type { Art, Finish, Gem, GemKind, NailDesign, Shape } from './model';
import { halfWidthAt, nailLength, nailPath, SPOT_CENTRES } from './geometry';
import { darken, lighten, luminance, mix, seeded } from './colour';

/**
 * Shared SVG definitions (filters and gemstone gradients). Each <svg> that
 * draws nails includes this once and passes its prefix to the nails.
 */
export function StudioDefs({ g }: { g: string }) {
  return (
    <>
      <filter id={`${g}-soft`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.2" />
      </filter>
      <filter id={`${g}-softer`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={`${g}-hair`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.35" />
      </filter>
      {/* Fine grain for matte polish */}
      <filter id={`${g}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
      </filter>

      {/* Curvature: a nail is a shallow arch, darker where it turns away from the light */}
      <linearGradient id={`${g}-curve`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1a0d16" stopOpacity="0.38" />
        <stop offset="0.2" stopColor="#1a0d16" stopOpacity="0.06" />
        <stop offset="0.55" stopColor="#1a0d16" stopOpacity="0" />
        <stop offset="0.85" stopColor="#1a0d16" stopOpacity="0.1" />
        <stop offset="1" stopColor="#1a0d16" stopOpacity="0.34" />
      </linearGradient>
      <linearGradient id={`${g}-sheen`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
      </linearGradient>

      {/* Gemstones */}
      <radialGradient id={`${g}-rhine`} cx="0.38" cy="0.34" r="0.75">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.35" stopColor="#eef3fb" />
        <stop offset="0.7" stopColor="#b9c3d6" />
        <stop offset="1" stopColor="#7e88a0" />
      </radialGradient>
      <linearGradient id={`${g}-crystal`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.3" stopColor="#f6dcef" />
        <stop offset="0.55" stopColor="#d9d2fb" />
        <stop offset="0.8" stopColor="#c9efe6" />
        <stop offset="1" stopColor="#9a8fc0" />
      </linearGradient>
      <radialGradient id={`${g}-pearl`} cx="0.36" cy="0.32" r="0.78">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.38" stopColor="#fbf3ea" />
        <stop offset="0.78" stopColor="#e6d6c8" />
        <stop offset="1" stopColor="#c9b2a6" />
      </radialGradient>
      <radialGradient id={`${g}-gold`} cx="0.36" cy="0.32" r="0.8">
        <stop offset="0" stopColor="#fff6d6" />
        <stop offset="0.35" stopColor="#f0cf7d" />
        <stop offset="0.75" stopColor="#bf8b34" />
        <stop offset="1" stopColor="#7a5418" />
      </radialGradient>
      {[
        ['rose', '#f7c6d2', '#d56f8c', '#8e2f4d'],
        ['jade', '#cdeedd', '#5fa585', '#235e45'],
        ['amethyst', '#e5d6ff', '#9a74d6', '#4c2a7c'],
      ].map(([name, a, b, c]) => (
        <radialGradient key={name} id={`${g}-stone-${name}`} cx="0.4" cy="0.34" r="0.8">
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </radialGradient>
      ))}
    </>
  );
}

interface NailProps {
  design: NailDesign;
  /** Nail width in user units. */
  w: number;
  /** Unique prefix for this nail's own ids. */
  p: string;
  /** Prefix of the surrounding <StudioDefs>. */
  g: string;
  /** Seed for glitter, so each nail sparkles differently. */
  seed?: number;
  /** Draw decorations (off for shape and finish previews). */
  showGems?: boolean;
}

/** One nail, drawn in the nail frame: cuticle at (0, 0), free edge at (0, -L). */
export const Nail = memo(function Nail({ design, w, p, g, seed = 1, showGems = true }: NailProps) {
  const L = nailLength(w);
  const h = w / 2;
  const d = nailPath(design.shape, w);
  const shapeStyle = { d: `path("${d}")` } as CSSProperties;
  const box = { x: -h - 2, y: -L - 2, width: w + 4, height: L + 8 };

  return (
    <g className="ns-nail">
      <defs>
        <clipPath id={`${p}-clip`}>
          <path className="ns-shape" d={d} style={shapeStyle} />
        </clipPath>
        <FinishDefs finish={design.finish} colour={design.colour} p={p} />
        {design.art === 'ombre' && (
          <linearGradient id={`${p}-ombre`} gradientUnits="userSpaceOnUse" x1="0" y1={-0.18 * L} x2="0" y2={-0.92 * L}>
            <stop offset="0" stopColor={design.artColour} stopOpacity="0" />
            <stop offset="1" stopColor={design.artColour} stopOpacity="1" />
          </linearGradient>
        )}
      </defs>

      {/* Contact shadow where the nail meets skin and the background */}
      <path
        className="ns-shape"
        d={d}
        style={shapeStyle}
        fill="#2a1420"
        opacity="0.32"
        transform="translate(0 1.6)"
        filter={`url(#${g}-soft)`}
      />

      <g clipPath={`url(#${p}-clip)`}>
        <FinishBase finish={design.finish} colour={design.colour} p={p} g={g} box={box} w={w} L={L} seed={seed} />
        <ArtLayer art={design.art} w={w} L={L} colour={design.artColour} base={design.colour} p={p} d={d} shapeStyle={shapeStyle} />
        <rect {...box} fill={`url(#${g}-curve)`} />
        <TopCoat finish={design.finish} w={w} L={L} g={g} box={box} />
      </g>

      {/* A hairline edge so pale polish still reads against pale skin */}
      <path
        className="ns-shape"
        d={d}
        style={shapeStyle}
        fill="none"
        stroke="#3b1f2e"
        strokeOpacity={luminance(design.colour) > 0.55 ? 0.28 : 0.16}
        strokeWidth="0.7"
      />

      {showGems && design.gems.length > 0 && <Gems gems={design.gems} shape={design.shape} w={w} L={L} g={g} />}
    </g>
  );
});

/* ------------------------------------------------------------------
   Finishes
------------------------------------------------------------------- */

function FinishDefs({ finish, colour, p }: { finish: Finish; colour: string; p: string }) {
  if (finish === 'chrome') {
    return (
      <linearGradient id={`${p}-chrome`} x1="0" y1="0.05" x2="1" y2="0.95">
        <stop offset="0" stopColor={lighten(colour, 0.7)} />
        <stop offset="0.18" stopColor={lighten(colour, 0.15)} />
        <stop offset="0.36" stopColor={darken(colour, 0.45)} />
        <stop offset="0.5" stopColor={lighten(colour, 0.82)} />
        <stop offset="0.62" stopColor={mix(colour, '#ffffff', 0.3)} />
        <stop offset="0.8" stopColor={darken(colour, 0.35)} />
        <stop offset="1" stopColor={lighten(colour, 0.55)} />
      </linearGradient>
    );
  }
  if (finish === 'pearl') {
    return (
      // An iridescent band across the nail; the polish itself keeps its colour.
      <linearGradient id={`${p}-pearl`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0.12" stopColor="#ffd9e6" stopOpacity="0" />
        <stop offset="0.36" stopColor="#ffd9e6" stopOpacity="0.3" />
        <stop offset="0.5" stopColor="#e3dcff" stopOpacity="0.36" />
        <stop offset="0.64" stopColor="#d6f3ea" stopOpacity="0.28" />
        <stop offset="0.88" stopColor="#fff1d6" stopOpacity="0" />
      </linearGradient>
    );
  }
  if (finish === 'catEye') {
    const glow = luminance(colour) < 0.08 ? '#d8d4e6' : lighten(colour, 0.62);
    return (
      <>
        <linearGradient id={`${p}-cat`} x1="0" y1="0.85" x2="1" y2="0.15">
          <stop offset="0.2" stopColor={glow} stopOpacity="0" />
          <stop offset="0.47" stopColor={glow} stopOpacity="0.9" />
          <stop offset="0.53" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.8" stopColor={glow} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${p}-catbase`} cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor={darken(colour, 0.2)} />
          <stop offset="1" stopColor={darken(colour, 0.62)} />
        </radialGradient>
      </>
    );
  }
  return null;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function FinishBase(props: { finish: Finish; colour: string; p: string; g: string; box: Box; w: number; L: number; seed: number }) {
  const { finish, colour, p, g, box, w, L, seed } = props;
  switch (finish) {
    case 'chrome':
      return <rect {...box} fill={`url(#${p}-chrome)`} />;
    case 'pearl':
      return (
        <>
          <rect {...box} className="ns-paint" fill={colour} />
          <rect {...box} fill={`url(#${p}-pearl)`} />
          <ellipse cx={-w * 0.05} cy={-L * 0.52} rx={w * 0.36} ry={L * 0.3} fill={lighten(colour, 0.5)} opacity="0.4" filter={`url(#${g}-softer)`} />
        </>
      );
    case 'catEye':
      return (
        <>
          <rect {...box} fill={`url(#${p}-catbase)`} />
          <rect {...box} fill={`url(#${p}-cat)`} filter={`url(#${g}-soft)`} />
        </>
      );
    case 'glitter':
      return (
        <>
          <rect {...box} className="ns-paint" fill={colour} />
          <Glitter w={w} L={L} colour={colour} seed={seed} />
        </>
      );
    case 'matte':
      return (
        <>
          <rect {...box} className="ns-paint" fill={colour} />
          <rect {...box} fill="#fff" opacity="0.06" />
          <rect {...box} filter={`url(#${g}-grain)`} opacity="0.16" />
        </>
      );
    default:
      return <rect {...box} className="ns-paint" fill={colour} />;
  }
}

function Glitter({ w, L, colour, seed }: { w: number; L: number; colour: string; seed: number }) {
  const rnd = seeded(seed * 9301 + Math.round(w * 10));
  const count = Math.round((w * L) / 22);
  const tones = ['#ffffff', lighten(colour, 0.65), '#f3d48b', lighten(colour, 0.35), '#ffffff'];
  const flecks: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rnd() - 0.5) * w;
    const y = -rnd() * L;
    const s = 0.45 + rnd() ** 2 * 1.5;
    const tone = tones[Math.floor(rnd() * tones.length)];
    flecks.push(
      <rect
        key={i}
        x={x - s / 2}
        y={y - s / 2}
        width={s}
        height={s}
        fill={tone}
        opacity={0.45 + rnd() * 0.55}
        transform={`rotate(${Math.round(rnd() * 90)} ${x.toFixed(1)} ${y.toFixed(1)})`}
      />,
    );
  }
  return <g>{flecks}</g>;
}

function TopCoat({ finish, w, L, g, box }: { finish: Finish; w: number; L: number; g: string; box: Box }) {
  if (finish === 'matte') {
    return <ellipse cx={-w * 0.12} cy={-L * 0.55} rx={w * 0.4} ry={L * 0.36} fill="#fff" opacity="0.1" filter={`url(#${g}-softer)`} />;
  }
  const strength = finish === 'chrome' ? 0.95 : finish === 'pearl' ? 0.55 : 0.78;
  // A long window reflection down the left side, and a smaller one opposite.
  const streak =
    `M${-w * 0.3} ${-L * 0.16} C${-w * 0.38} ${-L * 0.42} ${-w * 0.33} ${-L * 0.66} ${-w * 0.17} ${-L * 0.86}` +
    ` C${-w * 0.23} ${-L * 0.66} ${-w * 0.25} ${-L * 0.42} ${-w * 0.2} ${-L * 0.17} Z`;
  return (
    <>
      <rect {...box} fill={`url(#${g}-sheen)`} />
      <path d={streak} fill="#fff" opacity={strength} filter={`url(#${g}-hair)`} />
      <ellipse cx={w * 0.24} cy={-L * 0.3} rx={w * 0.045} ry={L * 0.09} fill="#fff" opacity={strength * 0.45} filter={`url(#${g}-hair)`} />
      {finish === 'chrome' && (
        <path
          d={`M${w * 0.18} ${-L * 0.55} C${w * 0.26} ${-L * 0.68} ${w * 0.22} ${-L * 0.8} ${w * 0.12} ${-L * 0.9}`}
          stroke="#fff"
          strokeWidth={w * 0.05}
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
          filter={`url(#${g}-hair)`}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------
   Nail art. Everything here is clipped to the nail outline.
------------------------------------------------------------------- */

function heart(cx: number, cy: number, s: number) {
  return (
    `M${cx} ${cy + s * 0.9} C${cx - s * 1.5} ${cy - s * 0.1} ${cx - s * 0.75} ${cy - s * 1.25} ${cx} ${cy - s * 0.45}` +
    ` C${cx + s * 0.75} ${cy - s * 1.25} ${cx + s * 1.5} ${cy - s * 0.1} ${cx} ${cy + s * 0.9} Z`
  );
}

function Flower({ cx, cy, r, colour, centre }: { cx: number; cy: number; r: number; colour: string; centre: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={cx} cy={cy - r * 0.62} rx={r * 0.42} ry={r * 0.62} fill={colour} transform={`rotate(${a} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.3} fill={centre} />
    </g>
  );
}

interface ArtProps {
  art: Art;
  w: number;
  L: number;
  colour: string;
  base: string;
  p: string;
  d: string;
  shapeStyle: CSSProperties;
}

function ArtLayer({ art, w, L, colour, base, p, d, shapeStyle }: ArtProps) {
  const h = w / 2;
  switch (art) {
    case 'none':
      return null;
    case 'french':
      return (
        <path
          d={`M${-h * 1.4} ${-L * 0.5} Q0 ${-L * 0.86} ${h * 1.4} ${-L * 0.5} L${h * 1.4} ${-L * 1.2} L${-h * 1.4} ${-L * 1.2} Z`}
          fill={colour}
        />
      );
    case 'reverseFrench':
      return (
        <path
          d={`M${-h * 1.3} ${-L * 0.02} C${-h * 0.75} ${-L * 0.34} ${h * 0.75} ${-L * 0.34} ${h * 1.3} ${-L * 0.02} L${h * 1.3} ${L * 0.2} L${-h * 1.3} ${L * 0.2} Z`}
          fill={colour}
        />
      );
    case 'microFrench':
      // Stroke the nail outline itself: the nail clip keeps the inner half, and
      // a second clip keeps only the free edge, so the line follows every shape.
      return (
        <g>
          <defs>
            <clipPath id={`${p}-upper`}>
              <path d={`M${-h * 1.4} ${-L * 0.64} Q0 ${-L * 0.8} ${h * 1.4} ${-L * 0.64} L${h * 1.4} ${-L * 1.2} L${-h * 1.4} ${-L * 1.2} Z`} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${p}-upper)`}>
            <path className="ns-shape" d={d} style={shapeStyle} fill="none" stroke={colour} strokeWidth={w * 0.2} />
          </g>
        </g>
      );
    case 'ombre':
      return <rect x={-h - 2} y={-L - 2} width={w + 4} height={L + 6} fill={`url(#${p}-ombre)`} />;
    case 'dots': {
      const r = w * 0.075;
      const step = w * 0.3;
      const dots: ReactNode[] = [];
      let row = 0;
      for (let y = -L * 0.16; y > -L * 1.05; y -= step * 0.86, row++) {
        for (let x = -h - step; x < h + step; x += step) {
          dots.push(<circle key={`${row}-${x.toFixed(1)}`} cx={x + (row % 2 ? step / 2 : 0)} cy={y} r={r} fill={colour} />);
        }
      }
      return <g>{dots}</g>;
    }
    case 'stripes': {
      const lines: ReactNode[] = [];
      const gap = w * 0.27;
      for (let i = -6; i <= 6; i++) {
        const x = i * gap;
        lines.push(
          <line key={i} x1={x - L * 0.3} y1={2} x2={x + L * 0.3} y2={-L - 2} stroke={colour} strokeWidth={w * 0.07} />,
        );
      }
      return <g>{lines}</g>;
    }
    case 'hearts':
      return (
        <g fill={colour}>
          <path d={heart(w * 0.04, -L * 0.6, w * 0.2)} />
          <path d={heart(-w * 0.2, -L * 0.3, w * 0.1)} />
          <path d={heart(w * 0.2, -L * 0.84, w * 0.085)} />
        </g>
      );
    case 'flowers': {
      const centre = luminance(colour) > 0.5 && colour.toLowerCase() !== '#f4b84a' ? '#f4b84a' : '#fbf7f2';
      return (
        <g>
          <Flower cx={w * 0.1} cy={-L * 0.64} r={w * 0.25} colour={colour} centre={centre} />
          <Flower cx={-w * 0.24} cy={-L * 0.3} r={w * 0.15} colour={colour} centre={centre} />
          <circle cx={w * 0.26} cy={-L * 0.34} r={w * 0.045} fill={colour} />
          <circle cx={-w * 0.12} cy={-L * 0.88} r={w * 0.035} fill={colour} />
        </g>
      );
    }
    case 'abstract': {
      const second = mix(colour, base, 0.45);
      return (
        <g>
          <path
            d={`M${-h * 1.2} ${-L * 0.42} C${-h * 0.4} ${-L * 0.36} ${-h * 0.1} ${-L * 0.62} ${h * 0.5} ${-L * 0.56} C${h} ${-L * 0.52} ${h * 1.2} ${-L * 0.7} ${h * 1.3} ${-L * 0.8} L${h * 1.3} ${-L * 1.2} L${-h * 1.2} ${-L * 1.2} Z`}
            fill={second}
          />
          <path
            d={`M${-h * 1.2} ${-L * 0.05} C${-h * 0.2} ${-L * 0.1} ${-h * 0.5} ${-L * 0.32} ${h * 0.25} ${-L * 0.3} C${h * 0.7} ${-L * 0.29} ${h * 0.9} ${-L * 0.18} ${h * 1.3} ${-L * 0.22} L${h * 1.3} ${L * 0.2} L${-h * 1.2} ${L * 0.2} Z`}
            fill={colour}
          />
          <path
            d={`M${-h * 1.2} ${-L * 0.7} C${-h * 0.3} ${-L * 0.66} ${h * 0.1} ${-L * 0.86} ${h * 1.2} ${-L * 0.98}`}
            stroke="#d6ad5f"
            strokeWidth={w * 0.035}
            fill="none"
          />
          <circle cx={h * 0.45} cy={-L * 0.42} r={w * 0.06} fill="#d6ad5f" />
        </g>
      );
    }
    case 'swirls':
      return (
        <g fill="none" strokeLinecap="round">
          <path
            d={`M${-h * 0.9} ${L * 0.05} C${-h * 1.1} ${-L * 0.25} ${h * 0.6} ${-L * 0.3} ${h * 0.2} ${-L * 0.55} C${-h * 0.2} ${-L * 0.8} ${h * 0.9} ${-L * 0.85} ${h * 0.5} ${-L * 1.05}`}
            stroke={colour}
            strokeWidth={w * 0.09}
          />
          <path
            d={`M${h * 0.2} ${L * 0.05} C${h * 0.6} ${-L * 0.2} ${-h * 1.1} ${-L * 0.42} ${-h * 0.4} ${-L * 0.68} C${0} ${-L * 0.82} ${-h * 0.9} ${-L * 0.95} ${-h * 0.4} ${-L * 1.1}`}
            stroke={mix(colour, base, 0.4)}
            strokeWidth={w * 0.06}
          />
        </g>
      );
    case 'geometric':
      return (
        <g>
          <path d={`M${-h * 1.2} ${-L * 0.98} L${h * 0.35} ${-L * 0.6} L${h * 1.2} ${-L * 1.1} Z`} fill={colour} />
          <g stroke={colour} strokeWidth={w * 0.035} fill="none">
            <path d={`M${-h * 1.2} ${-L * 0.22} L${h * 0.35} ${-L * 0.6} L${h * 1.2} ${-L * 0.36}`} />
            <path d={`M${-h * 0.2} ${L * 0.1} L${-h * 0.2} ${-L * 0.44}`} />
          </g>
        </g>
      );
  }
}

/* ------------------------------------------------------------------
   Decorations
------------------------------------------------------------------- */

const GEM_RADIUS: Record<GemKind, number> = {
  rhinestone: 0.135,
  crystal: 0.14,
  pearl: 0.14,
  stud: 0.105,
  stone: 0.12,
  glitter: 0.19,
};

function Gems({ gems, shape, w, L, g }: { gems: Gem[]; shape: Shape; w: number; L: number; g: string }) {
  const placed: ReactNode[] = [];
  const bySpot = new Map<string, Gem[]>();
  for (const gem of gems) bySpot.set(gem.spot, [...(bySpot.get(gem.spot) ?? []), gem]);

  for (const [spot, list] of bySpot) {
    const c = SPOT_CENTRES[spot as Gem['spot']];
    const radii = list.map((gem) => GEM_RADIUS[gem.kind] * w);
    const gap = w * 0.03;
    if (spot === 'side') {
      // Stack down the right side, towards the cuticle.
      let y = -c.t * L + ((list.length - 1) * (Math.max(...radii) * 2 + gap)) / 2;
      list.forEach((gem, i) => {
        placed.push(<PlacedGem key={gem.id} kind={gem.kind} x={c.x * (w / 2)} y={y} r={radii[i]} g={g} index={gem.id} />);
        y -= Math.max(...radii) * 2 + gap;
      });
      continue;
    }
    const total = radii.reduce((s, r) => s + r * 2, 0) + gap * (list.length - 1);
    const room = halfWidthAt(shape, w, c.t) * 2;
    const k = Math.min(1, room / total);
    let x = (-total * k) / 2;
    list.forEach((gem, i) => {
      const r = radii[i] * k;
      placed.push(<PlacedGem key={gem.id} kind={gem.kind} x={x + r} y={-c.t * L} r={r} g={g} index={gem.id} />);
      x += r * 2 + gap * k;
    });
  }
  return <g className="ns-gems">{placed}</g>;
}

function PlacedGem({ kind, x, y, r, g, index }: { kind: GemKind; x: number; y: number; r: number; g: string; index: number }) {
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
      <g className="ns-gem">
        <GemShape kind={kind} r={r} g={g} index={index} />
      </g>
    </g>
  );
}

/** A single decoration centred on (0, 0) with radius r. Exported for the option tiles. */
export function GemShape({ kind, r, g, index = 0 }: { kind: GemKind; r: number; g: string; index?: number }) {
  const shadow = (
    <ellipse cx={r * 0.12} cy={r * 0.38} rx={r * 1.02} ry={r * 0.9} fill="#1c0b14" opacity="0.42" filter={`url(#${g}-soft)`} />
  );
  switch (kind) {
    case 'rhinestone': {
      const facets = Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return `${(Math.cos(a) * r * 0.55).toFixed(2)},${(Math.sin(a) * r * 0.55).toFixed(2)}`;
      });
      return (
        <g>
          {shadow}
          <circle r={r} fill="#8d96ad" />
          <circle r={r * 0.92} fill={`url(#${g}-rhine)`} />
          <polygon points={facets.join(' ')} fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth={r * 0.07} />
          {facets.map((pt, i) => {
            const [px, py] = pt.split(',').map(Number);
            return <line key={i} x1={px} y1={py} x2={px * 1.6} y2={py * 1.6} stroke="#6f7892" strokeOpacity="0.4" strokeWidth={r * 0.05} />;
          })}
          <Sparkle r={r * 0.75} x={-r * 0.3} y={-r * 0.32} />
        </g>
      );
    }
    case 'crystal':
      return (
        <g>
          <ellipse cx={r * 0.12} cy={r * 0.45} rx={r * 0.85} ry={r * 1.5} fill="#1c0b14" opacity="0.38" filter={`url(#${g}-soft)`} />
          <path d={`M0 ${-r * 1.55} L${r * 0.8} 0 L0 ${r * 1.55} L${-r * 0.8} 0 Z`} fill={`url(#${g}-crystal)`} stroke="#8a7fb3" strokeWidth={r * 0.06} />
          <path
            d={`M0 ${-r * 1.55} L${r * 0.3} 0 L0 ${r * 1.55} L${-r * 0.3} 0 Z M${-r * 0.8} 0 L${r * 0.8} 0`}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.7"
            strokeWidth={r * 0.06}
          />
          <path d={`M${-r * 0.3} 0 L0 ${-r * 1.55} L${-r * 0.8} 0 Z`} fill="#fff" opacity="0.4" />
          <Sparkle r={r * 0.7} x={-r * 0.25} y={-r * 0.6} />
        </g>
      );
    case 'pearl':
      return (
        <g>
          {shadow}
          <circle r={r} fill={`url(#${g}-pearl)`} />
          <circle r={r} fill="none" stroke="#ffe6ef" strokeOpacity="0.5" strokeWidth={r * 0.08} />
          <ellipse cx={-r * 0.32} cy={-r * 0.36} rx={r * 0.26} ry={r * 0.18} fill="#fff" opacity="0.9" transform={`rotate(-35 ${-r * 0.32} ${-r * 0.36})`} />
        </g>
      );
    case 'stud':
      return (
        <g>
          {shadow}
          <circle r={r} fill={`url(#${g}-gold)`} />
          <circle r={r * 0.62} fill="none" stroke="#fff3cf" strokeOpacity="0.45" strokeWidth={r * 0.1} />
          <circle cx={-r * 0.3} cy={-r * 0.32} r={r * 0.18} fill="#fffbea" opacity="0.95" />
        </g>
      );
    case 'stone': {
      const tone = ['rose', 'jade', 'amethyst'][index % 3];
      return (
        <g>
          <ellipse cx={r * 0.1} cy={r * 0.4} rx={r * 0.9} ry={r * 1.1} fill="#1c0b14" opacity="0.4" filter={`url(#${g}-soft)`} />
          <ellipse rx={r * 0.95} ry={r * 1.2} fill="#c9a25a" />
          <ellipse rx={r * 0.78} ry={r * 1.02} fill={`url(#${g}-stone-${tone})`} />
          <ellipse cx={-r * 0.25} cy={-r * 0.4} rx={r * 0.24} ry={r * 0.16} fill="#fff" opacity="0.8" transform={`rotate(-30 ${-r * 0.25} ${-r * 0.4})`} />
        </g>
      );
    }
    case 'glitter': {
      const rnd = seeded(index * 131 + 17);
      const flecks: ReactNode[] = [];
      for (let i = 0; i < 26; i++) {
        const a = rnd() * Math.PI * 2;
        const d = Math.sqrt(rnd()) * r;
        const s = r * (0.1 + rnd() * 0.2);
        const x = Math.cos(a) * d * 1.3;
        const y = Math.sin(a) * d * 0.8;
        flecks.push(
          <rect
            key={i}
            x={x - s / 2}
            y={y - s / 2}
            width={s}
            height={s}
            fill={['#f6d58e', '#ffffff', '#d6ad5f', '#fdf2c8'][i % 4]}
            transform={`rotate(${Math.round(rnd() * 90)} ${x.toFixed(2)} ${y.toFixed(2)})`}
          />,
        );
      }
      return (
        <g>
          {flecks}
          <Sparkle r={r * 0.55} x={r * 0.2} y={-r * 0.1} />
        </g>
      );
    }
  }
}

/** Four-point catch light. */
function Sparkle({ r, x, y }: { r: number; x: number; y: number }) {
  const s = r * 0.5;
  return (
    <path
      d={`M${x} ${y - s} Q${x + s * 0.12} ${y - s * 0.12} ${x + s} ${y} Q${x + s * 0.12} ${y + s * 0.12} ${x} ${y + s} Q${x - s * 0.12} ${y + s * 0.12} ${x - s} ${y} Q${x - s * 0.12} ${y - s * 0.12} ${x} ${y - s} Z`}
      fill="#fff"
    />
  );
}
