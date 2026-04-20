"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, RefreshCw, ChevronRight, UtensilsCrossed, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/app-header";
import { Recipe } from "@/types/database";
import { useRouter } from "next/navigation";

function RecipeImage({ title }: { title: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Search by main ingredient (text before の/と/で/や)
    const query = title.split(/[のとでや]/)[0].trim() || title;
    fetch(`/api/pantry/image?name=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setImageUrl(d.imageUrl ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [title]);

  if (!imageUrl || error) {
    return (
      <div className="w-full h-36 rounded-xl bg-muted flex items-center justify-center">
        <UtensilsCrossed className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={title}
      className="w-full h-36 rounded-xl object-cover bg-muted"
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

      <div className="px-4 pt-4 pb-8 space-y-4">
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
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-foreground">レシピがまだありません</p>
            <p className="text-sm text-muted-foreground">
              上のボタンを押してAIにレシピを提案してもらいましょう
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <RecipeImage title={recipe.title} />
                  <div className="p-3 space-y-1.5">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug">{recipe.title}</h3>
                    <div className="flex flex-wrap gap-1">
                      {recipe.protein_g_per_serving && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                          P {recipe.protein_g_per_serving}g
                        </span>
                      )}
                      {recipe.prep_time_min && (
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />{recipe.prep_time_min}分
                        </span>
                      )}
                      {recipe.is_meal_prep_friendly && (
                        <span className="text-xs bg-warning-subtle text-warning px-1.5 py-0.5 rounded-sm font-semibold">作り置き</span>
                      )}
                    </div>
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
