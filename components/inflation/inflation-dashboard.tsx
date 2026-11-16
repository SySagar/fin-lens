"use client";

import { useEffect, useMemo, useState } from "react";
import { InflationChart } from "@/components/inflation/inflation-chart";
import type { InflationObservation, InflationResponse } from "@/lib/inflation/types";

const PLACEHOLDER_SERIES = [
  {
    seriesId: "gdp-deflator",
    seriesName: "GDP Deflator",
  },
];

function formatNumber(value: number | null, suffix = "") {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)}${suffix}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not reported by source";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

function formatFetchedAt(value: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short",
      }).format(date);
}

function seriesRank(seriesId: string) {
  const order = [
    "cpi-general",
    "cfpi",
    "core-cpi",
    "wpi-all",
    "wpi-primary",
    "wpi-fuel",
    "wpi-manufactured",
    "cpi-iw",
    "cpi-al",
    "cpi-rl",
  ];
  const index = order.indexOf(seriesId);
  return index < 0 ? 100 : index;
}

function monthOrder(referenceMonth: string) {
  const [year, month] = referenceMonth.split("-").map(Number);
  return year * 12 + month;
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export function InflationDashboard() {
  const [response, setResponse] = useState<InflationResponse | null>(null);
  const [seriesId, setSeriesId] = useState("cpi-general");
  const [geography, setGeography] = useState("Combined");
  const [baseYear, setBaseYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetch("/api/inflation", {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = (await result.json()) as InflationResponse & { error?: string };
        if (!result.ok) throw new Error(payload.error ?? "Official inflation data is currently unavailable");
        if (!controller.signal.aborted) setResponse(payload);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load inflation data");
          setResponse(null);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [reloadKey]);

  const seriesOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const observation of response?.observations ?? []) {
      options.set(observation.seriesId, observation.seriesName);
    }
    return [...options.entries()].sort(
      ([aId, aName], [bId, bName]) => seriesRank(aId) - seriesRank(bId) || aName.localeCompare(bName),
    );
  }, [response]);

  const seriesObservations = useMemo(
    () => (response?.observations ?? []).filter((item) => item.seriesId === seriesId),
    [response, seriesId],
  );
  const geographies = useMemo(
    () => [...new Set(seriesObservations.map((item) => item.geography))],
    [seriesObservations],
  );
  const activeGeography = geographies.includes(geography) ? geography : geographies[0] ?? "All India";
  const baseYears = useMemo(
    () => [...new Set(seriesObservations.filter((item) => item.geography === activeGeography).map((item) => item.baseYear))]
      .sort((a, b) => Number(b.replace(/\D/g, "")) - Number(a.replace(/\D/g, ""))),
    [seriesObservations, activeGeography],
  );
  const activeBaseYear = baseYears.includes(baseYear) ? baseYear : baseYears[0] ?? "";
  const observations = useMemo(
    () => seriesObservations
      .filter((item) => item.geography === activeGeography && item.baseYear === activeBaseYear)
      .sort((a, b) => a.referenceMonth.localeCompare(b.referenceMonth)),
    [seriesObservations, activeGeography, activeBaseYear],
  );
  const latest = observations.at(-1) ?? null;
  const selectedName = seriesOptions.find(([id]) => id === seriesId)?.[1] ?? seriesId;
  const selectedLimitation = response?.limitations.find((item) => item.seriesId === seriesId);
  const isCore = seriesId === "core-cpi";
  const previousObservation = observations.length > 1 ? observations.at(-2) ?? null : null;
  const consecutiveMonths = Boolean(
    latest && previousObservation &&
    monthOrder(latest.referenceMonth) - monthOrder(previousObservation.referenceMonth) === 1,
  );
  const yoyDelta = latest?.yoyInflationPercent !== null &&
    latest?.yoyInflationPercent !== undefined &&
    previousObservation?.yoyInflationPercent !== null &&
    previousObservation?.yoyInflationPercent !== undefined &&
    consecutiveMonths
      ? latest.yoyInflationPercent - previousObservation.yoyInflationPercent
      : null;
  const pulse = yoyDelta === null
    ? latest?.momChangePercent === null || latest?.momChangePercent === undefined
      ? { arrow: "·", label: "Rate unavailable", tone: "text-muted-foreground", description: "There is not enough comparable data to describe the latest move." }
      : latest.momChangePercent > 0.05
        ? { arrow: "↑", label: "Index up this month", tone: "text-primary", description: `The index rose ${formatNumber(latest.momChangePercent, "%")} from the previous month.` }
        : latest.momChangePercent < -0.05
          ? { arrow: "↓", label: "Index down this month", tone: "text-secondary", description: `The index fell ${formatNumber(Math.abs(latest.momChangePercent), "%")} from the previous month.` }
          : { arrow: "→", label: "Little monthly change", tone: "text-muted-foreground", description: "The index was nearly unchanged from the previous month." }
    : yoyDelta > 0.05
      ? { arrow: "↗", label: "Inflation picking up", tone: "text-primary", description: `The year-on-year rate increased by ${formatNumber(yoyDelta, " percentage points")} from last month.` }
      : yoyDelta < -0.05
        ? { arrow: "↘", label: "Inflation easing", tone: "text-secondary", description: `The year-on-year rate decreased by ${formatNumber(Math.abs(yoyDelta), " percentage points")} from last month.` }
        : { arrow: "→", label: "Inflation steady", tone: "text-muted-foreground", description: "The year-on-year rate changed very little from last month." };
  const categoryHighlights = useMemo(() => {
    if (!latest || !response) return [];
    const unique = new Map<string, InflationObservation>();
    for (const item of response.observations) {
      if (
        item.seriesId.startsWith("cpi-category-") &&
        item.referenceMonth === latest.referenceMonth &&
        item.baseYear === latest.baseYear &&
        item.geography === latest.geography &&
        item.yoyInflationPercent !== null
      ) {
        unique.set(item.seriesId, item);
      }
    }
    return [...unique.values()].sort(
      (a, b) => (a.yoyInflationPercent ?? 0) - (b.yoyInflationPercent ?? 0),
    );
  }, [latest, response]);

  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">India · prices &amp; inflation</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Inflation tracker</h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Follow official CPI, food and wholesale price indices, with the reporting period, index base, and source kept in view.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {loading ? "Updating…" : "Refresh official data"}
          </button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-3 sm:p-5">
          <label className="grid gap-2 text-sm font-medium" htmlFor="inflation-series">
            Indicator
            <select
              id="inflation-series"
              value={seriesId}
              onChange={(event) => setSeriesId(event.target.value)}
              className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {seriesOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              {PLACEHOLDER_SERIES.map((item) => <option key={item.seriesId} value={item.seriesId}>{item.seriesName}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="inflation-geography">
            Geography
            <select
              id="inflation-geography"
              value={activeGeography}
              onChange={(event) => setGeography(event.target.value)}
              disabled={geographies.length < 2}
              className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {geographies.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="inflation-base-year">
            Index base
            <select
              id="inflation-base-year"
              value={activeBaseYear}
              onChange={(event) => setBaseYear(event.target.value)}
              disabled={baseYears.length < 2}
              className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {baseYears.map((item) => <option key={item} value={item}>{item} = 100</option>)}
            </select>
          </label>
        </div>

        {loading && !response ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground" role="status">
            Loading official inflation releases…
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-xl border border-negative/30 bg-card p-5 text-sm" role="alert">
            <p className="font-semibold">Inflation data could not be loaded</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        ) : null}

        {selectedLimitation && observations.length === 0 ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">{selectedLimitation.label}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{selectedLimitation.reason}</p>
            {selectedLimitation.seriesId === "gdp-deflator" ? (
              <a
                href="https://data.rbi.org.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Open RBI Database on Indian Economy
              </a>
            ) : null}
          </div>
        ) : null}

        {!selectedLimitation && !latest && !loading && !error ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No published values were returned for this indicator and geography.
          </div>
        ) : null}

        {latest ? (
          <>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{selectedName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {latest.geography} · {latest.periodLabel} · Base {latest.baseYear}=100
                  {isCore ? " · Derived estimate" : ""}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Publication date: {formatDate(latest.publicationDate)}</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Index level*" value={formatNumber(latest.indexValue)} detail={`For ${latest.periodLabel}`} />
              <Stat label="Change vs same month last year*" value={formatNumber(latest.yoyInflationPercent, "%")} detail="Year-on-year change" />
              <Stat label="Change vs previous month*" value={formatNumber(latest.momChangePercent, "%")} detail="Month-on-month change" />
              <Stat label="Previous month index" value={formatNumber(latest.previousValue)} detail={`Year-ago index: ${formatNumber(latest.yearAgoValue)}`} />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold">Index history</h3>
                <p className="text-xs text-muted-foreground">{observations.length} monthly observations · official published index levels</p>
              </div>
              {isCore ? (
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  Calculated from the published CPI group indices and combined weights, excluding Food and Beverages and Fuel and Light. This is a derived series, not a separately published MoSPI index.
                </p>
              ) : null}
              <InflationChart observations={observations} label={`${selectedName} ${activeGeography}`} />
            </div>

          </>
        ) : null}

        <section className="mt-8" aria-labelledby="source-status-heading">
          <h2 id="source-status-heading" className="text-lg font-semibold">Official data sources</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {(response?.sources ?? []).map((source) => (
              <article key={source.id} className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">{source.label}</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Retrieved: {formatFetchedAt(source.fetchedAt)}
                </p>
                {source.error ? <p className="mt-2 text-xs text-negative">Source unavailable: {source.error}</p> : null}
                <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Open official source
                </a>
              </article>
            ))}
          </div>
        </section>

        {latest ? (
          <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="inflation-summary-heading">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="flex flex-1 items-center gap-4 rounded-xl bg-muted/50 p-5">
                <div className={`flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-4xl font-semibold ${pulse.tone}`} aria-hidden="true">
                  {pulse.arrow}
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Price pulse</p>
                  <h2 id="inflation-summary-heading" className={`mt-1 text-xl font-semibold ${pulse.tone}`}>{pulse.label}</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{pulse.description}</p>
                </div>
              </div>

              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">In plain language</p>
                <p className="mt-2 text-sm leading-relaxed">
                  <strong>{selectedName}</strong> for <strong>{latest.geography}</strong> was at <strong>{formatNumber(latest.indexValue)}</strong> in {latest.periodLabel}.
                  {latest.yoyInflationPercent !== null
                    ? latest.yoyInflationPercent >= 0
                      ? <> That is <strong>{formatNumber(latest.yoyInflationPercent, "%")}</strong> higher than the same month last year.</>
                      : <> That is <strong>{formatNumber(Math.abs(latest.yoyInflationPercent), "%")}</strong> lower than the same month last year.</>
                    : <> A year-on-year comparison is not available for this observation.</>}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {latest.yoyInflationPercent !== null && latest.yoyInflationPercent > 0
                    ? "A positive rate means the index is higher than a year ago; it does not mean every item rose by that amount."
                    : "The index is a weighted measure, so individual prices can move differently."}
                </p>
              </div>
            </div>

            {categoryHighlights.length > 0 ? (
              <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">Highest CPI category YoY</p>
                  <p className="mt-1 font-semibold">{categoryHighlights.at(-1)?.category}</p>
                  <p className="mt-1 text-sm tabular-nums">{formatNumber(categoryHighlights.at(-1)?.yoyInflationPercent ?? null, "%")} YoY</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">Lowest CPI category YoY</p>
                  <p className="mt-1 font-semibold">{categoryHighlights[0]?.category}</p>
                  <p className="mt-1 text-sm tabular-nums">{formatNumber(categoryHighlights[0]?.yoyInflationPercent ?? null, "%")} YoY</p>
                </div>
              </div>
            ) : null}

            <div className="mt-5 border-t border-border pt-5">
              <h3 className="text-sm font-semibold">A few useful meanings</h3>
              <ul className="mt-3 grid gap-2 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
                <li><strong className="text-foreground">* Index level:</strong> a basket score relative to its base period (=100); it is not a price in rupees.</li>
                <li><strong className="text-foreground">* Year-on-year:</strong> compares with the same month one year ago. A lower rate can still mean prices are rising, just more slowly.</li>
                <li><strong className="text-foreground">* Month-on-month:</strong> compares with the immediately previous month and can move around more.</li>
                {categoryHighlights.length > 0 ? <li><strong className="text-foreground">* Category rates:</strong> the highest rate is not automatically the biggest contribution to overall CPI; category weights differ.</li> : null}
                {isCore ? <li><strong className="text-foreground">* Core CPI:</strong> this tracker calculates it from CPI groups; it is not a separately published MoSPI index.</li> : null}
              </ul>
            </div>
          </section>
        ) : null}

        <aside className="mt-4 text-xs leading-relaxed text-muted-foreground">
          CPI base years are kept separate. Labour Bureau values shown here are limited to the recent all-India observations currently available in its page table. Market-return comparisons are not included in this release.
        </aside>
      </section>
    </main>
  );
}
