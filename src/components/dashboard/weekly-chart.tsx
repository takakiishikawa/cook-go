"use client";

import { ChartArea, type ChartConfig } from "@takaki/go-design-system";

interface WeeklyChartProps {
  weekData: Array<{ planned_date: string; protein_g: number }>;
  target: number;
}

export function WeeklyChart({ weekData, target }: WeeklyChartProps) {
  const data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const entry = weekData.find((m) => m.planned_date === dateStr);
    const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return {
      day: `${d.getMonth() + 1}/${d.getDate()}(${dow})`,
      protein: entry?.protein_g ?? 0,
    };
  });

  const config: ChartConfig = {
    protein: { label: "タンパク質 (g)", color: "var(--color-primary)" },
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
