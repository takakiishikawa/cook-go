import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { RecipeDetailClient } from "./recipe-detail-client";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: recipe } = await supabase
    .schema("cookgo")
    .from("recipes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!recipe) notFound();

  const { data: pantryItems } = await supabase
    .schema("cookgo")
    .from("pantry_items")
    .select("name, in_stock")
    .eq("user_id", user.id);

  return <RecipeDetailClient recipe={recipe} pantryItems={pantryItems ?? []} />;
}
