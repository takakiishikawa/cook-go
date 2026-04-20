// Meal analysis
export interface MealAnalysisRequest {
  image_base64: string;
  meal_type?: string;
  recipe_url?: string;
}

export interface MealAnalysisResponse {
  description: string;
  protein_g: number;
  calorie_kcal: number;
  meal_type: string;
}

// Recipe suggestion
export interface SuggestedIngredient {
  name: string;
  amount: string;
  in_pantry?: boolean;
}

export interface SuggestedStep {
  order: number;
  text: string;
}

export interface SuggestedRecipe {
  title: string;
  description: string | null;
  protein_g_per_serving: number;
  calorie_kcal_per_serving: number | null;
  prep_time_min: number | null;
  is_meal_prep_friendly: boolean;
  servings: number;
  ingredients: SuggestedIngredient[];
  steps: SuggestedStep[];
}

export interface RecipeSuggestClaudeResponse {
  recipes: SuggestedRecipe[];
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

// Food image / pantry suggest
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
