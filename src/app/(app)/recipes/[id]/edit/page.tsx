import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EditRecipeClient } from "./edit-client";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [recipe, pantryItems] = await Promise.all([
    db.recipes.getById(supabase, user.id, id),
    db.pantry.getAll(supabase, user.id),
  ]);
  if (!recipe) redirect("/recipes");

  return <EditRecipeClient recipe={recipe} pantryItems={pantryItems} />;
}
