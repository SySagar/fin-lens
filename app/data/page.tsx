import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data & sources",
  description:
    "Explore the official sources behind Fin Lens data and what each source provides.",
};

const sources = [
  {
    name: "Central Depository Services (India) Limited — CDSL",
    tracker: "fii-dii",
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
    tracker: "fii-dii",
    href: "https://www.nseindia.com/reports/fii-dii",
    description:
      "Latest-session capital-market trading activity for FII/FPI and DII participants, including buy, sell, and net values. This is a separate measure from CDSL's broader investment series.",
    links: [{ label: "FII/DII report", href: "https://www.nseindia.com/reports/fii-dii" }],
  },
  {
    name: "Securities and Exchange Board of India — SEBI",
    tracker: "fii-dii",
    href: "https://www.sebi.gov.in/curation/fpi.html",
    description:
      "A directory of curated FPI information and links to official depository sources for further reference.",
    links: [{ label: "FPI data directory", href: "https://www.sebi.gov.in/curation/fpi.html" }],
  },
  {
    name: "Ministry of Statistics and Programme Implementation — MoSPI",
    tracker: "inflation",
    href: "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi",
    description:
      "Official monthly CPI releases and downloadable Excel annexures, including all-India rural, urban, and combined indices and published category inflation. The tracker reads the portal's catalogue and official release files.",
    links: [
      { label: "CPI macro indicators", href: "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi" },
      { label: "eSankhyiki data catalogue", href: "https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=CPI" },
    ],
  },
  {
    name: "Office of the Economic Adviser — OEA",
    tracker: "inflation",
    href: "https://eaindustry.nic.in/",
    description:
      "Official WPI source. Its downloadable monthly index workbook contains the All Commodities series and Primary Articles, Fuel & Power, and Manufactured Products groups.",
    links: [
      { label: "WPI monthly data downloads", href: "https://eaindustry.nic.in/download_data_2223.asp" },
      { label: "WPI metadata", href: "https://eaindustry.nic.in/pdf_files/Metadata_WPI.pdf" },
    ],
  },
  {
    name: "Labour Bureau — Ministry of Labour and Employment",
    tracker: "inflation",
    href: "https://labourbureau.gov.in/",
    description:
      "Official CPI-IW and CPI-AL/RL indices. The first release displays the recent all-India values published in the Labour Bureau page tables.",
    links: [
      { label: "Labour Bureau CPI data", href: "https://labourbureau.gov.in/" },
      { label: "CPI-IW methodology", href: "https://labourbureau.gov.in/cpi-iw" },
      { label: "CPI-AL/RL data", href: "https://labourbureau.gov.in/CPI-ALRL-2019-base" },
    ],
  },
  {
    name: "Reserve Bank of India — Database on Indian Economy",
    tracker: "inflation",
    href: "https://data.rbi.org.in/",
    description:
      "Reference source for historical macroeconomic time series, including GDP deflator and monetary-policy indicators. A stable public download for GDP deflator has not yet been verified for this release.",
    links: [{ label: "RBI DBIE", href: "https://data.rbi.org.in/" }],
  },
];

const sourceGroups = [
  {
    id: "fii-dii",
    title: "FII / DII flows",
    description: "Sources for historical FPI/FII investment and latest-session FII/DII market activity.",
    href: "/fii-dii",
    linkLabel: "Open FII / DII tracker",
  },
  {
    id: "inflation",
    title: "India inflation tracker",
    description: "Sources for CPI, CFPI, WPI, and specialised labour price indices. RBI is included as a reference for GDP deflator; that series is not displayed yet.",
    href: "/inflation",
    linkLabel: "Open inflation tracker",
  },
].map((group) => ({
  ...group,
  sources: sources.filter((source) => source.tracker === group.id),
}));

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

        <div className="mt-12 grid gap-12">
          {sourceGroups.map((group) => (
            <section key={group.id} aria-labelledby={`${group.id}-sources-heading`}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id={`${group.id}-sources-heading`} className="text-2xl font-semibold tracking-tight">{group.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{group.description}</p>
                </div>
                <Link href={group.href} className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  {group.linkLabel} <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="mt-4 grid gap-4">
                {group.sources.map((source) => (
                  <article key={source.name} className="rounded-xl border border-border bg-card p-6 sm:p-8">
                    <h3 className="text-lg font-semibold tracking-tight">
                      <a href={source.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                        {source.name}
                      </a>
                    </h3>
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
            </section>
          ))}
        </div>

        <aside className="mt-8 max-w-3xl border-l-2 border-primary pl-5 text-sm leading-relaxed text-muted-foreground">
          Sources may cover different activities and reporting periods. For
          example, CPI and WPI use different baskets and base years, and
          specialised labour indices have different populations. Refer to the
          original publication for definitions and the latest figures. GDP
          deflator is listed as a source reference but is not yet included in
          the tracker series.
        </aside>
      </section>
    </main>
  );
}
