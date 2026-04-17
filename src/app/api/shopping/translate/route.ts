import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: Request) {
  const { names } = await request.json();
  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json({ translations: {} });
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `以下の食材・料理名を英語とベトナム語に翻訳してください。
JSONオブジェクトで返してください。キーは元の日本語名、値は { "en": "英語名", "vi": "ベトナム語名" } の形式。
JSONのみ返してください。

名前リスト:
${names.map((n: string) => `- ${n}`).join("\n")}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ translations: {} });

    const translations = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json({ translations: {} });
  }
}
