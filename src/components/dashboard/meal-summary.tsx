"use client";

import Link from "next/link";
import { Plus, Sunrise, Sun, Moon, Cookie } from "lucide-react";
import { MealLog, MealType, MEAL_TYPE_LABELS } from "@/types/database";
import { cn } from "@/lib/utils";

interface MealSummaryProps {
  meals: MealLog[];
}

const MEAL_ICONS: Record<MealType, React.ElementType> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

export function MealSummary({ meals }: MealSummaryProps) {
  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

  const getMealsForType = (type: MealType) =>
    meals.filter((m) => m.meal_type === type);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">今日の食事</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {mealTypes.map((type) => {
          const typeMeals = getMealsForType(type);
          const totalProtein = typeMeals.reduce((sum, m) => sum + Number(m.protein_g), 0);
          const hasLog = typeMeals.length > 0;
          const Icon = MEAL_ICONS[type];

          return (
            <Link
              key={type}
              href={`/log?type=${type}`}
              className={cn(
                "rounded-xl border p-3 flex items-center gap-3 transition-colors",
                hasLog
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card border-border hover:bg-muted"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                hasLog ? "bg-primary/10" : "bg-muted"
              )}>
                <Icon className={cn("w-4 h-4", hasLog ? "text-primary" : "text-muted-foreground")} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{MEAL_TYPE_LABELS[type]}</p>
                {hasLog ? (
                  <p className="text-sm font-bold text-primary">{Math.round(totalProtein)}g</p>
                ) : (
                  <div className="flex items-center gap-0.5 text-muted-foreground">
                    <Plus className="w-3 h-3" />
                    <span className="text-xs">追加</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
