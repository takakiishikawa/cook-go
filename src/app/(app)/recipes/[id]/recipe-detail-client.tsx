"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Recipe, RecipeIngredient, RecipeStep } from "@/types/database";
import { cn } from "@/lib/utils";

interface RecipeDetailClientProps {
  recipe: Recipe;
  pantryItems: Array<{ name: string; in_stock: boolean }>;
}

export function RecipeDetailClient({ recipe, pantryItems }: RecipeDetailClientProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const pantryNames = new Set(pantryItems.filter(p => p.in_stock).map(p => p.name.toLowerCase()));
  const ingredients = (recipe.ingredients as RecipeIngredient[]) ?? [];
  const steps = [...((recipe.steps as RecipeStep[]) ?? [])].sort((a, b) => a.order - b.order);

  const inPantryCount = ingredients.filter(i => pantryNames.has(i.name.toLowerCase())).length;
  const needToBuyCount = ingredients.length - inPantryCount;

  const generateShoppingList = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/shopping/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipe.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.items?.length) {
        toast.success("すべての食材が食材庫にあります");
      } else {
        toast.success(`${data.items.length}件を買い物リストに追加しました`);
        router.push("/shopping");
      }
    } catch {
      toast.error("買い物リスト生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  const toggleStep = (order: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order); else next.add(order);
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      <AppHeader title={recipe.title} backHref="/recipes" />

      <div className="px-4 md:px-8 pt-4 space-y-6 pb-8">
        <div className="flex flex-wrap gap-3">
          {recipe.protein_g_per_serving && (
            <div className="bg-primary/10 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">タンパク質/食</p>
              <p className="font-bold text-primary text-xl">{recipe.protein_g_per_serving}g</p>
            </div>
          )}
          {recipe.calorie_kcal_per_serving && (
            <div className="bg-muted rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">カロリー/食</p>
              <p className="font-bold text-xl">{recipe.calorie_kcal_per_serving}kcal</p>
            </div>
          )}
          {recipe.prep_time_min && (
            <div className="bg-muted rounded-xl px-4 py-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">調理時間</p>
                <p className="font-bold">{recipe.prep_time_min}分</p>
              </div>
            </div>
          )}
          {recipe.servings && recipe.servings > 1 && (
            <div className="bg-muted rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">食分</p>
              <p className="font-bold text-xl">{recipe.servings}食分</p>
            </div>
          )}
        </div>

        {recipe.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{recipe.description}</p>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">食材リスト</h2>
            <span className="text-xs text-muted-foreground">
              食材庫: {inPantryCount}品 / 購入必要: {needToBuyCount}品
            </span>
          </div>
          {ingredients.length > 0 ? (
            <div className="space-y-1.5 md:grid md:grid-cols-2 md:gap-1.5 md:space-y-0">
              {ingredients.map((ing, i) => {
                const inPantry = pantryNames.has(ing.name.toLowerCase());
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-xl",
                      inPantry ? "bg-primary/5 border border-primary/20" : "bg-muted border border-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {inPantry
                        ? <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        : <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      }
                      <span className="text-sm">{ing.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{ing.amount}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">食材情報なし</p>
          )}
          {needToBuyCount > 0 && (
            <Button onClick={generateShoppingList} disabled={generating} className="w-full h-12 rounded-xl bg-primary gap-2">
              <ShoppingCart className="w-4 h-4" />
              {generating ? "生成中..." : `買い物リストを作る（${needToBuyCount}品）`}
            </Button>
          )}
        </div>

        {steps.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold">作り方</h2>
            <div className="space-y-2">
              {steps.map((step) => {
                const done = completedSteps.has(step.order);
                return (
                  <button
                    key={step.order}
                    onClick={() => toggleStep(step.order)}
                    className={cn(
                      "w-full text-left flex gap-4 p-4 rounded-xl border transition-colors",
                      done ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold",
                      done ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {done ? <Check className="w-3.5 h-3.5" /> : step.order}
                    </div>
                    <p className={cn("text-sm leading-relaxed flex-1 text-left", done && "line-through text-muted-foreground")}>
                      {step.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
