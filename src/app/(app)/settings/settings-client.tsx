"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Activity, Info } from "lucide-react";
import { toast } from "@takaki/go-design-system";
import {
  Button,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
  SettingsGroup,
  SettingsItem,
  Separator,
  SettingsPage,
  Card,
  CardContent,
  PageHeader,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { UserSettings } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";

interface SettingsClientProps {
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar: string;
  settings: UserSettings | null;
}

export function SettingsClient({
  userId,
  userEmail,
  userName,
  userAvatar,
  settings,
}: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [proteinTarget, setProteinTarget] = useState(
    String(settings?.protein_target_g ?? 108),
  );
  const [weightKg, setWeightKg] = useState(String(settings?.weight_kg ?? ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await db.settings.upsert(supabase, {
      user_id: userId,
      protein_target_g: parseInt(proteinTarget),
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error("保存に失敗しました");
      return;
    }
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
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 max-w-3xl">
        <PageHeader title="設定" />
      </div>

      <SettingsPage
        title=""
        sections={[
          {
            id: "profile",
            label: "プロフィール",
            icon: <User className="w-4 h-4" />,
            content: (
              <div className="space-y-6">
                <div className="flex items-center gap-4 py-2">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback className="bg-surface-subtle text-muted-foreground">
                      <User className="w-7 h-7" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {userName || "ユーザー"}
                    </p>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
                <Separator />
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </Button>
              </div>
            ),
          },
          {
            id: "body",
            label: "身体情報",
            icon: <Activity className="w-4 h-4" />,
            content: (
              <div className="space-y-5">
                <SettingsGroup
                  title="身体情報"
                  description="体重からタンパク質目標を自動計算できます"
                >
                  <SettingsItem
                    label="体重 (kg)"
                    description="体重×1.5gでタンパク質目標を自動計算"
                    control={
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="72"
                          value={weightKg}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setWeightKg(e.target.value)
                          }
                          className="w-24"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={calcProteinTarget}
                          disabled={!weightKg}
                        >
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProteinTarget(e.target.value)
                        }
                        className="w-24"
                      />
                    }
                  />
                </SettingsGroup>

                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          目標の参考値
                        </p>
                        <p className="text-xs text-muted-foreground">
                          筋肉増量: 体重×1.6〜2.2g
                        </p>
                        <p className="text-xs text-muted-foreground">
                          体脂肪減少: 体重×1.2〜1.6g
                        </p>
                        <p className="text-xs text-muted-foreground">
                          一般維持: 体重×0.8〜1.0g
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-11"
                >
                  {saving ? "保存中..." : "設定を保存する"}
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
