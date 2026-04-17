import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShoppingClient } from "./shopping-client";

export default async function ShoppingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: items } = await supabase
    .schema("cookgo")
    .from("shopping_list_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <ShoppingClient userId={user.id} items={items ?? []} />;
}
