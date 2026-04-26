"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Section,
  toast,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { LogMealDialog } from "@/components/log-meal-dialog";
import { RecipePickerDialog } from "@/components/recipe-picker-dialog";
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  type FoodLogWithRecipe,
  type MealPlanWithRecipe,
  type MealType,
  type Recipe,
} from "@/types/database";

interface Props {
  proteinTarget: number;
  calorieTarget: number;
  initialDate: string;
  initialDateLogs: FoodLogWithRecipe[];
  initialDatePlans: MealPlanWithRecipe[];
  twoWeekLogs: FoodLogWithRecipe[];
  twoWeekPlans: MealPlanWithRecipe[];
  recentByMealType: Record<MealType, FoodLogWithRecipe[]>;
  recipes: Recipe[];
}

type Entry = {
  kind: "log" | "plan";
  id: string;
  meal_type: MealType;
  date: string;
  recipe_id: string;
  title: string;
  image_url: string | null;
  protein_g: number;
  kcal: number;
};

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${dow})`;
}

function logToEntry(l: FoodLogWithRecipe): Entry {
  return {
    kind: "log",
    id: l.id,
    meal_type: l.meal_type,
    date: l.logged_date,
    recipe_id: l.recipe_id,
    title: l.recipe.title,
    image_url: l.recipe.image_url,
    protein_g: l.actual_protein_g ?? 0,
    kcal: l.actual_calorie_kcal ?? 0,
  };
}

function planToEntry(p: MealPlanWithRecipe): Entry {
  const proteinPer = p.recipe.protein_g_per_serving ?? 0;
  const kcalPer = p.recipe.calorie_kcal_per_serving ?? 0;
  return {
    kind: "plan",
    id: p.id,
    meal_type: p.meal_type,
    date: p.planned_date,
    recipe_id: p.recipe_id,
    title: p.recipe.title,
    image_url: p.recipe.image_url,
    protein_g: proteinPer * p.servings,
    kcal: kcalPer * p.servings,
  };
}

export function DashboardClient({
  proteinTarget,
  calorieTarget,
  initialDate,
  initialDateLogs,
  initialDatePlans,
  twoWeekLogs,
  twoWeekPlans,
  recentByMealType,
  recipes,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [dateLogs, setDateLogs] =
    useState<FoodLogWithRecipe[]>(initialDateLogs);
  const [datePlans, setDatePlans] =
    useState<MealPlanWithRecipe[]>(initialDatePlans);
  const [allLogs, setAllLogs] = useState<FoodLogWithRecipe[]>(twoWeekLogs);
  const [allPlans, setAllPlans] =
    useState<MealPlanWithRecipe[]>(twoWeekPlans);
  const [recent, setRecent] =
    useState<Record<MealType, FoodLogWithRecipe[]>>(recentByMealType);
  const [loading, setLoading] = useState(false);
  const [logTarget, setLogTarget] = useState<{
    recipe: Recipe;
    mealType: MealType;
  } | null>(null);
  const [pickerMealType, setPickerMealType] = useState<MealType | null>(null);

  const isToday = date === todayStr();

  const recipesById = useMemo(() => {
    const m = new Map<string, Recipe>();
    recipes.forEach((r) => m.set(r.id, r));
    return m;
  }, [recipes]);

  const fetchForDate = async (newDate: string) => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/food-logs?date=${newDate}`).then((r) => r.json()),
        fetch(`/api/plan/week?start=${newDate}&end=${newDate}`).then((r) =>
          r.json(),
        ),
      ]);
      if (r1.error) throw new Error(r1.error);
      setDateLogs(r1.logs as FoodLogWithRecipe[]);
      setDatePlans((r2.plans ?? []) as MealPlanWithRecipe[]);
    } catch {
      toast.error("取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const refreshTwoWeek = async () => {
    const today = todayStr();
    const start = addDays(today, -13);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/food-logs?start=${start}&end=${today}`).then((r) =>
          r.json(),
        ),
        fetch(`/api/plan/week?start=${start}&end=${today}`).then((r) =>
          r.json(),
        ),
      ]);
      if (!r1.error) setAllLogs(r1.logs as FoodLogWithRecipe[]);
      setAllPlans((r2.plans ?? []) as MealPlanWithRecipe[]);
    } catch {
      // ignore
    }
  };

  const refreshRecent = async () => {
    try {
      const arrays = await Promise.all(
        MEAL_TYPES.map((mt) =>
          fetch(`/api/food-logs/recent?meal_type=${mt}&limit=3`)
            .then((r) => r.json())
            .then((d: { logs?: FoodLogWithRecipe[] }) => d.logs ?? []),
        ),
      );
      const next = MEAL_TYPES.reduce(
        (acc, mt, i) => {
          acc[mt] = arrays[i];
          return acc;
        },
        {} as Record<MealType, FoodLogWithRecipe[]>,
      );
      setRecent(next);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (date !== initialDate) fetchForDate(date);
  }, [date, initialDate]);

  const goDay = (delta: number) => setDate((d) => addDays(d, delta));

  const dateEntries: Entry[] = [
    ...dateLogs.map(logToEntry),
    ...datePlans.map(planToEntry),
  ];

  const totalProteinToday = dateEntries.reduce((s, e) => s + e.protein_g, 0);
  const totalKcalToday = dateEntries.reduce((s, e) => s + e.kcal, 0);

  const proteinPct = Math.min(
    100,
    Math.round((totalProteinToday / proteinTarget) * 100),
  );
  const kcalPct = Math.min(
    100,
    Math.round((totalKcalToday / calorieTarget) * 100),
  );

  const repeatLog = async (log: FoodLogWithRecipe, mealType: MealType) => {
    try {
      const res = await fetch("/api/food-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: log.recipe_id,
          logged_date: date,
          meal_type: mealType,
          servings: log.servings,
          overrides: log.overrides ?? null,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`${log.recipe.title}を追加しました`);
      await Promise.all([fetchForDate(date), refreshTwoWeek(), refreshRecent()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "記録に失敗しました");
    }
  };

  const deleteEntry = async (entry: Entry) => {
    try {
      if (entry.kind === "log") {
        const res = await fetch(`/api/food-logs?id=${entry.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      } else {
        const res = await fetch("/api/plan/map", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: entry.id }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      await Promise.all([fetchForDate(date), refreshTwoWeek(), refreshRecent()]);
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  const openRecord = (mealType: MealType) => {
    if (recipes.length === 0) {
      toast.error("先にレシピを登録してください");
      return;
    }
    setPickerMealType(mealType);
  };

  const entriesByMealType = MEAL_TYPES.reduce(
    (acc, mt) => {
      acc[mt] = dateEntries.filter((e) => e.meal_type === mt);
      return acc;
    },
    {} as Record<MealType, Entry[]>,
  );

  // Last 7 days data
  const dailyEntries = (d: string): Entry[] => [
    ...allLogs.filter((l) => l.logged_date === d).map(logToEntry),
    ...allPlans.filter((p) => p.planned_date === d).map(planToEntry),
  ];
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(todayStr(), -6 + i);
    const entries = dailyEntries(d);
    return {
      date: d,
      protein_g: Math.round(entries.reduce((s, e) => s + e.protein_g, 0)),
      kcal: Math.round(entries.reduce((s, e) => s + e.kcal, 0)),
    };
  });

  const todayDate = todayStr();
  const lastWeekStart = addDays(todayDate, -6);
  const lastWeekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(lastWeekStart, i),
  );
  const lastWeekTotals = lastWeekDays.map((d) => {
    const entries = dailyEntries(d);
    return {
      protein: entries.reduce((s, e) => s + e.protein_g, 0),
      kcal: entries.reduce((s, e) => s + e.kcal, 0),
    };
  });
  const lastWeekProteinAvg =
    lastWeekTotals.reduce((s, t) => s + t.protein, 0) / 7;
  const lastWeekKcalAvg = lastWeekTotals.reduce((s, t) => s + t.kcal, 0) / 7;

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-6 max-w-5xl">
        <PageHeader title="きょうの食事" />

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => goDay(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 text-sm border border-border rounded-md px-3 py-2 bg-background text-center"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => goDay(1)}
            disabled={date >= todayStr()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isToday && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDate(todayStr())}
            >
              今日
            </Button>
          )}
        </div>

        {/* Stats: today protein + kcal + week avg (4 columns) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="py-3 space-y-1.5">
              <span className="text-xs text-muted-foreground">
                {formatDate(date)} のタンパク質
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">
                  {Math.round(totalProteinToday)}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {proteinTarget}g
                </span>
              </div>
              <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 space-y-1.5">
              <span className="text-xs text-muted-foreground">
                {formatDate(date)} のカロリー
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-warning">
                  {Math.round(totalKcalToday)}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {calorieTarget}kcal
                </span>
              </div>
              <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning transition-all"
                  style={{ width: `${kcalPct}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 space-y-1">
              <span className="text-xs text-muted-foreground">
                最近のタンパク質
              </span>
              <div>
                <span className="text-2xl font-bold">
                  {Math.round(lastWeekProteinAvg)}
                </span>
                <span className="text-xs text-muted-foreground"> g/日</span>
              </div>
              <span className="text-xs text-muted-foreground">
                直近7日の平均
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 space-y-1">
              <span className="text-xs text-muted-foreground">
                最近のカロリー
              </span>
              <div>
                <span className="text-2xl font-bold">
                  {Math.round(lastWeekKcalAvg)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {" "}
                  kcal/日
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                直近7日の平均
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Today's meals */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            食事
          </h2>
          {loading ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                読み込み中...
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {MEAL_TYPES.map((mt) => {
                const entries = entriesByMealType[mt];
                const recentLogs = recent[mt] ?? [];
                const lastLog = recentLogs[0];
                return (
                  <Card key={mt}>
                    <CardContent className="py-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-semibold">
                          {MEAL_TYPE_LABELS[mt]}
                        </Badge>
                        <div className="flex-1" />
                        {entries.length === 0 && lastLog && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => repeatLog(lastLog, mt)}
                          >
                            <Repeat className="w-3 h-3" />
                            前回と同じ
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => openRecord(mt)}
                        >
                          <Plus className="w-3 h-3" />
                          追加
                        </Button>
                      </div>

                      {entries.length === 0 ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            まだ
                          </p>
                          {recentLogs.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                最近よく食べる
                              </p>
                              <div className="grid gap-1">
                                {recentLogs.map((log) => {
                                  const recipe = recipesById.get(log.recipe_id);
                                  if (!recipe) return null;
                                  return (
                                    <button
                                      key={log.id}
                                      onClick={() => repeatLog(log, mt)}
                                      className="flex items-center gap-2 p-1.5 rounded-md border border-border bg-surface-subtle hover:bg-muted text-left transition-colors"
                                    >
                                      {log.recipe.image_url ? (
                                        <img
                                          src={log.recipe.image_url}
                                          alt=""
                                          className="w-8 h-8 rounded object-cover shrink-0"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded bg-background flex items-center justify-center shrink-0">
                                          <UtensilsCrossed
                                            className="w-3 h-3 text-muted-foreground"
                                            strokeWidth={1.5}
                                          />
                                        </div>
                                      )}
                                      <span className="flex-1 text-xs truncate">
                                        {log.recipe.title}
                                      </span>
                                      {log.actual_protein_g != null && (
                                        <span className="text-xs text-primary font-semibold">
                                          P{Math.round(log.actual_protein_g)}g
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="grid gap-1.5">
                          {entries.map((entry) => (
                            <div
                              key={`${entry.kind}-${entry.id}`}
                              className="flex items-center gap-2 p-2 rounded-md bg-surface-subtle"
                            >
                              {entry.image_url ? (
                                <img
                                  src={entry.image_url}
                                  alt=""
                                  className="w-10 h-10 rounded object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-background flex items-center justify-center shrink-0">
                                  <UtensilsCrossed
                                    className="w-4 h-4 text-muted-foreground"
                                    strokeWidth={1.5}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {entry.title}
                                </p>
                                <div className="flex gap-1.5 text-xs text-muted-foreground">
                                  {entry.protein_g > 0 && (
                                    <span className="text-primary font-semibold">
                                      P{Math.round(entry.protein_g)}g
                                    </span>
                                  )}
                                  {entry.kcal > 0 && (
                                    <span>
                                      {Math.round(entry.kcal)}kcal
                                    </span>
                                  )}
                                  {entry.kind === "plan" && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] py-0 px-1"
                                    >
                                      予定
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => deleteEntry(entry)}
                                className="text-muted-foreground hover:text-destructive p-1"
                                title="削除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly chart */}
        <Section title="ここ1週間の動き">
          <WeeklyChart
            data={weekData}
            proteinTarget={proteinTarget}
            calorieTarget={calorieTarget}
          />
        </Section>

        {recipes.length === 0 && (
          <Card>
            <CardContent className="py-6 flex flex-col items-center gap-3">
              <CalendarDays className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                まずはレシピを追加しましょう
              </p>
              <Button asChild size="sm">
                <a href="/recipes/new">レシピを追加</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <RecipePickerDialog
        open={pickerMealType !== null}
        recipes={recipes}
        title={
          pickerMealType
            ? `${MEAL_TYPE_LABELS[pickerMealType]}に追加`
            : "レシピを選択"
        }
        onPick={(recipe) => {
          if (pickerMealType) {
            setLogTarget({ recipe, mealType: pickerMealType });
            setPickerMealType(null);
          }
        }}
        onClose={() => setPickerMealType(null)}
      />

      <LogMealDialog
        recipe={logTarget?.recipe ?? null}
        defaultMealType={logTarget?.mealType}
        defaultDate={date}
        onClose={() => setLogTarget(null)}
        onLogged={async () => {
          setLogTarget(null);
          toast.success("追加しました");
          await Promise.all([
            fetchForDate(date),
            refreshTwoWeek(),
            refreshRecent(),
          ]);
        }}
      />
    </div>
  );
}
