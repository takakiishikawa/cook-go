"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { MealLog, MealType, MEAL_TYPE_LABELS } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

interface MealEditDialogProps {
  meal: MealLog;
  onClose: () => void;
  onSaved: (updated: MealLog) => void;
}

export function MealEditDialog({
  meal,
  onClose,
  onSaved,
}: MealEditDialogProps) {
  const supabase = createClient();
  const [description, setDescription] = useState(meal.description ?? "");
  const [proteinG, setProteinG] = useState(String(meal.protein_g));
  const [calorieKcal, setCalorieKcal] = useState(
    String(meal.calorie_kcal ?? ""),
  );
  const [mealType, setMealType] = useState<MealType>(meal.meal_type ?? "snack");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error, data } = await db.meals.update(supabase, meal.id, {
      description,
      protein_g: parseFloat(proteinG),
      calorie_kcal: calorieKcal ? parseFloat(calorieKcal) : null,
      meal_type: mealType,
    });
    setSaving(false);
    if (error) {
      toast.error("更新に失敗しました");
      return;
    }
    onSaved(data as MealLog);
    toast.success("更新しました");
  };

  return (
    <Dialog
      open
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="rounded-xl mx-4">
        <DialogHeader>
          <DialogTitle>食事を編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>食事内容</Label>
            <Input
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
            />
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
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              キャンセル
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存する"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
