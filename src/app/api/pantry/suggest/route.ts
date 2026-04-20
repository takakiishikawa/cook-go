import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { PANTRY_CATEGORIES } from "@/types/database";
import { WIKI_USER_AGENT, CLAUDE_HAIKU } from "@/lib/constants";
import type { FoodSuggestResponse } from "@/types/api";

const client = new Anthropic();
const WIKI_CACHE = { next: { revalidate: 86400 } } as const;

interface WikiPage {
  thumbnail?: { source: string };
}

async function fetchWikipediaImage(name: string): Promise<string | null> {
  try {
    const searchRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?` +
        new URLSearchParams({ action: "query", list: "search", srsearch: name, format: "json", srlimit: "1", origin: "*" }),
      { headers: { "User-Agent": WIKI_USER_AGENT }, ...WIKI_CACHE },
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json() as { query?: { search?: Array<{ title: string }> } };
    const pageTitle = searchData.query?.search?.[0]?.title;
    if (!pageTitle) return null;

    const imgRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?` +
        new URLSearchParams({ action: "query", titles: pageTitle, prop: "pageimages", format: "json", pithumbsize: "200", origin: "*" }),
      { headers: { "User-Agent": WIKI_USER_AGENT }, ...WIKI_CACHE },
    );
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json() as { query?: { pages?: Record<string, WikiPage> } };
    const page = Object.values(imgData.query?.pages ?? {})[0];
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name?.trim()) {
    return NextResponse.json({ imageUrl: null, category: "その他" } satisfies FoodSuggestResponse);
  }

  const [imageUrl, categoryResponse] = await Promise.all([
    fetchWikipediaImage(name),
    client.messages.create({
      model: CLAUDE_HAIKU,
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: `食材「${name}」のカテゴリーを以下から1つだけ選んでください。カテゴリー名のみ回答してください：${PANTRY_CATEGORIES.join("、")}`,
        },
      ],
    }).catch(() => null),
  ]);

  let category = "その他";
  if (categoryResponse) {
    const text = categoryResponse.content[0].type === "text"
      ? categoryResponse.content[0].text.trim()
      : "";
    if ((PANTRY_CATEGORIES as readonly string[]).includes(text)) {
      category = text;
    }
  }

  return NextResponse.json({ imageUrl, category } satisfies FoodSuggestResponse);
}
