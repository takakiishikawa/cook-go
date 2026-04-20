"use client";

import { ChartArea, type ChartConfig } from "@takaki/go-design-system";

interface WeeklyChartProps {
  weekMeals: Array<{ logged_at: string; protein_g: number; calorie_kcal: number | null }>;
  target: number;
}

export function WeeklyChart({ weekMeals, target }: WeeklyChartProps) {
  const data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayMeals = weekMeals.filter((m) => m.logged_at.startsWith(dateStr));
    const protein = dayMeals.reduce((sum, m) => sum + Number(m.protein_g), 0);
    const calorie = dayMeals.reduce((sum, m) => sum + Number(m.calorie_kcal ?? 0), 0);
    return {
      day: ["日", "月", "火", "水", "木", "金", "土"][d.getDay()],
      protein: Math.round(protein),
      calorie: Math.round(calorie),
    };
  });

  const config: ChartConfig = {
    protein: { label: "タンパク質 (g)", color: "var(--color-primary)" },
    calorie: { label: "カロリー (kcal)", color: "var(--color-info)" },
  };

  return (
    <ChartArea
      data={data}
      config={config}
      xKey="day"
      yKeys={["protein"]}
      title="週次タンパク質推移"
      description={`目標 ${target}g/日`}
      timeRanges={[]}
      filterByDate={false}
      xTickFormatter={(v) => v}
    />
  );
}
