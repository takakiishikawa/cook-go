"use client";

import { useState } from "react";
import { Plus, Trash2, ShoppingBag, Globe, ImageOff } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Checkbox,
  Input,
  EmptyState,
  PageHeader,
  Card,
  CardContent,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Section,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { ShoppingListItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";
import { useFoodImage } from "@/hooks/use-food-image";

interface ShoppingClientProps {
  userId: string;
  items: ShoppingListItem[];
}

function ItemImage({ item }: { item: ShoppingListItem }) {
  const query = item.name_en ?? item.name;
  const { imageUrl, error } = useFoodImage(item.image_url ? null : query);
  const src = item.image_url ?? imageUrl;

  if (!src || error) {
    return (
      <div className="w-10 h-10 rounded-md bg-surface-subtle flex items-center justify-center flex-shrink-0">
        <ImageOff className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={item.name}
      className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-muted"
    />
  );
}

export function ShoppingClient({
  userId,
  items: initialItems,
}: ShoppingClientProps) {
  const supabase = createClient();
  const [items, setItems] = useState<ShoppingListItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);
  const [storeMode, setStoreMode] = useState(false);
  const [pendingPantryItem, setPendingPantryItem] =
    useState<ShoppingListItem | null>(null);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const toggleItem = async (item: ShoppingListItem) => {
    const { error } = await db.shopping.update(supabase, item.id, {
      checked: !item.checked,
    });
    if (error) {
      toast.error("更新に失敗しました");
      return;
    }
    setItems(
      items.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)),
    );
    if (!item.checked) setPendingPantryItem(item);
  };

  const confirmAddToPantry = async () => {
    if (!pendingPantryItem) return;
    const itemName = pendingPantryItem.name.replace(/\s+\S+$/, "").trim();
    await db.pantry.upsert(supabase, {
      user_id: userId,
      name: itemName,
      in_stock: true,
    });
    toast.success(`${itemName}を食材庫に追加しました`);
    setPendingPantryItem(null);
  };

  const deleteItem = async (id: string) => {
    const { error } = await db.shopping.delete(supabase, id);
    if (error) {
      toast.error("削除に失敗しました");
      return;
    }
    setItems(items.filter((i) => i.id !== id));
  };

  const clearChecked = async () => {
    const ids = checked.map((i) => i.id);
    const { error } = await db.shopping.deleteMany(supabase, ids);
    if (error) {
      toast.error("削除に失敗しました");
      return;
    }
    setItems(unchecked);
    toast.success(`${ids.length}件を削除しました`);
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;
    setAdding(true);
    const { error, data } = await db.shopping.insert(supabase, {
      user_id: userId,
      name: newItemName.trim(),
      checked: false,
    });
    setAdding(false);
    if (error) {
      toast.error("追加に失敗しました");
      return;
    }
    setItems([data as ShoppingListItem, ...items]);
    setNewItemName("");
  };

  return (
    <div className="flex flex-col">
      <AppHeader />

      <AlertDialog
        open={!!pendingPantryItem}
        onOpenChange={(open) => !open && setPendingPantryItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>食材庫に追加しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{pendingPantryItem?.name}」を食材庫の在庫に追加します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>スキップ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddToPantry}>
              追加する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 店員に見せるモード */}
      <Sheet open={storeMode} onOpenChange={setStoreMode}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>店員に見せる / Show to staff</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pt-4">
            {unchecked.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <ItemImage item={item} />
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-semibold text-foreground">
                        {item.name}
                      </p>
                      {item.name_en && (
                        <p className="text-lg font-medium text-muted-foreground">
                          {item.name_en}
                        </p>
                      )}
                      {item.name_vi && (
                        <p className="text-lg font-semibold text-info">
                          {item.name_vi}
                        </p>
                      )}
                      {item.amount && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.amount}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {unchecked.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                未購入アイテムがありません
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-5 max-w-2xl">
        <PageHeader
          title="買い物リスト"
          description={
            unchecked.length > 0
              ? `未購入 ${unchecked.length}品`
              : checked.length > 0
                ? "すべて購入済み"
                : undefined
          }
          actions={
            unchecked.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStoreMode(true)}
                className="gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                店員に見せる
              </Button>
            ) : undefined
          }
        />

        <div className="flex gap-2">
          <Input
            placeholder="アイテムを追加..."
            value={newItemName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewItemName(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && addItem()
            }
            className="flex-1"
          />
          <Button onClick={addItem} disabled={adding} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-6 h-6" />}
            title="買い物リストは空です"
            description="レシピページから買い物リストを生成するか、手動で追加してください"
          />
        ) : (
          <div className="space-y-6 pb-4">
            {unchecked.length > 0 && (
              <Section title="未購入" description={`${unchecked.length}品`}>
                <div className="space-y-1.5">
                  {unchecked.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-card border border-border rounded-md px-3 py-2.5"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => toggleItem(item)}
                        className="flex-shrink-0"
                      />
                      <ItemImage item={item} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.name}</p>
                        {(item.name_en || item.name_vi) && (
                          <p className="text-xs text-muted-foreground">
                            {[item.name_en, item.name_vi]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChecked}
                    className="text-sm text-destructive font-medium hover:underline h-auto p-0"
                  >
                    クリア
                  </Button>
                }
              >
                <div className="space-y-1.5">
                  {checked.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-muted border border-border rounded-md px-3 py-2.5 opacity-60"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => toggleItem(item)}
                        className="flex-shrink-0"
                      />
                      <ItemImage item={item} />
                      <span className="flex-1 text-sm line-through text-muted-foreground">
                        {item.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
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
