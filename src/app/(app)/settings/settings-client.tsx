"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppHeader } from "@/components/layout/app-header";
import { UserSettings } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface SettingsClientProps {
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar: string;
  settings: UserSettings | null;
}

export function SettingsClient({ userId, userEmail, userName, userAvatar, settings }: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [proteinTarget, setProteinTarget] = useState(String(settings?.protein_target_g ?? 108));
  const [weightKg, setWeightKg] = useState(String(settings?.weight_kg ?? ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .schema("cookgo")
      .from("user_settings")
      .upsert({
        user_id: userId,
        protein_target_g: parseInt(proteinTarget),
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    setSaving(false);

    if (error) { toast.error("保存に失敗しました"); return; }
    toast.success("設定を保存しました");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const calcProteinTarget = () => {
    const weight = parseFloat(weightKg);
    if (!isNaN(weight)) {
      setProteinTarget(String(Math.round(weight * 1.5)));
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader title="設定" />

      <div className="px-4 pt-4 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{userName || "ユーザー"}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <h2 className="font-heading text-lg">身体情報</h2>

          <div className="space-y-1.5">
            <Label>体重 (kg)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="72"
                value={weightKg}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightKg(e.target.value)}
                className="rounded-xl flex-1"
              />
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={calcProteinTarget}
                disabled={!weightKg}
              >
                自動計算
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">体重×1.5gでタンパク質目標を自動計算します</p>
          </div>

          <div className="space-y-1.5">
            <Label>タンパク質目標 (g/日)</Label>
            <Input
              type="number"
              value={proteinTarget}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProteinTarget(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              現在の設定: {proteinTarget}g/日
              {weightKg && ` （体重 ${weightKg}kg × 1.5）`}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h2 className="font-heading text-lg">目標の参考値</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>・筋肉増量: 体重 × 1.6〜2.2g</p>
            <p>・体脂肪減少（維持筋肉量）: 体重 × 1.2〜1.6g</p>
            <p>・一般維持: 体重 × 0.8〜1.0g</p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-primary"
        >
          {saving ? "保存中..." : "設定を保存する"}
        </Button>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 gap-2"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
