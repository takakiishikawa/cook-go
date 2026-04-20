"use client";

import Link from "next/link";
import { Beef, Flame, Target } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { MealLog, Recipe, UserSettings } from "@/types/database";
import { AppHeader } from "@/components/layout/app-header";
import { MealSummary } from "@/components/dashboard/meal-summary";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { RecipeSuggestionBanner } from "@/components/dashboard/recipe-suggestion-banner";
import { SectionCards, Button } from "@takaki/go-design-system";

interface Props {
  user: User;
  settings: Partial<UserSettings>;
  todayMeals: MealLog[];
  weekMeals: Array<{ logged_at: string; protein_g: number; calorie_kcal: number | null }>;
  recipes: Recipe[];
}

export function DashboardClient({ user, settings, todayMeals, weekMeals, recipes }: Props) {
  const proteinTarget = settings.protein_target_g ?? 108;
  const totalProtein = todayMeals.reduce((sum, m) => sum + Number(m.protein_g), 0);
  const totalCalorie = todayMeals.reduce((sum, m) => sum + Number(m.calorie_kcal ?? 0), 0);
  const pct = Math.min(Math.round((totalProtein / proteinTarget) * 100), 100);
  const remaining = Math.max(proteinTarget - totalProtein, 0);
  const userName = user.user_metadata?.full_name?.split(" ")[0] ?? "";

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは";
  const weekDay = ["日", "月", "火", "水", "木", "金", "土"][today.getDay()];

  return (
    <div className="flex flex-col">
      <AppHeader title="CookGo" showSettings />

      <div className="px-4 md:px-8 pt-6 pb-8 space-y-6">
        {/* Greeting */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-foreground">
              {greeting}{userName ? `、${userName}さん` : ""}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {today.getMonth() + 1}月{today.getDate()}日（{weekDay}）
            </p>
          </div>
          <Link href="/log">
            <Button size="sm" className="gap-1.5">
              食事を記録
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <SectionCards
          cards={[
            {
              title: "今日のタンパク質",
              value: `${Math.round(totalProtein)}g`,
              description: `目標 ${proteinTarget}g`,
              progress: pct,
              icon: <Beef className="w-4 h-4" />,
              trend: totalProtein >= proteinTarget
                ? { direction: "up" as const, value: "目標達成！" }
                : remaining > 0
                  ? { direction: "neutral" as const, value: `あと ${Math.round(remaining)}g` }
                  : undefined,
            },
            {
              title: "今日のカロリー",
              value: totalCalorie > 0 ? `${Math.round(totalCalorie)}kcal` : "—",
              description: "本日の摂取カロリー",
              icon: <Flame className="w-4 h-4" />,
            },
            {
              title: "達成率",
              value: `${pct}%`,
              description: "タンパク質目標に対して",
              progress: pct,
              icon: <Target className="w-4 h-4" />,
            },
          ]}
        />

        {/* Today's meals by type */}
        <MealSummary meals={todayMeals} />

        {/* Weekly chart */}
        <WeeklyChart weekMeals={weekMeals} target={proteinTarget} />

        {/* Recipe suggestions */}
        {recipes.length > 0 && <RecipeSuggestionBanner recipes={recipes} />}
      </div>
    </div>
  );
}
