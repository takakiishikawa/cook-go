import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DB_SCHEMA, CLAUDE_SONNET } from "@/lib/constants";
import type {
  SuggestedRecipe,
  RecipeSuggestClaudeResponse,
  RecipeSuggestRequest,
} from "@/types/api";

const client = new Anthropic();

async function fetchUnsplashImage(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ urls?: { regular?: string } }>;
    };
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    let body: RecipeSuggestRequest = {};
    try {
      body = (await request.json()) as RecipeSuggestRequest;
    } catch {
      // body省略時は空オブジェクト
    }
    const mainIngredient = body.main_ingredient?.trim() ?? "";
    const tags = (body.tags ?? []).filter((t) => typeof t === "string");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [pantryResult, pastRecipesResult, settingsResult, plansResult] =
      await Promise.all([
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
        supabase
          .schema(DB_SCHEMA)
          .from("meal_plans")
          .select(
            "planned_date, servings, recipe:recipes(protein_g_per_serving)",
          )
          .eq("user_id", user.id)
          .gte(
            "planned_date",
            new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
          ),
      ]);

    const pantryItems = pantryResult.data ?? [];
    const pastRecipes = pastRecipesResult.data ?? [];
    const proteinTarget = settingsResult.data?.protein_target_g ?? 108;

    const recentPlans = (plansResult.data ?? []) as unknown as Array<{
      servings: number;
      recipe: { protein_g_per_serving: number | null };
    }>;
    const avgDailyProtein =
      recentPlans.length > 0
        ? recentPlans.reduce(
            (s, p) => s + (p.recipe?.protein_g_per_serving ?? 0) * p.servings,
            0,
          ) / 7
        : 0;

    const userRequestSection: string[] = [];
    if (mainIngredient) {
      userRequestSection.push(
        `- メイン食材として「${mainIngredient}」を必ず使用すること`,
      );
    }
    if (tags.length > 0) {
      userRequestSection.push(`- 好み・条件タグ: ${tags.join(", ")}`);
    }

    const prompt = `あなたは栄養士兼料理家です。以下の情報をもとに、今週のミールプレップ向けレシピを4〜5件提案してください。

【ユーザー情報】
- 居住地: ホーチミン（ベトナム）
- タンパク質目標: ${proteinTarget}g/日
- 直近7日間の推定平均タンパク質: ${Math.round(avgDailyProtein)}g/日

【現在のストック食材】
${pantryItems.map((p) => p.name).join(", ") || "なし"}

【過去に提案した料理（重複を避ける）】
${pastRecipes.map((r) => r.title).join(", ") || "なし"}

【ユーザーリクエスト】
${userRequestSection.length > 0 ? userRequestSection.join("\n") : "- 特になし（おまかせ）"}

【固定条件（最優先・必ず守る）】
- 高タンパク（1食あたり30g以上、可能なら40g以上）
- ホーチミン市内のスーパーで手に入る食材を使用
- 調理時間は60分以内

以下のJSONフォーマットのみで返してください（説明文不要）：
{
  "recipes": [
    {
      "title": "豚肉の生姜醤油炒め",
      "title_en": "Ginger Soy Pork Stir-fry",
      "description": "作り置き可能。3日分まとめて作れる。",
      "protein_g_per_serving": 42,
      "calorie_kcal_per_serving": 380,
      "prep_time_min": 25,
      "is_meal_prep_friendly": true,
      "meal_prep_days": 3,
      "servings": 4,
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
        {
          "order": 1,
          "text": "豚肉を一口大に切る",
          "image_query": "slicing pork loin"
        }
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
      throw new Error("Invalid JSON");
    }

    const pantryNames = new Set(pantryItems.map((p) => p.name.toLowerCase()));
    const inserts = parsed.recipes.map((r: SuggestedRecipe) => ({
      user_id: user.id,
      title: r.title,
      title_en: r.title_en ?? null,
      description: r.description,
      protein_g_per_serving: r.protein_g_per_serving,
      calorie_kcal_per_serving: r.calorie_kcal_per_serving,
      prep_time_min: r.prep_time_min,
      is_meal_prep_friendly: r.is_meal_prep_friendly ?? true,
      meal_prep_days: r.meal_prep_days ?? 1,
      servings: r.servings ?? 1,
      ingredients: r.ingredients.map((ing) => ({
        ...ing,
        in_pantry: pantryNames.has(ing.name.toLowerCase()),
      })),
      steps: r.steps,
      ai_generated: true,
      is_tried: false,
    }));

    const { data: savedRecipes, error } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .insert(inserts)
      .select();
    if (error) throw error;

    // Fetch Unsplash images asynchronously and update DB
    const imageUpdates = (savedRecipes ?? []).map(async (recipe, i) => {
      const titleEn = parsed.recipes[i]?.title_en;
      if (!titleEn) return;
      const imageUrl = await fetchUnsplashImage(titleEn);
      if (!imageUrl) return;
      await supabase
        .schema(DB_SCHEMA)
        .from("recipes")
        .update({ image_url: imageUrl })
        .eq("id", recipe.id);
      recipe.image_url = imageUrl;
    });
    await Promise.allSettled(imageUpdates);

    return NextResponse.json({ recipes: savedRecipes });
  } catch (error) {
    console.error("Recipe suggestion error:", error);
    return NextResponse.json(
      { error: "レシピ提案に失敗しました" },
      { status: 500 },
    );
  }
}
