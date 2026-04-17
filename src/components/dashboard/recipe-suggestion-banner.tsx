"use client";

import Link from "next/link";
import { ChevronRight, Clock, Flame } from "lucide-react";
import { Recipe } from "@/types/database";

interface RecipeSuggestionBannerProps {
  recipes: Recipe[];
}

export function RecipeSuggestionBanner({ recipes }: RecipeSuggestionBannerProps) {
  const latest = recipes[0];
  if (!latest) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">今週のレシピ提案</h3>
        <Link href="/recipes" className="text-xs text-primary font-medium">すべて見る</Link>
      </div>
      <div className="space-y-2">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🍽️</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{recipe.title}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {recipe.protein_g_per_serving && (
                  <span className="text-xs text-primary font-medium">
                    P: {recipe.protein_g_per_serving}g
                  </span>
                )}
                {recipe.prep_time_min && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{recipe.prep_time_min}分
                  </span>
                )}
                {recipe.is_meal_prep_friendly && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    作り置き
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
