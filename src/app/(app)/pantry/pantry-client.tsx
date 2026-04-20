"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Archive, ImageOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/layout/app-header";
import { PantryItem, PANTRY_CATEGORIES } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface PantryClientProps {
  userId: string;
  items: PantryItem[];
}

function PantryItemImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [error, setError] = useState(false);
  if (!imageUrl || error) {
    return (
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <ImageOff className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-muted"
      onError={() => setError(true)}
    />
  );
}

export function PantryClient({ userId, items: initialItems }: PantryClientProps) {
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
        const res = await fetch(`/api/pantry/suggest?name=${encodeURIComponent(newName.trim())}`);
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
    const { error } = await supabase
      .schema("cookgo")
      .from("pantry_items")
      .update({ in_stock: !item.in_stock })
      .eq("id", item.id);
    if (error) { toast.error("更新に失敗しました"); return; }
    setItems(items.map(i => i.id === item.id ? { ...i, in_stock: !i.in_stock } : i));
  };

  const deleteItem = async (item: PantryItem) => {
    setDeletingId(item.id);
    const { error } = await supabase
      .schema("cookgo")
      .from("pantry_items")
      .delete()
      .eq("id", item.id);
    setDeletingId(null);
    if (error) { toast.error("削除に失敗しました"); return; }
    setItems(items.filter(i => i.id !== item.id));
    toast.success(`「${item.name}」を削除しました`);
  };

  const addItem = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const { error, data } = await supabase
      .schema("cookgo")
      .from("pantry_items")
      .insert({
        user_id: userId,
        name: newName.trim(),
        category: suggestedCategory,
        in_stock: true,
        image_url: previewImageUrl,
      })
      .select()
      .single();
    setAdding(false);
    if (error) { toast.error(`追加に失敗しました: ${error.message}`); console.error(error); return; }
    setItems([...items, data as PantryItem]);
    setNewName("");
    setPreviewImageUrl(null);
    setSuggestedCategory("その他");
    toast.success("追加しました");
  };

  const categories = ["すべて", ...Array.from(new Set(items.map(i => i.category ?? "その他")))];
  const filteredItems = filterCategory === "すべて"
    ? items
    : items.filter(i => (i.category ?? "その他") === filterCategory);

  const groupedItems = filteredItems.reduce<Record<string, PantryItem[]>>((acc, item) => {
    const cat = item.category ?? "その他";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const inStockCount = items.filter(i => i.in_stock).length;

  return (
    <div className="flex flex-col">
      <AppHeader title="食材庫" />

      <div className="px-4 md:px-8 pt-4 space-y-4 pb-8">
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">今家にあるもの</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            {inStockCount}<span className="text-sm font-normal text-muted-foreground ml-1">品</span>
          </span>
        </div>

        {/* 追加フォーム */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="食材・調味料を追加..."
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addItem()}
                className="rounded-xl"
              />
              {/* AI suggested category badge */}
              <div className="flex items-center gap-1.5 min-h-[24px]">
                {fetchingSuggest ? (
                  <span className="text-xs text-muted-foreground">カテゴリー判定中...</span>
                ) : newName.trim() ? (
                  <>
                    <span className="text-xs text-muted-foreground">カテゴリー：</span>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {suggestedCategory}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            {/* 画像プレビュー */}
            <div className="flex flex-col items-center justify-center w-20 h-20 rounded-xl border border-border bg-muted flex-shrink-0 overflow-hidden">
              {fetchingSuggest ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : previewImageUrl ? (
                <img src={previewImageUrl} alt={newName} className="w-full h-full object-cover" />
              ) : (
                <ImageOff className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
              )}
            </div>
          </div>

          <Button onClick={addItem} disabled={adding || fetchingSuggest} className="w-full rounded-xl bg-primary gap-2">
            <Plus className="w-4 h-4" />
            {adding ? "追加中..." : "追加する"}
          </Button>
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filterCategory === cat
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 食材リスト */}
        <div className="space-y-5 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{category}</h3>
              <div className="space-y-1">
                {categoryItems.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 bg-card border rounded-xl px-3 py-2.5 transition-colors",
                      item.in_stock ? "border-border" : "border-border opacity-50"
                    )}
                  >
                    <PantryItemImage imageUrl={item.image_url} name={item.name} />
                    <span className={cn(
                      "flex-1 text-sm",
                      item.in_stock ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {item.name}
                    </span>
                    <button
                      onClick={() => toggleStock(item)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                        item.in_stock
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      )}
                    >
                      {item.in_stock ? "✓ 在庫あり" : "✗ 切れた"}
                    </button>
                    <button
                      onClick={() => deleteItem(item)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      aria-label="削除"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
