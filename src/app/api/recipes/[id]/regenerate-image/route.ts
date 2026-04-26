import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DB_SCHEMA } from "@/lib/constants";
import { fetchRecipeImage } from "@/lib/image-query";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: recipe } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .select("title, title_en, description, ingredients")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (!recipe)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const imageUrl = await fetchRecipeImage(recipe);

    const { error } = await supabase
      .schema(DB_SCHEMA)
      .from("recipes")
      .update({ image_url: imageUrl })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error("regenerate-image error:", error);
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
    return NextResponse.json(
      { error: `画像取得に失敗しました: ${detail}` },
      { status: 500 },
    );
  }
}
