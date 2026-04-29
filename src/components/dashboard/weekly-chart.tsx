import dynamic from "next/dynamic";

export interface WeeklyChartProps {
  data: { date: string; protein_g: number; kcal: number }[];
  proteinTarget: number;
  calorieTarget: number;
}

export const WeeklyChart = dynamic<WeeklyChartProps>(
  () =>
    import("./weekly-chart-inner").then((m) => ({
      default: m.WeeklyChartInner,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-[200px] rounded bg-muted animate-pulse" />
        <div className="h-[200px] rounded bg-muted animate-pulse" />
      </div>
    ),
  },
);
