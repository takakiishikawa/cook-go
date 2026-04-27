"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface WeeklyDataPoint {
  date: string;
  [key: string]: string | number | null | undefined;
}

export interface ProductSeries {
  id: string;
  name: string;
  color: string;
}

export interface WeeklyChartProps {
  deployData: WeeklyDataPoint[];
  scoreData: WeeklyDataPoint[];
  products: ProductSeries[];
}

export function WeeklyChart({ deployData, scoreData, products }: WeeklyChartProps) {
  const noData = deployData.length === 0 && scoreData.length === 0;
  if (noData) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex h-[232px] items-center justify-center text-sm text-muted-foreground">
          データがまだありません
        </div>
        <div className="flex h-[232px] items-center justify-center text-sm text-muted-foreground">
          データがまだありません
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-[232px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={deployData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              width={32}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--color-border)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
            {products.map((p) => (
              <Bar key={p.id} dataKey={p.id} name={p.name} fill={p.color} stackId="a" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-[232px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={scoreData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              width={32}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--color-border)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
            {products.map((p) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                name={p.name}
                stroke={p.color}
                strokeWidth={1.8}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}