import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecipesClient } from "./recipes-client";

export default async function RecipesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: recipes } = await supabase
    .schema("cookgo")
    .from("recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <RecipesClient recipes={recipes ?? []} />;
}
