"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingBag, Globe, ImageOff, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Button, Checkbox, Input, EmptyState,
  Card, CardContent,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Section, Badge,
} from "@takaki/go-design-system";
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

      {/* Store mode sheet */}
      <Sheet open={storeMode} onOpenChange={setStoreMode}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>🛒 店員に見せる / Show to staff</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pt-4">
            {translating && (
              <p className="text-center py-4 text-sm text-muted-foreground">翻訳中...</p>
            )}
            {unchecked.map(item => {
              const t = translations[item.name];
              return (
                <Card key={item.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <ItemImage name={item.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-2xl font-bold text-foreground">{item.name}</p>
                        {t?.en && <p className="text-lg font-medium text-muted-foreground">{t.en}</p>}
                        {t?.vi && <p className="text-lg font-semibold text-info">{t.vi}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {unchecked.length === 0 && (
              <p className="text-center text-muted-foreground py-8">未購入アイテムがありません</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="px-4 md:px-8 pt-4 pb-8 space-y-5">
        {/* Add item */}
        <div className="flex gap-2">
          <Input
            placeholder="アイテムを追加..."
            value={newItemName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addItem()}
            className="flex-1"
          />
          <Button onClick={addItem} disabled={adding} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {unchecked.length > 0 && (
          <Button
            variant="outline"
            onClick={() => { setStoreMode(true); fetchTranslations(unchecked); }}
            className="w-full gap-2"
          >
            <Globe className="w-4 h-4" />
            店員に見せる（日・English・Tiếng Việt）
          </Button>
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-6 h-6" />}
            title="買い物リストは空です"
            description="レシピページから買い物リストを生成するか、手動で追加してください"
          />
        ) : (
          <div className="space-y-6 pb-4">
            {unchecked.length > 0 && (
              <Section title={`未購入`} description={`${unchecked.length}品`}>
                <div className="space-y-1.5">
                  {unchecked.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-md px-3 py-2.5">
                      <Checkbox checked={false} onCheckedChange={() => toggleItem(item)} className="flex-shrink-0" />
                      <ItemImage name={item.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.name}</p>
                        {translations[item.name] && (
                          <p className="text-xs text-muted-foreground">
                            {translations[item.name].en} · {translations[item.name].vi}
                          </p>
                        )}
                      </div>
                      <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-muted rounded-md flex-shrink-0">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {checked.length > 0 && (
              <Section
                title="購入済み"
                description={`${checked.length}品`}
                actions={
                  <button onClick={clearChecked} className="text-sm text-destructive font-medium hover:underline">
                    クリア
                  </button>
                }
              >
                <div className="space-y-1.5">
                  {checked.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-muted border border-border rounded-md px-3 py-2.5 opacity-60">
                      <Checkbox checked={true} onCheckedChange={() => toggleItem(item)} className="flex-shrink-0" />
                      <ItemImage name={item.name} />
                      <span className="flex-1 text-sm line-through text-muted-foreground">{item.name}</span>
                      <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-background rounded-md flex-shrink-0">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
