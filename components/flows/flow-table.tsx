"use client";

import { useUnits } from "@/components/units-provider";
import type { CdslPeriod } from "@/lib/flows/types";

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

export function FlowTable({
  rows,
  selectedKey,
}: {
  rows: CdslPeriod[];
  selectedKey: string | null;
}) {
  const { formatFlow } = useUnits();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] border-collapse text-sm">
        <caption className="sr-only">
          FPI/FII net investment by period and asset class, in INR crore
        </caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="px-5 py-3 font-medium">
              Period
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              Equity
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              Debt
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              Hybrid
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              Mutual funds
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              AIFs
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
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
                  className={`px-5 py-3 text-left font-medium whitespace-nowrap ${
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
                  className={`px-5 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${
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
