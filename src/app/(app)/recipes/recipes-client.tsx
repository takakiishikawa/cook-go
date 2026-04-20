"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, RefreshCw, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import {
  Button, Badge, EmptyState, Card, CardContent, Skeleton,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { Recipe } from "@/types/database";
import { useRouter } from "next/navigation";

function RecipeImage({ title }: { title: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const query = title.split(/[のとでや]/)[0].trim() || title;
    fetch(`/api/pantry/image?name=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setImageUrl(d.imageUrl ?? null); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [title]);

  if (loading) {
    return <Skeleton className="w-full h-40" />;
  }
  if (!imageUrl || error) {
    return (
      <div className="w-full h-40 bg-surface-subtle flex items-center justify-center">
        <UtensilsCrossed className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={title}
      className="w-full h-40 object-cover bg-muted"
      onError={() => setError(true)}
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
      <AppHeader title="レシピ" />

      <div className="px-4 md:px-8 pt-4 pb-8 space-y-5">
        <Button
          onClick={generateRecipes}
          disabled={generating}
          className="w-full h-12 gap-2 text-base"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "AIがレシピを考えています..." : "今週のレシピを提案してもらう"}
        </Button>

        {recipes.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="w-6 h-6" />}
            title="レシピがまだありません"
            description="上のボタンを押してAIにレシピを提案してもらいましょう"
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{recipes.length}件のレシピ</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {recipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="overflow-hidden">
                      <RecipeImage title={recipe.title} />
                    </div>
                    <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                      <p className="font-semibold text-foreground text-sm line-clamp-2 leading-snug flex-1">{recipe.title}</p>
                      <div className="flex flex-wrap gap-1">
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
