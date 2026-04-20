import { NextResponse } from "next/server";
import { WIKI_USER_AGENT } from "@/lib/constants";
import type { FoodImageResponse } from "@/types/api";

const WIKI_CACHE = { next: { revalidate: 86400 } } as const;

interface WikiPage {
  thumbnail?: { source: string };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name?.trim()) return NextResponse.json({ imageUrl: null } satisfies FoodImageResponse);

  try {
    // Japanese Wikipedia summary API (includes thumbnail)
    const jaRes = await fetch(
      `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { headers: { "User-Agent": WIKI_USER_AGENT }, ...WIKI_CACHE },
    );
    if (jaRes.ok) {
      const data = await jaRes.json() as { thumbnail?: { source: string } };
      if (data.thumbnail?.source) {
        return NextResponse.json({ imageUrl: data.thumbnail.source } satisfies FoodImageResponse);
      }
    }

    // Fallback: Wikipedia page images API (broader search)
    const wikiRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?` +
        new URLSearchParams({ action: "query", titles: name, prop: "pageimages", format: "json", pithumbsize: "200", origin: "*" }),
      { headers: { "User-Agent": WIKI_USER_AGENT }, ...WIKI_CACHE },
    );
    if (wikiRes.ok) {
      const data = await wikiRes.json() as { query?: { pages?: Record<string, WikiPage> } };
      const page = Object.values(data.query?.pages ?? {})[0];
      if (page?.thumbnail?.source) {
        return NextResponse.json({ imageUrl: page.thumbnail.source } satisfies FoodImageResponse);
      }
    }

    // Fallback: English Wikipedia
    const enRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { headers: { "User-Agent": WIKI_USER_AGENT }, ...WIKI_CACHE },
    );
    if (enRes.ok) {
      const data = await enRes.json() as { thumbnail?: { source: string } };
      if (data.thumbnail?.source) {
        return NextResponse.json({ imageUrl: data.thumbnail.source } satisfies FoodImageResponse);
      }
    }
  } catch (e) {
    console.error("Pantry image fetch error:", e);
  }

  return NextResponse.json({ imageUrl: null } satisfies FoodImageResponse);
}
