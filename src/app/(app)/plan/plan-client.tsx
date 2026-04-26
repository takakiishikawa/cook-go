"use client";

import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  UtensilsCrossed,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  PageHeader,
  Card,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import {
  Recipe,
  MealPlanWithRecipe,
  MealType,
  MEAL_TYPE_LABELS,
} from "@/types/database";
import { useFoodImage } from "@/hooks/use-food-image";

interface PlanClientProps {
  userId: string;
  initialPlans: MealPlanWithRecipe[];
  recipes: Recipe[];
  initialWeekStart: string;
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

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

function RecipeImage({ url, title }: { url: string | null; title: string }) {
  const titleEn = title;
  const { imageUrl } = useFoodImage(url ? null : titleEn);
  const src = url ?? imageUrl;

  if (!src) {
    return (
      <div className="w-full h-20 bg-surface-subtle flex items-center justify-center">
        <UtensilsCrossed
          className="w-5 h-5 text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
    );
  }
  return <img src={src} alt={title} className="w-full h-20 object-cover" />;
}

export function PlanClient({
  initialPlans,
  recipes,
  initialWeekStart,
}: PlanClientProps) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [plans, setPlans] = useState<MealPlanWithRecipe[]>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [servings, setServings] = useState<number>(1);
  const [repeatRule, setRepeatRule] = useState<
    "none" | "daily" | "weekdays" | "custom"
  >("none");
  const [repeatUntil, setRepeatUntil] = useState<string>("");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const plansByCell = new Map<string, MealPlanWithRecipe[]>();
  plans.forEach((p) => {
    const key = `${p.planned_date}:${p.meal_type}`;
    const arr = plansByCell.get(key) ?? [];
    arr.push(p);
    plansByCell.set(key, arr);
  });

