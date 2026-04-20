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
    if (!isNaN(weight)) setProteinTarget(String(Math.round(weight * 1.5)));
  };

  return (
    <div className="flex flex-col">
      <AppHeader title="設定" />

      <div className="px-4 md:px-8 pt-4 space-y-4 pb-8">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{userName || "ユーザー"}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="text-base font-bold">身体情報</h2>
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
              <Button variant="outline" className="rounded-xl" onClick={calcProteinTarget} disabled={!weightKg}>
                自動計算
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">体重×1.5gでタンパク質目標を自動計算します</p>
          </div>
          <div className="space-y-1.5">
            <Label>タンパク質目標 (g/日)</Label>
            <Input
              type="number"
              value={proteinTarget}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProteinTarget(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-base font-bold">目標の参考値</h2>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>筋肉増量: 体重 × 1.6〜2.2g</p>
            <p>体脂肪減少（筋肉量維持）: 体重 × 1.2〜1.6g</p>
            <p>一般維持: 体重 × 0.8〜1.0g</p>
          </div>
        </div>

        <div className="md:flex md:gap-3 space-y-3 md:space-y-0">
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-primary md:flex-1">
            {saving ? "保存中..." : "設定を保存する"}
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 gap-2 md:w-auto md:px-6"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  );
}
