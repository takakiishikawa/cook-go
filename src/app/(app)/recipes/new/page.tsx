import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { NewRecipeClient } from "./new-client";

export default async function NewRecipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const pantryItems = await db.pantry.getAll(supabase, user.id);
  return <NewRecipeClient pantryItems={pantryItems} />;
}
