"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, Section } from "@takaki/go-design-system";

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

function formatLabel(dateStr: string): string {
  const dt = new Date(dateStr);
  const dow = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()];
  return `${dt.getMonth() + 1}/${dt.getDate()}(${dow})`;
}

function MiniChart({
  data,
  dataKey,
  color,
  target,
  yMax,
  unit,
}: {
  data: DayData[];
  dataKey: "protein_g" | "kcal";
  color: string;
  target: number;
  yMax: number;
  unit: string;
}) {
  const series = data.map((d) => ({ ...d, label: formatLabel(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={series}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e5e7eb"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#6b7280", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          domain={[0, yMax]}
          width={42}
          tickFormatter={(v) => `${v}${unit}`}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--color-foreground)" }}
        />
        <ReferenceLine
          y={target}
          stroke={color}
          strokeDasharray="4 4"
          opacity={0.5}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#fill-${dataKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeeklyChart({
  data,
  proteinTarget,
  calorieTarget,
}: WeeklyChartProps) {
  const maxProtein = Math.max(
    proteinTarget * 1.1,
    ...data.map((d) => d.protein_g),
    50,
  );
  const maxKcal = Math.max(
    calorieTarget * 1.1,
    ...data.map((d) => d.kcal),
    1500,
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Section title="タンパク質" description={`目安 ${proteinTarget}g/日`}>
        <Card>
          <CardContent className="p-3">
            <MiniChart
              data={data}
              dataKey="protein_g"
              color="hsl(150 60% 45%)"
              target={proteinTarget}
              yMax={Math.ceil(maxProtein / 10) * 10}
              unit="g"
            />
          </CardContent>
        </Card>
      </Section>
      <Section title="カロリー" description={`目安 ${calorieTarget}kcal/日`}>
        <Card>
          <CardContent className="p-3">
            <MiniChart
              data={data}
              dataKey="kcal"
              color="hsl(30 80% 55%)"
              target={calorieTarget}
              yMax={Math.ceil(maxKcal / 100) * 100}
              unit=""
            />
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
