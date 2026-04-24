import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LogClient } from "./log-client";

export default async function LogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = new Date().toISOString().split("T")[0];

  const [todayMeals, recentMeals] = await Promise.all([
    db.meals.getToday(supabase, user.id, today),
    db.meals.getRecent(supabase, user.id, today),
  ]);

  return (
    <LogClient
      userId={user.id}
      todayMeals={todayMeals}
      recentMeals={recentMeals}
    />
  );
}
