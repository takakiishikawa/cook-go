"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MealType, MEAL_TYPE_LABELS } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

interface RecurringMealDialogProps {
  userId: string;
  onSaved: () => void;
}

export function RecurringMealDialog({
  userId,
  onSaved,
}: RecurringMealDialogProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [proteinG, setProteinG] = useState("");
  const [calorieKcal, setCalorieKcal] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !proteinG) {
      toast.error("名前とタンパク質量を入力してください");
      return;
    }
    setSaving(true);
    const { error } = await db.recurring.insert(supabase, {
      user_id: userId,
      name,
      meal_type: mealType,
      protein_g: parseFloat(proteinG),
      calorie_kcal: calorieKcal ? parseFloat(calorieKcal) : null,
    });
    setSaving(false);
    if (error) {
      toast.error("保存に失敗しました");
      return;
    }
    toast.success("定期メニューを追加しました");
    setOpen(false);
    setName("");
    setProteinG("");
    setCalorieKcal("");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Plus className="w-4 h-4" />
          定期メニューを追加
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl mx-4">
        <DialogHeader>
          <DialogTitle>定期メニューを追加</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>メニュー名</Label>
            <Input
              placeholder="例: 鶏胸肉+白米セット"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>食事区分</Label>
            <Select
              value={mealType}
              onValueChange={(v: string | null) =>
                v && setMealType(v as MealType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {MEAL_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>タンパク質 (g)</Label>
              <Input
                type="number"
                value={proteinG}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProteinG(e.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>カロリー (kcal)</Label>
              <Input
                type="number"
                value={calorieKcal}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCalorieKcal(e.target.value)
                }
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "追加する"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
