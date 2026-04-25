// Recipe suggestion
export interface SuggestedIngredient {
  name: string;
  name_en: string | null;
  name_vi: string | null;
  amount: string;
  in_pantry?: boolean;
  category: string | null;
}

export interface SuggestedStep {
  order: number;
  text: string;
  image_query: string | null;
}

export interface SuggestedRecipe {
  title: string;
  title_en: string;
  description: string | null;
  protein_g_per_serving: number;
  calorie_kcal_per_serving: number | null;
  prep_time_min: number | null;
  is_meal_prep_friendly: boolean;
  meal_prep_days: number;
  servings: number;
  ingredients: SuggestedIngredient[];
  steps: SuggestedStep[];
}

export interface RecipeSuggestClaudeResponse {
  recipes: SuggestedRecipe[];
}

export interface RecipeSuggestRequest {
  main_ingredient?: string;
  tags?: string[];
}

export interface RecipeImportUrlRequest {
  url: string;
}

export interface RecipeImportClaudeResponse {
  recipe: SuggestedRecipe;
}

// Plan mapping
export interface PlanMapRequest {
  recipe_id: string;
  planned_date: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  servings: number;
  repeat_rule: "none" | "daily" | "weekdays" | "custom";
  repeat_days: number[];
  repeat_until: string | null;
}

export interface PlanMapResponse {
  plans_created: number;
  total_protein_g: number;
}

// Image
export interface ImageResponse {
  imageUrl: string | null;
}

// Translation
export interface TranslationEntry {
  en: string;
  vi: string;
}

export interface TranslateRequest {
  names: string[];
}

export interface TranslateResponse {
  translations: Record<string, TranslationEntry>;
}

// Food image / pantry suggest (legacy compat)
export interface FoodImageResponse {
  imageUrl: string | null;
}

export interface FoodSuggestResponse {
  imageUrl: string | null;
  category: string;
}

// Shopping list
export interface ShoppingGenerateRequest {
  recipe_id: string;
}
