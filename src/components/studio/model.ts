/**
 * Nail studio: the data model. Every nail carries its own configuration, so a
 * manicure is simply five of them. Visible names live in src/i18n (studio.*).
 */

export const FINGERS = ['thumb', 'index', 'middle', 'ring', 'little'] as const;
export type Finger = (typeof FINGERS)[number];

export const SHAPES = ['almond', 'oval', 'square', 'coffin'] as const;
export type Shape = (typeof SHAPES)[number];

export const FINISHES = ['glossy', 'matte', 'chrome', 'pearl', 'glitter', 'catEye'] as const;
export type Finish = (typeof FINISHES)[number];

export const ARTS = [
  'none',
  'french',
  'reverseFrench',
  'microFrench',
  'ombre',
  'dots',
  'stripes',
  'hearts',
  'flowers',
  'abstract',
  'swirls',
  'geometric',
] as const;
export type Art = (typeof ARTS)[number];

export const GEMS = ['rhinestone', 'crystal', 'pearl', 'stud', 'stone', 'glitter'] as const;
export type GemKind = (typeof GEMS)[number];

export const GEM_SPOTS = ['cuticle', 'centre', 'tip', 'side'] as const;
export type GemSpot = (typeof GEM_SPOTS)[number];

/** Polish colours. `id` keys the translated name; custom colours have no id. */
export const POLISHES = [
  { id: 'nude', hex: '#d8b096' },
  { id: 'milky', hex: '#f3ece6' },
  { id: 'babyPink', hex: '#f4c4cd' },
  { id: 'dustyRose', hex: '#c48a90' },
  { id: 'peach', hex: '#f3b694' },
  { id: 'butter', hex: '#f5d27e' },
  { id: 'mint', hex: '#b8dcc6' },
  { id: 'sky', hex: '#b6cdea' },
  { id: 'lavender', hex: '#c9b7e9' },
  { id: 'deepPurple', hex: '#4a2a62' },
  { id: 'cherry', hex: '#b0142c' },
  { id: 'burgundy', hex: '#6b1d2e' },
  { id: 'chocolate', hex: '#5a3626' },
  { id: 'black', hex: '#18131b' },
] as const;
export type PolishId = (typeof POLISHES)[number]['id'];

/** Detail colours for nail art: the polishes plus two metallics. */
export const DETAIL_COLOURS = [
  { id: 'milky', hex: '#fbf7f2' },
  { id: 'black', hex: '#18131b' },
  { id: 'gold', hex: '#d6ad5f' },
  { id: 'silver', hex: '#c5c3cc' },
  { id: 'lavender', hex: '#b7a0e3' },
  { id: 'babyPink', hex: '#f4b9c4' },
  { id: 'cherry', hex: '#b0142c' },
  { id: 'butter', hex: '#f4b84a' },
] as const;
export type DetailId = (typeof DETAIL_COLOURS)[number]['id'];

export interface Gem {
  id: number;
  kind: GemKind;
  spot: GemSpot;
}

export interface NailDesign {
  colour: string; // hex
  finish: Finish;
  shape: Shape;
  art: Art;
  artColour: string; // hex
  gems: Gem[];
}

export type Manicure = NailDesign[]; // always five, in FINGERS order

export const MAX_GEMS_PER_NAIL = 6;
export const MAX_GEMS_PER_SPOT = 3;

const lavender = '#c9b7e9';
const milky = '#f3ece6';

export const DEFAULT_MANICURE: Manicure = [
  { colour: lavender, finish: 'glossy', shape: 'almond', art: 'none', artColour: '#fbf7f2', gems: [] },
  { colour: milky, finish: 'pearl', shape: 'almond', art: 'none', artColour: '#b7a0e3', gems: [] },
  { colour: lavender, finish: 'glossy', shape: 'almond', art: 'microFrench', artColour: '#fbf7f2', gems: [] },
  {
    colour: milky,
    finish: 'glossy',
    shape: 'almond',
    art: 'flowers',
    artColour: '#b7a0e3',
    gems: [
      { id: 1, kind: 'pearl', spot: 'cuticle' },
      { id: 2, kind: 'rhinestone', spot: 'cuticle' },
    ],
  },
  { colour: lavender, finish: 'glossy', shape: 'almond', art: 'none', artColour: '#fbf7f2', gems: [] },
];

export const sameDesign = (a: NailDesign, b: NailDesign) =>
  a.colour === b.colour &&
  a.finish === b.finish &&
  a.shape === b.shape &&
  a.art === b.art &&
  a.artColour === b.artColour &&
  a.gems.length === b.gems.length &&
  a.gems.every((g, i) => g.kind === b.gems[i].kind && g.spot === b.gems[i].spot);

