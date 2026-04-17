import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogClient } from "./log-client";

export default async function LogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = new Date().toISOString().split("T")[0];

  const [todayMealsResult, recentMealsResult, recurringResult] = await Promise.all([
    supabase
      .schema("cookgo")
      .from("meal_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", `${today}T00:00:00`)
      .lte("logged_at", `${today}T23:59:59`)
      .order("logged_at", { ascending: false }),
    supabase
      .schema("cookgo")
      .from("meal_logs")
      .select("*")
      .eq("user_id", user.id)
      .lt("logged_at", `${today}T00:00:00`)
      .order("logged_at", { ascending: false })
      .limit(10),
    supabase
      .schema("cookgo")
      .from("recurring_meals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <LogClient
      userId={user.id}
      todayMeals={todayMealsResult.data ?? []}
      recentMeals={recentMealsResult.data ?? []}
      recurringMeals={recurringResult.data ?? []}
    />
  );
}
