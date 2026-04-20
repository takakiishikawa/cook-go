"use client";

import Link from "next/link";
import { Beef, Flame, PlusCircle } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { MealLog, Recipe, UserSettings } from "@/types/database";
import { AppHeader } from "@/components/layout/app-header";
import { MealSummary } from "@/components/dashboard/meal-summary";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { RecipeSuggestionBanner } from "@/components/dashboard/recipe-suggestion-banner";
import { SectionCards, Button, PageHeader } from "@takaki/go-design-system";

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
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-6 max-w-3xl">
        {/* Greeting + action */}
        <PageHeader
          title={`${greeting}${userName ? `、${userName}さん` : ""}`}
          description={`${today.getMonth() + 1}月${today.getDate()}日（${weekDay}）`}
          actions={
            <Link href="/log">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                追加
              </Button>
            </Link>
          }
        />

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
