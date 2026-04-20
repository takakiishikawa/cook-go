"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, Trash2, Edit2, RefreshCw, CalendarRange, Link2, Utensils } from "lucide-react";
import { toast } from "sonner";
import {
  Button, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Card, CardContent, Section, Badge,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { MealLog, MealType, MEAL_TYPE_LABELS, RecurringMeal } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MealEditDialog } from "@/components/log/meal-edit-dialog";
import { RecurringMealDialog } from "@/components/log/recurring-meal-dialog";

interface LogClientProps {
  userId: string;
  todayMeals: MealLog[];
  recentMeals: MealLog[];
  recurringMeals: RecurringMeal[];
}

type AnalysisResult = {
  description: string;
  protein_g: number;
  calorie_kcal: number;
  meal_type: MealType;
};

export function LogClient({ userId, todayMeals: initialTodayMeals, recentMeals, recurringMeals }: LogClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [todayMeals, setTodayMeals] = useState<MealLog[]>(initialTodayMeals);
  const [analyzing, setAnalyzing] = useState(false);
  const [pendingResult, setPendingResult] = useState<AnalysisResult | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkDays, setBulkDays] = useState(5);

  const getCurrentMealType = (): MealType => {
    const h = new Date().getHours();
    if (h < 10) return "breakfast";
    if (h < 14) return "lunch";
    if (h < 20) return "dinner";
    return "snack";
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      const objectUrl = ev.target?.result as string;
      setPendingImageUrl(objectUrl);
      try {
        const res = await fetch("/api/meals/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64, meal_type: getCurrentMealType(), recipe_url: recipeUrl.trim() || undefined }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPendingResult({ ...data, meal_type: data.meal_type ?? getCurrentMealType() });
      } catch {
        toast.error("画像解析に失敗しました");
        setPendingImageUrl(null);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveMeal = async () => {
    if (!pendingResult) return;
    setSaving(true);
    const { error, data } = await supabase
      .schema("cookgo")
      .from("meal_logs")
      .insert({
        user_id: userId,
        meal_type: pendingResult.meal_type,
        description: pendingResult.description,
        protein_g: pendingResult.protein_g,
        calorie_kcal: pendingResult.calorie_kcal,
        photo_url: pendingImageUrl,
      })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error("保存に失敗しました"); return; }
    setTodayMeals([data as MealLog, ...todayMeals]);
    setPendingResult(null);
    setPendingImageUrl(null);
    toast.success("記録しました");
    router.refresh();
  };

  const repeatMeal = async (meal: MealLog) => {
    const { error, data } = await supabase
      .schema("cookgo")
      .from("meal_logs")
      .insert({
        user_id: userId,
        meal_type: getCurrentMealType(),
        description: meal.description,
        protein_g: meal.protein_g,
        calorie_kcal: meal.calorie_kcal,
        is_repeat: true,
        source_meal_id: meal.id,
      })
      .select()
      .single();
    if (error) { toast.error("登録に失敗しました"); return; }
    setTodayMeals([data as MealLog, ...todayMeals]);
    toast.success("今日の食事に追加しました");
    router.refresh();
  };

  const deleteMeal = async (id: string) => {
    const { error } = await supabase.schema("cookgo").from("meal_logs").delete().eq("id", id);
    if (error) { toast.error("削除に失敗しました"); return; }
    setTodayMeals(todayMeals.filter((m) => m.id !== id));
    toast.success("削除しました");
  };

  const bulkRegister = async (recurring: RecurringMeal) => {
    const today = new Date();
    const inserts = Array.from({ length: bulkDays }, (_: unknown, i: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      return {
        user_id: userId,
        meal_type: recurring.meal_type,
        description: recurring.name,
        protein_g: recurring.protein_g,
        calorie_kcal: recurring.calorie_kcal,
        is_repeat: true,
        logged_at: `${dateStr}T12:00:00`,
      };
    });
    const { error } = await supabase.schema("cookgo").from("meal_logs").insert(inserts);
    if (error) { toast.error("一括登録に失敗しました"); return; }
    toast.success(`${bulkDays}日分を登録しました`);
    router.refresh();
  };

  const totalProtein = todayMeals.reduce((s, m) => s + Number(m.protein_g), 0);

  return (
    <div className="flex flex-col">
      <AppHeader title="食事記録" />

      {/* Today summary */}
      {todayMeals.length > 0 && (
        <div className="px-4 md:px-8 pt-4">
          <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded-md px-4 py-3">
            <Utensils className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">今日の合計</p>
              <p className="text-xs text-muted-foreground">{todayMeals.length}品</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{Math.round(totalProtein)}g</p>
              <p className="text-xs text-muted-foreground">タンパク質</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 pb-4">
        <Tabs defaultValue="camera" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="camera" className="flex-1 gap-1.5">
              <Camera className="w-3.5 h-3.5" />写真
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />履歴
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1 gap-1.5">
              <CalendarRange className="w-3.5 h-3.5" />まとめて
            </TabsTrigger>
          </TabsList>

          {/* Camera tab */}
          <TabsContent value="camera" className="mt-4 space-y-4">
            {!pendingResult && (
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2.5">
                <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="レシピURLを貼る（任意）"
                  value={recipeUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipeUrl(e.target.value)}
                  className="border-0 bg-transparent text-sm h-auto p-0 focus-visible:ring-0"
                />
              </div>
            )}

            {pendingResult ? (
              <div className="space-y-3">
                {pendingImageUrl && (
                  <img src={pendingImageUrl} alt="food" className="w-full h-52 object-cover rounded-md" />
                )}
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <p className="font-semibold text-foreground">{pendingResult.description}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-primary/5 rounded-md py-3">
                        <p className="text-xs text-muted-foreground mb-1">タンパク質</p>
                        <p className="font-bold text-primary text-xl">{pendingResult.protein_g}g</p>
                      </div>
                      <div className="text-center bg-surface-subtle rounded-md py-3">
                        <p className="text-xs text-muted-foreground mb-1">カロリー</p>
                        <p className="font-bold text-foreground text-xl">{pendingResult.calorie_kcal}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                      <div className="text-center bg-surface-subtle rounded-md py-2">
                        <p className="text-xs text-muted-foreground mb-1">食事区分</p>
                        <Select
                          value={pendingResult.meal_type}
                          onValueChange={(v) => setPendingResult({ ...pendingResult, meal_type: v as MealType })}
                        >
                          <SelectTrigger className="h-auto border-none shadow-none p-0 text-sm font-medium justify-center">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((t) => (
                              <SelectItem key={t} value={t}>{MEAL_TYPE_LABELS[t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setPendingResult(null); setPendingImageUrl(null); }}>
                    キャンセル
                  </Button>
                  <Button className="flex-1" onClick={saveMeal} disabled={saving}>
                    {saving ? "保存中..." : "記録する"}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                className={cn(
                  "w-full h-48 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors",
                  analyzing ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                {analyzing ? (
                  <>
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">AIが解析中...</p>
                      <p className="text-xs text-muted-foreground mt-0.5">しばらくお待ちください</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">写真を選択</p>
                      <p className="text-xs text-muted-foreground mt-0.5">AIが栄養を自動分析します</p>
                    </div>
                  </>
                )}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />

            {todayMeals.length > 0 && (
              <Section title="今日の記録" description={`${todayMeals.length}品`}>
                <div className="space-y-1.5 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                  {todayMeals.map((meal) => (
                    <div key={meal.id} className="bg-card border border-border rounded-md p-3 flex items-center gap-3">
                      {meal.photo_url ? (
                        <img src={meal.photo_url} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-surface-subtle flex items-center justify-center flex-shrink-0">
                          <Utensils className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{meal.description ?? "食事"}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {meal.meal_type ? MEAL_TYPE_LABELS[meal.meal_type] : ""}
                          </Badge>
                          <span className="text-sm text-primary font-semibold">{meal.protein_g}g</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        <button onClick={() => setEditingMeal(meal)} className="p-1.5 hover:bg-muted rounded-md">
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => deleteMeal(meal.id)} className="p-1.5 hover:bg-destructive/10 rounded-md">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">過去の食事をタップして今日に追加</p>
            {recentMeals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">記録がありません</p>
            ) : (
              <div className="space-y-1.5 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                {recentMeals.map((meal) => (
                  <div key={meal.id} className="bg-card border border-border rounded-md p-3 flex items-center gap-3">
                    {meal.photo_url ? (
                      <img src={meal.photo_url} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-surface-subtle flex items-center justify-center flex-shrink-0">
                        <Utensils className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{meal.description ?? "食事"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="text-primary font-semibold">{meal.protein_g}g</span>
                        {meal.calorie_kcal && ` · ${meal.calorie_kcal}kcal`}
                        {" · "}{new Date(meal.logged_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="flex-shrink-0 gap-1" onClick={() => repeatMeal(meal)}>
                      <Plus className="w-3 h-3" />追加
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bulk tab */}
          <TabsContent value="bulk" className="mt-4 space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">何日分まとめて登録しますか？</p>
                <div className="flex gap-2">
                  {[3, 5, 7].map((d) => (
                    <Button
                      key={d}
                      variant={bulkDays === d ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setBulkDays(d)}
                    >
                      {d}日
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {recurringMeals.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-muted-foreground">定期登録メニューがありません</p>
                <RecurringMealDialog userId={userId} onSaved={router.refresh} />
              </div>
            ) : (
              <div className="space-y-2">
                {recurringMeals.map((meal) => (
                  <div key={meal.id} className="bg-card border border-border rounded-md p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Utensils className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {meal.meal_type ? MEAL_TYPE_LABELS[meal.meal_type] : ""} ·{" "}
                        <span className="text-primary font-semibold">{meal.protein_g}g</span>
                      </p>
                    </div>
                    <Button size="sm" className="flex-shrink-0" onClick={() => bulkRegister(meal)}>
                      {bulkDays}日分
                    </Button>
                  </div>
                ))}
                <RecurringMealDialog userId={userId} onSaved={router.refresh} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {editingMeal && (
        <MealEditDialog
          meal={editingMeal}
          onClose={() => setEditingMeal(null)}
          onSaved={(updated) => {
            setTodayMeals(todayMeals.map((m) => m.id === updated.id ? updated : m));
            setEditingMeal(null);
          }}
        />
      )}
    </div>
  );
}
