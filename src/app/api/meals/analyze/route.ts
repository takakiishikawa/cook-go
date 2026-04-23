import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CLAUDE_SONNET, WIKI_USER_AGENT } from "@/lib/constants";
import type { MealAnalysisRequest, MealAnalysisResponse } from "@/types/api";

const client = new Anthropic();

async function fetchRecipeContext(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    const res = await fetch(url, {
      headers: { "User-Agent": WIKI_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const body: MealAnalysisRequest = await request.json();
    const { image_base64, meal_type, recipe_url } = body;

    const recipeContext = recipe_url
      ? await fetchRecipeContext(recipe_url)
      : "";
    const contextNote = recipeContext
      ? `\n\n参照レシピ情報（栄養計算の参考に）:\n${recipeContext}`
      : "";

    const response = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image_base64,
              },
            },
            {
              type: "text",
              text: `この食事の写真を分析して、タンパク質量とカロリーを推定してください。${contextNote}

必ずJSON形式で以下のフィールドを含めて回答してください：
{
  "description": "食事の内容（例: 鶏胸肉ソテー + 白米 + ブロッコリー）",
  "protein_g": タンパク質量（数値、単位:g）,
  "calorie_kcal": カロリー（数値、単位:kcal）,
  "meal_type": "${meal_type ?? "snack"}"
}

食事が見えない場合や不明な場合は合理的な推定値を使用してください。JSONのみを返してください。`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    let result: MealAnalysisResponse;
    try {
      result = JSON.parse(jsonMatch[0]) as MealAnalysisResponse;
    } catch {
      throw new Error("Invalid JSON in response");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Meal analysis error:", error);
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
}
