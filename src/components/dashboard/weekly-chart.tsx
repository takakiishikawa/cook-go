"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export interface WeeklyChartProps {
  data: { date: string; protein_g: number; kcal: number }[];
  proteinTarget: number;
  calorieTarget: number;
}

export function WeeklyChart({
  data,
  proteinTarget,
  calorieTarget,
}: WeeklyChartProps) {
  if (data.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="flex h-[200px] items-center justify-center text-sm text-muted-foreground"
          >
            データなし
          </div>
        ))}
      </div>
    );
  }

  const axisProps = {
    tick: { fontSize: 11, fill: "var(--color-text-secondary)" },
    tickLine: false,
    axisLine: { stroke: "var(--color-border)" },
  } as const;

  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid var(--color-border)",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <ReferenceLine
              y={proteinTarget}
              stroke="#0052CC"
              strokeDasharray="4 2"
            />
            <Bar dataKey="protein_g" name="タンパク質 (g)" fill="#0052CC" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <ReferenceLine
              y={calorieTarget}
              stroke="#FF5630"
              strokeDasharray="4 2"
            />
            <Bar dataKey="kcal" name="カロリー (kcal)" fill="#FF5630" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}