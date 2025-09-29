import { supabase } from './supabase';
import { User, WorkoutPlan } from '../types';

export const aiPersonalService = {
  // Generate AI-powered workout plan based on user profile
  async generatePersonalizedPlan(user: User): Promise<WorkoutPlan | null> {
    try {
      // Calculate user fitness metrics
      const fitnessScore = this.calculateFitnessScore(user);
      const planStructure = this.generatePlanStructure(user, fitnessScore);

      // Create the workout plan
      const { data: plan, error } = await supabase
        .from('workout_plans')
        .insert({
          name: `AI Custom Plan for ${user.name}`,
          description: `Personalized ${user.fitness_level} plan targeting ${user.goals?.join(', ') || 'general fitness'}`,
          difficulty: user.fitness_level || 'beginner',
          duration_weeks: planStructure.duration,
          created_by: 'ai-system',
          is_ai_generated: true,
          is_public: false,
          price: 0,
          tags: [...(user.goals || []), user.fitness_level || 'beginner', 'ai-generated'],
          rating: 0,
          rating_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Generate exercises for the plan
      await this.generatePlanExercises(plan.id, user, planStructure);

      return plan as WorkoutPlan;
    } catch (error) {
      console.error('Error generating personalized plan:', error);
      return null;
    }
  },

  // Calculate fitness score based on user profile
  calculateFitnessScore(user: User): number {
    let score = 0;
    
    // Base fitness level score
    switch (user.fitness_level) {
      case 'beginner': score += 1; break;
      case 'intermediate': score += 2; break;
      case 'advanced': score += 3; break;
      default: score += 1;
    }
    
    // Workout history bonus
    if (user.total_workouts > 50) score += 1;
    if (user.total_workouts > 100) score += 1;
    
    // Streak bonus
    if (user.streak_days > 7) score += 0.5;
    if (user.streak_days > 30) score += 0.5;
    
    return Math.min(score, 5); // Cap at 5
  },

  // Generate plan structure based on user profile
  generatePlanStructure(user: User, fitnessScore: number) {
    const goals = user.goals || ['general'];
    
    let duration = 8; // Default 8 weeks
    let workoutsPerWeek = 3;
    let exercisesPerWorkout = 6;
    
    // Adjust based on goals
    if (goals.includes('weight_loss')) {
      duration = 12;
      workoutsPerWeek = 4;
    } else if (goals.includes('muscle_gain')) {
      duration = 16;
      workoutsPerWeek = 4;
      exercisesPerWorkout = 8;
    } else if (goals.includes('endurance')) {
      duration = 10;
      workoutsPerWeek = 5;
    }
    
    // Adjust based on fitness score
    if (fitnessScore >= 4) {
      workoutsPerWeek += 1;
      exercisesPerWorkout += 2;
    }
    
    return {
      duration,
      workoutsPerWeek,
      exercisesPerWorkout,
      restDays: 7 - workoutsPerWeek
    };
  },

  // Generate exercises for the plan
  async generatePlanExercises(planId: string, user: User, structure: any) {
    try {
      // Get appropriate exercises from database
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .limit(structure.exercisesPerWorkout);

      if (error) throw error;
      if (!exercises || exercises.length === 0) return;

      // Create plan exercises with AI-calculated sets/reps
      const planExercises = exercises.map((exercise, index) => ({
        workout_plan_id: planId,
        exercise_id: exercise.id,
        sets: this.calculateSets(user.fitness_level),
        reps: this.calculateReps(exercise.muscle_groups, user.fitness_level),
        rest_seconds: this.calculateRest(user.fitness_level),
        order_index: index + 1,
        notes: this.generateExerciseNotes(exercise, user)
      }));

      const { error: insertError } = await supabase
        .from('workout_plan_exercises')
        .insert(planExercises);

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Error generating plan exercises:', error);
    }
  },

  // Calculate optimal sets based on fitness level
  calculateSets(fitnessLevel?: string): number {
    switch (fitnessLevel) {
      case 'beginner': return 2;
      case 'intermediate': return 3;
      case 'advanced': return 4;
      default: return 3;
    }
  },

  // Calculate optimal reps based on muscle groups and fitness level
  calculateReps(muscleGroups: string[], fitnessLevel?: string): number {
    const isStrength = muscleGroups.some(group => 
      ['chest', 'back', 'legs', 'shoulders'].includes(group.toLowerCase())
    );
    
    const baseReps = isStrength ? 8 : 12;
    const multiplier = fitnessLevel === 'beginner' ? 0.8 : 
                     fitnessLevel === 'advanced' ? 1.2 : 1;
    
    return Math.round(baseReps * multiplier);
  },

  // Calculate rest time based on fitness level
  calculateRest(fitnessLevel?: string): number {
    switch (fitnessLevel) {
      case 'beginner': return 90;
      case 'intermediate': return 75;
      case 'advanced': return 60;
      default: return 75;
    }
  },

  // Generate personalized exercise notes
  generateExerciseNotes(exercise: any, user: User): string {
    const level = user.fitness_level || 'beginner';
    const notes = [
      `Customized for ${level} level`,
      'Focus on proper form over speed'
    ];
    
    if (level === 'beginner') {
      notes.push('Start with bodyweight if needed');
    } else if (level === 'advanced') {
      notes.push('Consider adding progressive overload');
    }
    
    return notes.join('. ') + '.';
  },

  // Dynamic plan adjustment based on progress
  async adjustPlanDifficulty(userId: string, planId: string, progressData: any) {
    try {
      // Analyze user progress
      const adjustment = this.analyzeProgressForAdjustment(progressData);
      
      if (!adjustment.shouldAdjust) return null;

      // Get current plan exercises
      const { data: exercises, error } = await supabase
        .from('workout_plan_exercises')
        .select('*')
        .eq('workout_plan_id', planId);

      if (error) throw error;

      // Apply adjustments
      const updates = exercises?.map(exercise => ({
        ...exercise,
        sets: Math.max(1, exercise.sets + adjustment.setsChange),
        reps: Math.max(1, (exercise.reps || 10) + adjustment.repsChange),
        rest_seconds: Math.max(30, exercise.rest_seconds + adjustment.restChange)
      }));

      // Update exercises
      if (updates) {
        for (const update of updates) {
          await supabase
            .from('workout_plan_exercises')
            .update({
              sets: update.sets,
              reps: update.reps,
              rest_seconds: update.rest_seconds
            })
            .eq('id', update.id);
        }
      }

      return {
        adjusted: true,
        type: adjustment.type,
        message: adjustment.message
      };
    } catch (error) {
      console.error('Error adjusting plan:', error);
      return null;
    }
  },

  // Analyze progress data to determine adjustments
  analyzeProgressForAdjustment(progressData: any) {
    const consistency = progressData.workoutsCompleted / progressData.workoutsPlanned;
    const averageDifficulty = progressData.averageDifficultyRating || 3;
    
    // Too easy - increase difficulty
    if (consistency >= 0.9 && averageDifficulty < 3) {
      return {
        shouldAdjust: true,
        type: 'increase',
        setsChange: 1,
        repsChange: 2,
        restChange: -15,
        message: 'Great progress! Increasing intensity to challenge you more.'
      };
    }
    
    // Too hard - decrease difficulty  
    if (consistency <= 0.6 || averageDifficulty > 4) {
      return {
        shouldAdjust: true,
        type: 'decrease',
        setsChange: -1,
        repsChange: -2,
        restChange: 15,
        message: 'Adjusting plan for better sustainability and consistency.'
      };
    }
    
    return {
      shouldAdjust: false,
      type: 'maintain',
      message: 'Current plan difficulty is optimal for your progress.'
    };
  },

  // Calculate nutrition goals using AI algorithms
  calculateNutritionGoals(user: User) {
    // Calculate BMR using Mifflin-St Jeor Equation
    const bmr = this.calculateBMR(user);
    
    // Calculate TDEE with activity multiplier
    const activityLevel = user.activity_level || 'moderate';
    const tdee = bmr * this.getActivityMultiplier(activityLevel);
    
    // Adjust for goals
    let calorieGoal = tdee;
    const goals = user.goals || [];
    
    if (goals.includes('weight_loss')) {
      calorieGoal = tdee * 0.85; // 15% deficit
    } else if (goals.includes('muscle_gain')) {
      calorieGoal = tdee * 1.15; // 15% surplus
    }
    
    // Calculate macro distribution
    const macros = this.calculateMacroDistribution(calorieGoal, goals);
    
    return {
      calories: Math.round(calorieGoal),
      protein: Math.round(macros.protein),
      carbs: Math.round(macros.carbs),
      fat: Math.round(macros.fat),
      fiber: Math.round(calorieGoal * 0.014), // 14g per 1000 calories
      water: Math.round(user.weight ? user.weight * 35 : 2500) // 35ml per kg bodyweight
    };
  },

  // Calculate BMR using Mifflin-St Jeor Equation
  calculateBMR(user: User): number {
    const weight = user.weight || 70;
    const height = user.height || 170;
    const age = user.age || 30;
    const gender = user.gender || 'female';
    
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  },

  // Get activity level multiplier
  getActivityMultiplier(activityLevel: string): number {
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    return multipliers[activityLevel] || 1.55;
  },

  // Calculate macro distribution based on goals
  calculateMacroDistribution(calories: number, goals: string[]) {
    let proteinPercent = 0.25; // 25%
    let fatPercent = 0.30; // 30%
    let carbPercent = 0.45; // 45%
    
    // Adjust for specific goals
    if (goals.includes('muscle_gain')) {
      proteinPercent = 0.30; // Increase protein for muscle building
      carbPercent = 0.45;
      fatPercent = 0.25;
    } else if (goals.includes('weight_loss')) {
      proteinPercent = 0.35; // Higher protein for satiety
      carbPercent = 0.35;
      fatPercent = 0.30;
    }
    
    return {
      protein: (calories * proteinPercent) / 4, // 4 calories per gram
      carbs: (calories * carbPercent) / 4,
      fat: (calories * fatPercent) / 9 // 9 calories per gram
    };
  }
};