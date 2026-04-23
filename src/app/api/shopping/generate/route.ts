import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DB_SCHEMA } from "@/lib/constants";
import type { ShoppingGenerateRequest } from "@/types/api";
import type { RecipeIngredient } from "@/types/database";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body: ShoppingGenerateRequest = await request.json();
    const { recipe_id } = body;

    const { data: recipe, error: recipeError } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .select("*")
      .eq("id", recipe_id)
      .eq("user_id", user.id)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const { data: pantryItems } = await supabase
      .schema(DB_SCHEMA)
      .from("pantry_items")
      .select("name, in_stock")
      .eq("user_id", user.id)
      .eq("in_stock", true);

    const pantryNames = new Set(
      (pantryItems ?? []).map((p: { name: string }) => p.name.toLowerCase()),
    );
    const ingredients = (recipe.ingredients as RecipeIngredient[]) ?? [];
    const itemsToShop = ingredients.filter(
      (ing) => !pantryNames.has(ing.name.toLowerCase()),
    );

    if (itemsToShop.length === 0) {
      return NextResponse.json({
        message: "すべての食材がストックにあります",
        items: [],
      });
    }

    const { data: insertedItems, error: insertError } = await supabase
      .schema(DB_SCHEMA)
      .from("shopping_list_items")
      .insert(
        itemsToShop.map((ing) => ({
          user_id: user.id,
          recipe_id,
          name: `${ing.name} ${ing.amount}`,
          checked: false,
        })),
      )
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({ items: insertedItems });
  } catch (error) {
    console.error("Shopping list generate error:", error);
    return NextResponse.json(
      { error: "買い物リスト生成に失敗しました" },
      { status: 500 },
    );
  }
}
