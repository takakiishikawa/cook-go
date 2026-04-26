"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, ImageOff, Trash2, Check } from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  Switch,
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
  size = "lg",
}: {
  imageUrl: string | null;
  name: string;
  size?: "lg" | "sm";
}) {
  const [error, setError] = useState(false);
  const dim = size === "lg" ? "w-16 h-16" : "w-10 h-10";
  if (!imageUrl || error) {
    return (
      <div
        className={`${dim} rounded-md bg-surface-subtle flex items-center justify-center flex-shrink-0`}
      >
        <ImageOff
          className="w-4 h-4 text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      className={`${dim} rounded-md object-cover flex-shrink-0 bg-muted`}
      onError={() => setError(true)}
      loading="lazy"
      decoding="async"
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
    const next = !item.in_stock;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, in_stock: next } : i)),
    );
    const { error } = await db.pantry.update(supabase, item.id, {
      in_stock: next,
    });
    if (error) {
      toast.error("更新に失敗しました");
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, in_stock: !next } : i,
        ),
      );
    }
  };

  const deleteItem = async (item: PantryItem) => {
    setDeletingId(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const { error } = await db.pantry.delete(supabase, item.id);
    setDeletingId(null);
    if (error) {
      toast.error("削除に失敗しました");
      setItems((prev) => [item, ...prev]);
    }
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

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-5 max-w-5xl">
        <PageHeader
          title="食材庫"
          description={`${inStockCount}/${items.length}品が在庫あり`}
        />

        {/* Add form: 1行のみ */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2 items-center">
              {fetchingSuggest ? (
                <div className="w-12 h-12 rounded-md border border-border bg-surface-subtle flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt={newName}
                  className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-md border border-dashed border-border bg-surface-subtle flex items-center justify-center flex-shrink-0">
                  <Plus
                    className="w-4 h-4 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                </div>
              )}
              <Input
                placeholder="食材を追加..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="flex-1"
              />
              {newName.trim() && (
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {fetchingSuggest ? "..." : suggestedCategory}
                </Badge>
              )}
              <Button
                size="sm"
                onClick={addItem}
                disabled={adding || fetchingSuggest || !newName.trim()}
              >
                {adding ? "追加中" : "追加"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full border transition-colors ${
                filterCategory === cat
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-subtle text-foreground border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items grid (2-column on md+) */}
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-1.5">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 bg-card border rounded-md p-2 transition-opacity",
                      !item.in_stock && "opacity-50",
                    )}
                  >
                    <PantryItemImage
                      imageUrl={item.image_url}
                      name={item.name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          !item.in_stock &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Switch
                          checked={item.in_stock}
                          onCheckedChange={() => toggleStock(item)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.in_stock ? "あり" : "切れた"}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteItem(item)}
                      disabled={deletingId === item.id}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Check
              className="w-10 h-10 mx-auto mb-3 opacity-30"
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
