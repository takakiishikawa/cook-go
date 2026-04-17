"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, RefreshCw, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/layout/app-header";
import { Recipe } from "@/types/database";
import { useRouter } from "next/navigation";

interface RecipesClientProps {
  recipes: Recipe[];
}

export function RecipesClient({ recipes: initialRecipes }: RecipesClientProps) {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [generating, setGenerating] = useState(false);

  const generateRecipes = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/recipes/suggest", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipes([...data.recipes, ...recipes]);
      toast.success(`${data.recipes.length}件のレシピを提案しました！`);
    } catch {
      toast.error("レシピ提案に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader title="レシピ" />

      <div className="px-4 pt-4 space-y-4">
        <Button
          onClick={generateRecipes}
          disabled={generating}
          className="w-full h-12 rounded-xl bg-primary gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "AIがレシピを考えています..." : "今週のレシピを提案してもらう"}
        </Button>

        {recipes.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🍽️</p>
            <p className="font-medium text-foreground">レシピがまだありません</p>
            <p className="text-sm text-muted-foreground">
              上のボタンを押してAIにレシピを提案してもらいましょう
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <div className="bg-card border border-border rounded-xl p-4 hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{recipe.title}</h3>
                      {recipe.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{recipe.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {recipe.protein_g_per_serving && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            P: {recipe.protein_g_per_serving}g
                          </span>
                        )}
                        {recipe.calorie_kcal_per_serving && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {recipe.calorie_kcal_per_serving}kcal
                          </span>
                        )}
                        {recipe.prep_time_min && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />{recipe.prep_time_min}分
                          </span>
                        )}
                        {recipe.is_meal_prep_friendly && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            作り置き可
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
