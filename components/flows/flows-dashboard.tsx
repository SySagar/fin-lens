"use client";

import { useState } from "react";
import { UnitToggle } from "@/components/unit-toggle";
import { useUnits } from "@/components/units-provider";


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

type FlowsDashboardProps = {
  initialMonth: number;
  initialYear: number;
};

export function FlowsDashboard({
  initialMonth,
  initialYear,
}: FlowsDashboardProps) {
  const { unit, fx } = useUnits();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const years = Array.from({ length: 25 }, (_, index) => initialYear - index);

  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                Reporting period
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="relative">
                  <label htmlFor="reporting-month" className="sr-only">
                    Reporting month
                  </label>
                  <select
                    id="reporting-month"
                    value={month}
                    onChange={(event) => setMonth(Number(event.target.value))}
                    className="appearance-none rounded-lg border border-border bg-transparent py-1 pr-8 pl-1 text-4xl font-semibold tracking-tight text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-5xl"
                  >
                    {MONTHS.map((name, index) => (
                      <option key={name} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                <div className="relative">
                  <label htmlFor="reporting-year" className="sr-only">
                    Reporting year
                  </label>
                  <select
                    id="reporting-year"
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    className="appearance-none rounded-lg border border-border bg-transparent py-1 pr-8 pl-1 text-4xl font-semibold tracking-tight text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-5xl"
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
                  {MONTHS[month]} {year}
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
                  ? `USD/INR ${fx.rate.toFixed(2)} · ${formatFxDate(fx.date)}`
                  : unit === "usd-billion"
                    ? "Fetching USD/INR rate…"
                    : "INR values from official reports"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Data source · pending
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">
            Connecting official FII / DII reports
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            The table and chart will use CDSL and NSE reports. Values are stored
            in INR crore and will convert to{" "}
            <span className="font-medium text-foreground">
              {unit === "usd-billion" ? "USD billion" : "INR crore"}
            </span>{" "}
            with the switch above.
          </p>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">
            {unit === "usd-billion"
              ? fx
                ? `USD values use ₹${fx.rate.toFixed(2)} per USD (${fx.source}, ${formatFxDate(fx.date)}).`
                : "Waiting for the USD/INR reference rate before converting."
              : "USD conversions use the RBI reference rate published with the CDSL data."}
          </p>
        </div>
      </section>
    </main>
  );
}

function formatFxDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
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
