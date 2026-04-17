"use client";

import { User } from "@supabase/supabase-js";
import { MealLog, Recipe, UserSettings } from "@/types/database";
import { AppHeader } from "@/components/layout/app-header";
import { ProteinGauge } from "@/components/dashboard/protein-gauge";
import { MealSummary } from "@/components/dashboard/meal-summary";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { RecipeSuggestionBanner } from "@/components/dashboard/recipe-suggestion-banner";

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
  const userName = user.user_metadata?.full_name?.split(" ")[0] ?? "";

  const today = new Date();
  const greeting = today.getHours() < 12 ? "おはようございます" :
    today.getHours() < 18 ? "こんにちは" : "こんばんは";

  return (
    <div className="flex flex-col">
      <AppHeader title="CookGo" showSettings />

      <div className="px-4 md:px-8 pt-5 pb-4 space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}{userName ? `、${userName}` : ""}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {today.getMonth() + 1}月{today.getDate()}日（{["日", "月", "火", "水", "木", "金", "土"][today.getDay()]}）
          </p>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-5 space-y-5 md:space-y-0">
          <ProteinGauge current={totalProtein} target={proteinTarget} />
          <MealSummary meals={todayMeals} />
        </div>

        <WeeklyChart weekMeals={weekMeals} target={proteinTarget} />

        {recipes.length > 0 && <RecipeSuggestionBanner recipes={recipes} />}
      </div>
    </div>
  );
}
