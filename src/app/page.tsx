"use client";

import { Leaf } from "lucide-react";
import { LoginPage } from "@takaki/go-design-system";
import { createClient } from "@/lib/supabase/client";

export default function LoginRoute() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://cook-go-lovat.vercel.app").replace(/\/$/, "")}/auth/callback`,
        scopes: "email profile",
      },
    });
  };

  return (
    <LoginPage
      productName="CookGo"
      productLogo={<Leaf className="h-7 w-7" />}
      tagline="撮るだけ・選ぶだけで、タンパク質の水位が見えて、料理のレパートリーが増えていく。"
      onGoogleSignIn={handleGoogleSignIn}
    />
  );
}
