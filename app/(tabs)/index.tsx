import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useFitness } from '../../hooks/useFitness';
import StatCard from '../../components/ui/StatCard';
import ProgressChart from '../../components/ui/ProgressChart';
import GradientButton from '../../components/ui/GradientButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Colors, Sizes, Fonts } from '../../constants/theme';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { stats, progress, challenges, currentPlan, refreshData, isLoading } = useFitness();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const weightData = progress.map(p => ({
    date: p.date,
    value: p.weight || 0,
  }));

  const todaysChallenge = challenges[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading && !user) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradient.primary}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Fitness Enthusiast'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Workouts"
            value={stats.totalWorkouts}
            icon="fitness-center"
            gradient={Colors.gradient.primary}
          />
          <StatCard
            title="Streak"
            value={stats.weeklyStreak}
            icon="local-fire-department"
            gradient={Colors.gradient.accent}
            unit=" days"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Points"
            value={stats.points}
            icon="stars"
            gradient={Colors.gradient.secondary}
          />
          <StatCard
            title="Calories"
            value={stats.caloriesBurned}
            icon="whatshot"
            gradient={Colors.gradient.dark}
            unit=" kcal"
          />
        </View>

        {/* Current Plan */}
        {currentPlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Plan</Text>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.planCard}
            >
              <View style={styles.planContent}>
                <Text style={styles.planName}>{currentPlan.name}</Text>
                <Text style={styles.planDescription}>
                  {currentPlan.description}
                </Text>
                <View style={styles.planStats}>
                  <View style={styles.planStat}>
                    <MaterialIcons name="schedule" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.planStatText}>{currentPlan.duration_weeks} weeks</Text>
                  </View>
                  <View style={styles.planStat}>
                    <MaterialIcons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.planStatText}>{currentPlan.difficulty}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.startButton}>
                <MaterialIcons name="play-arrow" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Today's Challenge */}
        {todaysChallenge && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Challenge</Text>
            <View style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeTitle}>{todaysChallenge.title}</Text>
                <Text style={styles.challengeReward}>+{todaysChallenge.reward_points} pts</Text>
              </View>
              <Text style={styles.challengeDescription}>
                {todaysChallenge.description}
              </Text>
              <View style={styles.challengeProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min((todaysChallenge.user_progress || 0) / todaysChallenge.target_value * 100, 100)}%` 
                  }]} />
                </View>
                <Text style={styles.progressText}>
                  {Math.round((todaysChallenge.user_progress || 0) / todaysChallenge.target_value * 100)}% Complete
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Progress Chart */}
        {weightData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weight Progress</Text>
            <ProgressChart
              data={weightData}
              title="Weight Tracking"
              unit="kg"
              color={Colors.primary}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <GradientButton
              title="Start Workout"
              onPress={() => {}}
              gradient={Colors.gradient.primary}
              style={styles.actionButton}
            />
            <GradientButton
              title="Log Food"
              onPress={() => {}}
              gradient={Colors.gradient.secondary}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Welcome Message for New Users */}
        {stats.totalWorkouts === 0 && (
          <View style={styles.section}>
            <View style={styles.welcomeCard}>
              <MaterialIcons name="waving-hand" size={32} color={Colors.primary} />
              <Text style={styles.welcomeTitle}>Welcome to FitSync Pro!</Text>
              <Text style={styles.welcomeDescription}>
                Ready to start your fitness journey? Complete your first workout to unlock achievements and track your progress.
              </Text>
              <GradientButton
                title="Get Started"
                onPress={() => {}}
                gradient={Colors.gradient.primary}
                style={styles.welcomeButton}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Sizes.lg,
    paddingBottom: Sizes.lg,
    borderBottomLeftRadius: Sizes.lg,
    borderBottomRightRadius: Sizes.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: Fonts.sizes.md,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    color: 'white',
    marginTop: Sizes.xs,
  },
  notificationButton: {
    padding: Sizes.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: Sizes.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Sizes.md,
    marginBottom: Sizes.md,
  },
  section: {
    marginBottom: Sizes.xl,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.md,
  },
  planCard: {
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planContent: {
    flex: 1,
  },
  planName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: Sizes.xs,
  },
  planDescription: {
    fontSize: Fonts.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Sizes.sm,
  },
  planStats: {
    flexDirection: 'row',
    gap: Sizes.md,
  },
  planStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizes.xs,
  },
  planStatText: {
    fontSize: Fonts.sizes.xs,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
  },
  startButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.sm,
  },
  challengeTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  challengeReward: {
    fontSize: Fonts.sizes.sm,
    color: Colors.accent,
    fontWeight: '600',
  },
  challengeDescription: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Sizes.md,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizes.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
  },
  progressText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Sizes.md,
  },
  actionButton: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Sizes.md,
    marginBottom: Sizes.sm,
  },
  welcomeDescription: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Sizes.lg,
  },
  welcomeButton: {
    minWidth: 150,
  },
});