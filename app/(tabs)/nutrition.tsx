import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitness } from '../../hooks/useFitness';
import { barcodeScannerService } from '../../services/barcodeScanner';
import GradientButton from '../../components/ui/GradientButton';
import { Colors, Sizes, Fonts } from '../../constants/theme';

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const { nutritionLog } = useFitness();
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

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

  const handleBarcodeSearch = async () => {
    if (Platform.OS === 'web') {
      // Web demo implementation
      const demoBarcode = '1234567890123';
      showWebAlert('Demo Mode', `Scanning barcode: ${demoBarcode}. In production, this would scan actual barcodes.`, async () => {
        await searchFoodByBarcode(demoBarcode);
      });
      return;
    }
    
    // Mobile implementation would use camera
    setShowScanModal(true);
  };

  const searchFoodByBarcode = async (barcode: string) => {
    try {
      setIsScanning(true);
      const foodData = await barcodeScannerService.scanBarcode(barcode);
      
      if (foodData) {
        setScanResult(foodData);
        showWebAlert('Food Found', `Found: ${foodData.name}${foodData.brand ? ` (${foodData.brand})` : ''}\nCalories: ${foodData.calories_per_100g} per 100g`);
      } else {
        showWebAlert('Not Found', 'Food not found in database. You can add it manually.');
      }
    } catch (error) {
      console.error('Barcode search error:', error);
      showWebAlert('Error', 'Failed to search food. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAIFoodRecognition = async () => {
    try {
      setIsScanning(true);
      
      // Demo AI recognition
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'; // Demo base64
      const recognitionResult = await barcodeScannerService.recognizeFoodFromImage(mockImageData);
      
      if (recognitionResult) {
        setScanResult(recognitionResult);
        showWebAlert('AI Recognition', `Recognized: ${recognitionResult.name}\nEstimated calories: ${recognitionResult.calories_per_100g} per 100g`);
      } else {
        showWebAlert('Recognition Failed', 'Could not recognize the food. Please try again or add manually.');
      }
    } catch (error) {
      console.error('AI recognition error:', error);
      showWebAlert('Error', 'AI recognition failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && onOk) onOk();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

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

        {/* Enhanced Quick Add with AI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add Food</Text>
          <View style={styles.quickActions}>
            <GradientButton
              title="📷 Scan Barcode"
              onPress={handleBarcodeSearch}
              gradient={Colors.gradient.primary}
              style={styles.quickButton}
            />
            <GradientButton
              title="🤖 AI Food Scan"
              onPress={handleAIFoodRecognition}
              gradient={Colors.gradient.accent}
              style={styles.quickButton}
            />
          </View>
          
          <View style={styles.quickActions}>
            <GradientButton
              title="🔍 Search Food"
              onPress={() => showWebAlert('Search Food', 'Food search feature coming soon!')}
              gradient={Colors.gradient.secondary}
              style={styles.quickButton}
            />
            <GradientButton
              title="➕ Add Custom"
              onPress={() => showWebAlert('Custom Food', 'Custom food entry coming soon!')}
              gradient={Colors.gradient.dark}
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
                    name="local-drink" 
                    size={32} 
                    color={i < 5 ? Colors.accent : Colors.textSecondary + '40'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.waterProgress}>5 / 8 glasses completed</Text>
          </View>
        </View>

        {/* Nutrition Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Nutrition Insights</Text>
          <View style={styles.insightCard}>
            <MaterialIcons name="psychology" size={24} color={Colors.accent} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Smart Recommendation</Text>
              <Text style={styles.insightText}>
                You are 300 calories below your daily goal. Consider adding a healthy snack 
                with protein to reach your targets and support muscle recovery.
              </Text>
            </View>
          </View>
          
          <View style={styles.insightCard}>
            <MaterialIcons name="trending-up" size={24} color={Colors.success} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Progress Update</Text>
              <Text style={styles.insightText}>
                Great protein intake today! You have reached 80% of your protein goal, 
                which supports your muscle-building objectives.
              </Text>
            </View>
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
                levels and keeps you feeling full longer. Aim for 20-30g per meal.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <Modal visible={showScanModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.scannerModal}>
            <Text style={styles.scannerTitle}>Barcode Scanner</Text>
            <Text style={styles.scannerText}>
              {isScanning ? 'Searching food database...' : 'Position barcode within the frame'}
            </Text>
            
            <View style={styles.scannerFrame}>
              <MaterialIcons name="qr-code-scanner" size={100} color={Colors.primary} />
            </View>
            
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => searchFoodByBarcode('1234567890123')}
              disabled={isScanning}
            >
              <Text style={styles.scanButtonText}>
                {isScanning ? 'Scanning...' : 'Demo Scan'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeScannerButton}
              onPress={() => setShowScanModal(false)}
            >
              <Text style={styles.closeScannerText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: Sizes.md,
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
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Sizes.md,
  },
  insightContent: {
    flex: 1,
    marginLeft: Sizes.md,
  },
  insightTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.xs,
  },
  insightText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerModal: {
    backgroundColor: 'white',
    borderRadius: Sizes.borderRadius,
    padding: Sizes.lg,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Sizes.md,
  },
  scannerText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Sizes.lg,
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Sizes.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Sizes.lg,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Sizes.md,
    paddingHorizontal: Sizes.xl,
    borderRadius: Sizes.borderRadius,
    marginBottom: Sizes.md,
  },
  scanButtonText: {
    color: 'white',
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
  closeScannerButton: {
    paddingVertical: Sizes.sm,
    paddingHorizontal: Sizes.lg,
  },
  closeScannerText: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.md,
  },
});