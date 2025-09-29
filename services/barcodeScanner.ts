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

  // Get popular/trending foods
  async getPopularFoods(): Promise<Food[]> {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('verified', true)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Food[];
    } catch (error) {
      console.error('Error fetching popular foods:', error);
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

  // AI Food Recognition from camera (structure ready for ML integration)
  async recognizeFoodFromImage(imageBase64: string): Promise<ScannedFood | null> {
    try {
      // This would integrate with an AI service like:
      // - Google Vision API Food Detection
      // - Clarifai Food Model
      // - Custom TensorFlow model
      // - Azure Cognitive Services
      
      console.log('AI Food Recognition - Processing image...');
      
      // For demo purposes, return a mock response
      // In production, this would call an actual AI API
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI response based on common foods
      const mockFoods = [
        {
          name: 'Banana',
          calories_per_100g: 89,
          protein_per_100g: 1.1,
          carbs_per_100g: 22.8,
          fat_per_100g: 0.3,
          fiber_per_100g: 2.6,
          sugar_per_100g: 12.2,
        },
        {
          name: 'Apple',
          calories_per_100g: 52,
          protein_per_100g: 0.3,
          carbs_per_100g: 13.8,
          fat_per_100g: 0.2,
          fiber_per_100g: 2.4,
          sugar_per_100g: 10.4,
        },
        {
          name: 'Chicken Breast',
          calories_per_100g: 165,
          protein_per_100g: 31.0,
          carbs_per_100g: 0,
          fat_per_100g: 3.6,
          fiber_per_100g: 0,
          sugar_per_100g: 0,
        }
      ];

      const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)];
      
      return {
        name: `AI Recognized: ${randomFood.name}`,
        brand: '',
        barcode: '',
        calories_per_100g: randomFood.calories_per_100g,
        protein_per_100g: randomFood.protein_per_100g,
        carbs_per_100g: randomFood.carbs_per_100g,
        fat_per_100g: randomFood.fat_per_100g,
        fiber_per_100g: randomFood.fiber_per_100g,
        sugar_per_100g: randomFood.sugar_per_100g,
        sodium_per_100g: 0
      };
    } catch (error) {
      console.error('AI food recognition error:', error);
      return null;
    }
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