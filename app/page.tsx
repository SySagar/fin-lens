import Link from "next/link";

const features = [
  {
    label: "01",
    tone: "text-primary",
    title: "Official sources",
    body: "Built on published CDSL and NSE reports, with the source and as-of date kept visible.",
  },
  {
    label: "02",
    tone: "text-secondary",
    title: "Monthly & quarterly",
    body: "Switch between reporting periods to see how net institutional flows evolve over time.",
  },
  {
    label: "03",
    tone: "text-tertiary",
    title: "Chart and table",
    body: "Scan the trend visually, then read the exact figures behind every bar and period.",
  },
];

export default function HomePage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Finance &amp; economics · India
          </p>

          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
            Fin Lens
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            A clear view of economy and investments in Indian markets — without
            the noise.
          </p>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Follow the numbers behind Indian markets through focused views,
            useful context, and transparent sources.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/fii-dii"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Explore FII / DII data
            </Link>
            <a
              href="#about"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              What&apos;s inside
            </a>
          </div>
        </div>
      </section>

      <section
        id="about"
        aria-labelledby="about-heading"
        className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="about-heading"
              className="text-2xl font-semibold tracking-tight"
            >
              One question, answered clearly
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Who is buying and selling Indian equities — foreign investors or
              domestic institutions? Fin Lens brings the reported numbers
              together so the answer is easy to see.
            </p>
          </div>
        </div>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="bg-card p-6 sm:p-7">
              <dt className="flex items-baseline gap-3">
                <span className={`font-mono text-[11px] ${feature.tone}`}>
                  {feature.label}
                </span>
                <span className="text-[15px] font-semibold tracking-tight">
                  {feature.title}
                </span>
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
