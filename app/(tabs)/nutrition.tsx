import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitness } from '../../hooks/useFitness';
import GradientButton from '../../components/ui/GradientButton';
import { Colors, Sizes, Fonts } from '../../constants/theme';

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const { nutritionLog } = useFitness();

  const dailyGoals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67,
  };

  const current = nutritionLog || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };

  const macroData = [
    {
      name: 'Calories',
      current: current.totalCalories,
      goal: dailyGoals.calories,
      unit: 'kcal',
      color: Colors.primary,
    },
    {
      name: 'Protein',
      current: current.totalProtein,
      goal: dailyGoals.protein,
      unit: 'g',
      color: Colors.success,
    },
    {
      name: 'Carbs',
      current: current.totalCarbs,
      goal: dailyGoals.carbs,
      unit: 'g',
      color: Colors.accent,
    },
    {
      name: 'Fat',
      current: current.totalFat,
      goal: dailyGoals.fat,
      unit: 'g',
      color: Colors.warning,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <TouchableOpacity style={styles.calendarButton}>
          <MaterialIcons name="calendar-today" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.calorieCircle}>
              <Text style={styles.calorieNumber}>{current.totalCalories}</Text>
              <Text style={styles.calorieLabel}>/ {dailyGoals.calories} kcal</Text>
            </View>
            <View style={styles.macroGrid}>
              {macroData.slice(1).map((macro) => (
                <View key={macro.name} style={styles.macroItem}>
                  <Text style={styles.macroName}>{macro.name}</Text>
                  <Text style={[styles.macroValue, { color: macro.color }]}>
                    {macro.current}g
                  </Text>
                  <Text style={styles.macroGoal}>/ {macro.goal}g</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Macro Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macro Progress</Text>
          {macroData.map((macro) => {
            const percentage = Math.min((macro.current / macro.goal) * 100, 100);
            return (
              <View key={macro.name} style={styles.macroProgress}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroName}>{macro.name}</Text>
                  <Text style={styles.macroNumbers}>
                    {macro.current} / {macro.goal} {macro.unit}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${percentage}%`, backgroundColor: macro.color }
                    ]} 
                  />
                </View>
                <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
              </View>
            );
          })}
        </View>

        {/* Quick Add */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickActions}>
            <GradientButton
              title="📷 Scan Barcode"
              onPress={() => {}}
              gradient={Colors.gradient.primary}
              style={styles.quickButton}
            />
            <GradientButton
              title="🔍 Search Food"
              onPress={() => {}}
              gradient={Colors.gradient.secondary}
              style={styles.quickButton}
            />
          </View>
        </View>

        {/* Today's Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          
          {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((mealType) => {
            const mealCalories = mealType === 'Breakfast' ? 300 : 0;
            return (
              <TouchableOpacity key={mealType} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{mealType}</Text>
                    <Text style={styles.mealCalories}>
                      {mealCalories > 0 ? `${mealCalories} kcal` : 'No items added'}
                    </Text>
                  </View>
                  <MaterialIcons 
                    name={mealCalories > 0 ? "edit" : "add"} 
                    size={24} 
                    color={Colors.primary} 
                  />
                </View>
                
                {mealType === 'Breakfast' && mealCalories > 0 && (
                  <View style={styles.foodItems}>
                    <View style={styles.foodItem}>
                      <Text style={styles.foodName}>Oatmeal with Berries</Text>
                      <Text style={styles.foodCalories}>300 kcal</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Water Intake */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Water Intake</Text>
            <Text style={styles.waterGoal}>Goal: 8 glasses</Text>
          </View>
          
          <View style={styles.waterTracker}>
            <View style={styles.waterGlasses}>
              {Array.from({ length: 8 }, (_, i) => (
                <TouchableOpacity key={i} style={styles.waterGlass}>
                  <MaterialIcons 
                    name={i < 5 ? "local-drink" : "local-drink"} 
                    size={32} 
                    color={i < 5 ? Colors.accent : Colors.textSecondary + '40'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.waterProgress}>5 / 8 glasses completed</Text>
          </View>
        </View>

        {/* Nutrition Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Tip</Text>
          <View style={styles.tipCard}>
            <MaterialIcons name="lightbulb" size={24} color={Colors.warning} />
            <View style={styles.tipContent}>
              <Text style={styles.tipText}>
                Eating protein with every meal helps maintain stable blood sugar 
                levels and keeps you feeling full longer.
              </Text>
            </View>
          </View>
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
  calendarButton: {
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
    marginBottom: Sizes.md,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieCircle: {
    alignItems: 'center',
    marginRight: Sizes.xl,
  },
  calorieNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  calorieLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Sizes.xs,
  },
  macroGrid: {
    flex: 1,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sizes.sm,
  },
  macroName: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    fontWeight: '500',
    width: 60,
  },
  macroValue: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    marginLeft: Sizes.sm,
  },
  macroGoal: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginLeft: Sizes.xs,
  },
  macroProgress: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    marginBottom: Sizes.md,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.sm,
  },
  macroNumbers: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    marginBottom: Sizes.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  quickActions: {
    flexDirection: 'row',
    gap: Sizes.md,
  },
  quickButton: {
    flex: 1,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    marginBottom: Sizes.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  mealCalories: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  foodItems: {
    marginTop: Sizes.md,
    paddingTop: Sizes.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.xs,
  },
  foodName: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
  },
  foodCalories: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  waterGoal: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  waterTracker: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
  },
  waterGlasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Sizes.sm,
    marginBottom: Sizes.md,
  },
  waterGlass: {
    padding: Sizes.xs,
  },
  waterProgress: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipContent: {
    flex: 1,
    marginLeft: Sizes.md,
  },
  tipText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.text,
    lineHeight: 20,
  },
});