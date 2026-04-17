"use client";

import { User } from "@supabase/supabase-js";
import { MealLog, MealType, MEAL_TYPE_LABELS, Recipe, UserSettings } from "@/types/database";
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

  const userName = user.user_metadata?.full_name?.split(" ")[0] ?? "さん";

  const today = new Date();
  const greeting = today.getHours() < 12 ? "おはようございます" :
    today.getHours() < 18 ? "こんにちは" : "こんばんは";

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-2">
      <AppHeader title="CookGo" showSettings />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{greeting}、</p>
          <h2 className="font-heading text-2xl text-foreground">{userName}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {today.getMonth() + 1}月{today.getDate()}日
          </p>
        </div>
      </div>

      <ProteinGauge current={totalProtein} target={proteinTarget} />

      <MealSummary meals={todayMeals} />

      <WeeklyChart weekMeals={weekMeals} target={proteinTarget} />

      {recipes.length > 0 && <RecipeSuggestionBanner recipes={recipes} />}
    </div>
  );
}
