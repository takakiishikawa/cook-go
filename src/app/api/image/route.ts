import { NextResponse } from "next/server";
import type { ImageResponse } from "@/types/api";

const UNSPLASH_CACHE: Record<string, { url: string; expires: number }> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  if (!query) return NextResponse.json({ imageUrl: null } satisfies ImageResponse);

  const now = Date.now();
  const cached = UNSPLASH_CACHE[query];
  if (cached && cached.expires > now) {
    return NextResponse.json({ imageUrl: cached.url } satisfies ImageResponse);
  }

  // Unsplash
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (key) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${key}` }, next: { revalidate: 86400 } },
      );
      if (res.ok) {
        const data = await res.json() as { results?: Array<{ urls?: { regular?: string } }> };
        const url = data.results?.[0]?.urls?.regular ?? null;
        if (url) {
          UNSPLASH_CACHE[query] = { url, expires: now + 86400 * 1000 };
          return NextResponse.json({ imageUrl: url } satisfies ImageResponse);
        }
      }
    } catch {
      // fall through to Wikipedia
    }
  }

  // Fallback: Japanese Wikipedia
  try {
    const jaRes = await fetch(
      `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { next: { revalidate: 86400 } },
    );
    if (jaRes.ok) {
      const data = await jaRes.json() as { thumbnail?: { source?: string } };
      if (data.thumbnail?.source) {
        return NextResponse.json({ imageUrl: data.thumbnail.source } satisfies ImageResponse);
      }
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ imageUrl: null } satisfies ImageResponse);
}
