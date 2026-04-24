import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RecipeDetailClient } from "./recipe-detail-client";

export default async function RecipeDetailPage({
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

  if (!recipe) notFound();

  return (
    <RecipeDetailClient
      recipe={recipe}
      pantryItems={pantryItems.map((p) => ({
        name: p.name,
        in_stock: p.in_stock,
      }))}
    />
  );
}
