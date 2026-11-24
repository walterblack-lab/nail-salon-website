/**
 * Booking adapter.
 *
 * The form calls `submitBooking()` and doesn't care where the request goes.
 * Today there is no booking backend, so unless VITE_BOOKING_ENDPOINT is set the
 * function returns `not-connected` and the UI offers a prefilled email instead.
 * It never pretends a request was sent.
 *
 * To connect a real system:
 *   - Simplest: set VITE_BOOKING_ENDPOINT in .env to any URL that accepts a JSON
 *     POST (Formspree, a serverless function, Make/Zapier webhook, your own API).
 *   - Booking platform (Salonic, Fresha, Calendly, …): replace the body of
 *     `submitBooking` with a call to its API, keeping the same return type.
 */
import type { Lang } from '../i18n/LanguageContext';

export interface BookingRequest {
  name: string;
  contact: string;
  service: string; // service id, or "unsure"
  serviceLabel: string; // human-readable, in the visitor's language
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  message: string;
  lang: Lang;
}

export type BookingResult = { status: 'sent' } | { status: 'not-connected' } | { status: 'error'; message?: string };

const ENDPOINT: string | undefined = import.meta.env.VITE_BOOKING_ENDPOINT;

export const isBookingConnected = Boolean(ENDPOINT);

export async function submitBooking(request: BookingRequest): Promise<BookingResult> {
  if (!ENDPOINT) return { status: 'not-connected' };

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...request, submittedAt: new Date().toISOString() }),
    });
    if (!res.ok) return { status: 'error', message: `HTTP ${res.status}` };
    return { status: 'sent' };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : undefined };
  }
}
