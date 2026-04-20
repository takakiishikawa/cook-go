"use client";

import { Card, CardContent, ProgressCircular } from "@takaki/go-design-system";

interface ProteinGaugeProps {
  current: number;
  target: number;
}

export function ProteinGauge({ current, target }: ProteinGaugeProps) {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  const remaining = Math.max(target - current, 0);
  const isOver = current > target;

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-5">
          <ProgressCircular
            value={pct}
            size="xl"
            color={isOver ? "warning" : "primary"}
            showLabel
          />
          <div className="flex-1 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">タンパク質</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">{Math.round(current)}</span>
              <span className="text-sm text-muted-foreground">/ {target}g</span>
            </div>
            {isOver ? (
              <p className="text-sm font-medium text-warning">+{Math.round(current - target)}g 超過</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                あと <span className="font-semibold text-foreground">{Math.round(remaining)}g</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
