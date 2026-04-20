"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import {
  Button, Input, Label,
  Avatar, AvatarFallback, AvatarImage,
  SettingsGroup, SettingsItem, Separator, Banner,
} from "@takaki/go-design-system";
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

      <div className="px-4 md:px-8 pt-4 space-y-6 pb-8 max-w-2xl">
        {/* User profile */}
        <div className="flex items-center gap-4 py-2">
          <Avatar className="w-14 h-14">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-surface-subtle text-muted-foreground">
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{userName || "ユーザー"}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <Separator />

        <SettingsGroup title="身体情報">
          <SettingsItem
            label="体重 (kg)"
            description="体重×1.5gでタンパク質目標を自動計算します"
            control={
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="72"
                  value={weightKg}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightKg(e.target.value)}
                  className="w-24"
                />
                <Button variant="outline" size="sm" onClick={calcProteinTarget} disabled={!weightKg}>
                  自動計算
                </Button>
              </div>
            }
          />
          <SettingsItem
            label="タンパク質目標 (g/日)"
            control={
              <Input
                type="number"
                value={proteinTarget}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProteinTarget(e.target.value)}
                className="w-24"
              />
            }
          />
        </SettingsGroup>

        <Banner
          variant="default"
          title="目標の参考値"
          description="筋肉増量: 体重×1.6〜2.2g ／ 体脂肪減少: 体重×1.2〜1.6g ／ 一般維持: 体重×0.8〜1.0g"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleSave} disabled={saving} className="flex-1 h-11">
            {saving ? "保存中..." : "設定を保存する"}
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  );
}
