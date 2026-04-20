"use client";

import Link from "next/link";
import { ChevronRight, Clock, UtensilsCrossed } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@takaki/go-design-system";
import { Recipe } from "@/types/database";

interface RecipeSuggestionBannerProps {
  recipes: Recipe[];
}

export function RecipeSuggestionBanner({ recipes }: RecipeSuggestionBannerProps) {
  if (!recipes.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          今週のレシピ提案
        </CardTitle>
        <Link href="/recipes" className="text-sm text-primary font-medium">すべて見る</Link>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="flex items-center gap-3 rounded-md border border-border bg-card p-3 hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-md bg-surface-subtle flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{recipe.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {recipe.protein_g_per_serving && (
                  <Badge>P {recipe.protein_g_per_serving}g</Badge>
                )}
                {recipe.prep_time_min && (
                  <Badge variant="secondary">
                    <Clock className="w-2.5 h-2.5 mr-1" />{recipe.prep_time_min}分
                  </Badge>
                )}
                {recipe.is_meal_prep_friendly && (
                  <Badge variant="outline" className="bg-warning-subtle text-warning border-transparent">
                    作り置き
                  </Badge>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
