import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";

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

  const [settings, todayMeals, weekMeals] = await Promise.all([
    db.settings.get(supabase, user.id),
    db.meals.getToday(supabase, user.id, todayStr),
    db.meals.getWeek(supabase, user.id, sevenDaysAgo.toISOString()),
  ]);

  return (
    <DashboardClient
      user={user}
      settings={settings ?? { protein_target_g: 108, weight_kg: null }}
      todayMeals={todayMeals}
      weekMeals={weekMeals}
    />
  );
}
