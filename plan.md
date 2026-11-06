# Implementation Plan

1. Scaffold a Next.js App Router project with TypeScript, Tailwind CSS, and lint/build scripts.
2. Add the shared header/navigation/footer, the home page, and the working title “Fin Lens”; include the copyright and X link.
3. Implement server-side CDSL and NSE source adapters, normalization, period aggregation, provenance, and a cached `/api/flows` route.
4. Build `/fii-dii` with source and monthly/quarterly/year controls, a net-flow chart, and a sortable table.
5. Add loading, empty, stale/error, responsive, accessibility, and source/methodology states.
6. Verify against official source samples, then run lint and production build and check both routes at desktop/mobile sizes.
