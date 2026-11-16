"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InflationObservation } from "@/lib/inflation/types";

export function InflationChart({
  observations,
  label,
}: {
  observations: InflationObservation[];
  label: string;
}) {
  const points = observations.map((item) => ({
    month: item.periodLabel,
    index: item.indexValue,
    yoy: item.yoyInflationPercent,
  }));

  return (
    <div
      role="img"
      aria-label={`${label} index values by month. See the summary cards and plain-language explanation for the latest figures.`}
      className="h-[280px] w-full sm:h-[320px]"
    >
      <div aria-hidden="true" className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              width={54}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(value: number) => Number(value).toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
              formatter={(value, name) => [
                Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
                name === "index" ? "Index" : "YoY inflation",
              ]}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                color: "var(--foreground)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="index"
              name="Index"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
