"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  PageHeader,
  Section,
  toast,
} from "@takaki/go-design-system";
import { AppHeader } from "@/components/layout/app-header";
import { UserSettings } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";

interface SettingsClientProps {
  userId: string;
  settings: UserSettings | null;
}

export function SettingsClient({ userId, settings }: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [proteinTarget, setProteinTarget] = useState(
    String(settings?.protein_target_g ?? 108),
  );
  const [weightKg, setWeightKg] = useState(String(settings?.weight_kg ?? ""));
  const initialMultiplier =
    settings?.weight_kg && settings?.protein_target_g
      ? Math.round((settings.protein_target_g / settings.weight_kg) * 10) / 10
      : 1.5;
  const [multiplier, setMultiplier] = useState<number>(initialMultiplier);
  const [saving, setSaving] = useState(false);

  const weightNum = useMemo(() => parseFloat(weightKg), [weightKg]);
  const computedTarget = useMemo(() => {
    if (Number.isFinite(weightNum)) return Math.round(weightNum * multiplier);
    return null;
  }, [weightNum, multiplier]);

  const applyComputed = () => {
    if (computedTarget != null) setProteinTarget(String(computedTarget));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await db.settings.upsert(supabase, {
      user_id: userId,
      protein_target_g: parseInt(proteinTarget) || 0,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
    });
    setSaving(false);
    if (error) {
      toast.error("保存に失敗しました");
      return;
    }
    toast.success("保存しました");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="px-4 md:px-8 pt-5 pb-8 space-y-5 max-w-2xl">
        <PageHeader title="設定" />

        <Section title="タンパク質目標">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    体重 (kg)
                  </label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    係数 (×g/kg)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3"
                    value={String(multiplier)}
                    onChange={(e) =>
                      setMultiplier(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div>
                <input
                  type="range"
                  min={0.8}
                  max={2.5}
                  step={0.1}
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                  <span>0.8</span>
                  <span>1.5</span>
                  <span>2.5</span>
                </div>
              </div>

              {computedTarget != null && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                  <span className="text-sm">
                    {weightNum} × {multiplier} ={" "}
                    <span className="font-semibold text-primary">
                      {computedTarget}g/日
                    </span>
                  </span>
                  <Button size="sm" variant="outline" onClick={applyComputed}>
                    目標に反映
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  タンパク質目標 (g/日)
                </label>
                <Input
                  type="number"
                  value={proteinTarget}
                  onChange={(e) => setProteinTarget(e.target.value)}
                />
              </div>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? "保存中..." : "保存"}
              </Button>
            </CardContent>
          </Card>
        </Section>

        <Section title="アカウント">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            <LogOut className="w-3.5 h-3.5" />
            ログアウト
          </Button>
        </Section>
      </div>
    </div>
  );
}
