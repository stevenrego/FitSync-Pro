import { supabase } from './supabase';
import { Food } from '../types';

export interface ScannedFood {
  name: string;
  brand?: string;
  barcode: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  image_url?: string;
}

export const barcodeScannerService = {
  // Scan barcode and get food information
  async scanBarcode(barcode: string): Promise<ScannedFood | null> {
    try {
      // Validate barcode format
      if (!this.isValidBarcode(barcode)) {
        throw new Error('Invalid barcode format');
      }

      // First check local database
      const localFood = await this.getFoodByBarcode(barcode);
      if (localFood) {
        return this.formatFoodData(localFood);
      }

      // If not found locally, try external API
      const externalFood = await this.fetchFromOpenFoodFacts(barcode);
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
    try {
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
    } catch (error) {
      console.error('Error fetching food by barcode:', error);
      return null;
    }
  },

  // Fetch food data from OpenFoodFacts API
  async fetchFromOpenFoodFacts(barcode: string): Promise<ScannedFood | null> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status !== 1 || !data.product) {
        return null;
      }

      const product = data.product;
      const nutriments = product.nutriments || {};

      // Normalize nutrient values per 100g
      const calories = nutriments['energy-kcal_100g'] || 
                     nutriments['energy-kcal'] || 
                     (nutriments['energy_100g'] ? Math.round(nutriments['energy_100g'] * 0.239) : 0);

      // Extract and normalize nutrition data
      return {
        name: product.product_name || product.product_name_en || 'Unknown Product',
        brand: product.brands?.split(',')[0]?.trim() || '',
        barcode: barcode,
        calories_per_100g: Math.round(calories),
        protein_per_100g: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10,
        carbs_per_100g: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10,
        fat_per_100g: Math.round((nutriments.fat_100g || nutriments.fat || 0) * 10) / 10,
        fiber_per_100g: Math.round((nutriments.fiber_100g || nutriments.fiber || 0) * 10) / 10,
        sugar_per_100g: Math.round((nutriments.sugars_100g || nutriments.sugars || 0) * 10) / 10,
        sodium_per_100g: Math.round((nutriments.sodium_100g || nutriments.sodium || 0) * 1000) / 1000, // Convert to mg
        image_url: product.image_url || product.image_front_url || product.image_front_small_url || ''
      };
    } catch (error) {
      console.error('OpenFoodFacts API error:', error);
      return null;
    }
  },

  // Save new food to database
  async saveFoodToDatabase(food: ScannedFood): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('foods')
        .insert({
          name: food.name,
          brand: food.brand || null,
          barcode: food.barcode,
          calories_per_100g: food.calories_per_100g,
          protein_per_100g: food.protein_per_100g,
          carbs_per_100g: food.carbs_per_100g,
          fat_per_100g: food.fat_per_100g,
          fiber_per_100g: food.fiber_per_100g || 0,
          sugar_per_100g: food.sugar_per_100g || 0,
          sodium_per_100g: food.sodium_per_100g || 0,
          image_url: food.image_url || null,
          verified: true, // Auto-verify OpenFoodFacts data
          created_by: user?.id
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }
    } catch (error) {
      console.error('Error saving food to database:', error);
    }
  },

  // Format food data from database
  formatFoodData(food: Food): ScannedFood {
    return {
      name: food.name,
      brand: food.brand || '',
      barcode: food.barcode || '',
      calories_per_100g: food.calories_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fat_per_100g: food.fat_per_100g,
      fiber_per_100g: food.fiber_per_100g,
      sugar_per_100g: food.sugar_per_100g,
      sodium_per_100g: food.sodium_per_100g,
      image_url: food.image_url || ''
    };
  },

  // AI Food Recognition from camera via secure Edge Function
  async recognizeFoodFromImage(imageBase64: string): Promise<ScannedFood | null> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-food-recognition', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('AI food recognition error:', error);
        return null;
      }

      return data?.food || null;
    } catch (error) {
      console.error('AI food recognition error:', error);
      return null;
    }
  },

  // Search foods by name for autocomplete
  async searchFoodsByName(query: string): Promise<Food[]> {
    try {
      if (query.length < 2) return [];

      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .eq('verified', true)
        .order('name')
        .limit(20);

      if (error) throw error;
      return data as Food[];
    } catch (error) {
      console.error('Error searching foods:', error);
      return [];
    }
  },

  // Calculate nutrition for custom quantity
  calculateNutritionForQuantity(food: ScannedFood, quantity: number) {
    const multiplier = quantity / 100; // Food data is per 100g

    return {
      calories: Math.round(food.calories_per_100g * multiplier),
      protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      fat: Math.round(food.fat_per_100g * multiplier * 10) / 10,
      fiber: Math.round((food.fiber_per_100g || 0) * multiplier * 10) / 10,
      sugar: Math.round((food.sugar_per_100g || 0) * multiplier * 10) / 10,
      sodium: Math.round((food.sodium_per_100g || 0) * multiplier * 100) / 100
    };
  },

  // Validate barcode format
  isValidBarcode(barcode: string): boolean {
    // Support common barcode formats (UPC, EAN-8, EAN-13, UPC-A)
    const barcodeRegex = /^(\d{8}|\d{12}|\d{13}|\d{14})$/;
    return barcodeRegex.test(barcode.trim());
  },

  // Batch food lookup for meal planning
  async batchLookupFoods(barcodes: string[]): Promise<ScannedFood[]> {
    try {
      const results = await Promise.all(
        barcodes.map(barcode => this.scanBarcode(barcode))
      );
      
      return results.filter(food => food !== null) as ScannedFood[];
    } catch (error) {
      console.error('Batch lookup error:', error);
      return [];
    }
  }
};