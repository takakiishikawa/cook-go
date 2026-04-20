"use client";

import { cn } from "@/lib/utils";

interface ProteinGaugeProps {
  current: number;
  target: number;
}

export function ProteinGauge({ current, target }: ProteinGaugeProps) {
  const pct = Math.min((current / target) * 100, 110);
  const remaining = Math.max(target - current, 0);
  const isOver = current > target;

  const gaugeColor = pct < 50
    ? "bg-primary/35"
    : pct < 80
    ? "bg-primary/65"
    : pct <= 100
    ? "bg-primary"
    : "bg-warning";

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 card-shadow">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">タンパク質</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-heading text-4xl text-foreground">{Math.round(current)}</span>
            <span className="text-muted-foreground text-sm">/ {target}g</span>
          </div>
        </div>
        <div className="text-right">
          {isOver ? (
            <span className="text-warning font-semibold text-sm">+{Math.round(current - target)}g 超過</span>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">あと</p>
              <p className="font-semibold text-foreground">{Math.round(remaining)}g</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", gaugeColor)}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>0g</span>
          <span className={cn("font-medium", pct >= 100 ? "text-primary" : "")}>
            {Math.round(pct)}% 達成
          </span>
          <span>{target}g</span>
        </div>
      </div>
    </div>
  );
}
