export interface UserSettings {
  id: string;
  user_id: string;
  protein_target_g: number;
  weight_kg: number | null;
  created_at: string;
}

export interface RecipeIngredient {
  name: string;
  name_en: string | null;
  name_vi: string | null;
  amount: string;
  in_pantry: boolean;
  category: string | null;
}

export interface RecipeStep {
  order: number;
  text: string;
  image_query: string | null;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  protein_g_per_serving: number | null;
  calorie_kcal_per_serving: number | null;
  servings: number;
  prep_time_min: number | null;
  is_meal_prep_friendly: boolean;
  is_tried: boolean;
  meal_prep_days: number | null;
  image_url: string | null;
  ingredients: RecipeIngredient[] | null;
  steps: RecipeStep[] | null;
  ai_generated: boolean;
  created_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  servings: number;
  repeat_rule: "none" | "daily" | "weekdays" | "custom";
  repeat_days: number[] | null;
  repeat_until: string | null;
  created_at: string;
}

export interface MealPlanWithRecipe extends MealPlan {
  recipe: Pick<
    Recipe,
    | "id"
    | "title"
    | "title_en"
    | "image_url"
    | "protein_g_per_serving"
    | "calorie_kcal_per_serving"
  >;
}

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  name_en: string | null;
  name_vi: string | null;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  created_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  name: string;
  name_en: string | null;
  name_vi: string | null;
  image_url: string | null;
  amount: string | null;
  checked: boolean;
  added_to_pantry: boolean;
  created_at: string;
}

export type MealType = "breakfast" | "lunch" | "dinner";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
};

export const PANTRY_CATEGORIES = [
  "タンパク源",
  "野菜",
  "調味料",
  "炭水化物",
  "その他",
] as const;
