import dynamic from "next/dynamic";

export interface WeeklyChartProps {
  data: { date: string; protein_g: number; kcal: number }[];
  proteinTarget: number;
  calorieTarget: number;
}

const WeeklyChartInner = dynamic(() => import("./weekly-chart-inner"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />
    </div>
  ),
});

export function WeeklyChart(props: WeeklyChartProps) {
  return <WeeklyChartInner {...props} />;
}
