import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_SONNET } from "./constants";
import type { DraftRecipe } from "@/types/api";
import type { RecipeIngredient, RecipeStep } from "@/types/database";

const anthropic = new Anthropic();

export const SCHEMA_SAMPLE = `{
  "title": "豚の生姜焼き",
  "title_en": "Ginger Pork",
  "description": "1〜2文の説明",
  "protein_g_per_serving": 38,
  "calorie_kcal_per_serving": 520,
  "prep_time_min": 25,
  "is_meal_prep_friendly": true,
  "meal_prep_days": 2,
  "servings": 2,
  "ingredients": [
    {
      "name": "豚ロース",
      "name_en": "Pork loin",
      "name_vi": "Thịt heo thăn",
      "amount": "150",
      "unit": "g",
      "protein_g": 31,
      "category": "protein"
    },
    {
      "name": "醤油",
      "name_en": "Soy sauce",
      "name_vi": "Nước tương",
      "amount": "大さじ2",
      "unit": "",
      "protein_g": 0,
      "category": "seasoning"
    }
  ],
  "steps": [
    { "order": 1, "text": "豚肉を一口大に切る", "image_query": "slicing pork loin" }
  ]
}`;

export const FIXED_CONSTRAINTS = `【固定条件（最優先・必ず守る）】
- 高タンパク（1食あたり30g以上、可能なら40g以上）
- ホーチミン市内のスーパーで手に入る食材を使用
- 調理時間は60分以内
- 食材は具体的に（例：「肉」ではなく「豚バラ肉」「鶏胸肉」など）
- ingredients[*].protein_g は その amount での絶対値（例: 豚ロース150gで31g）。後で量を変更したとき protein_g/amount の比率で再計算するため、必ず妥当な値を入れる
- ingredients[*].unit は数値量のときは "g" / "ml" など。それ以外（"大さじ2" 等のように amount に単位含む）は空文字 ""`;

export interface RawDraft {
  title?: unknown;
  title_en?: unknown;
  description?: unknown;
  protein_g_per_serving?: unknown;
  calorie_kcal_per_serving?: unknown;
  prep_time_min?: unknown;
  is_meal_prep_friendly?: unknown;
  meal_prep_days?: unknown;
  servings?: unknown;
  ingredients?: unknown;
  steps?: unknown;
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}
function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function normalizeIngredient(raw: unknown): RecipeIngredient | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name);
  if (!name) return null;
  return {
    name,
    name_en: asString(r.name_en),
    name_vi: asString(r.name_vi),
    amount: typeof r.amount === "number" ? String(r.amount) : (asString(r.amount) ?? ""),
    unit: asString(r.unit) ?? "",
    protein_g: asNumber(r.protein_g),
    in_pantry: r.in_pantry === true,
    category: asString(r.category),
  };
}

function normalizeStep(raw: unknown): RecipeStep | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const text = asString(r.text);
  if (!text) return null;
  return {
    order: asNumber(r.order) ?? 0,
    text,
    image_query: asString(r.image_query),
  };
}

export function normalizeDraft(raw: RawDraft): DraftRecipe | null {
  const title = asString(raw.title);
  if (!title) return null;
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients
        .map(normalizeIngredient)
        .filter((i): i is RecipeIngredient => i !== null)
    : [];
  const steps = Array.isArray(raw.steps)
    ? raw.steps.map(normalizeStep).filter((s): s is RecipeStep => s !== null)
    : [];
  return {
    title,
    title_en: asString(raw.title_en),
    description: asString(raw.description),
    protein_g_per_serving: asNumber(raw.protein_g_per_serving),
    calorie_kcal_per_serving: asNumber(raw.calorie_kcal_per_serving),
    prep_time_min: asNumber(raw.prep_time_min),
    is_meal_prep_friendly: raw.is_meal_prep_friendly === true,
    meal_prep_days: asNumber(raw.meal_prep_days),
    servings: asNumber(raw.servings) ?? 1,
    ingredients,
    steps,
  };
}

export async function callClaudeJson(prompt: string): Promise<unknown> {
  const response = await anthropic.messages.create({
    model: CLAUDE_SONNET,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claudeの応答からJSONを抽出できませんでした");
  try {
    return JSON.parse(match[0]) as unknown;
  } catch {
    throw new Error("Claudeの応答JSONが不正です");
  }
}
