# Mira Nail Atelier: website

Single-page site for a colourful, contemporary nail studio in Szeged. Hungarian by default, with English.
Built with React, TypeScript and Vite. Styling is plain CSS with design tokens; there is no UI framework.

## Design system ("Colour Atelier")

- **Palette** (`src/styles/tokens.css`): powder, lavender, butter, sage, deep plum, warm paper. Each section owns a
  colour; plum is the ink everywhere. Keep plum text on the light colours; that pairing passes WCAG AA.
- **Type:** Bricolage Grotesque (display, variable width) + Manrope (text). Sentence case throughout, no tracked capitals.
- **Motif:** the almond nail shape (`NailMark` component and the `--r-arch` radius), used for image crops, bullets,
  the logo and the map pin.
- **Shape:** pill buttons and chips, soft rounded panels, small rotations and overlaps; no divider lines.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in /dist (static, host anywhere)
npm run preview   # serve the production build locally
npm run images    # regenerate optimised photos after changing /images-src
```

## Before launch: placeholders to replace

| What | Where |
|---|---|
| Salon name, address, phone, email, Instagram, opening hours | `src/content/site.ts` |
| Same details for search engines (structured data, canonical URL, OG tags) | `index.html` |
| Prices, durations, panel colours and photos per service | `src/content/services.ts` |
| Photos (all temporary Unsplash images) | `images-src/`, see below |
| Booking backend | `.env`, see below |

## Editing text

All visible text lives in two files:

- `src/i18n/hu.ts`: Hungarian (default; it defines the structure)
- `src/i18n/en.ts`: English

TypeScript reports an error if a key exists in one language but not the other, so translations can't silently go missing.
The language choice is remembered, and `?lang=en` links straight to the English version.

## Photos

1. Put the original photo in `images-src/`. To replace an existing photo, use the same file name, e.g. `hero.jpg`.
2. Run `npm run images`. This writes responsive WebP sizes to `public/images/` and updates `src/content/images.generated.ts`.

To add a gallery photo, also add one line to `src/content/gallery.ts` with its name, category and a caption in both languages.
Credits for the current temporary photos are in `images-src/CREDITS.md`.

## Booking

The form validates input, only offers opening days, and generates time slots from the opening hours in `site.ts`.
It never shows a booking as confirmed. Without a backend it says that online booking isn't connected yet and offers a prefilled email or a phone call.

To connect a backend, copy `.env.example` to `.env` and set `VITE_BOOKING_ENDPOINT` to any URL that accepts a JSON POST,
such as Formspree, a serverless function, a Make/Zapier webhook or your own API. The request shape is `BookingRequest` in `src/lib/booking.ts`.
For a booking platform's API, replace the body of `submitBooking()` in that file and keep its return type.

## Structure

```
src/
  content/      site details, services, gallery list, generated image manifest
  i18n/         translations + language provider
  lib/          booking adapter, opening-hours/time-slot logic, scroll reveal
  components/   one folder-less component + CSS file per section
  styles/       tokens.css (palette, type scale, spacing), base.css (shared patterns)
scripts/        image optimisation pipeline
images-src/     original photos (source of truth)
```

The Google Map only loads after the visitor clicks **Load map**, so no Google request is made without consent.

## Deployment

Hosted on Vercel, connected to this GitHub repository:

- **Live site:** https://nail-salon-website-swart.vercel.app
- Every push to `main` deploys to production; pushes to other branches and pull requests get preview URLs.
- Vercel detects Vite automatically (build: `npm run build`, output: `dist`). No environment variables are required.
  To connect a booking backend, add `VITE_BOOKING_ENDPOINT` under Project → Settings → Environment Variables and redeploy.
