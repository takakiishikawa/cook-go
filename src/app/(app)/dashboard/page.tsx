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
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const [settings, todayPlans, weeklyProtein] = await Promise.all([
    db.settings.get(supabase, user.id),
    db.plans.getToday(supabase, user.id, todayStr),
    db.plans.getWeeklyProtein(supabase, user.id, sevenDaysAgoStr, todayStr),
  ]);

  return (
    <DashboardClient
      settings={settings ?? { protein_target_g: 108, weight_kg: null }}
      todayPlans={todayPlans}
      weeklyProtein={weeklyProtein}
    />
  );
}
