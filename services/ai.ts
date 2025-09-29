import { supabase } from './supabase';
import { WorkoutPlan, User } from '../types';

export const aiService = {
  // Generate personalized workout plan based on user profile
  async generateWorkoutPlan(userId: string): Promise<WorkoutPlan> {
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // AI plan generation logic based on user profile
    const planData = {
      name: `Custom ${user.fitness_level} Plan for ${user.name}`,
      description: this.generatePlanDescription(user),
      difficulty: user.fitness_level || 'beginner',
      duration_weeks: this.calculateDuration(user.goals),
      created_by: 'ai-system',
      is_ai_generated: true,
      is_public: false,
      price: 0,
      tags: this.generateTags(user),
      rating: 0,
      rating_count: 0
    };

    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .insert(planData)
      .select()
      .single();

    if (planError) throw planError;

    // Generate exercises for the plan
    await this.generatePlanExercises(plan.id, user);

    return plan as WorkoutPlan;
  },

  // Generate nutrition plan based on user goals and preferences
  async generateNutritionPlan(userId: string) {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const nutritionGoals = this.calculateNutritionGoals(user);
    const mealPlan = this.generateMealPlan(user, nutritionGoals);

    return {
      userId,
      dailyCalories: nutritionGoals.calories,
      macros: nutritionGoals.macros,
      mealPlan,
      restrictions: user.dietary_restrictions || [],
      preferences: user.dietary_preferences || []
    };
  },

  // AI food recognition from image
  async recognizeFood(imageBase64: string) {
    // Integration with AI food recognition API
    try {
      const response = await fetch('/api/ai/recognize-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 })
      });

      const result = await response.json();
      return {
        foodName: result.food_name,
        calories: result.calories,
        macros: result.macros,
        portionSize: result.portion_size,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Food recognition error:', error);
      throw new Error('Unable to recognize food. Please try again.');
    }
  },

  // Dynamic plan adjustment based on progress
  async adjustPlan(userId: string, planId: string, progressData: any) {
    const { data: currentPlan, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) throw error;

    // AI logic to adjust plan based on user progress
    const adjustments = this.calculatePlanAdjustments(progressData, currentPlan);
    
    if (adjustments.shouldAdjust) {
      await supabase
        .from('workout_plan_exercises')
        .update(adjustments.exerciseChanges)
        .eq('workout_plan_id', planId);
    }

    return adjustments;
  },

  // Helper methods
  generatePlanDescription(user: User): string {
    const goals = user.goals?.join(', ') || 'general fitness';
    return `AI-generated ${user.fitness_level} plan focused on ${goals}. Customized for your current fitness level and preferences.`;
  },

  calculateDuration(goals: string[] = []): number {
    if (goals.includes('weight_loss')) return 12;
    if (goals.includes('muscle_gain')) return 16;
    if (goals.includes('endurance')) return 8;
    return 8;
  },

  generateTags(user: User): string[] {
    const tags = [user.fitness_level || 'beginner', 'ai-generated'];
    if (user.goals) tags.push(...user.goals);
    return tags;
  },

  async generatePlanExercises(planId: string, user: User) {
    // Generate appropriate exercises based on user profile
    const exercises = await this.selectExercisesForUser(user);
    
    const planExercises = exercises.map((exercise, index) => ({
      workout_plan_id: planId,
      exercise_id: exercise.id,
      sets: this.calculateSets(user.fitness_level),
      reps: this.calculateReps(exercise.type, user.fitness_level),
      rest_seconds: this.calculateRest(exercise.intensity),
      order_index: index + 1,
      notes: this.generateExerciseNotes(exercise, user)
    }));

    const { error } = await supabase
      .from('workout_plan_exercises')
      .insert(planExercises);

    if (error) throw error;
  },

  async selectExercisesForUser(user: User) {
    // Select exercises based on user goals and equipment
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .in('muscle_groups', user.goals || ['general'])
      .limit(12);

    if (error) throw error;
    return exercises || [];
  },

  calculateSets(fitnessLevel: string): number {
    switch (fitnessLevel) {
      case 'beginner': return 2;
      case 'intermediate': return 3;
      case 'advanced': return 4;
      default: return 3;
    }
  },

  calculateReps(exerciseType: string, fitnessLevel: string): number {
    const baseReps = exerciseType === 'strength' ? 8 : 12;
    const multiplier = fitnessLevel === 'beginner' ? 0.8 : fitnessLevel === 'advanced' ? 1.2 : 1;
    return Math.round(baseReps * multiplier);
  },

  calculateRest(intensity: string): number {
    switch (intensity) {
      case 'high': return 120;
      case 'medium': return 90;
      case 'low': return 60;
      default: return 90;
    }
  },

  generateExerciseNotes(exercise: any, user: User): string {
    return `Customized for ${user.fitness_level} level. Focus on proper form over speed.`;
  },

  calculateNutritionGoals(user: User) {
    const bmr = this.calculateBMR(user);
    const tdee = bmr * this.getActivityMultiplier(user.activity_level);
    
    let calorieGoal = tdee;
    if (user.goals?.includes('weight_loss')) calorieGoal *= 0.85;
    if (user.goals?.includes('muscle_gain')) calorieGoal *= 1.15;

    return {
      calories: Math.round(calorieGoal),
      macros: {
        protein: Math.round(calorieGoal * 0.25 / 4), // 25% protein
        carbs: Math.round(calorieGoal * 0.45 / 4),   // 45% carbs
        fat: Math.round(calorieGoal * 0.30 / 9)      // 30% fat
      }
    };
  },

  calculateBMR(user: User): number {
    if (!user.weight || !user.height || !user.age) return 2000;
    
    // Mifflin-St Jeor Equation
    if (user.gender === 'male') {
      return 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
    } else {
      return 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
    }
  },

  getActivityMultiplier(activityLevel: string = 'moderate'): number {
    switch (activityLevel) {
      case 'sedentary': return 1.2;
      case 'light': return 1.375;
      case 'moderate': return 1.55;
      case 'active': return 1.725;
      case 'very_active': return 1.9;
      default: return 1.55;
    }
  },

  generateMealPlan(user: User, nutritionGoals: any) {
    // Generate AI-based meal suggestions
    return {
      breakfast: this.generateMealSuggestions('breakfast', nutritionGoals.calories * 0.25),
      lunch: this.generateMealSuggestions('lunch', nutritionGoals.calories * 0.35),
      dinner: this.generateMealSuggestions('dinner', nutritionGoals.calories * 0.30),
      snacks: this.generateMealSuggestions('snacks', nutritionGoals.calories * 0.10)
    };
  },

  generateMealSuggestions(mealType: string, targetCalories: number) {
    // AI-generated meal suggestions based on user preferences
    const suggestions = {
      breakfast: [
        'Oatmeal with berries and nuts',
        'Greek yogurt with granola',
        'Scrambled eggs with whole grain toast'
      ],
      lunch: [
        'Grilled chicken salad',
        'Quinoa bowl with vegetables',
        'Turkey and avocado wrap'
      ],
      dinner: [
        'Baked salmon with sweet potato',
        'Lean beef stir-fry with brown rice',
        'Lentil curry with naan'
      ],
      snacks: [
        'Apple with almond butter',
        'Protein smoothie',
        'Mixed nuts and dried fruit'
      ]
    };

    return suggestions[mealType as keyof typeof suggestions] || [];
  },

  calculatePlanAdjustments(progressData: any, currentPlan: any) {
    // AI logic to determine if plan needs adjustment
    const shouldIncrease = progressData.consistency > 0.8 && progressData.difficulty_rating < 3;
    const shouldDecrease = progressData.consistency < 0.6 || progressData.difficulty_rating > 4;

    return {
      shouldAdjust: shouldIncrease || shouldDecrease,
      adjustmentType: shouldIncrease ? 'increase' : shouldDecrease ? 'decrease' : 'maintain',
      exerciseChanges: shouldIncrease ? { sets: currentPlan.sets + 1 } : shouldDecrease ? { sets: Math.max(1, currentPlan.sets - 1) } : {},
      reasoning: shouldIncrease ? 'Great progress! Increasing intensity.' : shouldDecrease ? 'Adjusting for better sustainability.' : 'Current plan is optimal.'
    };
  }
};