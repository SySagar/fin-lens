"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUnits } from "@/components/units-provider";

export type FlowPoint = {
  label: string;
  equity: number;
  debt: number;
  total: number;
};

export function FlowChart({ points }: { points: FlowPoint[] }) {
  const { convert, formatFlow, unit } = useUnits();

  const tickFormatter = (value: number) =>
    new Intl.NumberFormat(unit === "crore" ? "en-IN" : "en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(convert(value));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          barGap={4}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            width={60}
            tickLine={false}
            axisLine={false}
            tickFormatter={tickFormatter}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.45} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            formatter={(value) => formatFlow(Number(value))}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--foreground)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          />
          <Bar
            dataKey="equity"
            name="Equity"
            fill="var(--primary)"
            radius={[3, 3, 0, 0]}
            maxBarSize={30}
          />
          <Bar
            dataKey="debt"
            name="Debt"
            fill="var(--secondary)"
            radius={[3, 3, 0, 0]}
            maxBarSize={30}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="var(--tertiary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
