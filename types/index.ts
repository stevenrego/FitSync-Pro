export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'coach' | 'dietician' | 'admin';
  avatar_url?: string;
  subscription?: 'free' | 'premium' | 'pro';
  subscription_end?: string;
  bio?: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  points: number;
  streak_days: number;
  total_workouts: number;
  calories_burned: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  created_by?: string;
  is_ai_generated: boolean;
  is_public: boolean;
  price: number;
  image_url?: string;
  tags?: string[];
  rating: number;
  rating_count: number;
  exercises: WorkoutPlanExercise[];
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  muscle_groups: string[];
  equipment: string[];
  image_url?: string;
  video_url?: string;
  created_at: string;
}

export interface WorkoutPlanExercise {
  id: string;
  workout_plan_id: string;
  exercise_id: string;
  exercise?: Exercise;
  sets: number;
  reps?: number;
  duration_seconds?: number;
  rest_seconds: number;
  order_index: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_plan_id?: string;
  workout_plan?: WorkoutPlan;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  calories_burned?: number;
  notes?: string;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  date: string;
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  measurements?: Record<string, number>;
  photos?: string[];
  notes?: string;
  created_at: string;
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  image_url?: string;
  verified: boolean;
  created_by?: string;
  created_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  created_at: string;
}

export interface Meal {
  id: string;
  nutrition_log_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  food_entries: FoodEntry[];
  totalCalories: number;
  created_at: string;
}

export interface FoodEntry {
  id: string;
  meal_id: string;
  food_id?: string;
  food?: Food;
  quantity: number;
  custom_name?: string;
  custom_calories?: number;
  custom_protein?: number;
  custom_carbs?: number;
  custom_fat?: number;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  user?: User;
  content: string;
  image_urls?: string[];
  workout_session_id?: string;
  workout_session?: WorkoutSession;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user?: User;
  content: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  challenge_type: 'steps' | 'workouts' | 'calories' | 'custom';
  target_value: number;
  duration_days: number;
  reward_points: number;
  start_date: string;
  end_date?: string;
  created_by?: string;
  is_public: boolean;
  participants_count: number;
  user_progress?: number;
  user_completed?: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  requirement_type?: string;
  requirement_value?: number;
  points: number;
  earned?: boolean;
  earned_at?: string;
  created_at: string;
}

export interface CoachClient {
  id: string;
  coach_id: string;
  client_id: string;
  coach?: User;
  client?: User;
  status: string;
  monthly_fee?: number;
  started_at: string;
  ended_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender?: User;
  recipient?: User;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status?: string;
  tier: 'free' | 'premium' | 'pro';
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}