import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DB_SCHEMA } from "@/lib/constants";
import { fetchUnsplashImage } from "@/lib/unsplash";
import type {
  RecipeSaveManyRequest,
  RecipeSaveManyResponse,
} from "@/types/api";
import type { RecipeSourceTag } from "@/types/database";

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

    const images = await Promise.all(
      drafts.map((d) =>
        d.title_en ? fetchUnsplashImage(d.title_en) : Promise.resolve(null),
      ),
    );

    const inserts = drafts.map((draft, i) => ({
      user_id: user.id,
      title: draft.title,
      title_en: draft.title_en ?? null,
      description: draft.description ?? null,
      protein_g_per_serving: draft.protein_g_per_serving,
      calorie_kcal_per_serving: draft.calorie_kcal_per_serving,
      prep_time_min: draft.prep_time_min,
      is_meal_prep_friendly: draft.is_meal_prep_friendly ?? false,
      meal_prep_days: draft.meal_prep_days ?? 1,
      servings: draft.servings ?? 1,
      ingredients: (draft.ingredients ?? []).map((ing) => ({
        ...ing,
        unit: ing.unit ?? "",
        protein_g: typeof ing.protein_g === "number" ? ing.protein_g : null,
        in_pantry: pantryNames.has((ing.name ?? "").toLowerCase()),
      })),
      steps: draft.steps ?? [],
      ai_generated: source_tag === "ai_suggest",
      is_tried: false,
      image_url: images[i],
      source_tag,
    }));

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
