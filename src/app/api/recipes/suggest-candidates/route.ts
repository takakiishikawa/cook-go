import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DB_SCHEMA } from "@/lib/constants";
import {
  callClaudeJson,
  normalizeDraft,
  FIXED_CONSTRAINTS,
  SCHEMA_SAMPLE,
  type RawDraft,
} from "@/lib/recipes-ai";
import type {
  RecipeSuggestCandidatesRequest,
  RecipeSuggestCandidatesResponse,
} from "@/types/api";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as RecipeSuggestCandidatesRequest;
    const conditions = (body.conditions ?? "").trim();

    const fourWeeksAgo = new Date(Date.now() - 28 * 86400_000)
      .toISOString()
      .split("T")[0];

    const [recentRecipesResult, recentLogsResult, pantryResult] =
      await Promise.all([
        supabase
          .schema(DB_SCHEMA)
          .from("recipes")
          .select("title")
          .eq("user_id", user.id)
          .gte("created_at", fourWeeksAgo)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .schema(DB_SCHEMA)
          .from("food_logs")
          .select("recipe:recipes(title)")
          .eq("user_id", user.id)
          .gte("logged_date", fourWeeksAgo)
          .order("logged_date", { ascending: false })
          .limit(40),
        supabase
          .schema(DB_SCHEMA)
          .from("pantry_items")
          .select("name")
          .eq("user_id", user.id)
          .eq("in_stock", true),
      ]);

    const recentRecipes = (recentRecipesResult.data ?? []).map((r) => r.title);
    const recentLogTitles = ((recentLogsResult.data ?? []) as unknown as Array<{
      recipe: { title: string } | null;
    }>)
      .map((l) => l.recipe?.title)
      .filter((t): t is string => !!t);
    const avoid = Array.from(new Set([...recentRecipes, ...recentLogTitles]));
    const pantryNames = (pantryResult.data ?? []).map((p) => p.name);

    const prompt = `あなたは栄養士兼料理家です。以下の条件に合うレシピを3〜5件、JSONで提案してください。日本語で出力。

【ユーザーの条件】
${conditions || "（特になし。バランス良く高タンパクなレシピを3〜5件）"}

【現在のストック食材】
${pantryNames.join(", ") || "なし"}

【直近4週間で登録済み・記録済みの料理（重複を避ける）】
${avoid.join(", ") || "なし"}

${FIXED_CONSTRAINTS}

以下のJSONフォーマットのみで返してください（説明文不要）：
{
  "candidates": [
    ${SCHEMA_SAMPLE}
  ]
}`;

    const parsed = (await callClaudeJson(prompt)) as {
      candidates?: RawDraft[];
    };
    const list = Array.isArray(parsed.candidates) ? parsed.candidates : [];
    const drafts = list
      .map(normalizeDraft)
      .filter((d): d is NonNullable<typeof d> => d !== null);
    if (drafts.length === 0) throw new Error("候補を生成できませんでした");

    return NextResponse.json({
      candidates: drafts,
    } satisfies RecipeSuggestCandidatesResponse);
  } catch (error) {
    console.error("suggest-candidates error:", error);
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
    return NextResponse.json(
      { error: `候補生成に失敗しました: ${detail}` },
      { status: 500 },
    );
  }
}
