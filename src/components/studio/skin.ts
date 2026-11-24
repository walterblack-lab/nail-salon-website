/** Skin tones for the hand. Names are translated in src/i18n (studio.skins). */
export const SKIN_TONES = [
  { id: 'porcelain', shadow: '#d29f88', mid: '#ebc3ad', light: '#f8dccb', crease: '#b77f69' },
  { id: 'honey', shadow: '#b9805f', mid: '#d8a27f', light: '#ecc19f', crease: '#9a6245' },
  { id: 'caramel', shadow: '#8e5a3d', mid: '#b07a56', light: '#c99470', crease: '#6f4128' },
  { id: 'espresso', shadow: '#4e2e20', mid: '#6d4430', light: '#875940', crease: '#3a2017' },
] as const;
export type SkinTone = (typeof SKIN_TONES)[number];
