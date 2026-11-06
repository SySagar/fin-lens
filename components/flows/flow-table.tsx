"use client";

import { useMemo, useState } from "react";
import { useUnits } from "@/components/units-provider";
import type { CdslPeriod } from "@/lib/flows/types";

type SortKey =
  | "period"
  | "equity"
  | "debt"
  | "hybrid"
  | "mutualFunds"
  | "aif"
  | "total";

type SortState = {
  key: SortKey;
  direction: "asc" | "desc";
};

const COLUMNS: Array<{
  key: SortKey;
  label: string;
  numeric: boolean;
}> = [
  { key: "period", label: "Period", numeric: false },
  { key: "equity", label: "Equity", numeric: true },
  { key: "debt", label: "Debt", numeric: true },
  { key: "hybrid", label: "Hybrid", numeric: true },
  { key: "mutualFunds", label: "Mutual funds", numeric: true },
  { key: "aif", label: "AIFs", numeric: true },
  { key: "total", label: "Total", numeric: true },
];

function debtOf(row: CdslPeriod) {
  return (
    row.values.debtGeneral + row.values.debtVRR + row.values.debtFAR
  );
}

function mutualFundsOf(row: CdslPeriod) {
  return (
    row.values.mfEquity +
    row.values.mfDebt +
    row.values.mfHybrid +
    row.values.mfSolution +
    row.values.mfOther
  );
}

function numericValueFor(
  row: CdslPeriod,
  key: Exclude<SortKey, "period">,
) {
  switch (key) {
    case "equity":
      return row.values.equity;
    case "debt":
      return debtOf(row);
    case "hybrid":
      return row.values.hybrid;
    case "mutualFunds":
      return mutualFundsOf(row);
    case "aif":
      return row.values.aif;
    case "total":
      return row.values.total;
  }
}

export function FlowTable({
  rows,
  selectedKey,
}: {
  rows: CdslPeriod[];
  selectedKey: string | null;
}) {
  const { formatFlow } = useUnits();
  const [sort, setSort] = useState<SortState>({
    key: "period",
    direction: "asc",
  });

  const sortedRows = useMemo(() => {
    const direction = sort.direction === "asc" ? 1 : -1;
    const key = sort.key;

    return [...rows].sort((a, b) => {
      if (key === "period") {
        return a.key.localeCompare(b.key) * direction;
      }

      return (numericValueFor(a, key) - numericValueFor(b, key)) * direction;
    });
  }, [rows, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: key === "period" ? "asc" : "desc",
      };
    });
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full min-w-[780px] border-collapse text-sm"
        aria-describedby="flows-table-help"
      >
        <caption id="flows-table-caption" className="sr-only">
          FPI/FII net investment by period and asset class. Values follow the
          selected unit. Select a column heading to sort.
        </caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              const ariaSort = active
                ? sort.direction === "asc"
                  ? "ascending"
                  : "descending"
                : "none";

              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={`px-3 py-3 font-medium first:pl-5 last:pr-5 ${
                    column.numeric ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className={`group inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      column.numeric ? "w-full justify-end" : ""
                    } ${active ? "text-foreground" : ""}`}
                  >
                    {column.label}
                    <SortIcon
                      active={active}
                      direction={sort.direction}
                    />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const selected = row.key === selectedKey;
            return (
              <tr
                key={row.key}
                className={`border-b border-border/60 transition-colors last:border-0 ${
                  selected ? "bg-muted/70" : ""
                }`}
              >
                <th
                  scope="row"
                  className={`py-3 pr-3 pl-5 text-left font-medium whitespace-nowrap ${
                    selected ? "text-primary" : ""
                  }`}
                >
                  {row.shortLabel}
                </th>
                <Cell value={row.values.equity} />
                <Cell value={debtOf(row)} />
                <Cell value={row.values.hybrid} />
                <Cell value={mutualFundsOf(row)} />
                <Cell value={row.values.aif} />
                <td
                  className={`py-3 pr-5 pl-3 text-right font-semibold tabular-nums whitespace-nowrap ${
                    row.values.total >= 0
                      ? "text-positive"
                      : "text-negative"
                  }`}
                >
                  {formatFlow(row.values.total, 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p id="flows-table-help" className="sr-only">
        Select a column heading to sort the table. Activating the same heading
        again reverses the order.
      </p>
    </div>
  );
}

function Cell({ value }: { value: number }) {
  const { formatFlow } = useUnits();
  return (
    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap text-muted-foreground">
      {formatFlow(value, 0)}
    </td>
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-3 transition-opacity ${
        active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
      }`}
    >
      {direction === "asc" || !active ? (
        <path d="m6 15 6-6 6 6" />
      ) : (
        <path d="m6 9 6 6 6-6" />
      )}
    </svg>
  );
}
