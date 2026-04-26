import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { FoodLogsRecentResponse } from "@/types/api";
import type { MealType } from "@/types/database";

const ALLOWED_MEAL_TYPES: ReadonlySet<MealType> = new Set([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const mealType = url.searchParams.get("meal_type") as MealType | null;
    const limitStr = url.searchParams.get("limit");
    if (!mealType || !ALLOWED_MEAL_TYPES.has(mealType))
      return NextResponse.json({ error: "meal_type が不正" }, { status: 400 });
    const limit = Math.min(Math.max(Number(limitStr) || 3, 1), 20);

    const logs = await db.foodLogs.getRecentByMealType(
      supabase,
      user.id,
      mealType,
      limit,
    );
    return NextResponse.json({ logs } satisfies FoodLogsRecentResponse);
  } catch (error) {
    console.error("food-logs/recent error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
