import { supabase } from './supabase';
import { Food, NutritionLog, Meal, FoodEntry } from '../types';

export const nutritionService = {
  // Foods
  async searchFoods(query: string): Promise<Food[]> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      .eq('verified', true)
      .order('name')
      .limit(20);

    if (error) throw error;
    return data as Food[];
  },

  async getFoodByBarcode(barcode: string): Promise<Food | null> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data as Food;
  },

  async createFood(food: Omit<Food, 'id' | 'created_at' | 'verified'>) {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('foods')
      .insert({
        ...food,
        created_by: user.user?.id,
        verified: false
      })
      .select()
      .single();

    if (error) throw error;
    return data as Food;
  },

  // Nutrition Logs
  async getTodaysNutritionLog(userId: string): Promise<NutritionLog | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select(`
        *,
        meals(
          *,
          food_entries(
            *,
            food:foods(*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Create new log for today
        return await this.createNutritionLog(userId, today);
      }
      throw error;
    }

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    data.meals?.forEach((meal: any) => {
      meal.food_entries?.forEach((entry: any) => {
        const multiplier = entry.quantity / 100;
        
        if (entry.food) {
          totalCalories += entry.food.calories_per_100g * multiplier;
          totalProtein += entry.food.protein_per_100g * multiplier;
          totalCarbs += entry.food.carbs_per_100g * multiplier;
          totalFat += entry.food.fat_per_100g * multiplier;
        } else {
          totalCalories += entry.custom_calories || 0;
          totalProtein += entry.custom_protein || 0;
          totalCarbs += entry.custom_carbs || 0;
          totalFat += entry.custom_fat || 0;
        }
      });
    });

    return {
      ...data,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat)
    } as NutritionLog;
  },

  async createNutritionLog(userId: string, date: string): Promise<NutritionLog> {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: userId,
        date
      })
      .select(`
        *,
        meals(
          *,
          food_entries(
            *,
            food:foods(*)
          )
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      meals: data.meals || [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0
    } as NutritionLog;
  },

  // Meals
  async createMeal(nutritionLogId: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string = '') {
    const { data, error } = await supabase
      .from('meals')
      .insert({
        nutrition_log_id: nutritionLogId,
        meal_type: mealType,
        name: name || mealType.charAt(0).toUpperCase() + mealType.slice(1)
      })
      .select()
      .single();

    if (error) throw error;
    return data as Meal;
  },

  // Food Entries
  async addFoodEntry(entry: Omit<FoodEntry, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('food_entries')
      .insert(entry)
      .select(`
        *,
        food:foods(*)
      `)
      .single();

    if (error) throw error;
    return data as FoodEntry;
  },

  async updateFoodEntry(entryId: string, updates: Partial<FoodEntry>) {
    const { data, error } = await supabase
      .from('food_entries')
      .update(updates)
      .eq('id', entryId)
      .select(`
        *,
        food:foods(*)
      `)
      .single();

    if (error) throw error;
    return data as FoodEntry;
  },

  async deleteFoodEntry(entryId: string) {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  }
};