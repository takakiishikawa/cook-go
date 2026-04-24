"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { MealLog, UserSettings } from "@/types/database";
import { AppHeader } from "@/components/layout/app-header";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { PageHeader, Card, CardContent, Button } from "@takaki/go-design-system";

interface Props {
  user: User;
  settings: Partial<UserSettings>;
  todayMeals: MealLog[];
  weekMeals: Array<{ logged_at: string; protein_g: number; calorie_kcal: number | null }>;
}

export function DashboardClient({ settings, todayMeals, weekMeals }: Props) {
  const proteinTarget = settings.protein_target_g ?? 108;
  const recordCount = todayMeals.length;

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-6 max-w-3xl">
        <PageHeader title="ダッシュボード" />

        {/* 今日の記録アップロード CTA */}
        <Link href="/log" className="block">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <div className="rounded-full bg-primary/10 p-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">今日の食事を記録する</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {recordCount > 0 ? `本日 ${recordCount} 件記録済み` : "まだ記録がありません"}
                </p>
              </div>
              <Button>記録を追加</Button>
            </CardContent>
          </Card>
        </Link>

        {/* 週次タンパク質推移 */}
        <WeeklyChart weekMeals={weekMeals} target={proteinTarget} />
      </div>
    </div>
  );
}
