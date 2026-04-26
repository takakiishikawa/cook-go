"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Plus,
  UtensilsCrossed,
  CheckCircle2,
  CalendarPlus,
} from "lucide-react";
import {
  Button,
  Badge,
  EmptyState,
  Card,
  CardContent,
  Skeleton,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { Recipe, MealType } from "@/types/database";
import { useFoodImage } from "@/hooks/use-food-image";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";
import { LogMealDialog } from "@/components/log-meal-dialog";

function RecipeImage({ recipe }: { recipe: Recipe }) {
  const query = recipe.title_en ?? recipe.title;
  const { imageUrl, loading } = useFoodImage(
    recipe.image_url ? null : query,
  );
  const src = recipe.image_url ?? imageUrl;

  if (!recipe.image_url && loading) return <Skeleton className="w-full h-40" />;
  if (!src) {
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
      src={src}
      alt={recipe.title}
      className="w-full h-40 object-cover bg-muted"
      loading="lazy"
      decoding="async"
    />
  );
}

function RecipeCard({
  recipe,
  onToggleTried,
  onLog,
}: {
  recipe: Recipe;
  onToggleTried: (id: string, tried: boolean) => void;
  onLog: (recipe: Recipe) => void;
}) {
  return (
    <div className="relative">
      <Link href={`/recipes/${recipe.id}`}>
        <Card className="overflow-hidden hover:border border-border transition-shadow h-full flex flex-col">
          <div className="overflow-hidden">
            <RecipeImage recipe={recipe} />
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
              {recipe.source_tag === "self" && (
                <Badge variant="outline" className="text-xs">
                  自分で登録
                </Badge>
              )}
              {recipe.source_tag === "ai_suggest" && (
                <Badge variant="outline" className="text-xs">
                  AI提案
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={(e) => {
                e.preventDefault();
                onLog(recipe);
              }}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              今日記録する
            </Button>
          </CardContent>
        </Card>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleTried(recipe.id, !recipe.is_tried);
        }}
        className={`absolute top-2 right-2 rounded-full p-1 transition-colors ${
          recipe.is_tried
            ? "bg-primary text-white"
            : "bg-background/80 text-muted-foreground hover:text-primary"
        }`}
        title={recipe.is_tried ? "未作成に戻す" : "作ったことある"}
      >
        <CheckCircle2 className="w-5 h-5" />
      </button>
    </div>
  );
}

interface RecipesClientProps {
  recipes: Recipe[];
}

type SourceFilter = "all" | "self" | "ai_suggest";

export function RecipesClient({ recipes: initialRecipes }: RecipesClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [logTarget, setLogTarget] = useState<Recipe | null>(null);
  const [defaultMealType] = useState<MealType>("dinner");

  const filtered = recipes.filter((r) => {
    if (filter === "all") return true;
    return r.source_tag === filter;
  });
  const tried = filtered.filter((r) => r.is_tried);
  const untried = filtered.filter((r) => !r.is_tried);

  const toggleTried = async (id: string, isTried: boolean) => {
    const { error } = await db.recipes.update(supabase, id, {
      is_tried: isTried,
    });
    if (error) {
      toast.error("更新に失敗しました");
      return;
    }
    setRecipes(
      recipes.map((r) => (r.id === id ? { ...r, is_tried: isTried } : r)),
    );
    toast.success(
      isTried
        ? "「作ったことある」に移動しました"
        : "「これから作る」に移動しました",
    );
  };

  const RecipeGrid = ({ items }: { items: Recipe[] }) =>
    items.length === 0 ? (
      <EmptyState
        icon={<UtensilsCrossed className="w-6 h-6" />}
        title="該当するレシピがありません"
        description=""
      />
    ) : (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onToggleTried={toggleTried}
            onLog={setLogTarget}
          />
        ))}
      </div>
    );

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-5 max-w-5xl">
        <PageHeader
          title="レシピ"
          description={`${recipes.length}件`}
          actions={
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => router.push("/recipes/new")}
            >
              <Plus className="w-3.5 h-3.5" />
              レシピを追加
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { value: "all", label: "すべて" },
            { value: "self", label: "自分で登録" },
            { value: "ai_suggest", label: "AI提案" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as SourceFilter)}
              className={`px-3 py-1 rounded-full border transition-colors ${
                filter === f.value
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-subtle text-foreground border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Tabs defaultValue="untried">
          <TabsList>
            <TabsTrigger value="untried" className="gap-1.5">
              これから作る
              {untried.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {untried.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tried" className="gap-1.5">
              作ったことある
              {tried.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tried.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="untried" className="mt-4">
            {recipes.length === 0 ? (
              <EmptyState
                icon={<UtensilsCrossed className="w-6 h-6" />}
                title="レシピがまだありません"
                description="「レシピを追加」から作りましょう"
              />
            ) : (
              <RecipeGrid items={untried} />
            )}
          </TabsContent>

          <TabsContent value="tried" className="mt-4">
            <RecipeGrid items={tried} />
          </TabsContent>
        </Tabs>
      </div>

      <LogMealDialog
        recipe={logTarget}
        defaultMealType={defaultMealType}
        onClose={() => setLogTarget(null)}
        onLogged={() => {
          toast.success("食事を記録しました");
          setLogTarget(null);
        }}
      />
    </div>
  );
}
