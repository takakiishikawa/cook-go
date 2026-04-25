import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DB_SCHEMA, CLAUDE_SONNET } from "@/lib/constants";
import type {
  SuggestedRecipe,
  RecipeImportClaudeResponse,
  RecipeFromTextRequest,
} from "@/types/api";

const client = new Anthropic();

const MAX_INPUT_CHARS = 4_000;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as RecipeFromTextRequest;
    const text = (body.text ?? "").trim();
    if (!text) {
      return NextResponse.json(
        { error: "メモを入力してください" },
        { status: 400 },
      );
    }
    if (text.length > MAX_INPUT_CHARS) {
      return NextResponse.json(
        { error: `入力が長すぎます（${MAX_INPUT_CHARS}文字以内）` },
        { status: 400 },
      );
    }

    const prompt = `あなたは栄養士兼料理家です。以下はユーザーが書いたレシピのメモです。これを元に整ったレシピ1件をJSONで作成してください。
記載されていない数値は妥当な推定値（タンパク質量・カロリー・所要時間）で埋めてください。日本語で出力してください。
固定条件：高タンパク（1食あたり30g以上、可能なら40g以上）。

【ユーザーのメモ】
${text}

以下のJSONフォーマットのみで返してください（説明文不要）：
{
  "recipe": {
    "title": "豚の生姜焼き",
    "title_en": "Ginger Pork",
    "description": "短い説明（1〜2文）",
    "protein_g_per_serving": 38,
    "calorie_kcal_per_serving": 520,
    "prep_time_min": 25,
    "is_meal_prep_friendly": true,
    "meal_prep_days": 2,
    "servings": 2,
    "ingredients": [
      {
        "name": "豚ロース",
        "name_en": "Pork loin",
        "name_vi": "Thịt heo thăn",
        "amount": "200g",
        "in_pantry": false,
        "category": "protein"
      }
    ],
    "steps": [
      { "order": 1, "text": "豚肉を一口大に切る", "image_query": "slicing pork loin" }
    ]
  }
}`;

    const response = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const out =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = out.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claudeの応答からJSONを抽出できませんでした");

    let parsed: RecipeImportClaudeResponse;
    try {
      parsed = JSON.parse(jsonMatch[0]) as RecipeImportClaudeResponse;
    } catch {
      throw new Error("Claudeの応答JSONが不正です");
    }
    const r: SuggestedRecipe = parsed.recipe;
    if (
      !r ||
      !r.title ||
      !Array.isArray(r.ingredients) ||
      !Array.isArray(r.steps)
    ) {
      throw new Error("レシピ情報を生成できませんでした");
    }

    const { data: pantryData } = await supabase
      .schema(DB_SCHEMA)
      .from("pantry_items")
      .select("name")
      .eq("user_id", user.id)
      .eq("in_stock", true);
    const pantryNames = new Set(
      (pantryData ?? []).map((p) => p.name.toLowerCase()),
    );

    const insert = {
      user_id: user.id,
      title: r.title,
      title_en: r.title_en ?? null,
      description: r.description,
      protein_g_per_serving: r.protein_g_per_serving,
      calorie_kcal_per_serving: r.calorie_kcal_per_serving,
      prep_time_min: r.prep_time_min,
      is_meal_prep_friendly: r.is_meal_prep_friendly ?? false,
      meal_prep_days: r.meal_prep_days ?? 1,
      servings: r.servings ?? 1,
      ingredients: r.ingredients.map((ing) => ({
        ...ing,
        in_pantry: pantryNames.has(ing.name.toLowerCase()),
      })),
      steps: r.steps,
      ai_generated: true,
      is_tried: false,
    };

    const { data: saved, error } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .insert(insert)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ recipe: saved });
  } catch (error) {
    console.error("Recipe from-text error:", error);
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
    return NextResponse.json(
      { error: `レシピ生成に失敗しました: ${detail}` },
      { status: 500 },
    );
  }
}
