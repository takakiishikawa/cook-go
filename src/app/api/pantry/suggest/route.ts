import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { PANTRY_CATEGORIES } from "@/types/database";

const client = new Anthropic();

async function fetchWikipediaImage(name: string): Promise<string | null> {
  try {
    // Search for the ingredient to get the correct page title
    const searchRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?` +
        new URLSearchParams({
          action: "query",
          list: "search",
          srsearch: name,
          format: "json",
          srlimit: "1",
          origin: "*",
        }),
      {
        headers: { "User-Agent": "CookGo/1.0 (https://cook-go-lovat.vercel.app)" },
        next: { revalidate: 86400 },
      }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const pageTitle: string | undefined = searchData.query?.search?.[0]?.title;
    if (!pageTitle) return null;

    // Fetch image for the found page
    const imgRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?` +
        new URLSearchParams({
          action: "query",
          titles: pageTitle,
          prop: "pageimages",
          format: "json",
          pithumbsize: "200",
          origin: "*",
        }),
      {
        headers: { "User-Agent": "CookGo/1.0" },
        next: { revalidate: 86400 },
      }
    );
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    const pages = imgData.query?.pages ?? {};
    const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name?.trim()) return NextResponse.json({ imageUrl: null, category: "その他" });

  const [imageUrl, categoryResponse] = await Promise.all([
    fetchWikipediaImage(name),
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
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
    const text =
      categoryResponse.content[0].type === "text"
        ? categoryResponse.content[0].text.trim()
        : "";
    if ((PANTRY_CATEGORIES as readonly string[]).includes(text)) {
      category = text;
    }
  }

  return NextResponse.json({ imageUrl, category });
}
