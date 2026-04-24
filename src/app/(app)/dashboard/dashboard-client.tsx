"use client";

import Link from "next/link";
import { CalendarDays, UtensilsCrossed } from "lucide-react";
import { UserSettings, MealPlanWithRecipe, MEAL_TYPE_LABELS } from "@/types/database";
import { AppHeader } from "@/components/layout/app-header";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { PageHeader, Card, CardContent, Button, Badge } from "@takaki/go-design-system";

interface Props {
  settings: Partial<UserSettings>;
  todayPlans: MealPlanWithRecipe[];
  weeklyProtein: Array<{ planned_date: string; protein_g: number }>;
}

export function DashboardClient({ settings, todayPlans, weeklyProtein }: Props) {
  const proteinTarget = settings.protein_target_g ?? 108;
  const totalProtein = todayPlans.reduce(
    (s, p) => s + (p.recipe.protein_g_per_serving ?? 0) * p.servings,
    0,
  );

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-6 max-w-3xl">
        <PageHeader title="ダッシュボード" />

        {/* 今日の献立 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">今日の献立</h2>
            {totalProtein > 0 && (
              <Badge variant="secondary">P {Math.round(totalProtein)}g</Badge>
            )}
          </div>

          {todayPlans.length === 0 ? (
            <Link href="/plan" className="block">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col items-center gap-4 py-10">
                  <div className="rounded-full bg-primary/10 p-4">
                    <CalendarDays className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">今日の献立を計画する</p>
                    <p className="text-muted-foreground text-sm mt-1">まだ献立が登録されていません</p>
                  </div>
                  <Button>献立を追加</Button>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <div className="grid gap-2">
              {todayPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="flex items-center gap-3 py-3">
                    {plan.recipe.image_url ? (
                      <img
                        src={plan.recipe.image_url}
                        alt={plan.recipe.title}
                        className="w-12 h-12 rounded-md object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-surface-subtle flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{MEAL_TYPE_LABELS[plan.meal_type]}</p>
                      <p className="text-sm font-medium truncate">{plan.recipe.title}</p>
                    </div>
                    {plan.recipe.protein_g_per_serving && (
                      <span className="text-xs text-primary font-semibold shrink-0">
                        P {Math.round(plan.recipe.protein_g_per_serving * plan.servings)}g
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Link href="/plan">
                <Button variant="outline" className="w-full">献立を編集</Button>
              </Link>
            </div>
          )}
        </div>

        {/* 週次タンパク質推移 */}
        <WeeklyChart weekData={weeklyProtein} target={proteinTarget} />
      </div>
    </div>
  );
}
