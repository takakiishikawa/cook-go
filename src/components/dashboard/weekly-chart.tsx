"use client";

import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";

interface WeeklyChartProps {
  weekMeals: Array<{ logged_at: string; protein_g: number; calorie_kcal: number | null }>;
  target: number;
}

export function WeeklyChart({ weekMeals, target }: WeeklyChartProps) {
  const data = Array.from({ length: 7 }, (_: unknown, i: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayMeals = weekMeals.filter((m) => m.logged_at.startsWith(dateStr));
    const protein = dayMeals.reduce((sum, m) => sum + Number(m.protein_g), 0);
    return {
      day: ["日", "月", "火", "水", "木", "金", "土"][d.getDay()],
      protein: Math.round(protein),
      isToday: i === 6,
    };
  });

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">週次推移</h3>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis
            dataKey="day"
            tick={{ fontSize: 14, fill: "var(--color-text-secondary)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, Math.max(target * 1.2, 30)]} />
          <Tooltip
            formatter={(value) => [`${value}g`, "タンパク質"]}
            contentStyle={{ fontSize: 14, borderRadius: 6, border: "1px solid var(--color-border-default)" }}
          />
          <ReferenceLine
            y={target}
            stroke="var(--color-primary)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <Bar
            dataKey="protein"
            radius={[4, 4, 0, 0]}
            fill="var(--color-primary)"
            fillOpacity={0.5}
            className="transition-all"
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-sm text-muted-foreground text-center">--- 目標 {target}g</p>
    </div>
  );
}
