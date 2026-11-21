import type { ImageName } from './images.generated';

export type PanelColor = 'lavender' | 'butter' | 'sage' | 'powder' | 'plum';

/**
 * Service menu. Prices are in HUF.
 * `from: true` shows "from 9 500 Ft"; `perNail` adds "per nail".
 * `color` picks the panel colour; `image` (optional) adds a nail-shaped photo to the panel.
 * Names and descriptions are translated in src/i18n (key: services.items.<id>).
 */
export const services = [
  { id: 'gel', color: 'lavender', image: 'svc-gel', price: 9500, durationMin: 75 },
  { id: 'extensions', color: 'butter', image: 'svc-extensions', price: 15500, durationMin: 150 },
  { id: 'builder', color: 'sage', price: 12000, durationMin: 90 },
  { id: 'classic', color: 'powder', price: 6000, durationMin: 45 },
  { id: 'art', color: 'plum', image: 'svc-art', price: 800, durationMin: 0, from: true, perNail: true },
  { id: 'special', color: 'lavender', image: 'svc-special', price: 18000, durationMin: 180, from: true },
] as const satisfies readonly {
  id: string;
  color: PanelColor;
  image?: ImageName;
  price: number;
  durationMin: number;
  from?: boolean;
  perNail?: boolean;
}[];

export type ServiceId = (typeof services)[number]['id'];
