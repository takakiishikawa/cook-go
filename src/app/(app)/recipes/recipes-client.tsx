"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Plus,
  RefreshCw,
  Sparkles,
  Link2,
  PencilLine,
  UtensilsCrossed,
  CheckCircle2,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Textarea,
  toast,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { Recipe } from "@/types/database";
import { useRouter } from "next/navigation";
import { useFoodImage } from "@/hooks/use-food-image";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";

function RecipeImage({ title }: { title: string }) {
  const query = title.split(/[のとでや]/)[0].trim() || title;
  const { imageUrl, loading, error } = useFoodImage(query);

  if (loading) return <Skeleton className="w-full h-40" />;
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
      loading="lazy"
      decoding="async"
    />
  );
}

function RecipeCard({
  recipe,
  onToggleTried,
}: {
  recipe: Recipe;
  onToggleTried: (id: string, tried: boolean) => void;
}) {
  return (
    <div className="relative">
      <Link href={`/recipes/${recipe.id}`}>
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

const SUGGEST_TAGS = [
  "作り置き",
  "時短(30分以内)",
  "和食",
  "中華",
  "洋食",
  "エスニック",
] as const;

export function RecipesClient({ recipes: initialRecipes }: RecipesClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"ai" | "url" | "text">("ai");
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [creatingFromText, setCreatingFromText] = useState(false);
  const [mainIngredient, setMainIngredient] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [importUrl, setImportUrl] = useState("");
  const [freeText, setFreeText] = useState("");

  const tried = recipes.filter((r) => r.is_tried);
  const untried = recipes.filter((r) => !r.is_tried);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const resetAddForm = () => {
    setMainIngredient("");
    setSelectedTags([]);
    setImportUrl("");
    setFreeText("");
  };

  const generateRecipes = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/recipes/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          main_ingredient: mainIngredient.trim() || undefined,
          tags: selectedTags,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipes([...data.recipes, ...recipes]);
      toast.success(`${data.recipes.length}件のレシピを提案しました`);
      setAddOpen(false);
      resetAddForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "レシピ提案に失敗しました";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const importFromUrl = async () => {
    const url = importUrl.trim();
    if (!url) {
      toast.error("URLを入力してください");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/recipes/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipes([data.recipe, ...recipes]);
      toast.success(`「${data.recipe.title}」を追加しました`);
      setAddOpen(false);
      resetAddForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "URLからの取込に失敗しました";
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const createFromText = async () => {
    const text = freeText.trim();
    if (!text) {
      toast.error("メモを入力してください");
      return;
    }
    setCreatingFromText(true);
    try {
      const res = await fetch("/api/recipes/from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipes([data.recipe, ...recipes]);
      toast.success(`「${data.recipe.title}」を追加しました`);
      setAddOpen(false);
      resetAddForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "レシピ生成に失敗しました";
      toast.error(msg);
    } finally {
      setCreatingFromText(false);
    }
  };

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
        title="レシピがありません"
        description=""
      />
    ) : (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onToggleTried={toggleTried}
          />
        ))}
      </div>
    );

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-5 max-w-3xl">
        <PageHeader
          title="レシピ"
          description={`${recipes.length}件`}
          actions={
            <Button
              onClick={() => {
                resetAddForm();
                setAddMode("ai");
                setAddOpen(true);
              }}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              レシピを追加
            </Button>
          }
        />

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
                description="「レシピを追加」から AI提案 / URL / メモ で登録できます"
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

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (generating || importing || creatingFromText) return;
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>レシピを追加</DialogTitle>
            <DialogDescription>
              AI提案・URL取込・自分で書く から選べます。
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={addMode}
            onValueChange={(v) => setAddMode(v as "ai" | "url" | "text")}
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="ai" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI提案
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-1.5">
                <PencilLine className="w-3.5 h-3.5" />
                自分で書く
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  メイン食材（任意）
                </label>
                <Input
                  placeholder="例: 鶏胸肉"
                  value={mainIngredient}
                  onChange={(e) => setMainIngredient(e.target.value)}
                  disabled={generating}
                />
                <p className="text-xs text-muted-foreground">
                  入れた食材を中心としたレシピを提案します
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">タグ（任意）</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGEST_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        disabled={generating}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          active
                            ? "bg-primary text-white border-primary"
                            : "bg-surface-subtle text-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  高タンパクは常に前提条件です
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAddOpen(false)}
                  disabled={generating}
                >
                  キャンセル
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={generateRecipes}
                  disabled={generating}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`}
                  />
                  {generating ? "提案中..." : "提案してもらう"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">レシピのURL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/recipe/..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  disabled={importing}
                />
                <p className="text-xs text-muted-foreground">
                  該当ページから材料・手順を抽出して保存します
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAddOpen(false)}
                  disabled={importing}
                >
                  キャンセル
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={importFromUrl}
                  disabled={importing || !importUrl.trim()}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${importing ? "animate-spin" : ""}`}
                  />
                  {importing ? "取込中..." : "取り込む"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">レシピのメモ</label>
                <Textarea
                  rows={6}
                  placeholder={
                    "例: 鶏胸肉をマヨネーズと醤油で焼く。\n副菜にブロッコリーを蒸す。\n2人分。"
                  }
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  disabled={creatingFromText}
                />
                <p className="text-xs text-muted-foreground">
                  ざっくり書けばAIが整ったレシピに仕上げて保存します（高タンパク前提）
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAddOpen(false)}
                  disabled={creatingFromText}
                >
                  キャンセル
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={createFromText}
                  disabled={creatingFromText || !freeText.trim()}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${creatingFromText ? "animate-spin" : ""}`}
                  />
                  {creatingFromText ? "生成中..." : "レシピにする"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
