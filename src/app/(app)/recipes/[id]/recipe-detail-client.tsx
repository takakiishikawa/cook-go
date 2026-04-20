"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Clock, Check, X, Play, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import {
  Button, Badge,
  Card, CardContent, CardHeader, CardTitle,
} from "@takaki/go-design-system";
import { Recipe, RecipeIngredient, RecipeStep } from "@/types/database";
import { cn } from "@/lib/utils";

interface RecipeDetailClientProps {
  recipe: Recipe;
  pantryItems: Array<{ name: string; in_stock: boolean }>;
}

function RecipeHeroImage({ title }: { title: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const query = title.split(/[のとでや]/)[0].trim() || title;
    fetch(`/api/pantry/image?name=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => setImageUrl(d.imageUrl ?? null))
      .catch(() => {});
  }, [title]);

  if (!imageUrl) {
    return (
      <div className="w-full h-48 rounded-md bg-surface-subtle flex items-center justify-center">
        <UtensilsCrossed className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  }
  return <img src={imageUrl} alt={title} className="w-full h-48 rounded-md object-cover" />;
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
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.title + " 作り方")}`;

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

      <div className="px-4 pt-4 space-y-5 pb-8">
        <RecipeHeroImage title={recipe.title} />

        {/* Stats badges */}
        <div className="flex flex-wrap gap-2">
          {recipe.protein_g_per_serving && (
            <Badge className="px-3 py-1.5 text-sm">
              P {recipe.protein_g_per_serving}g / 食
            </Badge>
          )}
          {recipe.calorie_kcal_per_serving && (
            <Badge variant="secondary" className="px-3 py-1.5 text-sm">
              {recipe.calorie_kcal_per_serving}kcal / 食
            </Badge>
          )}
          {recipe.prep_time_min && (
            <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-1">
              <Clock className="w-3.5 h-3.5" />{recipe.prep_time_min}分
            </Badge>
          )}
          {recipe.servings && recipe.servings > 1 && (
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              {recipe.servings}食分
            </Badge>
          )}
          {recipe.is_meal_prep_friendly && (
            <Badge variant="outline" className="px-3 py-1.5 text-sm bg-warning-subtle text-warning border-transparent">
              作り置き
            </Badge>
          )}
        </div>

        {recipe.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{recipe.description}</p>
        )}

        {/* Ingredients */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">食材リスト</CardTitle>
              <span className="text-sm text-muted-foreground">
                食材庫: {inPantryCount}品 / 購入必要: {needToBuyCount}品
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {ingredients.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5">
                {ingredients.map((ing, i) => {
                  const inPantry = pantryNames.has(ing.name.toLowerCase());
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-md border",
                        inPantry ? "bg-primary/5 border-primary/20" : "bg-muted border-border"
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {inPantry
                          ? <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          : <X className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        }
                        <span className="text-sm truncate">{ing.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">{ing.amount}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">食材情報なし</p>
            )}
            {needToBuyCount > 0 && (
              <Button onClick={generateShoppingList} disabled={generating} className="w-full gap-2">
                <ShoppingCart className="w-4 h-4" />
                {generating ? "生成中..." : `買い物リストを作る（${needToBuyCount}品）`}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        {steps.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">作り方</CardTitle>
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-destructive font-medium hover:underline"
                >
                  <Play className="w-4 h-4" />
                  動画で見る
                </a>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {steps.map((step) => {
                const done = completedSteps.has(step.order);
                return (
                  <button
                    key={step.order}
                    onClick={() => toggleStep(step.order)}
                    className={cn(
                      "w-full text-left flex gap-4 p-4 rounded-md border transition-colors",
                      done ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold",
                      done ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-muted-foreground"
                    )}>
                      {done ? <Check className="w-3.5 h-3.5" /> : step.order}
                    </div>
                    <p className={cn("text-sm leading-relaxed flex-1 text-left", done && "line-through text-muted-foreground")}>
                      {step.text}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
