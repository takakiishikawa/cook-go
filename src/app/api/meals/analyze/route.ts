import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

async function fetchRecipeContext(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CookGo/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    return text;
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const { image_base64, meal_type, recipe_url } = await request.json();

    let recipeContext = "";
    if (recipe_url) {
      recipeContext = await fetchRecipeContext(recipe_url);
    }

    const contextNote = recipeContext
      ? `\n\n参照レシピ情報（栄養計算の参考に）:\n${recipeContext}`
      : "";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
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
  "meal_type": "${meal_type}"
}

食事が見えない場合や不明な場合は合理的な推定値を使用してください。JSONのみを返してください。`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse response");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Meal analysis error:", error);
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
}
