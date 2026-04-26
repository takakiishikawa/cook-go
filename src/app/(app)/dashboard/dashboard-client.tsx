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
  type MealType,
  type Recipe,
} from "@/types/database";

interface Props {
  proteinTarget: number;
  initialDate: string;
  initialDateLogs: FoodLogWithRecipe[];
  twoWeekLogs: FoodLogWithRecipe[];
  recentByMealType: Record<MealType, FoodLogWithRecipe[]>;
  recipes: Recipe[];
}

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

export function DashboardClient({
  proteinTarget,
  initialDate,
  initialDateLogs,
  twoWeekLogs,
  recentByMealType,
  recipes,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [dateLogs, setDateLogs] =
    useState<FoodLogWithRecipe[]>(initialDateLogs);
  const [allLogs, setAllLogs] = useState<FoodLogWithRecipe[]>(twoWeekLogs);
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
      const res = await fetch(`/api/food-logs?date=${newDate}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDateLogs(data.logs as FoodLogWithRecipe[]);
    } catch {
      toast.error("取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const refreshChartLogs = async () => {
    const today = todayStr();
    const start = addDays(today, -13);
    try {
      const res = await fetch(`/api/food-logs?start=${start}&end=${today}`);
      const data = await res.json();
      if (data.error) return;
      setAllLogs(data.logs as FoodLogWithRecipe[]);
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

  const totalProteinToday = dateLogs.reduce(
    (s, l) => s + (l.actual_protein_g ?? 0),
    0,
  );
  const targetPct = Math.min(
    100,
    Math.round((totalProteinToday / proteinTarget) * 100),
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
      toast.success(`${log.recipe.title}を記録しました`);
      await Promise.all([
        fetchForDate(date),
        refreshChartLogs(),
        refreshRecent(),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "記録に失敗しました");
    }
  };

  const deleteLog = async (id: string) => {
    if (!confirm("削除しますか?")) return;
    try {
      const res = await fetch(`/api/food-logs?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("削除しました");
      await Promise.all([
        fetchForDate(date),
        refreshChartLogs(),
        refreshRecent(),
      ]);
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

  const logsByMealType = MEAL_TYPES.reduce(
    (acc, mt) => {
      acc[mt] = dateLogs.filter((l) => l.meal_type === mt);
      return acc;
    },
    {} as Record<MealType, FoodLogWithRecipe[]>,
  );

  // Weekly chart data: last 7 days
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(todayStr(), -6 + i);
    const protein = allLogs
      .filter((l) => l.logged_date === d)
      .reduce((s, l) => s + (l.actual_protein_g ?? 0), 0);
    return { planned_date: d, protein_g: Math.round(protein) };
  });

  // Week avg vs prev week
  const todayDate = todayStr();
  const lastWeekStart = addDays(todayDate, -6);
  const prevWeekStart = addDays(todayDate, -13);
  const prevWeekEnd = addDays(todayDate, -7);
  const lastWeekLogs = allLogs.filter(
    (l) => l.logged_date >= lastWeekStart && l.logged_date <= todayDate,
  );
  const prevWeekLogs = allLogs.filter(
    (l) => l.logged_date >= prevWeekStart && l.logged_date <= prevWeekEnd,
  );
  const lastWeekAvg =
    lastWeekLogs.length > 0
      ? lastWeekLogs.reduce((s, l) => s + (l.actual_protein_g ?? 0), 0) / 7
      : 0;
  const prevWeekAvg =
    prevWeekLogs.length > 0
      ? prevWeekLogs.reduce((s, l) => s + (l.actual_protein_g ?? 0), 0) / 7
      : 0;
  const weekDelta = lastWeekAvg - prevWeekAvg;

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-6 max-w-5xl">
        <PageHeader title="ダッシュボード" />

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

        {/* Stats row: today + week avg */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDate(date)} のタンパク質
                </span>
                <span className="text-sm">
                  <span className="text-2xl font-bold text-primary">
                    {Math.round(totalProteinToday)}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    / {proteinTarget}g
                  </span>
                </span>
              </div>
              <div className="h-2 bg-surface-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${targetPct}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 space-y-1">
              <span className="text-xs text-muted-foreground">
                直近1週間 平均/日
              </span>
              <div className="flex items-baseline justify-between">
                <span>
                  <span className="text-2xl font-bold text-foreground">
                    {Math.round(lastWeekAvg)}
                  </span>
                  <span className="text-muted-foreground text-sm"> g/日</span>
                </span>
                <span
                  className={`text-xs font-medium ${
                    weekDelta >= 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  先週比 {weekDelta >= 0 ? "+" : ""}
                  {Math.round(weekDelta)}g
                </span>
              </div>
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
                const logs = logsByMealType[mt];
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
                        {logs.length === 0 && lastLog && (
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
                          記録
                        </Button>
                      </div>

                      {logs.length === 0 ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            未記録
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
                          {logs.map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center gap-2 p-2 rounded-md bg-surface-subtle"
                            >
                              {log.recipe.image_url ? (
                                <img
                                  src={log.recipe.image_url}
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
                                  {log.recipe.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {log.servings}食分
                                </p>
                              </div>
                              {log.actual_protein_g != null && (
                                <span className="text-sm text-primary font-semibold shrink-0">
                                  P{Math.round(log.actual_protein_g)}g
                                </span>
                              )}
                              <button
                                onClick={() => deleteLog(log.id)}
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
        <Section title="週次推移">
          <WeeklyChart weekData={weeklyData} target={proteinTarget} />
        </Section>

        {recipes.length === 0 && (
          <Card>
            <CardContent className="py-6 flex flex-col items-center gap-3">
              <CalendarDays className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                まずはレシピを追加しましょう
              </p>
              <Button asChild>
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
            ? `${MEAL_TYPE_LABELS[pickerMealType]}に記録`
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
          toast.success("食事を記録しました");
          await Promise.all([
            fetchForDate(date),
            refreshChartLogs(),
            refreshRecent(),
          ]);
        }}
      />
    </div>
  );
}
