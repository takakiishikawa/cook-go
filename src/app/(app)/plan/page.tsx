import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PlanClient } from "./plan-client";

function getWeekRange(offset = 0): { startDate: string; endDate: string } {
  const today = new Date();
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
  };
}

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { startDate, endDate } = getWeekRange(0);

  const [plans, recipes] = await Promise.all([
    db.plans.getWeek(supabase, user.id, startDate, endDate),
    db.recipes.getAll(supabase, user.id),
  ]);

  return (
    <PlanClient
      userId={user.id}
      initialPlans={plans}
      recipes={recipes}
      initialWeekStart={startDate}
    />
  );
}
