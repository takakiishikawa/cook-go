import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name?.trim()) return NextResponse.json({ imageUrl: null });

  try {
    // Japanese Wikipedia summary API (includes thumbnail)
    const jaRes = await fetch(
      `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      {
        headers: { "User-Agent": "CookGo/1.0 (https://cook-go-lovat.vercel.app)" },
        next: { revalidate: 86400 },
      }
    );
    if (jaRes.ok) {
      const data = await jaRes.json();
      if (data.thumbnail?.source) {
        return NextResponse.json({ imageUrl: data.thumbnail.source });
      }
    }

    // Fallback: Wikipedia page images API (searches more broadly)
    const wikiRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?` +
        new URLSearchParams({
          action: "query",
          titles: name,
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
    if (wikiRes.ok) {
      const data = await wikiRes.json();
      const pages = data.query?.pages ?? {};
      const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
      if (page?.thumbnail?.source) {
        return NextResponse.json({ imageUrl: page.thumbnail.source });
      }
    }

    // Fallback: English Wikipedia with romaji/English name
    const enRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      {
        headers: { "User-Agent": "CookGo/1.0" },
        next: { revalidate: 86400 },
      }
    );
    if (enRes.ok) {
      const data = await enRes.json();
      if (data.thumbnail?.source) {
        return NextResponse.json({ imageUrl: data.thumbnail.source });
      }
    }
  } catch (e) {
    console.error("Pantry image fetch error:", e);
  }

  return NextResponse.json({ imageUrl: null });
}
