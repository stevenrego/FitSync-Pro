import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitness } from '../../hooks/useFitness';
import GradientButton from '../../components/ui/GradientButton';
import { Colors, Sizes, Fonts } from '../../constants/theme';

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const { currentPlan, workoutPlans } = useFitness();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity style={styles.searchButton}>
          <MaterialIcons name="search" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Workout */}
        {currentPlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Workout</Text>
            <View style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>{currentPlan.name}</Text>
                <Text style={styles.workoutDuration}>45 min</Text>
              </View>
              <Text style={styles.workoutDescription}>
                {currentPlan.description}
              </Text>
              
              {/* Exercise Preview */}
              <View style={styles.exercisePreview}>
                {currentPlan.exercises.slice(0, 3).map((exercise, index) => (
                  <View key={exercise.id} style={styles.exerciseItem}>
                    <MaterialIcons 
                      name="fitness-center" 
                      size={16} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseReps}>
                      {exercise.sets}x{exercise.reps}
                    </Text>
                  </View>
                ))}
                {currentPlan.exercises.length > 3 && (
                  <Text style={styles.moreExercises}>
                    +{currentPlan.exercises.length - 3} more exercises
                  </Text>
                )}
              </View>

              <GradientButton
                title="Start Workout"
                onPress={() => {}}
                gradient={Colors.gradient.primary}
                style={styles.startButton}
              />
            </View>
          </View>
        )}

        {/* Workout Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {[
              { name: 'Strength', icon: 'fitness-center', color: Colors.gradient.primary },
              { name: 'Cardio', icon: 'directions-run', color: Colors.gradient.accent },
              { name: 'Yoga', icon: 'self-improvement', color: Colors.gradient.secondary },
              { name: 'HIIT', icon: 'flash-on', color: Colors.gradient.dark },
            ].map((category) => (
              <TouchableOpacity key={category.name} style={styles.categoryCard}>
                <MaterialIcons 
                  name={category.icon as keyof typeof MaterialIcons.glyphMap} 
                  size={32} 
                  color={category.color[0]} 
                />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Workouts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {[
            {
              name: 'Morning Energizer',
              duration: '20 min',
              difficulty: 'Beginner',
              exercises: 8,
              rating: 4.8,
            },
            {
              name: 'Full Body Burn',
              duration: '35 min',
              difficulty: 'Intermediate',
              exercises: 12,
              rating: 4.9,
            },
            {
              name: 'Core Crusher',
              duration: '25 min',
              difficulty: 'Advanced',
              exercises: 10,
              rating: 4.7,
            },
          ].map((workout, index) => (
            <TouchableOpacity key={index} style={styles.popularWorkout}>
              <View style={styles.workoutImage}>
                <MaterialIcons name="play-circle-filled" size={24} color="white" />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>{workout.name}</Text>
                <View style={styles.workoutMeta}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="schedule" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{workout.duration}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="trending-up" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{workout.difficulty}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="fitness-center" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{workout.exercises} exercises</Text>
                  </View>
                </View>
                <View style={styles.rating}>
                  <MaterialIcons name="star" size={16} color={Colors.warning} />
                  <Text style={styles.ratingText}>{workout.rating}</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {[
            { name: 'Upper Body Strength', date: 'Yesterday', completed: true },
            { name: 'Cardio Blast', date: '2 days ago', completed: true },
            { name: 'Leg Day', date: '3 days ago', completed: false },
          ].map((workout, index) => (
            <View key={index} style={styles.recentWorkout}>
              <MaterialIcons 
                name={workout.completed ? "check-circle" : "radio-button-unchecked"} 
                size={24} 
                color={workout.completed ? Colors.success : Colors.textSecondary} 
              />
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{workout.name}</Text>
                <Text style={styles.recentDate}>{workout.date}</Text>
              </View>
              <TouchableOpacity>
                <MaterialIcons name="replay" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Sizes.lg,
    paddingBottom: Sizes.md,
  },
  title: {
    fontSize: Fonts.sizes.title,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchButton: {
    padding: Sizes.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Sizes.lg,
  },
  section: {
    marginBottom: Sizes.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.md,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  seeAll: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  workoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.sm,
  },
  workoutName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  workoutDuration: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  workoutDescription: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Sizes.md,
    lineHeight: 20,
  },
  exercisePreview: {
    marginBottom: Sizes.lg,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sizes.xs,
  },
  exerciseName: {
    flex: 1,
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    marginLeft: Sizes.sm,
  },
  exerciseReps: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  moreExercises: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Sizes.xs,
  },
  startButton: {
    marginTop: Sizes.md,
  },
  categories: {
    gap: Sizes.md,
    paddingRight: Sizes.lg,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    alignItems: 'center',
    minWidth: 80,
  },
  categoryName: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    marginTop: Sizes.xs,
    textAlign: 'center',
  },
  popularWorkout: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sizes.md,
  },
  workoutImage: {
    width: 60,
    height: 60,
    borderRadius: Sizes.sm,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Sizes.md,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  workoutMeta: {
    flexDirection: 'row',
    marginBottom: Sizes.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Sizes.md,
  },
  metaText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    marginLeft: 4,
    fontWeight: '500',
  },
  recentWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    marginBottom: Sizes.sm,
  },
  recentInfo: {
    flex: 1,
    marginLeft: Sizes.md,
  },
  recentName: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  recentDate: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});