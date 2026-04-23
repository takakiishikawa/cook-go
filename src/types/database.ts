export interface UserSettings {
  id: string;
  user_id: string;
  protein_target_g: number;
  weight_kg: number | null;
  created_at: string;
  updated_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  logged_at: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | null;
  photo_url: string | null;
  description: string | null;
  protein_g: number;
  calorie_kcal: number | null;
  is_repeat: boolean;
  source_meal_id: string | null;
  created_at: string;
}

export interface RecurringMeal {
  id: string;
  user_id: string;
  name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | null;
  protein_g: number;
  calorie_kcal: number | null;
  photo_url: string | null;
  servings: number;
  active_until: string | null;
  created_at: string;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  in_pantry?: boolean;
}

export interface RecipeStep {
  order: number;
  text: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  protein_g_per_serving: number | null;
  calorie_kcal_per_serving: number | null;
  servings: number;
  prep_time_min: number | null;
  is_meal_prep_friendly: boolean;
  ingredients: RecipeIngredient[] | null;
  steps: RecipeStep[] | null;
  ai_generated: boolean;
  created_at: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  in_stock: boolean;
  image_url: string | null;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  recipe_id: string | null;
  name: string;
  checked: boolean;
  created_at: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export const PANTRY_CATEGORIES = [
  "タンパク源",
  "野菜",
  "調味料",
  "炭水化物",
  "その他",
] as const;
