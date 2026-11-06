# Project Architecture (Draft)

## Product

A small, read-only Next.js website for finance and economics. Working project name: **Fin Lens**. Version one has a landing page and one FII/DII data page.

## Routes and shared UI

- `/` — project name, brief description, and a clear link to the data page.
- `/fii-dii` — data-source selector, monthly/quarterly view, chart, and table.
- Shared site header/navigation and footer on both routes. Footer: `© 2026 Sagar` and a link to [@SySagar2](https://x.com/SySagar2).

Use the Next.js App Router with TypeScript and Tailwind CSS. Use shadcn/ui for accessible navigation, tabs/selectors, cards, and table styling, and Recharts for the flow chart. Keep the page components focused on presentation; put source retrieval and normalization in server-side modules.

## Data sources and definitions

There is no publicly documented CDSL or NSE open API or dedicated RSS feed identified in this initial research. The official sources publish reports/tables and downloadable CSVs:

- **CDSL FPI/FII reports:** [monthly calendar-year data](https://www.cdslindia.com/eservices/Publications/FIICalendar), [quarterly data](https://www.cdslindia.com/eservices/Publications/FIIQuarterly), and [current-month daily trends](https://www.cdslindia.com/eservices/publications/FIIMonthly). These include net investment in INR crore by asset class. CDSL notes the data is compiled from custodian/depository reports and reflects trades up to the prior trading day. Its included categories changed over time (notably from September 2024), so the UI should show source notes and not imply every historical category is comparable.
- **NSE FII/FPI and DII activity:** [official report and CSV downloads](https://www.nseindia.com/reports/fii-dii). This is capital-market-segment trading activity. Summing its daily net purchases/sales produces monthly and quarterly figures for both investor groups; it is not the same coverage as CDSL's broader FPI investment reports.
- **SEBI source directory:** [FPI data curation page](https://www.sebi.gov.in/curation/fpi.html) links to the official depository sources.

Keep CDSL and NSE results as separate selectable views with a visible source/methodology note. Do not add or directly compare their totals as if they represented an identical measure. Label the CDSL series FPI/FII (current FPI terminology; legacy FII terminology appears in report titles).

## Data flow

1. A server-side source adapter fetches the official CDSL report or NSE CSV; browser clients do not fetch those sites directly.
2. Parse and validate the response, normalize values to INR crore and the period/participant/asset-class dimensions, and retain the source URL and retrieval timestamp.
3. Expose the normalized result through a Next.js route handler such as `/api/flows?source=cdsl|nse&period=monthly|quarterly&year=YYYY`.
4. Cache/revalidate responses (initially around one hour) and show the source's as-of date. If retrieval or parsing fails, show an explicit stale/unavailable state rather than fabricated values.
5. Present data in a table and a chart with a zero baseline so net inflows and outflows are clear.

Suggested normalized observation: `periodStart`, `periodEnd`, `periodLabel`, `source`, `participant`, optional `assetClass`, `netINRCrore`, optional `grossPurchaseINRCrore`/`grossSaleINRCrore`, `sourceUrl`, and `fetchedAt`.

## Suggested code layout

```text
app/
  layout.tsx              # global metadata, fonts, shared shell
  page.tsx                # home
  fii-dii/page.tsx        # data page
  api/flows/route.ts      # cached server endpoint
components/
  site-header.tsx
  site-footer.tsx
  flows/flow-controls.tsx
  flows/flow-chart.tsx
  flows/flow-table.tsx
lib/
  sources/cdsl.ts         # CDSL retrieval/parsing
  sources/nse.ts          # NSE CSV retrieval/parsing
  flows/normalize.ts      # validation, grouping, aggregation
  flows/types.ts
```

No database is needed for the first version: retrieve and cache official sources on the server. If source pages or CSV formats prove unstable, preserve parsed snapshots as versioned local CSV/JSON or add scheduled ingestion later; always display provenance and update time.

## Initial data-page behavior

The page defaults to the NSE view for a direct FII/FPI-versus-DII comparison, with monthly/quarterly controls and an INR-crore net-flow chart/table. A CDSL view provides its richer FPI/FII categories and official monthly/quarterly totals. Keep chart and table aligned with the selected source, period, and year. No authentication, user data, database, or other metrics are in v1.
