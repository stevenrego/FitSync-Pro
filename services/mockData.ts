import { User, WorkoutPlan, Progress, Challenge, Badge, NutritionLog } from '../types';

export const mockUser: User = {
  id: 'mock-user-123',
  email: 'test@example.com',
  name: 'Fitness Enthusiast',
  role: 'user',
  avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=150&h=150&fit=crop&crop=face',
  subscription: 'free',
  bio: 'Passionate about fitness and healthy living',
  height: 175,
  weight: 70,
  age: 28,
  gender: 'female',
  fitness_level: 'intermediate',
  goals: ['weight_loss', 'muscle_gain', 'endurance'],
  points: 1250,
  streak_days: 5,
  total_workouts: 24,
  calories_burned: 2400,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockWorkoutPlan: WorkoutPlan = {
  id: 'plan-1',
  name: 'Full Body Strength',
  description: 'A comprehensive full-body workout plan designed to build strength and muscle mass',
  difficulty: 'intermediate',
  duration_weeks: 8,
  created_by: 'coach-1',
  is_ai_generated: true,
  is_public: true,
  price: 0,
  image_url: 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?w=400&h=300&fit=crop',
  tags: ['strength', 'full-body', 'muscle-building'],
  rating: 4.8,
  rating_count: 156,
  exercises: [
    {
      id: 'ex-1',
      workout_plan_id: 'plan-1',
      exercise_id: 'push-ups',
      exercise: {
        id: 'push-ups',
        name: 'Push-ups',
        description: 'Classic bodyweight chest exercise',
        instructions: 'Start in plank position, lower chest to floor, push back up',
        muscle_groups: ['chest', 'triceps', 'shoulders'],
        equipment: ['bodyweight'],
        created_at: '2024-01-01T00:00:00Z'
      },
      sets: 3,
      reps: 12,
      rest_seconds: 60,
      order_index: 1,
      notes: 'Focus on form over speed'
    },
    {
      id: 'ex-2',
      workout_plan_id: 'plan-1',
      exercise_id: 'squats',
      exercise: {
        id: 'squats',
        name: 'Squats',
        description: 'Fundamental leg exercise',
        instructions: 'Stand with feet shoulder-width apart, lower as if sitting back, return to standing',
        muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
        equipment: ['bodyweight'],
        created_at: '2024-01-01T00:00:00Z'
      },
      sets: 3,
      reps: 15,
      rest_seconds: 90,
      order_index: 2,
      notes: 'Keep chest up and knees behind toes'
    }
  ],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockProgress: Progress[] = [
  { id: '1', user_id: 'mock-user-123', date: '2024-01-15', weight: 70, created_at: '2024-01-15T00:00:00Z' },
  { id: '2', user_id: 'mock-user-123', date: '2024-01-08', weight: 70.5, created_at: '2024-01-08T00:00:00Z' },
  { id: '3', user_id: 'mock-user-123', date: '2024-01-01', weight: 71, created_at: '2024-01-01T00:00:00Z' },
];

export const mockChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    title: '30-Day Plank Challenge',
    description: 'Hold a plank for increasing durations over 30 days',
    challenge_type: 'custom',
    target_value: 30,
    duration_days: 30,
    reward_points: 500,
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    created_by: 'admin',
    is_public: true,
    participants_count: 156,
    user_progress: 18,
    user_completed: false,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockBadges: Badge[] = [
  {
    id: 'badge-1',
    name: 'First Workout',
    description: 'Complete your first workout session',
    icon: '🏋️',
    requirement_type: 'workouts_count',
    requirement_value: 1,
    points: 50,
    earned: true,
    earned_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'badge-2',
    name: 'Consistency King',
    description: 'Maintain a 7-day workout streak',
    icon: '👑',
    requirement_type: 'streak_days',
    requirement_value: 7,
    points: 200,
    earned: false,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockNutritionLog: NutritionLog = {
  id: 'log-1',
  user_id: 'mock-user-123',
  date: '2024-01-15',
  meals: [
    {
      id: 'meal-1',
      nutrition_log_id: 'log-1',
      meal_type: 'breakfast',
      name: 'Breakfast',
      food_entries: [
        {
          id: 'entry-1',
          meal_id: 'meal-1',
          food_id: 'oats',
          food: {
            id: 'oats',
            name: 'Oatmeal with Berries',
            brand: '',
            calories_per_100g: 389,
            protein_per_100g: 16.9,
            carbs_per_100g: 66.3,
            fat_per_100g: 6.9,
            verified: true,
            created_at: '2024-01-01T00:00:00Z'
          },
          quantity: 50,
          created_at: '2024-01-15T08:00:00Z'
        }
      ],
      totalCalories: 195,
      created_at: '2024-01-15T08:00:00Z'
    }
  ],
  totalCalories: 1200,
  totalProtein: 80,
  totalCarbs: 150,
  totalFat: 45,
  created_at: '2024-01-15T00:00:00Z'
};