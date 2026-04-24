import type { SupabaseClient } from "@supabase/supabase-js";
import { DB_SCHEMA } from "./constants";
import type {
  MealLog, Recipe, PantryItem, ShoppingListItem,
  UserSettings, RecurringMeal,
} from "@/types/database";

function s(supabase: SupabaseClient) {
  return supabase.schema(DB_SCHEMA);
}

export const db = {
  settings: {
    get: async (supabase: SupabaseClient, userId: string): Promise<UserSettings | null> => {
      const { data } = await s(supabase).from("user_settings").select("*").eq("user_id", userId).single();
      return data as UserSettings | null;
    },
    upsert: async (supabase: SupabaseClient, values: Partial<UserSettings> & { user_id: string }) => {
      return s(supabase).from("user_settings").upsert(values, { onConflict: "user_id" });
    },
  },

  meals: {
    getToday: async (supabase: SupabaseClient, userId: string, date: string): Promise<MealLog[]> => {
      const { data } = await s(supabase).from("meal_logs").select("*")
        .eq("user_id", userId)
        .gte("logged_at", `${date}T00:00:00`)
        .lte("logged_at", `${date}T23:59:59`)
        .order("logged_at");
      return (data ?? []) as MealLog[];
    },
    getRecent: async (supabase: SupabaseClient, userId: string, before: string, limit = 10): Promise<MealLog[]> => {
      const { data } = await s(supabase).from("meal_logs").select("*")
        .eq("user_id", userId)
        .lt("logged_at", `${before}T00:00:00`)
        .order("logged_at", { ascending: false })
        .limit(limit);
      return (data ?? []) as MealLog[];
    },
    getWeek: async (
      supabase: SupabaseClient,
      userId: string,
      since: string,
    ): Promise<Array<{ logged_at: string; protein_g: number; calorie_kcal: number | null }>> => {
      const { data } = await s(supabase).from("meal_logs")
        .select("logged_at, protein_g, calorie_kcal")
        .eq("user_id", userId)
        .gte("logged_at", since)
        .order("logged_at");
      return data ?? [];
    },
    insert: async (supabase: SupabaseClient, values: Partial<MealLog> & { user_id: string }) => {
      return s(supabase).from("meal_logs").insert(values).select().single();
    },
    update: async (supabase: SupabaseClient, id: string, values: Partial<MealLog>) => {
      return s(supabase).from("meal_logs").update(values).eq("id", id).select().single();
    },
    delete: async (supabase: SupabaseClient, id: string) => {
      return s(supabase).from("meal_logs").delete().eq("id", id);
    },
    insertMany: async (supabase: SupabaseClient, values: Array<Partial<MealLog> & { user_id: string }>) => {
      return s(supabase).from("meal_logs").insert(values);
    },
  },

  recurring: {
    getAll: async (supabase: SupabaseClient, userId: string): Promise<RecurringMeal[]> => {
      const { data } = await s(supabase).from("recurring_meals").select("*")
        .eq("user_id", userId).order("created_at", { ascending: false });
      return (data ?? []) as RecurringMeal[];
    },
    insert: async (supabase: SupabaseClient, values: Partial<RecurringMeal> & { user_id: string }) => {
      return s(supabase).from("recurring_meals").insert(values);
    },
  },

  recipes: {
    getAll: async (supabase: SupabaseClient, userId: string, limit?: number): Promise<Recipe[]> => {
      let q = s(supabase).from("recipes").select("*")
        .eq("user_id", userId).order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data } = await q;
      return (data ?? []) as Recipe[];
    },
    getById: async (supabase: SupabaseClient, userId: string, id: string): Promise<Recipe | null> => {
      const { data } = await s(supabase).from("recipes").select("*")
        .eq("id", id).eq("user_id", userId).single();
      return data as Recipe | null;
    },
    update: async (supabase: SupabaseClient, id: string, values: Partial<Recipe>) => {
      return s(supabase).from("recipes").update(values).eq("id", id).select().single();
    },
  },

  pantry: {
    getAll: async (supabase: SupabaseClient, userId: string): Promise<PantryItem[]> => {
      const { data } = await s(supabase).from("pantry_items").select("*")
        .eq("user_id", userId).order("category").order("name");
      return (data ?? []) as PantryItem[];
    },
    count: async (supabase: SupabaseClient, userId: string): Promise<number> => {
      const { count } = await s(supabase).from("pantry_items")
        .select("name", { count: "exact", head: true }).eq("user_id", userId);
      return count ?? 0;
    },
    insert: async (supabase: SupabaseClient, values: Partial<PantryItem> & { user_id: string }) => {
      return s(supabase).from("pantry_items").insert(values).select().single();
    },
    insertMany: async (supabase: SupabaseClient, values: Array<Partial<PantryItem> & { user_id: string }>) => {
      return s(supabase).from("pantry_items").insert(values);
    },
    update: async (supabase: SupabaseClient, id: string, values: Partial<PantryItem>) => {
      return s(supabase).from("pantry_items").update(values).eq("id", id);
    },
    delete: async (supabase: SupabaseClient, id: string) => {
      return s(supabase).from("pantry_items").delete().eq("id", id);
    },
    upsert: async (
      supabase: SupabaseClient,
      values: Partial<PantryItem> & { user_id: string; name: string },
    ) => {
      return s(supabase).from("pantry_items").upsert(values, { onConflict: "user_id,name" });
    },
  },

  shopping: {
    getAll: async (supabase: SupabaseClient, userId: string): Promise<ShoppingListItem[]> => {
      const { data } = await s(supabase).from("shopping_list_items").select("*")
        .eq("user_id", userId).order("created_at", { ascending: false });
      return (data ?? []) as ShoppingListItem[];
    },
    insert: async (supabase: SupabaseClient, values: Partial<ShoppingListItem> & { user_id: string }) => {
      return s(supabase).from("shopping_list_items").insert(values).select().single();
    },
    update: async (supabase: SupabaseClient, id: string, values: Partial<ShoppingListItem>) => {
      return s(supabase).from("shopping_list_items").update(values).eq("id", id);
    },
    delete: async (supabase: SupabaseClient, id: string) => {
      return s(supabase).from("shopping_list_items").delete().eq("id", id);
    },
    deleteMany: async (supabase: SupabaseClient, ids: string[]) => {
      return s(supabase).from("shopping_list_items").delete().in("id", ids);
    },
  },
};
