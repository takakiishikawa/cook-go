import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DB_SCHEMA, CLAUDE_SONNET } from "@/lib/constants";
import type { SuggestedRecipe, RecipeSuggestClaudeResponse } from "@/types/api";

const client = new Anthropic();

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [mealsResult, pantryResult, pastRecipesResult, settingsResult] =
      await Promise.all([
        supabase
          .schema(DB_SCHEMA)
          .from("meal_logs")
          .select("description, protein_g, logged_at, meal_type")
          .eq("user_id", user.id)
          .gte("logged_at", oneWeekAgo.toISOString()),
        supabase
          .schema(DB_SCHEMA)
          .from("pantry_items")
          .select("name, category, in_stock")
          .eq("user_id", user.id)
          .eq("in_stock", true),
        supabase
          .schema(DB_SCHEMA)
          .from("recipes")
          .select("title")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .schema(DB_SCHEMA)
          .from("user_settings")
          .select("protein_target_g")
          .eq("user_id", user.id)
          .single(),
      ]);

    const meals = mealsResult.data ?? [];
    const pantryItems = pantryResult.data ?? [];
    const pastRecipes = pastRecipesResult.data ?? [];
    const proteinTarget = settingsResult.data?.protein_target_g ?? 108;

    const totalProtein = meals.reduce((s, m) => s + Number(m.protein_g), 0);
    const avgDailyProtein = meals.length > 0 ? totalProtein / 7 : 0;

    const prompt = `あなたは栄養士兼料理家です。以下の情報をもとに、今週のミールプレップ向けレシピを4〜5件提案してください。

【ユーザー情報】
- 居住地: ホーチミン（ベトナム）
- タンパク質目標: ${proteinTarget}g/日
- 直近7日間の平均タンパク質摂取量: ${Math.round(avgDailyProtein)}g/日

【直近1週間の食事ログ】
${meals.map((m) => `- ${m.description ?? "不明"} (${m.protein_g}g タンパク質)`).join("\n") || "記録なし"}

【現在のストック食材】
${pantryItems.map((p) => p.name).join(", ") || "なし"}

【過去に提案・調理した料理（重複を避ける）】
${pastRecipes.map((r) => r.title).join(", ") || "なし"}

【固定条件】
- タンパク質多め（1食あたり30g以上推奨）
- 作り置き可能であること
- ホーチミン市内のスーパーで手に入る食材を使用
- 調理時間は60分以内
- 料理のバリエーションを増やすため、上記ログと重複しない料理を提案

以下のJSONフォーマットのみで返してください（説明文不要）：
{
  "recipes": [
    {
      "title": "料理名",
      "description": "一言説明（作り置き日数など）",
      "protein_g_per_serving": 数値,
      "calorie_kcal_per_serving": 数値,
      "prep_time_min": 数値,
      "is_meal_prep_friendly": true/false,
      "servings": 数値,
      "ingredients": [
        { "name": "食材名", "amount": "量", "in_pantry": true/false }
      ],
      "steps": [
        { "order": 1, "text": "手順" }
      ]
    }
  ]
}`;

    const response = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    let parsed: RecipeSuggestClaudeResponse;
    try {
      parsed = JSON.parse(jsonMatch[0]) as RecipeSuggestClaudeResponse;
    } catch {
      throw new Error("Invalid JSON in response");
    }

    const pantryNames = new Set(pantryItems.map((p) => p.name.toLowerCase()));
    const inserts = parsed.recipes.map((r: SuggestedRecipe) => ({
      user_id: user.id,
      title: r.title,
      description: r.description,
      protein_g_per_serving: r.protein_g_per_serving,
      calorie_kcal_per_serving: r.calorie_kcal_per_serving,
      prep_time_min: r.prep_time_min,
      is_meal_prep_friendly: r.is_meal_prep_friendly ?? true,
      servings: r.servings ?? 1,
      ingredients: r.ingredients.map((ing) => ({
        ...ing,
        in_pantry: pantryNames.has(ing.name.toLowerCase()),
      })),
      steps: r.steps,
      ai_generated: true,
    }));

    const { data: savedRecipes, error } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .insert(inserts)
      .select();

    if (error) throw error;

    return NextResponse.json({ recipes: savedRecipes });
  } catch (error) {
    console.error("Recipe suggestion error:", error);
    return NextResponse.json(
      { error: "レシピ提案に失敗しました" },
      { status: 500 },
    );
  }
}
