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
  unit: string | null;
  protein_g: number | null;
  in_pantry: boolean;
  category: string | null;
}

export interface RecipeStep {
  order: number;
  text: string;
  image_query: string | null;
}

export type RecipeSourceTag = "self" | "ai_suggest";

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
  source_tag: RecipeSourceTag | null;
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

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export const MEAL_TYPES: MealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export interface FoodLogIngredientOverride {
  index: number;
  amount?: string;
  unit?: string | null;
  protein_g?: number | null;
}

export interface FoodLogOverrides {
  ingredients?: FoodLogIngredientOverride[];
}

export interface FoodLog {
  id: string;
  user_id: string;
  recipe_id: string;
  logged_date: string;
  meal_type: MealType;
  servings: number;
  overrides: FoodLogOverrides | null;
  actual_protein_g: number | null;
  actual_calorie_kcal: number | null;
  created_at: string;
}

export interface FoodLogWithRecipe extends FoodLog {
  recipe: Pick<
    Recipe,
    | "id"
    | "title"
    | "title_en"
    | "image_url"
    | "protein_g_per_serving"
    | "calorie_kcal_per_serving"
    | "servings"
  >;
}

export const PANTRY_CATEGORIES = [
  "タンパク源",
  "野菜",
  "調味料",
  "炭水化物",
  "その他",
] as const;
