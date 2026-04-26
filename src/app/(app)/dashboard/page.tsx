import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DB_SCHEMA } from "@/lib/constants";
import { DashboardClient } from "./dashboard-client";
import { type MealPlanWithRecipe } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split("T")[0];

  const fetchPlansByDate = async (date: string) => {
    const { data } = await supabase
      .schema(DB_SCHEMA)
      .from("meal_plans")
      .select(
        "*, recipe:recipes(id, title, title_en, image_url, protein_g_per_serving, calorie_kcal_per_serving, servings)",
      )
      .eq("user_id", user.id)
      .eq("planned_date", date);
    return (data ?? []) as unknown as MealPlanWithRecipe[];
  };
  const fetchPlansRange = async (start: string, end: string) => {
    const { data } = await supabase
      .schema(DB_SCHEMA)
      .from("meal_plans")
      .select(
        "*, recipe:recipes(id, title, title_en, image_url, protein_g_per_serving, calorie_kcal_per_serving, servings)",
      )
      .eq("user_id", user.id)
      .gte("planned_date", start)
      .lte("planned_date", end);
    return (data ?? []) as unknown as MealPlanWithRecipe[];
  };

  const [settings, todayLogs, twoWeekLogs, todayPlans, twoWeekPlans, recipes] =
    await Promise.all([
      db.settings.get(supabase, user.id),
      db.foodLogs.getByDate(supabase, user.id, todayStr),
      db.foodLogs.getByDateRange(
        supabase,
        user.id,
        fourteenDaysAgoStr,
        todayStr,
      ),
      fetchPlansByDate(todayStr),
      fetchPlansRange(fourteenDaysAgoStr, todayStr),
      db.recipes.getAll(supabase, user.id, 200),
    ]);

  return (
    <DashboardClient
      proteinTarget={settings?.protein_target_g ?? 108}
      calorieTarget={settings?.calorie_target_kcal ?? 2000}
      initialDate={todayStr}
      initialDateLogs={todayLogs}
      initialDatePlans={todayPlans}
      twoWeekLogs={twoWeekLogs}
      twoWeekPlans={twoWeekPlans}
      recipes={recipes}
    />
  );
}
