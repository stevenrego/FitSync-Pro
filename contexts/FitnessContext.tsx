import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { WorkoutPlan, Progress, Challenge, Badge, NutritionLog } from '../types';
import { fitnessService } from '../services/fitness';
import { nutritionService } from '../services/nutrition';
import { useAuth } from '../hooks/useAuth';

export interface FitnessContextType {
  workoutPlans: WorkoutPlan[];
  currentPlan: WorkoutPlan | null;
  progress: Progress[];
  challenges: Challenge[];
  badges: Badge[];
  nutritionLog: NutritionLog | null;
  stats: {
    totalWorkouts: number;
    weeklyStreak: number;
    points: number;
    caloriesBurned: number;
  };
  isLoading: boolean;
  setCurrentPlan: (plan: WorkoutPlan) => void;
  addProgress: (progress: Progress) => void;
  joinChallenge: (challengeId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

export function FitnessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [nutritionLog, setNutritionLog] = useState<NutritionLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const stats = {
    totalWorkouts: user?.total_workouts || 0,
    weeklyStreak: user?.streak_days || 0,
    points: user?.points || 0,
    caloriesBurned: user?.calories_burned || 0,
  };

  useEffect(() => {
    if (user) {
      loadFitnessData();
    } else {
      // Clear data when user logs out
      setWorkoutPlans([]);
      setCurrentPlan(null);
      setProgress([]);
      setChallenges([]);
      setBadges([]);
      setNutritionLog(null);
    }
  }, [user]);

  const loadFitnessData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load workout plans
      const plans = await fitnessService.getWorkoutPlans();
      setWorkoutPlans(plans);

      // Get user's current plan
      const userPlan = await fitnessService.getUserWorkoutPlan(user.id);
      setCurrentPlan(userPlan);

      // Load user progress
      const userProgress = await fitnessService.getUserProgress(user.id);
      setProgress(userProgress);

      // Load challenges
      const availableChallenges = await fitnessService.getChallenges();
      setChallenges(availableChallenges);

      // Load user badges
      const userBadges = await fitnessService.getUserBadges(user.id);
      setBadges(userBadges);

      // Load today's nutrition log
      const todayLog = await nutritionService.getTodaysNutritionLog(user.id);
      setNutritionLog(todayLog);
    } catch (error) {
      console.error('Error loading fitness data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addProgress = async (newProgress: Progress) => {
    try {
      const createdProgress = await fitnessService.createProgressEntry(newProgress);
      setProgress(prev => [createdProgress, ...prev]);
    } catch (error) {
      console.error('Error adding progress:', error);
      throw error;
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) return;
    
    try {
      await fitnessService.joinChallenge(challengeId, user.id);
      // Refresh challenges to update participation status
      const updatedChallenges = await fitnessService.getChallenges();
      setChallenges(updatedChallenges);
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await loadFitnessData();
  };

  return (
    <FitnessContext.Provider value={{
      workoutPlans,
      currentPlan,
      progress,
      challenges,
      badges,
      nutritionLog,
      stats,
      isLoading,
      setCurrentPlan,
      addProgress,
      joinChallenge,
      refreshData,
    }}>
      {children}
    </FitnessContext.Provider>
  );
}