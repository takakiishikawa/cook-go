import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DB_SCHEMA } from "@/lib/constants";
import { fetchRecipeImage } from "@/lib/image-query";
import { translateNames } from "@/lib/translate";
import type {
  RecipeSaveManyRequest,
  RecipeSaveManyResponse,
} from "@/types/api";
import type { RecipeIngredient, RecipeSourceTag } from "@/types/database";

function sumProtein(ingredients: RecipeIngredient[]): number {
  return (
    Math.round(
      ingredients.reduce(
        (s, i) => s + (typeof i.protein_g === "number" ? i.protein_g : 0),
        0,
      ) * 10,
    ) / 10
  );
}

function sumKcal(ingredients: RecipeIngredient[]): number {
  return Math.round(
    ingredients.reduce(
      (s, i) => s + (typeof i.kcal_kcal === "number" ? i.kcal_kcal : 0),
      0,
    ),
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as RecipeSaveManyRequest;
    const drafts = Array.isArray(body.recipes) ? body.recipes : [];
    if (drafts.length === 0)
      return NextResponse.json(
        { error: "保存するレシピがありません" },
        { status: 400 },
      );

    const source_tag: RecipeSourceTag =
      body.source_tag === "self" ? "self" : "ai_suggest";

    const { data: pantryData } = await supabase
      .schema(DB_SCHEMA)
      .from("pantry_items")
      .select("name")
      .eq("user_id", user.id)
      .eq("in_stock", true);
    const pantryNames = new Set(
      (pantryData ?? []).map((p) => p.name.toLowerCase()),
    );

    // Collect all ingredient names that need translation
    const namesToTranslate = new Set<string>();
    drafts.forEach((d) => {
      (d.ingredients ?? []).forEach((ing) => {
        if (ing.name && (!ing.name_en || !ing.name_vi)) {
          namesToTranslate.add(ing.name);
        }
      });
    });
    const translations =
      namesToTranslate.size > 0
        ? await translateNames(Array.from(namesToTranslate))
        : {};

    const images = await Promise.all(
      drafts.map((d) =>
        fetchRecipeImage({
          title: d.title,
          title_en: d.title_en,
          description: d.description,
          ingredients: d.ingredients ?? [],
        }),
      ),
    );

    const inserts = drafts.map((draft, i) => {
      const ingredients: RecipeIngredient[] = (draft.ingredients ?? []).map(
        (ing) => {
          const t = translations[ing.name];
          return {
            name: ing.name,
            name_en: ing.name_en ?? t?.en ?? null,
            name_vi: ing.name_vi ?? t?.vi ?? null,
            amount: ing.amount ?? "",
            unit: ing.unit ?? "",
            protein_g: typeof ing.protein_g === "number" ? ing.protein_g : null,
            kcal_kcal: typeof ing.kcal_kcal === "number" ? ing.kcal_kcal : null,
            in_pantry: pantryNames.has((ing.name ?? "").toLowerCase()),
            category: ing.category ?? null,
          };
        },
      );
      const hasAnyKcalData = ingredients.some(
        (i) => typeof i.kcal_kcal === "number",
      );
      return {
        user_id: user.id,
        title: draft.title,
        title_en: draft.title_en ?? null,
        description: draft.description ?? null,
        protein_g_per_serving: sumProtein(ingredients),
        calorie_kcal_per_serving: hasAnyKcalData
          ? sumKcal(ingredients)
          : draft.calorie_kcal_per_serving,
        prep_time_min: draft.prep_time_min,
        is_meal_prep_friendly: false,
        meal_prep_days: null,
        servings: 1,
        ingredients,
        steps: draft.steps ?? [],
        ai_generated: source_tag === "ai_suggest",
        is_tried: false,
        image_url: images[i],
        source_tag,
      };
    });

    const { data, error } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .insert(inserts)
      .select("id");
    if (error) throw error;

    return NextResponse.json({
      recipe_ids: (data ?? []).map((r) => r.id as string),
    } satisfies RecipeSaveManyResponse);
  } catch (error) {
    console.error("save-many error:", error);
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
    return NextResponse.json(
      { error: `保存に失敗しました: ${detail}` },
      { status: 500 },
    );
  }
}
