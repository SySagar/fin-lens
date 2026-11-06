import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Fin Lens, a clear, source-led view of the Indian economy and investments.",
};

export default function AboutPage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          About Fin Lens
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          The numbers, without the noise.
        </h1>
        <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            Fin Lens is an independent project for following the Indian economy
            and its markets. It turns public information into clear, focused
            views that are easy to understand and quick to explore.
          </p>
          <p>
            Every view is built around useful context: what a number represents,
            how it changes over time, and where it came from. The aim is to make
            market information more accessible without adding hype or clutter.
          </p>
          <p>
            Version 1 starts with institutional investment flows. Fin Lens will
            grow to include more economic and investment data while keeping the
            same focus on clarity, transparency, and calm presentation.
          </p>
        </div>
      </section>
    </main>
  );
}
