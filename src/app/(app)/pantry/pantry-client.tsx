"use client";

import { useState } from "react";
import { Plus, Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppHeader } from "@/components/layout/app-header";
import { PantryItem, PANTRY_CATEGORIES } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface PantryClientProps {
  userId: string;
  items: PantryItem[];
}

export function PantryClient({ userId, items: initialItems }: PantryClientProps) {
  const supabase = createClient();
  const [items, setItems] = useState<PantryItem[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("その他");
  const [adding, setAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("すべて");

  const toggleStock = async (item: PantryItem) => {
    const { error } = await supabase
      .schema("cookgo")
      .from("pantry_items")
      .update({ in_stock: !item.in_stock })
      .eq("id", item.id);
    if (error) { toast.error("更新に失敗しました"); return; }
    setItems(items.map(i => i.id === item.id ? { ...i, in_stock: !i.in_stock } : i));
  };

  const addItem = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const { error, data } = await supabase
      .schema("cookgo")
      .from("pantry_items")
      .insert({ user_id: userId, name: newName.trim(), category: newCategory, in_stock: true })
      .select()
      .single();
    setAdding(false);
    if (error) { toast.error(`追加に失敗しました: ${error.message}`); console.error(error); return; }
    setItems([...items, data as PantryItem]);
    setNewName("");
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

      <div className="px-4 md:px-8 pt-4 space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">今家にあるもの</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            {inStockCount}<span className="text-sm font-normal text-muted-foreground ml-1">品</span>
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="食材・調味料を追加..."
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addItem()}
            className="rounded-xl flex-1"
          />
          <Select value={newCategory} onValueChange={(v: string | null) => v && setNewCategory(v)}>
            <SelectTrigger className="rounded-xl w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PANTRY_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addItem} disabled={adding} className="rounded-xl bg-primary px-4">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

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

        <div className="space-y-5 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{category}</h3>
              <div className="space-y-1">
                {categoryItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                    <span className={`text-sm ${item.in_stock ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {item.name}
                    </span>
                    <Switch checked={item.in_stock} onCheckedChange={() => toggleStock(item)} />
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
