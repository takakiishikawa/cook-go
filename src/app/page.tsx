"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, ChartBar, Sparkles, Leaf } from "lucide-react";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.56_0.19_155_/_0.08),transparent)] pointer-events-none" />
      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Leaf className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">CookGo</h1>
          <p className="text-muted-foreground text-center text-sm leading-relaxed">
            撮るだけ・選ぶだけで、<br />
            タンパク質の水位が見えて、<br />
            料理のレパートリーが増えていく。
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">写真を撮るだけ</p>
                <p className="text-sm text-muted-foreground">AIが自動でタンパク質を推定</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ChartBar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">タンパク質ゲージ</p>
                <p className="text-sm text-muted-foreground">今日の達成状況をひと目で確認</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">AIレシピ提案</p>
                <p className="text-sm text-muted-foreground">手持ち食材でミールプレップ</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          ログインすることで、利用規約に同意したものとみなします。
        </p>
      </div>
    </div>
  );
}

