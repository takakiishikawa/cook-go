"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, ImageOff, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  TagGroup,
  Tag,
  Section,
  PageHeader,
  toast,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { PantryItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

interface PantryClientProps {
  userId: string;
  items: PantryItem[];
}

function PantryItemImage({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  const [error, setError] = useState(false);
  if (!imageUrl || error) {
    return (
      <div className="w-10 h-10 rounded-md bg-surface-subtle flex items-center justify-center flex-shrink-0">
        <ImageOff className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-muted"
      onError={() => setError(true)}
    />
  );
}

export function PantryClient({
  userId,
  items: initialItems,
}: PantryClientProps) {
  const supabase = createClient();
  const [items, setItems] = useState<PantryItem[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState<string>("その他");
  const [adding, setAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("すべて");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [fetchingSuggest, setFetchingSuggest] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!newName.trim()) {
      setPreviewImageUrl(null);
      setSuggestedCategory("その他");
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setFetchingSuggest(true);
      try {
        const res = await fetch(
          `/api/pantry/suggest?name=${encodeURIComponent(newName.trim())}`,
        );
        const data = await res.json();
        setPreviewImageUrl(data.imageUrl ?? null);
        setSuggestedCategory(data.category ?? "その他");
      } catch {
        setPreviewImageUrl(null);
        setSuggestedCategory("その他");
      } finally {
        setFetchingSuggest(false);
      }
    }, 600);
  }, [newName]);

  const toggleStock = async (item: PantryItem) => {
    const { error } = await db.pantry.update(supabase, item.id, {
      in_stock: !item.in_stock,
    });
    if (error) {
      toast.error("更新に失敗しました");
      return;
    }
    setItems(
      items.map((i) =>
        i.id === item.id ? { ...i, in_stock: !i.in_stock } : i,
      ),
    );
  };

  const deleteItem = async (item: PantryItem) => {
    setDeletingId(item.id);
    const { error } = await db.pantry.delete(supabase, item.id);
    setDeletingId(null);
    if (error) {
      toast.error("削除に失敗しました");
      return;
    }
    setItems(items.filter((i) => i.id !== item.id));
    toast.success(`「${item.name}」を削除しました`);
  };

  const addItem = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const { error, data } = await db.pantry.insert(supabase, {
      user_id: userId,
      name: newName.trim(),
      category: suggestedCategory,
      in_stock: true,
      image_url: previewImageUrl,
    });
    setAdding(false);
    if (error) {
      toast.error(`追加に失敗しました: ${error.message}`);
      return;
    }
    setItems([...items, data as PantryItem]);
    setNewName("");
    setPreviewImageUrl(null);
    setSuggestedCategory("その他");
    toast.success("追加しました");
  };

  const categories = [
    "すべて",
    ...Array.from(new Set(items.map((i) => i.category ?? "その他"))),
  ];
  const filteredItems =
    filterCategory === "すべて"
      ? items
      : items.filter((i) => (i.category ?? "その他") === filterCategory);

  const groupedItems = filteredItems.reduce<Record<string, PantryItem[]>>(
    (acc, item) => {
      const cat = item.category ?? "その他";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {},
  );

  const inStockCount = items.filter((i) => i.in_stock).length;
  const outOfStockCount = items.length - inStockCount;

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-5 max-w-3xl">
        <PageHeader
          title="食材庫"
          description={`在庫あり ${inStockCount}品 · 在庫切れ ${outOfStockCount}品`}
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">在庫あり</p>
              <p className="text-2xl font-semibold text-primary mt-1">
                {inStockCount}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  品
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">在庫切れ</p>
              <p
                className={cn(
                  "text-2xl font-semibold mt-1",
                  outOfStockCount > 0 ? "text-destructive" : "text-foreground",
                )}
              >
                {outOfStockCount}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  品
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add form */}
        <Section title="食材を追加">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="食材・調味料を追加..."
                    value={newName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewName(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                      e.key === "Enter" && addItem()
                    }
                  />
                  <div className="flex items-center gap-1.5 min-h-[24px]">
                    {fetchingSuggest ? (
                      <span className="text-xs text-muted-foreground">
                        カテゴリー判定中...
                      </span>
                    ) : newName.trim() ? (
                      <>
                        <span className="text-xs text-muted-foreground">
                          カテゴリー：
                        </span>
                        <Badge variant="outline">{suggestedCategory}</Badge>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-md border border-border bg-surface-subtle flex-shrink-0 overflow-hidden">
                  {fetchingSuggest ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt={newName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff
                      className="w-5 h-5 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
              </div>
              <Button
                onClick={addItem}
                disabled={adding || fetchingSuggest}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                {adding ? "追加中..." : "追加する"}
              </Button>
            </CardContent>
          </Card>
        </Section>

        {/* Category filter */}
        <TagGroup wrap>
          {categories.map((cat) => (
            <Tag
              key={cat}
              color={filterCategory === cat ? "primary" : "default"}
              onClick={() => setFilterCategory(cat)}
              className="cursor-pointer select-none"
            >
              {cat}
            </Tag>
          ))}
        </TagGroup>

        {/* Items list */}
        <div className="space-y-5 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-1">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 bg-card border rounded-md px-3 py-2.5 transition-opacity",
                      !item.in_stock && "opacity-50",
                    )}
                  >
                    <PantryItemImage
                      imageUrl={item.image_url}
                      name={item.name}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        item.in_stock
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.name}
                    </span>
                    <Button
                      onClick={() => toggleStock(item)}
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 p-0 h-auto hover:bg-transparent"
                    >
                      {item.in_stock ? (
                        <Badge variant="secondary" className="cursor-pointer">
                          在庫あり
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="cursor-pointer">
                          切れた
                        </Badge>
                      )}
                    </Button>
                    <Button
                      onClick={() => deleteItem(item)}
                      disabled={deletingId === item.id}
                      variant="ghost"
                      size="sm"
                      className="p-1.5 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="削除"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ImageOff
              className="w-12 h-12 mx-auto mb-3 opacity-30"
              strokeWidth={1}
            />
            <p className="text-sm">食材がまだありません</p>
            <p className="text-xs mt-1">上のフォームから追加してください</p>
          </div>
        )}
      </div>
    </div>
  );
}
