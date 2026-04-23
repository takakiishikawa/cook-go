"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Clock,
  Check,
  X,
  Play,
  UtensilsCrossed,
  Users,
  Flame,
  Beef,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import {
  Button,
  Badge,
  Skeleton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Section,
  PageHeader,
} from "@takaki/go-design-system";
import { Recipe, RecipeIngredient, RecipeStep } from "@/types/database";
import { cn } from "@/lib/utils";
import { useFoodImage } from "@/hooks/use-food-image";

interface RecipeDetailClientProps {
  recipe: Recipe;
  pantryItems: Array<{ name: string; in_stock: boolean }>;
}

function RecipeHeroImage({ title }: { title: string }) {
  const query = title.split(/[のとでや]/)[0].trim() || title;
  const { imageUrl, loading } = useFoodImage(query);

  if (loading) return <Skeleton className="w-full h-56" />;
  if (!imageUrl) {
    return (
      <div className="w-full h-56 bg-surface-subtle flex items-center justify-center">
        <UtensilsCrossed
          className="w-12 h-12 text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
    );
  }
  return (
    <img src={imageUrl} alt={title} className="w-full h-56 object-cover" />
  );
}

export function RecipeDetailClient({
  recipe,
  pantryItems,
}: RecipeDetailClientProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const pantryNames = new Set(
    pantryItems.filter((p) => p.in_stock).map((p) => p.name.toLowerCase()),
  );
  const ingredients = (recipe.ingredients as RecipeIngredient[]) ?? [];
  const steps = [...((recipe.steps as RecipeStep[]) ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const inPantryCount = ingredients.filter((i) =>
    pantryNames.has(i.name.toLowerCase()),
  ).length;
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
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  };

  const completedCount = completedSteps.size;
  const totalSteps = steps.length;

  return (
    <div className="flex flex-col">
      <AppHeader backHref="/recipes" />

      {/* Hero image - full bleed */}
      <div className="overflow-hidden">
        <RecipeHeroImage title={recipe.title} />
      </div>

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-6 max-w-3xl">
        <PageHeader
          title={recipe.title}
          description={recipe.description ?? undefined}
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {recipe.protein_g_per_serving && (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md px-3 py-2.5">
              <Beef className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">タンパク質</p>
                <p className="text-sm font-bold text-primary">
                  {recipe.protein_g_per_serving}g
                </p>
              </div>
            </div>
          )}
          {recipe.calorie_kcal_per_serving && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2.5">
              <Flame className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">カロリー</p>
                <p className="text-sm font-bold text-foreground">
                  {recipe.calorie_kcal_per_serving}kcal
                </p>
              </div>
            </div>
          )}
          {recipe.prep_time_min && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2.5">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">調理時間</p>
                <p className="text-sm font-bold text-foreground">
                  {recipe.prep_time_min}分
                </p>
              </div>
            </div>
          )}
          {recipe.servings && recipe.servings > 1 && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2.5">
              <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">食分</p>
                <p className="text-sm font-bold text-foreground">
                  {recipe.servings}食分
                </p>
              </div>
            </div>
          )}
        </div>

        {recipe.is_meal_prep_friendly && (
          <Badge
            variant="outline"
            className="bg-warning-subtle text-warning border-transparent"
          >
            作り置き向き
          </Badge>
        )}

        {/* Ingredients */}
        <Section
          title="食材リスト"
          description={`食材庫: ${inPantryCount}品 / 購入必要: ${needToBuyCount}品`}
        >
          {ingredients.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
                {ingredients.map((ing, i) => {
                  const inPantry = pantryNames.has(ing.name.toLowerCase());
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-md border",
                        inPantry
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted border-border",
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {inPantry ? (
                          <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-sm truncate">{ing.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">
                        {ing.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
              {needToBuyCount > 0 && (
                <Button
                  onClick={generateShoppingList}
                  disabled={generating}
                  className="w-full gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {generating
                    ? "生成中..."
                    : `買い物リストを作る（${needToBuyCount}品）`}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">食材情報なし</p>
          )}
        </Section>

        {/* Steps */}
        {steps.length > 0 && (
          <Section
            title="作り方"
            description={
              totalSteps > 0
                ? `${completedCount} / ${totalSteps} ステップ完了`
                : undefined
            }
            actions={
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-destructive font-medium hover:underline"
              >
                <Play className="w-4 h-4" />
                動画で見る
              </a>
            }
          >
            <div className="space-y-2">
              {steps.map((step) => {
                const done = completedSteps.has(step.order);
                return (
                  <button
                    key={step.order}
                    onClick={() => toggleStep(step.order)}
                    className={cn(
                      "w-full text-left flex gap-4 p-4 rounded-md border transition-colors",
                      done
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card border-border hover:bg-muted",
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold",
                        done
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-subtle text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : step.order}
                    </div>
                    <p
                      className={cn(
                        "text-sm leading-relaxed flex-1 text-left pt-0.5",
                        done && "line-through text-muted-foreground",
                      )}
                    >
                      {step.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
