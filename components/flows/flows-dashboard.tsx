"use client";

import { useEffect, useMemo, useState } from "react";
import { DataFreshness } from "@/components/flows/data-freshness";
import { FlowChart, type FlowPoint } from "@/components/flows/flow-chart";
import { FlowTable } from "@/components/flows/flow-table";
import { UnitToggle } from "@/components/unit-toggle";
import { useUnits } from "@/components/units-provider";
import type { CdslResponse, NseResponse } from "@/lib/flows/types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const QUARTERS = [
  "Q1 (Jan–Mar)",
  "Q2 (Apr–Jun)",
  "Q3 (Jul–Sep)",
  "Q4 (Oct–Dec)",
];

type View = "monthly" | "quarterly";

type FlowsDashboardProps = {
  initialMonth: number;
  initialYear: number;
};

function debtOf(row: CdslResponse["rows"][number]) {
  return (
    row.values.debtGeneral + row.values.debtVRR + row.values.debtFAR
  );
}

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function FlowsDashboard({
  initialMonth,
  initialYear,
}: FlowsDashboardProps) {
  const { unit, fx, formatFlow } = useUnits();
  const [view, setView] = useState<View>("monthly");
  const [month, setMonth] = useState(initialMonth);
  const [quarter, setQuarter] = useState(Math.floor(initialMonth / 3));
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<CdslResponse | null>(null);
  const [nse, setNse] = useState<NseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/flows?source=cdsl&period=${view}&year=${year}`,
          { signal: controller.signal },
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to load CDSL data");
        }

        if (!controller.signal.aborted) {
          setData(payload as CdslResponse);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setData(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load CDSL data",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [view, year, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/flows?source=nse", {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const payload = (await response.json()) as NseResponse;
        if (!controller.signal.aborted) setNse(payload);
      } catch {
        // The NSE strip is supplementary; the page still works without it.
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const years = useMemo(
    () =>
      Array.from({ length: initialYear - 2001 }, (_, index) =>
        initialYear - index,
      ),
    [initialYear],
  );

  const maxMonth = year === initialYear ? initialMonth : 11;
  const maxQuarter = year === initialYear ? Math.floor(initialMonth / 3) : 3;

  const selected = useMemo(() => {
    if (!data || data.rows.length === 0) return null;

    if (view === "monthly") {
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      return (
        data.rows.find((row) => row.key === key) ??
        data.rows[data.rows.length - 1]
      );
    }

    return (
      data.rows.find((row) => row.key === `${year}-Q${quarter + 1}`) ??
      data.rows[data.rows.length - 1]
    );
  }, [data, view, year, month, quarter]);

  const chartPoints: FlowPoint[] = (data?.rows ?? []).map((row) => ({
    label: row.shortLabel.split(" ")[0],
    equity: row.values.equity,
    debt: debtOf(row),
    total: row.values.total,
  }));

  const asOf = formatDate(data?.asOf ?? null);
  const selectedLabel = selected?.label ?? `${MONTHS[month]} ${year}`;

  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                Reporting period
              </p>

              <div
                role="group"
                aria-label="Period view"
                className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted p-0.5"
              >
                {(["monthly", "quarterly"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={view === option}
                    onClick={() => setView(option)}
                    className={`h-6 rounded-full px-2.5 text-[11px] font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      view === option
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {view === "monthly" ? (
                <div className="relative">
                  <label htmlFor="reporting-month" className="sr-only">
                    Reporting month
                  </label>
                  <select
                    id="reporting-month"
                    value={Math.min(month, maxMonth)}
                    onChange={(event) => setMonth(Number(event.target.value))}
                    className="appearance-none rounded-lg border border-border bg-transparent py-1 pr-8 pl-1 text-3xl font-semibold tracking-tight text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-5xl"
                  >
                    {MONTHS.slice(0, maxMonth + 1).map((name, index) => (
                      <option key={name} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              ) : (
                <div className="relative">
                  <label htmlFor="reporting-quarter" className="sr-only">
                    Reporting quarter
                  </label>
                  <select
                    id="reporting-quarter"
                    value={Math.min(quarter, maxQuarter)}
                    onChange={(event) => setQuarter(Number(event.target.value))}
                    className="appearance-none rounded-lg border border-border bg-transparent py-1 pr-8 pl-1 text-2xl font-semibold tracking-tight text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-5xl"
                  >
                    {QUARTERS.slice(0, maxQuarter + 1).map((name, index) => (
                      <option key={name} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              )}

              <div className="relative">
                <label htmlFor="reporting-year" className="sr-only">
                  Reporting year
                </label>
                <select
                  id="reporting-year"
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className="appearance-none rounded-lg border border-border bg-transparent py-1 pr-8 pl-1 text-3xl font-semibold tracking-tight text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-5xl"
                >
                  {years.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <ChevronIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Net investment data for{" "}
              <span className="font-medium text-foreground">
                {selectedLabel}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end lg:pt-1">
            <UnitToggle />
            <p
              aria-live="polite"
              className="font-mono text-[10px] tracking-wide text-muted-foreground"
            >
              {fx
                ? `USD/INR ${fx.rate.toFixed(2)} · ${formatDate(fx.date)}`
                : unit === "usd-billion"
                  ? "Fetching USD/INR rate…"
                  : "INR values from official reports"}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-busy={loading}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6"
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        ) : data && data.rows.length === 0 ? (
          <EmptyState
            year={year}
            period={view}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        ) : data && selected ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  FPI / FII net investment
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.sourceLabel} ·{" "}
                  {asOf ? `as of ${asOf}` : `calendar year ${year}`}
                </p>
              </div>
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  View CDSL source ↗
                </a>
                <DataFreshness fetchedAt={data.fetchedAt} />
              </div>
            </div>

            <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              <Metric
                label="Total net"
                value={selected.values.total}
                caption={selectedLabel}
              />
              <Metric
                label="Equity"
                value={selected.values.equity}
                caption="Net FPI/FII investment"
              />
              <Metric
                label="Debt"
                value={debtOf(selected)}
                caption="General limit + VRR + FAR"
              />
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold">
                    Net flows by {data.period === "monthly" ? "month" : "quarter"}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Equity and debt bars; total net flow line.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="#flows-table"
                    className="rounded-sm text-[11px] font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Skip to table ↓
                  </a>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {unit === "crore" ? "INR crore" : "USD billion"}
                  </span>
                </div>
              </div>
              <div className="px-2 py-4 sm:px-4">
                <FlowChart
                  points={chartPoints}
                  label={`Net FPI/FII flows by ${data.period} for ${year}`}
                />
              </div>
            </div>

            {nse ? (
              <div className="mt-6 rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold">
                      Latest NSE session
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      FII/FPI vs DII trading activity · capital-market segment
                    </p>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {formatDate(nse.asOf)}
                  </span>
                </div>
                <div className="grid gap-px bg-border sm:grid-cols-2">
                  {nse.rows.map((row) => (
                    <div key={row.category} className="bg-card p-5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {row.category}
                      </p>
                      <p
                        className={`mt-1 text-2xl font-semibold tracking-tight ${
                          row.net >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatFlow(row.net)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Buy {formatFlow(row.buy)} · Sell{" "}
                        {formatFlow(row.sell)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="border-t border-border px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
                  NSE provides this as a latest-session snapshot; the chart and
                  table above use CDSL&apos;s historical series.
                </p>
              </div>
            ) : null}

            <div
              id="flows-table"
              className="mt-6 scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold">
                  {data.period === "monthly" ? "Monthly" : "Quarterly"} detail
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {unit === "crore" ? "INR crore" : "USD billion"}
                </span>
              </div>

              <FlowTable rows={data.rows} selectedKey={selected.key} />

              <div className="border-t border-border px-5 py-4 text-[11px] leading-relaxed text-muted-foreground">
                <p>
                  Source:{" "}
                  <a
                    href={data.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    CDSL FPI/FII reports
                  </a>
                  {asOf
                    ? ` · as of ${asOf}`
                    : ` · calendar year ${year}`}
                  . Figures are in INR crore unless the unit switch is changed;
                  USD values use the latest reference rate shown above.
                </p>
                {data.notes[0] ? <p className="mt-1">{data.notes[0]}</p> : null}
              </div>
            </div>

            <Methodology />
          </>
        ) : null}
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption: string;
}) {
  const { formatFlow } = useUnits();

  return (
    <div className="bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
          value >= 0 ? "text-positive" : "text-negative"
        }`}
      >
        {formatFlow(value)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function EmptyState({
  year,
  period,
  onRetry,
}: {
  year: number;
  period: View;
  onRetry: () => void;
}) {
  return (
    <div
      role="status"
      className="rounded-xl border border-border bg-card p-10 text-center"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        No observations
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">
        No {period} data for {year}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        CDSL has not published {period} figures for this year yet. Try another
        period, or retry if you expected data to be available.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        Try again
      </button>
    </div>
  );
}

function Methodology() {
  return (
    <section
      aria-labelledby="methodology-heading"
      className="mt-6 rounded-xl border border-border bg-card px-5 py-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="methodology-heading" className="text-sm font-semibold">
          Methodology &amp; coverage
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Read before comparing
        </span>
      </div>

      <dl className="mt-4 grid gap-4 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="font-medium text-foreground">CDSL series</dt>
          <dd className="mt-1">
            Monthly and quarterly FPI/FII net investment compiled by CDSL from
            custodian and depository reports. The latest period is provisional
            and reflects trades up to the previous trading day.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Category coverage</dt>
          <dd className="mt-1">
            Debt-FAR, mutual fund, and AIF categories were included from
            September 2024. Earlier periods do not have the same breakdown, so
            compare asset-class columns with care.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">NSE snapshot</dt>
          <dd className="mt-1">
            The latest-session card shows FII/FPI and DII cash-market trading
            activity. It is a different measure from CDSL investment flows and
            is not included in the chart totals.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Currency conversion</dt>
          <dd className="mt-1">
            USD values use the latest RBI reference rate shown above, not a
            period-average rate. Historical USD figures are indicative only.
          </dd>
        </div>
      </dl>
    </section>
  );
}

function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading flow data</span>
      <div className="h-6 w-56 animate-pulse rounded bg-muted" />
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="bg-card p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-7 w-36 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-border bg-card p-10 text-center"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-negative">
        Source unavailable
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">
        Could not load CDSL data
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {message}. The official report may be temporarily unavailable or may
        have changed format.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        Try again
      </button>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
