"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, RefreshCw, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Badge,
  EmptyState,
  Card,
  CardContent,
  Skeleton,
  PageHeader,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { Recipe } from "@/types/database";
import { useRouter } from "next/navigation";
import { useFoodImage } from "@/hooks/use-food-image";

function RecipeImage({ title }: { title: string }) {
  const query = title.split(/[のとでや]/)[0].trim() || title;
  const { imageUrl, loading, error } = useFoodImage(query);

  if (loading) {
    return <Skeleton className="w-full h-40" />;
  }
  if (!imageUrl || error) {
    return (
      <div className="w-full h-40 bg-surface-subtle flex items-center justify-center">
        <UtensilsCrossed
          className="w-8 h-8 text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={title}
      className="w-full h-40 object-cover bg-muted"
    />
  );
}

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
      toast.success(`${data.recipes.length}件のレシピを提案しました`);
    } catch {
      toast.error("レシピ提案に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-5 max-w-3xl">
        <PageHeader
          title="レシピ"
          description={
            recipes.length > 0
              ? `${recipes.length}件`
              : "AIが食材庫に合わせて提案します"
          }
          actions={
            <Button
              onClick={generateRecipes}
              disabled={generating}
              size="sm"
              className="gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`}
              />
              {generating ? "提案中..." : "提案してもらう"}
            </Button>
          }
        />

        {recipes.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="w-6 h-6" />}
            title="レシピがまだありません"
            description="上のボタンを押してAIにレシピを提案してもらいましょう"
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {recipes.length}件のレシピ
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {recipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                  <Card className="overflow-hidden hover:border border-border transition-shadow h-full flex flex-col">
                    <div className="overflow-hidden">
                      <RecipeImage title={recipe.title} />
                    </div>
                    <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                      <p className="font-semibold text-foreground text-sm line-clamp-2 leading-snug flex-1">
                        {recipe.title}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.protein_g_per_serving && (
                          <Badge>P {recipe.protein_g_per_serving}g</Badge>
                        )}
                        {recipe.prep_time_min && (
                          <Badge variant="secondary">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {recipe.prep_time_min}分
                          </Badge>
                        )}
                        {recipe.is_meal_prep_friendly && (
                          <Badge
                            variant="outline"
                            className="bg-warning-subtle text-warning border-transparent"
                          >
                            作り置き
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
