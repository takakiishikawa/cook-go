"use client";

import dynamic from "next/dynamic";

export interface WeeklyChartProps {
  data: { date: string; protein_g: number; kcal: number }[];
  proteinTarget: number;
  calorieTarget: number;
}

const WeeklyChartInner = dynamic(
  () => import("./weekly-chart-inner").then((m) => m.WeeklyChartInner),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="flex h-[200px] items-center justify-center text-sm text-muted-foreground"
          >
            読込中...
          </div>
        ))}
      </div>
    ),
  }
);

export function WeeklyChart(props: WeeklyChartProps) {
  return <WeeklyChartInner {...props} />;
}