  const fetchWeek = useCallback(async (start: string) => {
    setLoading(true);
    try {
      const end = addDays(start, 6);
      const res = await fetch(`/api/plan/week?start=${start}&end=${end}`);
      if (!res.ok) return;
      const data = (await res.json()) as { plans: MealPlanWithRecipe[] };
      setPlans(data.plans);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const goWeek = (delta: number) => {
    const next = addDays(weekStart, delta * 7);
    setWeekStart(next);
    fetchWeek(next);
  };

  const openCell = (date: string, mealType: MealType) => {
    setSelectedCell({ date, mealType });
    setSelectedRecipeId("");
    setServings(1);
    setRepeatRule("none");
    setRepeatUntil("");
    setCustomDays([]);
  };

  const saveMapping = async () => {
    if (!selectedCell || !selectedRecipeId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/plan/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: selectedRecipeId,
          planned_date: selectedCell.date,
          meal_type: selectedCell.mealType,
          servings,
          repeat_rule: repeatRule,
          repeat_days: customDays,
          repeat_until: repeatUntil || null,
        }),
      });
      const data = (await res.json()) as {
        plans_created: number;
        error?: string;
      };
      if (data.error) throw new Error(data.error);
      toast.success(`${data.plans_created}日分の献立を登録しました`);
      setSelectedCell(null);
      await fetchWeek(weekStart);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "献立の登録に失敗しました";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    try {
      await fetch("/api/plan/map", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setPlans(plans.filter((p) => p.id !== id));
      toast.success("削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  const toggleCustomDay = (dow: number) => {
    setCustomDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow],
    );
  };

  const existingPlans = selectedCell
    ? (plansByCell.get(`${selectedCell.date}:${selectedCell.mealType}`) ?? [])
    : [];

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-5 max-w-5xl">
        <PageHeader title="献立" description="週単位で食事計画を立てます" />

        {/* Week navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => goWeek(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium flex-1 text-center">
            {formatDate(weekStart)} 〜 {formatDate(weekEnd)}
          </span>
          <Button variant="outline" size="icon" onClick={() => goWeek(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          {loading && (
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Calendar grid */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className="w-16 p-2 text-xs text-muted-foreground font-normal text-left" />
                {weekDays.map((date) => (
                  <th
                    key={date}
                    className={`p-2 text-xs font-medium text-center ${isToday(date) ? "text-primary" : "text-foreground"}`}
                  >
                    <span
                      className={
                        isToday(date)
                          ? "bg-primary/10 px-2 py-0.5 rounded-full"
                          : ""
                      }
                    >
                      {formatDate(date)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map((mealType) => (
                <tr key={mealType}>
                  <td className="p-2 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">
                    {MEAL_TYPE_LABELS[mealType]}
                  </td>
                  {weekDays.map((date) => {
                    const cellPlans =
                      plansByCell.get(`${date}:${mealType}`) ?? [];
                    return (
                      <td key={date} className="p-1 align-top">
                        <div className="space-y-1">
                          {cellPlans.map((plan) => (
                            <div key={plan.id} className="relative group">
                              <Card className="overflow-hidden">
                                <RecipeImage
                                  url={plan.recipe.image_url}
                                  title={
                                    plan.recipe.title_en ?? plan.recipe.title
                                  }
                                />
                                <CardContent className="p-1.5">
                                  <p className="text-xs font-medium line-clamp-1 leading-tight">
                                    {plan.recipe.title}
                                  </p>
                                  {plan.recipe.protein_g_per_serving && (
                                    <p className="text-xs text-primary font-semibold mt-0.5">
                                      P{" "}
                                      {Math.round(
                                        plan.recipe.protein_g_per_serving *
                                          plan.servings,
                                      )}
                                      g
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePlan(plan.id);
                                }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-destructive text-white rounded-full p-0.5 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => openCell(date, mealType)}
                            className={`w-full rounded-md border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center transition-colors ${
                              cellPlans.length === 0 ? "h-20" : "h-8"
                            }`}
                            title="レシピを追加"
                          >
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Weekly protein summary */}
        {plans.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {weekDays.map((date) => {
              const dayPlans = MEAL_TYPES.flatMap(
                (t) => plansByCell.get(`${date}:${t}`) ?? [],
              );
              const totalProtein = dayPlans.reduce(
                (s, p) =>
                  s + (p.recipe.protein_g_per_serving ?? 0) * p.servings,
                0,
              );
              if (totalProtein === 0) return null;
              return (
                <div key={date} className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(date).split("(")[1].replace(")", "")}:
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(totalProtein)}g
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipe picker dialog */}
      <Dialog
        open={!!selectedCell}
        onOpenChange={(open) => !open && setSelectedCell(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedCell &&
                `${formatDate(selectedCell.date)} ${MEAL_TYPE_LABELS[selectedCell.mealType]}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {existingPlans.length > 0 && (
              <div className="text-xs text-muted-foreground bg-surface-subtle rounded-md px-3 py-2 space-y-0.5">
                現在: {existingPlans.map((p) => p.recipe.title).join(", ")}
              </div>
            )}

            {recipes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                レシピがありません。まずレシピを追加してください。
              </p>
            ) : (
              <>
                <Select
                  value={selectedRecipeId}
                  onValueChange={setSelectedRecipeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="レシピを選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title}
                        {r.protein_g_per_serving &&
                          ` (P${r.protein_g_per_serving}g)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">食分:</span>
                  <Select
                    value={String(servings)}
                    onValueChange={(v) => setServings(Number(v))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0.5, 1, 1.5, 2, 3].map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">
                    繰り返し:
                  </span>
                  <Select
                    value={repeatRule}
                    onValueChange={(v) => setRepeatRule(v as typeof repeatRule)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">この日のみ</SelectItem>
                      <SelectItem value="daily">毎日</SelectItem>
                      <SelectItem value="weekdays">平日（月〜金）</SelectItem>
                      <SelectItem value="custom">曜日指定</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {repeatRule === "custom" && (
                  <div className="flex gap-1">
                    {["日", "月", "火", "水", "木", "金", "土"].map(
                      (label, i) => (
                        <button
                          key={i}
                          onClick={() => toggleCustomDay(i)}
                          className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                            customDays.includes(i)
                              ? "bg-primary text-white"
                              : "bg-surface-subtle text-muted-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                )}

                {repeatRule !== "none" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      終了日:
                    </span>
                    <input
                      type="date"
                      value={repeatUntil}
                      onChange={(e) => setRepeatUntil(e.target.value)}
                      className="flex-1 text-sm border border-border rounded-md px-2 py-1.5 bg-background"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedCell(null)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={saveMapping}
                    disabled={!selectedRecipeId || saving}
                  >
                    {saving ? "登録中..." : "登録"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
