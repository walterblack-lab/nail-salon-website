/**
 * Salon details. Everything a non-developer is likely to change lives here.
 * Text that differs by language lives in src/i18n/hu.ts and src/i18n/en.ts.
 */
export const site = {
  name: 'Mira',
  fullName: 'Mira Nail Atelier',
  // PLACEHOLDERS: replace with the real details before launch.
  address: {
    street: 'Kárász utca 00.',
    postalCode: '6720',
    city: 'Szeged',
    country: 'HU',
  },
  phone: '+36 30 000 0000',
  phoneHref: 'tel:+36300000000',
  email: 'hello@miranailatelier.hu',
  instagram: {
    handle: '@miranailatelier',
    url: 'https://www.instagram.com/miranailatelier',
  },
  /** Used for the Google Maps embed and the "Directions" link. */
  mapsQuery: 'Kárász utca, Szeged, Hungary',
  /**
   * Opening hours. Days use JS numbering: 0 = Sunday … 6 = Saturday.
   * Days that are missing are closed. Booking time slots are generated from these.
   */
  hours: {
    2: { open: '09:00', close: '19:00' },
    3: { open: '09:00', close: '19:00' },
    4: { open: '10:00', close: '20:00' },
    5: { open: '09:00', close: '19:00' },
    6: { open: '09:00', close: '14:00' },
  } as Partial<Record<number, { open: string; close: string }>>,
  /** Minutes between bookable start times. */
  slotStepMinutes: 30,
  /** The latest start time is this many minutes before closing. */
  lastSlotBeforeCloseMinutes: 60,
} as const;
