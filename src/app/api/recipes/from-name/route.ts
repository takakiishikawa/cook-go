import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  callClaudeJson,
  normalizeDraft,
  FIXED_CONSTRAINTS,
  SCHEMA_SAMPLE,
  type RawDraft,
} from "@/lib/recipes-ai";
import type {
  RecipeFromNameRequest,
  RecipeFromNameResponse,
} from "@/types/api";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as RecipeFromNameRequest;
    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json(
        { error: "料理名を入力してください" },
        { status: 400 },
      );
    }

    const prompt = `あなたは栄養士兼料理家です。料理名「${title}」のレシピを1件、JSONで作成してください。
妥当な推定値で数値（タンパク質量・カロリー・所要時間）を埋めてください。日本語で出力してください。

${FIXED_CONSTRAINTS}

以下のJSONフォーマットのみで返してください（説明文不要）：
{
  "recipe": ${SCHEMA_SAMPLE}
}`;

    const parsed = (await callClaudeJson(prompt)) as { recipe?: RawDraft };
    if (!parsed.recipe) throw new Error("レシピを生成できませんでした");
    const draft = normalizeDraft(parsed.recipe);
    if (!draft) throw new Error("生成内容を解釈できませんでした");

    return NextResponse.json({
      recipe: draft,
    } satisfies RecipeFromNameResponse);
  } catch (error) {
    console.error("from-name error:", error);
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
