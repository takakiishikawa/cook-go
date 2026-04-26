import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_HAIKU } from "./constants";
import { fetchUnsplashImage } from "./unsplash";
import type { RecipeIngredient } from "@/types/database";

const client = new Anthropic();

interface RecipeForImage {
  title: string;
  title_en: string | null;
  description: string | null;
  ingredients: RecipeIngredient[] | null;
}

/**
 * レシピ情報を渡すと、Unsplash 検索に適した英語クエリを Claude Haiku で生成する。
 * 失敗時は title_en もしくは title を返す。
 */
export async function generateImageQuery(
  recipe: RecipeForImage,
): Promise<string> {
  const fallback = recipe.title_en?.trim() || recipe.title;
  try {
    const ingredientsList = (recipe.ingredients ?? [])
      .slice(0, 6)
      .map((i) => i.name_en || i.name)
      .filter(Boolean)
      .join(", ");

    const prompt = `Generate a 4-6 word English Unsplash search query for finding a photo of this Japanese dish.
Output the query string only — no quotes, no markdown, no explanation, no leading/trailing whitespace beyond the query.

Rules:
- Reflect what the dish actually looks like (texture, key ingredients, plating).
- Avoid ambiguous single words like "oatmeal" or "egg" alone — combine them with context like "porridge", "bowl", "scrambled", "rice", "stir-fry".
- If the dish is a breakfast/lunch/dinner type, include that.
- Prefer concrete dish words: "stir-fry", "rice bowl", "porridge", "soup", "salad", "sandwich".

Recipe:
- Name (ja): ${recipe.title}
- Name (en): ${recipe.title_en ?? "(none)"}
- Description: ${recipe.description ?? "(none)"}
- Main ingredients: ${ingredientsList || "(none)"}`;

    const response = await client.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 64,
      messages: [{ role: "user", content: prompt }],
    });
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text
      .replace(/^["'`\s]+|["'`\s]+$/g, "")
      .replace(/\n[\s\S]*/g, "")
      .trim();
    return cleaned || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Claude で生成した検索クエリで Unsplash を引いて画像URLを返す。
 * 取得失敗時は title_en/title でフォールバック検索する。
 */
export async function fetchRecipeImage(
  recipe: RecipeForImage,
): Promise<string | null> {
  const query = await generateImageQuery(recipe);
  const primary = await fetchUnsplashImage(query);
  if (primary) return primary;
  const fallbackQuery = recipe.title_en?.trim() || recipe.title;
  if (fallbackQuery && fallbackQuery !== query) {
    return await fetchUnsplashImage(fallbackQuery);
  }
  return null;
}
