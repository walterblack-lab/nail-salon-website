/**
 * Shades for the "pick your shade" band. `ink` is the text colour that stays
 * readable on that shade. Names are translated in src/i18n (shades.names.<id>).
 */
export const shades = [
  { id: 'butter', hex: '#f4b84a', ink: '#493447' },
  { id: 'lavender', hex: '#c9b7e9', ink: '#493447' },
  { id: 'sage', hex: '#b9cbae', ink: '#493447' },
  { id: 'powder', hex: '#f5e7e2', ink: '#493447' },
  { id: 'nude', hex: '#e2c3ae', ink: '#493447' },
  { id: 'plum', hex: '#493447', ink: '#fff9f3' },
] as const;

export type ShadeId = (typeof shades)[number]['id'];
