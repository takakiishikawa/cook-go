import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { image_base64, meal_type } = await request.json();

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
              text: `この食事の写真を分析して、タンパク質量とカロリーを推定してください。

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
