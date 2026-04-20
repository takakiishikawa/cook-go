import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CLAUDE_HAIKU } from "@/lib/constants";
import type { TranslateRequest, TranslateResponse } from "@/types/api";

const client = new Anthropic();

export async function POST(request: Request) {
  const body: TranslateRequest = await request.json();
  const { names } = body;
  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json({ translations: {} } satisfies TranslateResponse);
  }

  try {
    const response = await client.messages.create({
      model: CLAUDE_HAIKU,
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
    if (!jsonMatch) return NextResponse.json({ translations: {} } satisfies TranslateResponse);

    let translations: TranslateResponse["translations"];
    try {
      translations = JSON.parse(jsonMatch[0]) as TranslateResponse["translations"];
    } catch {
      return NextResponse.json({ translations: {} } satisfies TranslateResponse);
    }

    return NextResponse.json({ translations } satisfies TranslateResponse);
  } catch {
    return NextResponse.json({ translations: {} } satisfies TranslateResponse);
  }
}
