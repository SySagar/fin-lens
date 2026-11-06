import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data & sources",
  description:
    "Explore the official sources behind Fin Lens data and what each source provides.",
};

const sources = [
  {
    name: "Central Depository Services (India) Limited — CDSL",
    href: "https://www.cdslindia.com/eservices/Publications/FIICalendar",
    description:
      "Historical monthly and quarterly foreign portfolio investor (FPI/FII) net investment by asset class. CDSL's daily report also provides the reference exchange rate used for currency conversion.",
    links: [
      { label: "Monthly data", href: "https://www.cdslindia.com/eservices/Publications/FIICalendar" },
      { label: "Quarterly data", href: "https://www.cdslindia.com/eservices/Publications/FIIQuarterly" },
      { label: "Daily report", href: "https://www.cdslindia.com/eservices/publications/fiidaily" },
    ],
  },
  {
    name: "National Stock Exchange of India — NSE",
    href: "https://www.nseindia.com/reports/fii-dii",
    description:
      "Latest-session capital-market trading activity for FII/FPI and DII participants, including buy, sell, and net values. This is a separate measure from CDSL's broader investment series.",
    links: [{ label: "FII/DII report", href: "https://www.nseindia.com/reports/fii-dii" }],
  },
  {
    name: "Securities and Exchange Board of India — SEBI",
    href: "https://www.sebi.gov.in/curation/fpi.html",
    description:
      "A directory of curated FPI information and links to official depository sources for further reference.",
    links: [{ label: "FPI data directory", href: "https://www.sebi.gov.in/curation/fpi.html" }],
  },
];

export default function DataPage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          Data &amp; sources
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Know where the numbers come from.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Fin Lens uses published information from official Indian market and
          regulatory sources. Each dataset has its source and reporting context
          shown alongside it.
        </p>

        <div className="mt-12 grid gap-4">
          {sources.map((source) => (
            <article key={source.name} className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight">
                <a href={source.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  {source.name}
                </a>
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {source.description}
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {source.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <aside className="mt-8 max-w-3xl border-l-2 border-primary pl-5 text-sm leading-relaxed text-muted-foreground">
          Sources may cover different activities and reporting periods. For
          example, CDSL historical FPI investment and NSE trading activity are
          distinct measures, so their totals should not be treated as directly
          comparable. Always refer to the original publication for definitions
          and the latest figures.
        </aside>
      </section>
    </main>
  );
}
