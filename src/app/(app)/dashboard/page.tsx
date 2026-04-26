import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";
import {
  MEAL_TYPES,
  type FoodLogWithRecipe,
  type MealType,
} from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split("T")[0];

  const [settings, todayLogs, twoWeekLogs, recipes, ...recentArrays] =
    await Promise.all([
      db.settings.get(supabase, user.id),
      db.foodLogs.getByDate(supabase, user.id, todayStr),
      db.foodLogs.getByDateRange(
        supabase,
        user.id,
        fourteenDaysAgoStr,
        todayStr,
      ),
      db.recipes.getAll(supabase, user.id, 200),
      ...MEAL_TYPES.map((mt) =>
        db.foodLogs.getRecentByMealType(supabase, user.id, mt, 3),
      ),
    ]);

  const recentByMealType = MEAL_TYPES.reduce(
    (acc, mt, i) => {
      acc[mt] = recentArrays[i] as FoodLogWithRecipe[];
      return acc;
    },
    {} as Record<MealType, FoodLogWithRecipe[]>,
  );

  return (
    <DashboardClient
      proteinTarget={settings?.protein_target_g ?? 108}
      initialDate={todayStr}
      initialDateLogs={todayLogs}
      twoWeekLogs={twoWeekLogs}
      recentByMealType={recentByMealType}
      recipes={recipes}
    />
  );
}
