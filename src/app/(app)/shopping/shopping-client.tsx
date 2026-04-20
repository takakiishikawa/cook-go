"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingBag, Globe, X, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/layout/app-header";
import { ShoppingListItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ShoppingClientProps {
  userId: string;
  items: ShoppingListItem[];
}

type Translation = { en: string; vi: string };

function ItemImage({ name }: { name: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pantry/image?name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setImageUrl(d.imageUrl ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [name]);

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

export function ShoppingClient({ userId, items: initialItems }: ShoppingClientProps) {
  const supabase = createClient();
  const [items, setItems] = useState<ShoppingListItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);
  const [storeMode, setStoreMode] = useState(false);
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const [translating, setTranslating] = useState(false);

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  const fetchTranslations = async (itemList: ShoppingListItem[]) => {
    const names = itemList.map(i => i.name);
    if (names.length === 0) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/shopping/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      });
      const data = await res.json();
      setTranslations(data.translations ?? {});
    } catch {
      // silent fail
    } finally {
      setTranslating(false);
    }
  };

  const enterStoreMode = () => {
    setStoreMode(true);
    fetchTranslations(unchecked);
  };

  const toggleItem = async (item: ShoppingListItem) => {
    const { error } = await supabase
      .schema("cookgo")
      .from("shopping_list_items")
      .update({ checked: !item.checked })
      .eq("id", item.id);
    if (error) { toast.error("更新に失敗しました"); return; }

    if (!item.checked) {
      const addToStock = confirm(`「${item.name}」を食材庫に追加しますか？`);
      if (addToStock) {
        const itemName = item.name.replace(/\s+\S+$/, "").trim();
        await supabase.schema("cookgo").from("pantry_items").upsert({
          user_id: userId,
          name: itemName,
          in_stock: true,
        }, { onConflict: "user_id,name" });
        toast.success(`${itemName}を食材庫に追加しました`);
      }
    }
    setItems(items.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.schema("cookgo").from("shopping_list_items").delete().eq("id", id);
    if (error) { toast.error("削除に失敗しました"); return; }
    setItems(items.filter(i => i.id !== id));
  };

  const clearChecked = async () => {
    const ids = checked.map(i => i.id);
    const { error } = await supabase.schema("cookgo").from("shopping_list_items").delete().in("id", ids);
    if (error) { toast.error("削除に失敗しました"); return; }
    setItems(unchecked);
    toast.success(`${ids.length}件を削除しました`);
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;
    setAdding(true);
    const { error, data } = await supabase
      .schema("cookgo")
      .from("shopping_list_items")
      .insert({ user_id: userId, name: newItemName.trim(), checked: false })
      .select()
      .single();
    setAdding(false);
    if (error) { toast.error("追加に失敗しました"); return; }
    setItems([data as ShoppingListItem, ...items]);
    setNewItemName("");
  };

  return (
    <div className="flex flex-col">
      <AppHeader title="買い物リスト" />

      {/* 店員モード overlay */}
      {storeMode && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-bold text-base">🛒 店員に見せる / Show to staff</span>
            <button onClick={() => setStoreMode(false)} className="p-2 rounded-xl hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {translating && (
              <div className="text-center py-4 text-sm text-muted-foreground">翻訳中...</div>
            )}
            {unchecked.map(item => {
              const t = translations[item.name];
              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <ItemImage name={item.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-foreground">{item.name}</p>
                      {t?.en && <p className="text-lg font-medium text-muted-foreground">{t.en}</p>}
                      {t?.vi && <p className="text-lg font-semibold text-[var(--color-info)]">{t.vi}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            {unchecked.length === 0 && (
              <p className="text-center text-muted-foreground py-8">未購入アイテムがありません</p>
            )}
          </div>
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="アイテムを追加..."
            value={newItemName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addItem()}
            className="rounded-xl flex-1"
          />
          <Button onClick={addItem} disabled={adding} className="rounded-xl bg-primary px-4">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {unchecked.length > 0 && (
          <Button
            variant="outline"
            onClick={enterStoreMode}
            className="w-full rounded-xl gap-2"
          >
            <Globe className="w-4 h-4" />
            店員に見せる（日本語・English・Tiếng Việt）
          </Button>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-foreground">買い物リストは空です</p>
            <p className="text-sm text-muted-foreground">
              レシピページから買い物リストを生成するか、手動で追加してください
            </p>
          </div>
        ) : (
          <div className="space-y-5 pb-8">
            {unchecked.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">未購入 ({unchecked.length})</p>
                <div className="space-y-1.5">
                  {unchecked.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5">
                      <Checkbox checked={false} onCheckedChange={() => toggleItem(item)} className="rounded-full flex-shrink-0" />
                      <ItemImage name={item.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.name}</p>
                        {translations[item.name] && (
                          <p className="text-xs text-muted-foreground">
                            {translations[item.name].en} · {translations[item.name].vi}
                          </p>
                        )}
                      </div>
                      <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-muted rounded-lg flex-shrink-0">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {checked.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">購入済み ({checked.length})</p>
                  <button onClick={clearChecked} className="text-sm text-destructive font-medium">クリア</button>
                </div>
                <div className="space-y-1.5">
                  {checked.map((item) => (
                    <div key={item.id} className={cn("flex items-center gap-3 bg-muted border border-border rounded-xl px-3 py-2.5 opacity-60")}>
                      <Checkbox checked={true} onCheckedChange={() => toggleItem(item)} className="rounded-full flex-shrink-0" />
                      <ItemImage name={item.name} />
                      <span className="flex-1 text-sm line-through text-muted-foreground">{item.name}</span>
                      <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-background rounded-lg flex-shrink-0">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
