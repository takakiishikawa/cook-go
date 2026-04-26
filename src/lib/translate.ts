import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_HAIKU } from "./constants";

const client = new Anthropic();

export interface TranslationEntry {
  en?: string;
  vi?: string;
}

export async function translateNames(
  names: string[],
): Promise<Record<string, TranslationEntry>> {
  const list = Array.from(new Set(names.filter((n) => n.trim())));
  if (list.length === 0) return {};
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
${list.map((n) => `- ${n}`).join("\n")}`,
        },
      ],
    });
    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    return JSON.parse(match[0]) as Record<string, TranslationEntry>;
  } catch {
    return {};
  }
}

export async function translateTitle(title: string): Promise<string | null> {
  const t = await translateNames([title]);
  return t[title]?.en ?? null;
}
