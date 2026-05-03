import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from 'expo-router';
import AddFoodForm from '../../components/AddFoodForm';
import { useApi } from '../../hooks/useApi';
import { useProfile } from '../../context/ProfileContext';
import { Food, MealType, DiaryEntry, Exercise } from '../../types/food';

// App Theme Colors
const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  primaryLight: '#FF8F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
  protein: '#FF6B6B',
  carbs: '#4ECDC4',
  fat: '#FFE66D',
};

const MEAL_CONFIG: Record<MealType, { icon: string; label: string; color: string }> = {
  breakfast: { icon: 'weather-sunset-up', label: 'Breakfast', color: '#FF9500' },
  lunch: { icon: 'weather-sunny', label: 'Lunch', color: '#34C759' },
  dinner: { icon: 'weather-night', label: 'Dinner', color: '#5856D6' },
  snacks: { icon: 'food-apple', label: 'Snacks', color: '#FF2D55' },
};

export default function DiaryScreen() {
  const insets = useSafeAreaInsets();
  const { loading, error, execute, apiClient } = useApi();
  const { settings } = useProfile();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMealForAdd, setSelectedMealForAdd] = useState<MealType>('breakfast');
  const [diaryEntry, setDiaryEntry] = useState<DiaryEntry | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseCalories, setExerciseCalories] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');

  useEffect(() => {
    loadDiaryEntry();
  }, [currentDate]);

  // Refresh diary when tab comes into focus (e.g., after logging via chat)
  useFocusEffect(
    useCallback(() => {
      loadDiaryEntry();
    }, [currentDate])
  );

  const loadDiaryEntry = async () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const result = await execute(() => apiClient.getDiaryByDate(dateStr));
    if (result) {
      setDiaryEntry(result as DiaryEntry);
    }
  };

  const handleAddFood = async (food: Food, mealType: MealType) => {
    if (!diaryEntry?.id) {
      Alert.alert('Error', 'No diary entry found. Please try again.');
      return;
    }

    const result = await execute(() =>
      apiClient.addFoodToDiary(diaryEntry.id!, mealType, food)
    );

    if (result) {
      await loadDiaryEntry();
      setShowAddForm(false);
    }
  };

  const handleAddExercise = async () => {
    if (!diaryEntry?.id) {
      Alert.alert('Error', 'No diary entry found.');
      return;
    }

    const calories = parseInt(exerciseCalories);
    const duration = parseInt(exerciseDuration);

    if (!exerciseName.trim() || isNaN(calories) || calories <= 0) {
      Alert.alert('Invalid Input', 'Please enter exercise name and calories burned.');
      return;
    }

    const result = await execute(() =>
      apiClient.addExerciseToDiary(diaryEntry.id!, {
        name: exerciseName.trim(),
        calories,
        durationMin: isNaN(duration) ? 0 : duration,
      })
    );

    if (result) {
      await loadDiaryEntry();
      setShowExerciseModal(false);
      setExerciseName('');
      setExerciseCalories('');
      setExerciseDuration('');
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!diaryEntry?.id) return;

    Alert.alert('Remove Exercise', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await execute(() => apiClient.removeExerciseFromDiary(diaryEntry.id!, exerciseId));
          await loadDiaryEntry();
        },
      },
    ]);
  };

  const handleRemoveFood = async (mealType: MealType, foodId: string) => {
    if (!diaryEntry?.id) return;

    await execute(() => apiClient.removeFoodFromDiary(diaryEntry.id!, mealType, foodId));
    await loadDiaryEntry();
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  const formatDate = (date: Date) => {
    if (isToday) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calculate totals
  const totals = diaryEntry
    ? Object.values(diaryEntry.meals).flat().reduce(
        (acc, food) => ({
          calories: acc.calories + food.calories,
          protein: acc.protein + (food.protein || 0),
          carbs: acc.carbs + (food.carbs || 0),
          fat: acc.fat + (food.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const exerciseCaloriesBurned = diaryEntry?.exercises?.reduce((sum, ex) => sum + ex.calories, 0) || 0;
  const calorieGoal = settings.calorieGoal ?? 2000;
  const remaining = calorieGoal - totals.calories + exerciseCaloriesBurned;

  const openAddForm = (mealType: MealType) => {
    setSelectedMealForAdd(mealType);
    setShowAddForm(true);
  };

  if (showAddForm) {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <View style={styles.addFormHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAddForm(false)}
          >
            <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.addFormTitle}>Add Food</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.addFormScroll} showsVerticalScrollIndicator={false}>
          <AddFoodForm
            onAddFood={handleAddFood}
            loading={loading}
            initialMealType={selectedMealForAdd}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Date Navigation Header */}
      <View style={styles.dateHeader}>
        <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.dateNavButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentDate(new Date())}>
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
          {!isToday && (
            <Text style={styles.fullDateText}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigateDate('next')}
          style={styles.dateNavButton}
          disabled={isToday}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={28}
            color={isToday ? COLORS.border : COLORS.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Calorie Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.calorieCircle}>
            <Text style={[styles.remainingNumber, remaining < 0 && styles.overBudget]}>
              {remaining}
            </Text>
            <Text style={styles.remainingLabel}>Remaining</Text>
          </View>

          <View style={styles.calorieBreakdown}>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieItemValue}>{calorieGoal}</Text>
              <Text style={styles.calorieItemLabel}>Goal</Text>
            </View>
            <Text style={styles.calorieMath}>−</Text>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieItemValue}>{totals.calories}</Text>
              <Text style={styles.calorieItemLabel}>Food</Text>
            </View>
            <Text style={styles.calorieMath}>+</Text>
            <View style={styles.calorieItem}>
              <Text style={[styles.calorieItemValue, { color: COLORS.carbs }]}>{exerciseCaloriesBurned}</Text>
              <Text style={styles.calorieItemLabel}>Exercise</Text>
            </View>
            <Text style={styles.calorieMath}>=</Text>
            <View style={styles.calorieItem}>
              <Text style={[styles.calorieItemValue, remaining < 0 && styles.overBudget]}>
                {remaining}
              </Text>
              <Text style={styles.calorieItemLabel}>Left</Text>
            </View>
          </View>

          {/* Macro Progress Bars */}
          <View style={styles.macroContainer}>
            <MacroProgressBar
              label="Protein"
              current={totals.protein}
              goal={settings.proteinGoal ?? 150}
              color={COLORS.protein}
              unit="g"
            />
            <MacroProgressBar
              label="Carbs"
              current={totals.carbs}
              goal={settings.carbsGoal ?? 250}
              color={COLORS.carbs}
              unit="g"
            />
            <MacroProgressBar
              label="Fat"
              current={totals.fat}
              goal={settings.fatGoal ?? 65}
              color={COLORS.fat}
              unit="g"
            />
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.protein} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Meal Sections */}
        {diaryEntry && (
          <View style={styles.mealsContainer}>
            {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map((mealType) => (
              <MealSection
                key={mealType}
                mealType={mealType}
                foods={diaryEntry.meals[mealType] || []}
                config={MEAL_CONFIG[mealType]}
                onAddPress={() => openAddForm(mealType)}
                onRemoveFood={(foodId) => handleRemoveFood(mealType, foodId)}
              />
            ))}

            {/* Exercise Section */}
            <View style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleRow}>
                  <View style={[styles.mealIconContainer, { backgroundColor: COLORS.carbs + '20' }]}>
                    <MaterialCommunityIcons name="run" size={22} color={COLORS.carbs} />
                  </View>
                  <View>
                    <Text style={styles.mealTitle}>Exercise</Text>
                    <Text style={styles.mealCalories}>+{exerciseCaloriesBurned} cal burned</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addMealButton} onPress={() => setShowExerciseModal(true)}>
                  <MaterialCommunityIcons name="plus" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {(!diaryEntry.exercises || diaryEntry.exercises.length === 0) ? (
                <TouchableOpacity style={styles.emptyMeal} onPress={() => setShowExerciseModal(true)}>
                  <Text style={styles.emptyMealText}>Tap to log exercise</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.foodList}>
                  {diaryEntry.exercises.map((exercise, index) => (
                    <TouchableOpacity
                      key={exercise.id || index}
                      style={[styles.foodItem, index === diaryEntry.exercises.length - 1 && styles.foodItemLast]}
                      onLongPress={() => exercise.id && handleRemoveExercise(exercise.id)}
                    >
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>{exercise.name}</Text>
                        {exercise.durationMin > 0 && (
                          <Text style={styles.foodMacros}>{exercise.durationMin} min</Text>
                        )}
                      </View>
                      <Text style={[styles.foodCalories, { color: COLORS.carbs }]}>+{exercise.calories}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {!diaryEntry && !loading && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="food-off" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateText}>No diary entry for this day</Text>
            <Text style={styles.emptyStateSubtext}>Start logging your meals</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openAddForm('breakfast')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Exercise Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Exercise</Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Exercise name (e.g., Running)"
              placeholderTextColor={COLORS.textSecondary}
              value={exerciseName}
              onChangeText={setExerciseName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Calories burned"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={exerciseCalories}
              onChangeText={setExerciseCalories}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Duration (minutes) - optional"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={exerciseDuration}
              onChangeText={setExerciseDuration}
            />

            <TouchableOpacity
              style={[styles.modalButton, loading && { opacity: 0.5 }]}
              onPress={handleAddExercise}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>{loading ? 'Adding...' : 'Add Exercise'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Macro Progress Bar Component
function MacroProgressBar({
  label,
  current,
  goal,
  color,
  unit
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit: string;
}) {
  const progress = Math.min((current / goal) * 100, 100);

  return (
    <View style={styles.macroRow}>
      <View style={styles.macroLabelContainer}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {current}<Text style={styles.macroGoal}>/{goal}{unit}</Text>
        </Text>
      </View>
      <View style={styles.macroBarBackground}>
        <View style={[styles.macroBarFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// Swipeable Food Item Component
function SwipeableFoodItem({
  food,
  isLast,
  onRemove,
}: {
  food: Food;
  isLast: boolean;
  onRemove: () => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          onRemove();
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialCommunityIcons name="delete" size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={[styles.foodItem, styles.foodItemSwipeable, isLast && styles.foodItemLast]}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodMacros}>
            P: {food.protein || 0}g  •  C: {food.carbs || 0}g  •  F: {food.fat || 0}g
          </Text>
        </View>
        <Text style={styles.foodCalories}>{food.calories}</Text>
      </View>
    </Swipeable>
  );
}

// Meal Section Component
function MealSection({
  mealType,
  foods,
  config,
  onAddPress,
  onRemoveFood,
}: {
  mealType: MealType;
  foods: Food[];
  config: { icon: string; label: string; color: string };
  onAddPress: () => void;
  onRemoveFood: (foodId: string) => void;
}) {
  const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);

  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleRow}>
          <View style={[styles.mealIconContainer, { backgroundColor: config.color + '20' }]}>
            <MaterialCommunityIcons name={config.icon as any} size={22} color={config.color} />
          </View>
          <View>
            <Text style={styles.mealTitle}>{config.label}</Text>
            <Text style={styles.mealCalories}>{totalCalories} cal</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addMealButton} onPress={onAddPress}>
          <MaterialCommunityIcons name="plus" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {foods.length === 0 ? (
        <TouchableOpacity style={styles.emptyMeal} onPress={onAddPress}>
          <Text style={styles.emptyMealText}>Tap to add food</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.foodList}>
          {foods.map((food, index) => (
            <SwipeableFoodItem
              key={food.id || index}
              food={food}
              isLast={index === foods.length - 1}
              onRemove={() => food.id && onRemoveFood(food.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  // Date Header
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateNavButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  fullDateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calorieCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  remainingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  remainingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  calorieBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  calorieItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  calorieItemValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  calorieItemLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  calorieMath: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginHorizontal: 12,
  },
  overBudget: {
    color: COLORS.protein,
  },
  // Macro Progress
  macroContainer: {
    gap: 12,
  },
  macroRow: {
    gap: 8,
  },
  macroLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  macroGoal: {
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  macroBarBackground: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a2020',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: COLORS.protein,
    fontSize: 14,
    flex: 1,
  },
  // Meals
  mealsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mealCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  mealCalories: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addMealButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMeal: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMealText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  foodList: {
    // No horizontal padding - swipeable items handle their own padding
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  foodItemLast: {
    borderBottomWidth: 0,
  },
  foodItemSwipeable: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  foodMacros: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  foodCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 12,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  // Add Form Header
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  addFormScroll: {
    flex: 1,
  },
  // Exercise Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Swipe to delete
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
});
