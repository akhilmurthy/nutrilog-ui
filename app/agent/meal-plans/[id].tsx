import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../../lib/api';

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
  success: '#34C759',
  protein: '#FF6B6B',
  carbs: '#4ECDC4',
  fat: '#FFE66D',
};

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
}

interface PlannedMeal {
  id: string;
  name: string;
  description?: string;
  foods: Food[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface MealPlanDay {
  dayNumber: number;
  dayName?: string;
  meals: {
    breakfast: PlannedMeal[];
    lunch: PlannedMeal[];
    dinner: PlannedMeal[];
    snacks: PlannedMeal[];
  };
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface MealPlan {
  id: string;
  name: string;
  description?: string;
  days: MealPlanDay[];
  calorieTarget: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  isActive: boolean;
  generatedBy: 'ai' | 'manual';
  createdAt: string;
}

export default function MealPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMealPlan();
  }, [id]);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const plan = await apiClient.getMealPlan(id);
      setMealPlan(plan);
    } catch (err: any) {
      setError(err.message || 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleLogDay = async () => {
    if (!mealPlan) return;

    Alert.alert(
      'Log Day to Diary',
      `Log Day ${selectedDay} meals to today's diary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log',
          onPress: async () => {
            try {
              setLogLoading(true);
              const result = await apiClient.logMealPlanDay(mealPlan.id, selectedDay);
              Alert.alert(
                'Success',
                `Logged ${result.itemsLogged} food items to your diary!`
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to log meals');
            } finally {
              setLogLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleActivate = async () => {
    if (!mealPlan) return;

    try {
      await apiClient.activateMealPlan(mealPlan.id);
      setMealPlan((prev) => (prev ? { ...prev, isActive: true } : null));
      Alert.alert('Success', 'Meal plan activated!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to activate meal plan');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !mealPlan) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal Plan</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Meal plan not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMealPlan}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentDay = mealPlan.days.find((d) => d.dayNumber === selectedDay);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {mealPlan.name}
        </Text>
        {!mealPlan.isActive ? (
          <TouchableOpacity onPress={handleActivate} style={styles.activateButton}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={COLORS.success} />
          </TouchableOpacity>
        ) : (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {mealPlan.days.map((day) => (
            <TouchableOpacity
              key={day.dayNumber}
              style={[
                styles.dayTab,
                selectedDay === day.dayNumber && styles.selectedDayTab,
              ]}
              onPress={() => setSelectedDay(day.dayNumber)}
            >
              <Text
                style={[
                  styles.dayTabText,
                  selectedDay === day.dayNumber && styles.selectedDayTabText,
                ]}
              >
                {day.dayName || `Day ${day.dayNumber}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Day Content */}
      <ScrollView style={styles.content}>
        {currentDay && (
          <>
            {/* Day Stats */}
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="fire" size={20} color={COLORS.primary} />
                  <Text style={styles.statValue}>{currentDay.totalCalories}</Text>
                  <Text style={styles.statLabel}>cal</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.dot, { backgroundColor: COLORS.protein }]} />
                  <Text style={styles.statValue}>{currentDay.totalProtein}g</Text>
                  <Text style={styles.statLabel}>protein</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.dot, { backgroundColor: COLORS.carbs }]} />
                  <Text style={styles.statValue}>{currentDay.totalCarbs}g</Text>
                  <Text style={styles.statLabel}>carbs</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.dot, { backgroundColor: COLORS.fat }]} />
                  <Text style={styles.statValue}>{currentDay.totalFat}g</Text>
                  <Text style={styles.statLabel}>fat</Text>
                </View>
              </View>
            </View>

            {/* Meals */}
            {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((mealType) => {
              const meals = currentDay.meals[mealType];
              if (!meals || meals.length === 0) return null;

              return (
                <View key={mealType} style={styles.mealSection}>
                  <Text style={styles.mealTitle}>
                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  </Text>
                  {meals.map((meal) => (
                    <View key={meal.id} style={styles.mealCard}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      {meal.description && (
                        <Text style={styles.mealDescription}>{meal.description}</Text>
                      )}
                      <View style={styles.foodList}>
                        {meal.foods.map((food) => (
                          <View key={food.id} style={styles.foodItem}>
                            <View style={styles.foodInfo}>
                              <Text style={styles.foodName}>{food.name}</Text>
                              {food.servingSize && (
                                <Text style={styles.servingSize}>{food.servingSize}</Text>
                              )}
                            </View>
                            <Text style={styles.foodCalories}>{food.calories} cal</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.mealMacros}>
                        <Text style={styles.macroText}>{meal.totalCalories} cal</Text>
                        <Text style={[styles.macroText, { color: COLORS.protein }]}>
                          P: {meal.totalProtein}g
                        </Text>
                        <Text style={[styles.macroText, { color: COLORS.carbs }]}>
                          C: {meal.totalCarbs}g
                        </Text>
                        <Text style={[styles.macroText, { color: COLORS.fat }]}>
                          F: {meal.totalFat}g
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Log Button */}
      <View style={styles.logButtonContainer}>
        <TouchableOpacity
          style={styles.logButton}
          onPress={handleLogDay}
          disabled={logLoading}
        >
          {logLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
              <Text style={styles.logButtonText}>Log Day {selectedDay} to Diary</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 32,
  },
  activateButton: {
    padding: 4,
  },
  activeBadge: {
    backgroundColor: COLORS.primary + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  daySelector: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
  },
  selectedDayTab: {
    backgroundColor: COLORS.primary,
  },
  dayTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  selectedDayTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  mealSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  mealCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  mealDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  foodList: {
    marginTop: 12,
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    color: COLORS.text,
  },
  servingSize: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  foodCalories: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  macroText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
  logButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
