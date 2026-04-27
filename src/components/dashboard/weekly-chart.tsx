"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export interface WeeklyChartProps {
  data: { date: string; protein_g: number; kcal: number }[];
  proteinTarget: number;
  calorieTarget: number;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${dow})`;
}

export function WeeklyChart({ data, proteinTarget, calorieTarget }: WeeklyChartProps) {
  const chartData = data.map((d) => ({ ...d, label: fmtDate(d.date) }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-[200px] w-full">
        <p className="text-xs text-muted-foreground mb-1">タンパク質 (g)</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} width={28} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <ReferenceLine y={proteinTarget} stroke="#16a34a" strokeDasharray="4 2" />
            <Bar dataKey="protein_g" name="タンパク質(g)" fill="#16a34a" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-[200px] w-full">
        <p className="text-xs text-muted-foreground mb-1">カロリー (kcal)</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} width={36} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <ReferenceLine y={calorieTarget} stroke="#f59e0b" strokeDasharray="4 2" />
            <Bar dataKey="kcal" name="カロリー(kcal)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
