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
  const [calorieTarget, setCalorieTarget] = useState(
    String(settings?.calorie_target_kcal ?? 2000),
  );
  const [weightKg, setWeightKg] = useState(String(settings?.weight_kg ?? ""));
  const initialMultiplier =
    settings?.weight_kg && settings?.protein_target_g
      ? Math.round((settings.protein_target_g / settings.weight_kg) * 10) / 10
      : 1.5;
  const [multiplier, setMultiplier] = useState<number>(initialMultiplier);
  const initialKcalMult =
    settings?.weight_kg && settings?.calorie_target_kcal
      ? Math.round(settings.calorie_target_kcal / settings.weight_kg)
      : 30;
  const [kcalMultiplier, setKcalMultiplier] =
    useState<number>(initialKcalMult);
  const [saving, setSaving] = useState(false);

  const weightNum = useMemo(() => parseFloat(weightKg), [weightKg]);
  const computedProteinTarget = useMemo(() => {
    if (Number.isFinite(weightNum)) return Math.round(weightNum * multiplier);
    return null;
  }, [weightNum, multiplier]);
  const computedKcalTarget = useMemo(() => {
    if (Number.isFinite(weightNum))
      return Math.round(weightNum * kcalMultiplier);
    return null;
  }, [weightNum, kcalMultiplier]);

  const applyComputedProtein = () => {
    if (computedProteinTarget != null)
      setProteinTarget(String(computedProteinTarget));
  };
  const applyComputedKcal = () => {
    if (computedKcalTarget != null)
      setCalorieTarget(String(computedKcalTarget));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await db.settings.upsert(supabase, {
      user_id: userId,
      protein_target_g: parseInt(proteinTarget) || 0,
      calorie_target_kcal: calorieTarget ? parseInt(calorieTarget) : null,
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

        <Section title="体重">
          <Card>
            <CardContent className="p-4 space-y-1.5">
              <label className="text-xs text-muted-foreground">体重 (kg)</label>
              <Input
                type="number"
                placeholder="72"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                体重を入れると下の係数からタンパク質・カロリーの目安を自動計算できます
              </p>
            </CardContent>
          </Card>
        </Section>

        <Section title="タンパク質の目安">
          <Card>
            <CardContent className="p-4 space-y-4">
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
                <input
                  type="range"
                  min={0.8}
                  max={2.5}
                  step={0.1}
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {computedProteinTarget != null && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                  <span className="text-sm">
                    {weightNum} × {multiplier} ={" "}
                    <span className="font-semibold text-primary">
                      {computedProteinTarget}g/日
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={applyComputedProtein}
                  >
                    反映
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  タンパク質の目安 (g/日)
                </label>
                <Input
                  type="number"
                  value={proteinTarget}
                  onChange={(e) => setProteinTarget(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section title="カロリーの目安">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  係数 (×kcal/kg)
                </label>
                <Input
                  type="number"
                  step="1"
                  min="15"
                  max="60"
                  value={String(kcalMultiplier)}
                  onChange={(e) =>
                    setKcalMultiplier(parseInt(e.target.value) || 0)
                  }
                />
                <input
                  type="range"
                  min={20}
                  max={45}
                  step={1}
                  value={kcalMultiplier}
                  onChange={(e) =>
                    setKcalMultiplier(parseInt(e.target.value))
                  }
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  目安: 維持 ~30 / 減量 ~25 / 増量 ~35-40
                </p>
              </div>

              {computedKcalTarget != null && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                  <span className="text-sm">
                    {weightNum} × {kcalMultiplier} ={" "}
                    <span className="font-semibold text-primary">
                      {computedKcalTarget}kcal/日
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={applyComputedKcal}
                  >
                    反映
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  カロリーの目安 (kcal/日)
                </label>
                <Input
                  type="number"
                  value={calorieTarget}
                  onChange={(e) => setCalorieTarget(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? "保存中..." : "保存"}
        </Button>

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
