# Implementation Plan

Status as of 6 November 2026.

- [x] 1. Scaffold a Next.js App Router project with TypeScript, Tailwind CSS, and lint/build scripts.
- [x] 2. Add the shared header/navigation/footer, the home page, and the working title “Fin Lens”; include the copyright and X link.
- [x] 3. Implement server-side CDSL and NSE source adapters, normalization, period aggregation, provenance, and a cached `/api/flows` route.
- [x] 4. Build `/fii-dii` with source and monthly/quarterly/year controls, a net-flow chart, and a sortable table.
- [x] 5. Add loading, empty, stale/error, responsive, accessibility, and source/methodology states.
- [x] 6. Verify against official source samples, then run lint and production build and check both routes at desktop/mobile sizes.

## Verification notes

- CDSL monthly and quarterly parsing checked against the official tables for 2002, 2024, 2025, and 2026.
- NSE latest-session parsing checked against the official `/api/fiidiiTradeReact` response.
- `npm run lint` and `npm run build` pass.
- Headless Chromium checks at 1440px and 390px: both routes render with no console/page errors, no horizontal page overflow, and the chart, sortable table, quarterly toggle, theme switch, and USD switch work.

## Known limitation

NSE’s free endpoint only returns the latest session’s FII/FPI and DII activity. Historical DII monthly/quarterly data needs a paid or archival source, so v1 shows CDSL’s historical FPI/FII series plus an NSE latest-session comparison.
