import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [settingsResult, todayMealsResult, weekMealsResult, recipesResult] = await Promise.all([
    supabase
      .schema("cookgo")
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .schema("cookgo")
      .from("meal_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", `${todayStr}T00:00:00`)
      .lte("logged_at", `${todayStr}T23:59:59`)
      .order("logged_at"),
    supabase
      .schema("cookgo")
      .from("meal_logs")
      .select("logged_at, protein_g, calorie_kcal")
      .eq("user_id", user.id)
      .gte("logged_at", sevenDaysAgo.toISOString())
      .order("logged_at"),
    supabase
      .schema("cookgo")
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const settings = settingsResult.data ?? { protein_target_g: 108, weight_kg: null };
  const todayMeals = todayMealsResult.data ?? [];
  const weekMeals = weekMealsResult.data ?? [];
  const recipes = recipesResult.data ?? [];

  return (
    <DashboardClient
      user={user}
      settings={settings}
      todayMeals={todayMeals}
      weekMeals={weekMeals}
      recipes={recipes}
    />
  );
}
