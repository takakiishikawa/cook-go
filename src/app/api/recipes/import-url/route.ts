import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DB_SCHEMA, CLAUDE_SONNET } from "@/lib/constants";
import type {
  SuggestedRecipe,
  RecipeImportClaudeResponse,
  RecipeImportUrlRequest,
} from "@/types/api";

const client = new Anthropic();

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 1_500_000;
const MAX_TEXT_CHARS = 60_000;

function isAllowedUrl(input: string): URL | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      host === "0.0.0.0"
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

async function fetchHtml(url: URL): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CookGo/1.0; +https://cook-go.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`URLの取得に失敗しました (HTTP ${res.status})`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("HTMLページではありません");
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_HTML_BYTES) {
      throw new Error("ページが大きすぎます");
    }
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  } finally {
    clearTimeout(timer);
  }
}

function htmlToText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > MAX_TEXT_CHARS
    ? stripped.slice(0, MAX_TEXT_CHARS)
    : stripped;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as RecipeImportUrlRequest;
    const url = isAllowedUrl(body.url ?? "");
    if (!url) {
      return NextResponse.json(
        { error: "URLが不正です（http(s) のみ対応）" },
        { status: 400 },
      );
    }

    const html = await fetchHtml(url);
    const text = htmlToText(html);
    if (!text) {
      return NextResponse.json(
        { error: "ページから内容を取得できませんでした" },
        { status: 400 },
      );
    }

    const prompt = `以下はレシピページのHTMLからテキストを抽出したものです。記載されているレシピを1件、JSONで抽出してください。
記載されていない数値は妥当な推定値（タンパク質量・カロリー・所要時間）で埋めてください。日本語で出力してください。

【元URL】
${url.toString()}

【ページ本文（抜粋）】
${text}

以下のJSONフォーマットのみで返してください（説明文不要）：
{
  "recipe": {
    "title": "豚の生姜焼き定食",
    "title_en": "Ginger Pork Set",
    "description": "短い説明（1〜2文）",
    "protein_g_per_serving": 38,
    "calorie_kcal_per_serving": 620,
    "prep_time_min": 25,
    "is_meal_prep_friendly": true,
    "meal_prep_days": 2,
    "servings": 2,
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
      { "order": 1, "text": "豚肉を一口大に切る", "image_query": "slicing pork loin" }
    ]
  }
}`;

    const response = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const out =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = out.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claudeの応答からJSONを抽出できませんでした");

    let parsed: RecipeImportClaudeResponse;
    try {
      parsed = JSON.parse(jsonMatch[0]) as RecipeImportClaudeResponse;
    } catch {
      throw new Error("Claudeの応答JSONが不正です");
    }
    const r: SuggestedRecipe = parsed.recipe;
    if (!r || !r.title || !Array.isArray(r.ingredients) || !Array.isArray(r.steps)) {
      throw new Error("レシピ情報を取得できませんでした");
    }

    const { data: pantryData } = await supabase
      .schema(DB_SCHEMA)
      .from("pantry_items")
      .select("name")
      .eq("user_id", user.id)
      .eq("in_stock", true);
    const pantryNames = new Set(
      (pantryData ?? []).map((p) => p.name.toLowerCase()),
    );

    const insert = {
      user_id: user.id,
      title: r.title,
      title_en: r.title_en ?? null,
      description: r.description,
      protein_g_per_serving: r.protein_g_per_serving,
      calorie_kcal_per_serving: r.calorie_kcal_per_serving,
      prep_time_min: r.prep_time_min,
      is_meal_prep_friendly: r.is_meal_prep_friendly ?? false,
      meal_prep_days: r.meal_prep_days ?? 1,
      servings: r.servings ?? 1,
      ingredients: r.ingredients.map((ing) => ({
        ...ing,
        in_pantry: pantryNames.has(ing.name.toLowerCase()),
      })),
      steps: r.steps,
      ai_generated: true,
      is_tried: false,
    };

    const { data: saved, error } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .insert(insert)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ recipe: saved });
  } catch (error) {
    console.error("Recipe import error:", error);
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
    return NextResponse.json(
      { error: `URLからの取込に失敗しました: ${detail}` },
      { status: 500 },
    );
  }
}
