import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_HAIKU } from "./constants";

const client = new Anthropic();

export interface TranslationEntry {
  en?: string;
  vi?: string;
  category?: string;
}

const VALID_CATEGORIES = new Set([
  "protein",
  "vegetable",
  "carb",
  "seasoning",
  "other",
]);

/**
 * 食材・料理名を一括で英語/ベトナム語/カテゴリへ変換する。
 * needCategory=true の時は category も返す（食材編集向け）。
 */
export async function translateNames(
  names: string[],
  options: { needCategory?: boolean } = {},
): Promise<Record<string, TranslationEntry>> {
  const list = Array.from(new Set(names.filter((n) => n.trim())));
  if (list.length === 0) return {};
  const cat = options.needCategory;
  try {
    const response = await client.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: cat
            ? `以下の食材名を英語・ベトナム語に翻訳し、さらにカテゴリを以下から1つ選んでください。
カテゴリ: protein (タンパク源/肉魚卵豆腐), vegetable (野菜/果物), carb (炭水化物/米麺パン), seasoning (調味料/酒/みりん/出汁), other (その他)

JSONオブジェクトで返してください。キーは元の日本語名、値は { "en": "...", "vi": "...", "category": "..." }。
JSONのみ返してください。

名前リスト:
${list.map((n) => `- ${n}`).join("\n")}`
            : `以下の食材・料理名を英語とベトナム語に翻訳してください。
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
    const parsed = JSON.parse(match[0]) as Record<string, TranslationEntry>;
    // sanitize category
    if (cat) {
      for (const key of Object.keys(parsed)) {
        const c = parsed[key]?.category;
        if (c && !VALID_CATEGORIES.has(c)) {
          parsed[key].category = "other";
        }
      }
    }
    return parsed;
  } catch {
    return {};
  }
}

export async function translateTitle(title: string): Promise<string | null> {
  const t = await translateNames([title]);
  return t[title]?.en ?? null;
}
