"use client";

import { useState } from "react";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/layout/app-header";
import { ShoppingListItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface ShoppingClientProps {
  userId: string;
  items: ShoppingListItem[];
}

export function ShoppingClient({ userId, items: initialItems }: ShoppingClientProps) {
  const supabase = createClient();
  const [items, setItems] = useState<ShoppingListItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

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

      <div className="px-4 md:px-8 pt-4 space-y-4">
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

        {items.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-foreground">買い物リストは空です</p>
            <p className="text-sm text-muted-foreground">
              レシピページから買い物リストを生成するか、手動で追加してください
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {unchecked.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">未購入 ({unchecked.length})</p>
                <div className="md:grid md:grid-cols-2 md:gap-2 space-y-1.5 md:space-y-0">
                  {unchecked.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                      <Checkbox checked={false} onCheckedChange={() => toggleItem(item)} className="rounded-full" />
                      <span className="flex-1 text-sm font-medium">{item.name}</span>
                      <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-muted rounded-lg">
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
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">購入済み ({checked.length})</p>
                  <button onClick={clearChecked} className="text-xs text-destructive font-medium">クリア</button>
                </div>
                <div className="md:grid md:grid-cols-2 md:gap-2 space-y-1.5 md:space-y-0">
                  {checked.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-muted border border-border rounded-xl px-4 py-3 opacity-60">
                      <Checkbox checked={true} onCheckedChange={() => toggleItem(item)} className="rounded-full" />
                      <span className="flex-1 text-sm line-through text-muted-foreground">{item.name}</span>
                      <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-background rounded-lg">
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
