"use client";

import { ChartArea, type ChartConfig } from "@takaki/go-design-system";

interface DayData {
  date: string;
  protein_g: number;
  kcal: number;
}

interface WeeklyChartProps {
  data: DayData[];
  proteinTarget: number;
  calorieTarget: number;
}

export function WeeklyChart({
  data,
  proteinTarget,
  calorieTarget,
}: WeeklyChartProps) {
  const chartData = data.map((d) => {
    const dt = new Date(d.date);
    const dow = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()];
    return {
      day: `${dt.getMonth() + 1}/${dt.getDate()}(${dow})`,
      protein: d.protein_g,
      kcal: d.kcal,
    };
  });

  const proteinConfig: ChartConfig = {
    protein: { label: "タンパク質 (g)", color: "var(--color-primary)" },
  };
  const kcalConfig: ChartConfig = {
    kcal: { label: "カロリー (kcal)", color: "var(--color-warning)" },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartArea
        data={chartData}
        config={proteinConfig}
        xKey="day"
        yKeys={["protein"]}
        title="タンパク質"
        description={`目安 ${proteinTarget}g/日`}
        timeRanges={[]}
        filterByDate={false}
        xTickFormatter={(v) => v}
      />
      <ChartArea
        data={chartData}
        config={kcalConfig}
        xKey="day"
        yKeys={["kcal"]}
        title="カロリー"
        description={`目安 ${calorieTarget}kcal/日`}
        timeRanges={[]}
        filterByDate={false}
        xTickFormatter={(v) => v}
      />
    </div>
  );
}
