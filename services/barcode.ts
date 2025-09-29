import { supabase } from './supabase';
import { Food } from '../types';

export const barcodeService = {
  // Scan barcode and get food information
  async scanBarcode(barcode: string): Promise<Food | null> {
    try {
      // First check local database
      const localFood = await this.getFoodByBarcode(barcode);
      if (localFood) return localFood;

      // If not found locally, try external API
      const externalFood = await this.fetchFromExternalAPI(barcode);
      if (externalFood) {
        // Save to local database for future use
        await this.saveFoodToDatabase(externalFood);
        return externalFood;
      }

      return null;
    } catch (error) {
      console.error('Barcode scan error:', error);
      throw new Error('Unable to scan barcode. Please try again.');
    }
  },

  // Get food from local database by barcode
  async getFoodByBarcode(barcode: string): Promise<Food | null> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('barcode', barcode)
      .eq('verified', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data as Food;
  },

  // Fetch food data from external API (OpenFoodFacts, etc.)
  async fetchFromExternalAPI(barcode: string): Promise<Food | null> {
    try {
      // Using OpenFoodFacts API as example
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status !== 1 || !data.product) return null;

      const product = data.product;
      const nutriments = product.nutriments || {};

      return {
        id: '', // Will be generated when saved
        name: product.product_name || 'Unknown Product',
        brand: product.brands || '',
        barcode: barcode,
        calories_per_100g: nutriments['energy-kcal_100g'] || 0,
        protein_per_100g: nutriments.proteins_100g || 0,
        carbs_per_100g: nutriments.carbohydrates_100g || 0,
        fat_per_100g: nutriments.fat_100g || 0,
        fiber_per_100g: nutriments.fiber_100g || 0,
        sugar_per_100g: nutriments.sugars_100g || 0,
        sodium_per_100g: nutriments.sodium_100g || 0,
        image_url: product.image_url || '',
        verified: false, // Needs admin verification
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('External API error:', error);
      return null;
    }
  },

  // Save new food to database
  async saveFoodToDatabase(food: Omit<Food, 'id' | 'created_at'>): Promise<Food> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('foods')
      .insert({
        ...food,
        created_by: user?.id,
        verified: false // Admin needs to verify
      })
      .select()
      .single();

    if (error) throw error;
    return data as Food;
  },

  // Search foods by name
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

  // Get popular foods
  async getPopularFoods(): Promise<Food[]> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as Food[];
  },

  // Validate barcode format
  isValidBarcode(barcode: string): boolean {
    // Check for common barcode formats (UPC, EAN)
    const barcodeRegex = /^(\d{8}|\d{12}|\d{13}|\d{14})$/;
    return barcodeRegex.test(barcode);
  },

  // Calculate nutrition for custom quantity
  calculateNutrition(food: Food, quantity: number) {
    const multiplier = quantity / 100; // Food data is per 100g

    return {
      calories: Math.round(food.calories_per_100g * multiplier),
      protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      fat: Math.round(food.fat_per_100g * multiplier * 10) / 10,
      fiber: Math.round((food.fiber_per_100g || 0) * multiplier * 10) / 10,
      sugar: Math.round((food.sugar_per_100g || 0) * multiplier * 10) / 10,
      sodium: Math.round((food.sodium_per_100g || 0) * multiplier * 10) / 10
    };
  }
};