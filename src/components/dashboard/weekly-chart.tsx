import dynamic from "next/dynamic";
import type { WeeklyChartProps } from "./weekly-chart-client";

export const WeeklyChart = dynamic<WeeklyChartProps>(
  () =>
    import("./weekly-chart-client").then((m) => ({ default: m.WeeklyChart })),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-[232px] animate-pulse rounded-lg bg-surface-subtle" />
        <div className="h-[232px] animate-pulse rounded-lg bg-surface-subtle" />
      </div>
    ),
  },
);
