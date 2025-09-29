import { supabase } from './supabase';
import { WorkoutPlan, Exercise, WorkoutSession, ProgressEntry, Challenge, Badge } from '../types';

export const fitnessService = {
  // Workout Plans
  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    const { data, error } = await supabase
      .from('workout_plans')
      .select(`
        *,
        workout_plan_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(plan => ({
      ...plan,
      exercises: plan.workout_plan_exercises || []
    })) as WorkoutPlan[];
  },

  async getUserWorkoutPlan(userId: string): Promise<WorkoutPlan | null> {
    // For now, return the first available plan
    // In a real app, this would be based on user's current program
    const plans = await this.getWorkoutPlans();
    return plans[0] || null;
  },

  // Workout Sessions
  async createWorkoutSession(session: Omit<WorkoutSession, 'id' | 'started_at'>) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutSession;
  },

  async completeWorkoutSession(sessionId: string, duration_minutes: number, calories_burned?: number) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update({
        completed_at: new Date().toISOString(),
        duration_minutes,
        calories_burned
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutSession;
  },

  async getUserWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_plan:workout_plans(*)
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as WorkoutSession[];
  },

  // Progress Tracking
  async createProgressEntry(entry: Omit<ProgressEntry, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('progress_entries')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data as ProgressEntry;
  },

  async getUserProgress(userId: string): Promise<ProgressEntry[]> {
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    if (error) throw error;
    return data as ProgressEntry[];
  },

  // Challenges
  async getChallenges(): Promise<Challenge[]> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenge_participants!left(
          progress,
          completed,
          user_id
        )
      `)
      .eq('is_public', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(challenge => {
      const userParticipation = challenge.challenge_participants?.find(
        (p: any) => p.user_id === user.user?.id
      );
      
      return {
        ...challenge,
        participants_count: challenge.challenge_participants?.length || 0,
        user_progress: userParticipation?.progress || 0,
        user_completed: userParticipation?.completed || false
      };
    }) as Challenge[];
  },

  async joinChallenge(challengeId: string, userId: string) {
    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        progress: 0,
        completed: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Badges
  async getUserBadges(userId: string): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select(`
        *,
        user_badges!left(
          earned_at,
          user_id
        )
      `);

    if (error) throw error;

    return data.map(badge => ({
      ...badge,
      earned: badge.user_badges?.some((ub: any) => ub.user_id === userId),
      earned_at: badge.user_badges?.find((ub: any) => ub.user_id === userId)?.earned_at
    })) as Badge[];
  },

  // User Stats
  async updateUserStats(userId: string, stats: {
    points?: number;
    streak_days?: number;
    total_workouts?: number;
    calories_burned?: number;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...stats,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};