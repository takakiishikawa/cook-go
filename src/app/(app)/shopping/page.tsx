import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ShoppingClient } from "./shopping-client";

export default async function ShoppingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const items = await db.shopping.getAll(supabase, user.id);

  return <ShoppingClient userId={user.id} items={items} />;
}
