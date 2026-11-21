import { site } from '../content/site';

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/** Parse "YYYY-MM-DD" as a local date (avoids the UTC shift of `new Date(str)`). */
export function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Earliest bookable date: tomorrow. */
export function minBookingDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toISODate(d);
}

/** Bookings open up to roughly three months ahead. */
export function maxBookingDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return toISODate(d);
}

export function isOpenOn(date: Date) {
  return Boolean(site.hours[date.getDay()]);
}

export function timeSlotsFor(value: string): string[] {
  const date = parseDate(value);
  if (!date) return [];
  const hours = site.hours[date.getDay()];
  if (!hours) return [];
  const slots: string[] = [];
  const last = toMinutes(hours.close) - site.lastSlotBeforeCloseMinutes;
  for (let t = toMinutes(hours.open); t <= last; t += site.slotStepMinutes) slots.push(toHHMM(t));
  return slots;
}

export const formatPrice = (amount: number, lang: string) =>
  new Intl.NumberFormat(lang === 'hu' ? 'hu-HU' : 'en-GB').format(amount);
