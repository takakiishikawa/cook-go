import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DB_SCHEMA } from "@/lib/constants";
import { fetchUnsplashImage } from "@/lib/unsplash";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DraftRecipe,
  RecipeSaveRequest,
  RecipeSaveResponse,
} from "@/types/api";
import type { RecipeIngredient, RecipeSourceTag } from "@/types/database";

function buildPayload(
  draft: DraftRecipe,
  imageUrl: string | null,
  pantryNames: Set<string>,
  source_tag: RecipeSourceTag,
) {
  const ingredients: RecipeIngredient[] = (draft.ingredients ?? []).map(
    (ing) => ({
      name: ing.name,
      name_en: ing.name_en ?? null,
      name_vi: ing.name_vi ?? null,
      amount: ing.amount ?? "",
      unit: ing.unit ?? "",
      protein_g: typeof ing.protein_g === "number" ? ing.protein_g : null,
      in_pantry: pantryNames.has((ing.name ?? "").toLowerCase()),
      category: ing.category ?? null,
    }),
  );
  return {
    title: draft.title,
    title_en: draft.title_en ?? null,
    description: draft.description ?? null,
    protein_g_per_serving: draft.protein_g_per_serving,
    calorie_kcal_per_serving: draft.calorie_kcal_per_serving,
    prep_time_min: draft.prep_time_min,
    is_meal_prep_friendly: draft.is_meal_prep_friendly ?? false,
    meal_prep_days: draft.meal_prep_days ?? 1,
    servings: draft.servings ?? 1,
    ingredients,
    steps: draft.steps ?? [],
    ai_generated: source_tag === "ai_suggest",
    is_tried: false,
    image_url: imageUrl,
    source_tag,
  };
}

async function getPantryNames(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .schema(DB_SCHEMA)
    .from("pantry_items")
    .select("name")
    .eq("user_id", userId)
    .eq("in_stock", true);
  return new Set((data ?? []).map((p) => p.name.toLowerCase()));
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as RecipeSaveRequest;
    const draft = body.recipe;
    if (!draft || !draft.title?.trim())
      return NextResponse.json(
        { error: "タイトルは必須です" },
        { status: 400 },
      );

    const source_tag: RecipeSourceTag =
      body.source_tag === "ai_suggest" ? "ai_suggest" : "self";

    const pantryNames = await getPantryNames(supabase, user.id);
    const imageUrl = draft.title_en
      ? await fetchUnsplashImage(draft.title_en)
      : null;

    const payload = buildPayload(draft, imageUrl, pantryNames, source_tag);

    const { data, error } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .insert({ user_id: user.id, ...payload })
      .select("id")
      .single();
    if (error) throw error;

    return NextResponse.json({
      recipe_id: data.id,
    } satisfies RecipeSaveResponse);
  } catch (error) {
    console.error("save POST error:", error);
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

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "id クエリは必須です" },
        { status: 400 },
      );

    const body = (await request.json()) as RecipeSaveRequest;
    const draft = body.recipe;
    if (!draft || !draft.title?.trim())
      return NextResponse.json(
        { error: "タイトルは必須です" },
        { status: 400 },
      );

    const { data: existing } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .select("title_en, image_url, source_tag")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pantryNames = await getPantryNames(supabase, user.id);

    let imageUrl = existing.image_url as string | null;
    if (
      draft.title_en &&
      draft.title_en !== existing.title_en
    ) {
      imageUrl = await fetchUnsplashImage(draft.title_en);
    }

    const source_tag: RecipeSourceTag =
      (existing.source_tag as RecipeSourceTag | null) ?? "self";

    const payload = buildPayload(draft, imageUrl, pantryNames, source_tag);

    const { error } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    return NextResponse.json({
      recipe_id: id,
    } satisfies RecipeSaveResponse);
  } catch (error) {
    console.error("save PUT error:", error);
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
    return NextResponse.json(
      { error: `更新に失敗しました: ${detail}` },
      { status: 500 },
    );
  }
}
