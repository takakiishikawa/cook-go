import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PantryClient } from "./pantry-client";

const PRESET_ITEMS = [
  { name: "鶏胸肉", category: "タンパク源" },
  { name: "豚ロース", category: "タンパク源" },
  { name: "牛ひき肉", category: "タンパク源" },
  { name: "卵", category: "タンパク源" },
  { name: "豆腐", category: "タンパク源" },
  { name: "ツナ缶", category: "タンパク源" },
  { name: "サーモン", category: "タンパク源" },
  { name: "えび", category: "タンパク源" },
  { name: "白米", category: "炭水化物" },
  { name: "パスタ", category: "炭水化物" },
  { name: "じゃがいも", category: "炭水化物" },
  { name: "ブロッコリー", category: "野菜" },
  { name: "ほうれん草", category: "野菜" },
  { name: "キャベツ", category: "野菜" },
  { name: "トマト", category: "野菜" },
  { name: "にんにく", category: "野菜" },
  { name: "玉ねぎ", category: "野菜" },
  { name: "醤油", category: "調味料" },
  { name: "塩", category: "調味料" },
  { name: "オリーブオイル", category: "調味料" },
  { name: "ごま油", category: "調味料" },
  { name: "魚醤（ヌックマム）", category: "調味料" },
  { name: "オイスターソース", category: "調味料" },
] as const;

export default async function PantryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const count = await db.pantry.count(supabase, user.id);
  if (count === 0) {
    await db.pantry.insertMany(
      supabase,
      PRESET_ITEMS.map(item => ({ user_id: user.id, ...item, in_stock: false })),
    );
  }

  const items = await db.pantry.getAll(supabase, user.id);

  return <PantryClient userId={user.id} items={items} />;
}