export const polishIdOf = (hex: string): PolishId | null =>
  POLISHES.find((p) => p.hex.toLowerCase() === hex.toLowerCase())?.id ?? null;

export const detailIdOf = (hex: string): DetailId | null =>
  DETAIL_COLOURS.find((p) => p.hex.toLowerCase() === hex.toLowerCase())?.id ?? null;

/* ------------------------------------------------------------------
   State: the manicure plus an undo history.
------------------------------------------------------------------- */

/** Which nails an edit applies to: one finger index, or all five. */
export type Target = number | 'all';

export type Patch = Partial<Omit<NailDesign, 'gems'>>;

export type Action =
  | { type: 'patch'; target: Target; patch: Patch; coalesce?: string }
  | { type: 'addGem'; target: Target; kind: GemKind; spot: GemSpot }
  | { type: 'removeGem'; nail: number; id: number }
  | { type: 'clearGems'; target: Target }
  | { type: 'copy'; from: number; to: number }
  | { type: 'applyAll'; from: number }
  | { type: 'reset' }
  | { type: 'undo' };

export interface StudioState {
  nails: Manicure;
  past: Manicure[];
  /** Key of the last coalescing edit, so a colour-picker drag is one undo step. */
  lastCoalesce: string | null;
  nextGemId: number;
}

export const initialState: StudioState = {
  nails: DEFAULT_MANICURE,
  past: [],
  lastCoalesce: null,
  nextGemId: 100,
};

const HISTORY_LIMIT = 60;

const indices = (t: Target) => (t === 'all' ? [0, 1, 2, 3, 4] : [t]);

export const canAddGem = (nail: NailDesign, spot: GemSpot) =>
  nail.gems.length < MAX_GEMS_PER_NAIL && nail.gems.filter((g) => g.spot === spot).length < MAX_GEMS_PER_SPOT;

function commit(state: StudioState, nails: Manicure, coalesce: string | null = null): StudioState {
  if (nails === state.nails) return state;
  const merge = coalesce !== null && coalesce === state.lastCoalesce;
  return {
    ...state,
    nails,
    past: merge ? state.past : [...state.past, state.nails].slice(-HISTORY_LIMIT),
    lastCoalesce: coalesce,
  };
}

export function reducer(state: StudioState, action: Action): StudioState {
  const { nails } = state;
  switch (action.type) {
    case 'patch': {
      const hit = indices(action.target);
      const keys = Object.keys(action.patch) as (keyof Patch)[];
      const changed = hit.some((i) => keys.some((k) => nails[i][k] !== action.patch[k]));
      if (!changed) return state;
      return commit(
        state,
        nails.map((n, i) => (hit.includes(i) ? { ...n, ...action.patch } : n)),
        action.coalesce ?? null,
      );
    }
    case 'addGem': {
      const hit = indices(action.target).filter((i) => canAddGem(nails[i], action.spot));
      if (!hit.length) return state;
      let id = state.nextGemId;
      const next = nails.map((n, i) =>
        hit.includes(i) ? { ...n, gems: [...n.gems, { id: id++, kind: action.kind, spot: action.spot }] } : n,
      );
      return { ...commit(state, next), nextGemId: id };
    }
    case 'removeGem':
      return commit(
        state,
        nails.map((n, i) => (i === action.nail ? { ...n, gems: n.gems.filter((g) => g.id !== action.id) } : n)),
      );
    case 'clearGems': {
      const hit = indices(action.target).filter((i) => nails[i].gems.length);
      if (!hit.length) return state;
      return commit(
        state,
        nails.map((n, i) => (hit.includes(i) ? { ...n, gems: [] } : n)),
      );
    }
    case 'copy': {
      if (action.from === action.to || sameDesign(nails[action.from], nails[action.to])) return state;
      let id = state.nextGemId;
      const src = nails[action.from];
      const copy = { ...src, gems: src.gems.map((g) => ({ ...g, id: id++ })) };
      return { ...commit(state, nails.map((n, i) => (i === action.to ? copy : n))), nextGemId: id };
    }
    case 'applyAll': {
      const src = nails[action.from];
      if (nails.every((n) => sameDesign(n, src))) return state;
      let id = state.nextGemId;
      const next = nails.map((n, i) =>
        i === action.from ? n : { ...src, gems: src.gems.map((g) => ({ ...g, id: id++ })) },
      );
      return { ...commit(state, next), nextGemId: id };
    }
    case 'reset':
      if (nails === DEFAULT_MANICURE) return state;
      return commit(state, DEFAULT_MANICURE);
    case 'undo': {
      if (!state.past.length) return state;
      return {
        ...state,
        nails: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        lastCoalesce: null,
      };
    }
  }
}
