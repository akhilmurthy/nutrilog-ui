import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApi } from '../../hooks/useApi';

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
  success: '#34C759',
  error: '#FF3B30',
  protein: '#FF6B6B',
  carbs: '#4ECDC4',
  fat: '#FFE66D',
};

interface PlannedFood {
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
  foods: PlannedFood[];
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
  userId: string;
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
  updatedAt: string;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

const MEAL_CONFIG: Record<MealType, { icon: string; label: string; color: string }> = {
  breakfast: { icon: 'weather-sunset-up', label: 'Breakfast', color: '#FF9500' },
  lunch: { icon: 'weather-sunny', label: 'Lunch', color: '#34C759' },
  dinner: { icon: 'weather-night', label: 'Dinner', color: '#5856D6' },
  snacks: { icon: 'food-apple', label: 'Snacks', color: '#FF2D55' },
};

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const { loading, error, execute, apiClient } = useApi();
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<MealPlanDay | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMealPlans();
    }, [])
  );

  const loadMealPlans = async () => {
    const result = await execute(() => apiClient.getMealPlans());
    if (result) {
      setMealPlans(result as MealPlan[]);
    }
  };

  const handleActivatePlan = async (planId: string) => {
    const result = await execute(() => apiClient.activateMealPlan(planId));
    if (result) {
      await loadMealPlans();
      Alert.alert('Success', 'Meal plan activated!');
    }
  };

  const handleDeactivatePlan = async (planId: string) => {
    const result = await execute(() =>
      apiClient.updateMealPlan(planId, { isActive: false })
    );
    if (result) {
      await loadMealPlans();
    }
  };

  const handleDeletePlan = (plan: MealPlan) => {
    Alert.alert(
      'Delete Meal Plan',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await execute(() => apiClient.deleteMealPlan(plan.id));
            await loadMealPlans();
          },
        },
      ]
    );
  };

  const handleLogDay = async (plan: MealPlan, dayNumber: number) => {
    setIsLogging(true);
    try {
      const result = await execute(() =>
        apiClient.logMealPlanDay(plan.id, dayNumber)
      );
      if (result) {
        Alert.alert(
          'Success',
          `Logged ${(result as any).itemsLogged} items from Day ${dayNumber} to your diary!`,
          [
            {
              text: 'View Diary',
              onPress: () => router.push('/(tabs)/diary'),
            },
            { text: 'OK' },
          ]
        );
      }
    } finally {
      setIsLogging(false);
    }
  };

  const openPlanDetail = (plan: MealPlan) => {
    setSelectedPlan(plan);
  };

  const closePlanDetail = () => {
    setSelectedPlan(null);
    setSelectedDay(null);
  };

  const openDayDetail = (day: MealPlanDay) => {
    setSelectedDay(day);
  };

  const closeDayDetail = () => {
    setSelectedDay(null);
  };

  const activePlan = mealPlans.find((p) => p.isActive);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Plans</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/chat')}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading && mealPlans.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Active Plan Section */}
        {activePlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Plan</Text>
            <PlanCard
              plan={activePlan}
              isActive={true}
              onPress={() => openPlanDetail(activePlan)}
              onDeactivate={() => handleDeactivatePlan(activePlan.id)}
              onDelete={() => handleDeletePlan(activePlan)}
            />
          </View>
        )}

        {/* All Plans Section */}
        {mealPlans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {activePlan ? 'Other Plans' : 'Your Plans'}
            </Text>
            {mealPlans
              .filter((p) => !p.isActive)
              .map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isActive={false}
                  onPress={() => openPlanDetail(plan)}
                  onActivate={() => handleActivatePlan(plan.id)}
                  onDelete={() => handleDeletePlan(plan)}
                />
              ))}
            {mealPlans.filter((p) => !p.isActive).length === 0 && activePlan && (
              <Text style={styles.emptyText}>No other plans</Text>
            )}
          </View>
        )}

        {/* Empty State */}
        {!loading && mealPlans.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={80}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>No Meal Plans Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Ask your AI coach to create a personalized meal plan for you
            </Text>
            <TouchableOpacity
              style={styles.createPlanButton}
              onPress={() => router.push('/(tabs)/chat')}
            >
              <MaterialCommunityIcons
                name="robot-happy-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.createPlanButtonText}>Ask Coach</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Plan Detail Modal */}
      <Modal
        visible={selectedPlan !== null && selectedDay === null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePlanDetail}
      >
        {selectedPlan && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closePlanDetail}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedPlan.name}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Plan Summary */}
              <View style={styles.planSummary}>
                <View style={styles.targetRow}>
                  <View style={styles.targetItem}>
                    <Text style={styles.targetValue}>{selectedPlan.calorieTarget}</Text>
                    <Text style={styles.targetLabel}>cal/day</Text>
                  </View>
                  {selectedPlan.proteinTarget && (
                    <View style={styles.targetItem}>
                      <Text style={[styles.targetValue, { color: COLORS.protein }]}>
                        {selectedPlan.proteinTarget}g
                      </Text>
                      <Text style={styles.targetLabel}>protein</Text>
                    </View>
                  )}
                  {selectedPlan.carbsTarget && (
                    <View style={styles.targetItem}>
                      <Text style={[styles.targetValue, { color: COLORS.carbs }]}>
                        {selectedPlan.carbsTarget}g
                      </Text>
                      <Text style={styles.targetLabel}>carbs</Text>
                    </View>
                  )}
                  {selectedPlan.fatTarget && (
                    <View style={styles.targetItem}>
                      <Text style={[styles.targetValue, { color: COLORS.fat }]}>
                        {selectedPlan.fatTarget}g
                      </Text>
                      <Text style={styles.targetLabel}>fat</Text>
                    </View>
                  )}
                </View>
                {selectedPlan.description && (
                  <Text style={styles.planDescription}>{selectedPlan.description}</Text>
                )}
              </View>

              {/* Days List */}
              <Text style={styles.daysTitle}>
                {selectedPlan.days.length} Day{selectedPlan.days.length !== 1 ? 's' : ''}
              </Text>
              {selectedPlan.days.map((day) => (
                <DayCard
                  key={day.dayNumber}
                  day={day}
                  onPress={() => openDayDetail(day)}
                  onLog={() => handleLogDay(selectedPlan, day.dayNumber)}
                  isLogging={isLogging}
                />
              ))}

              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Day Detail Modal */}
      <Modal
        visible={selectedDay !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDayDetail}
      >
        {selectedDay && selectedPlan && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeDayDetail}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedDay.dayName || `Day ${selectedDay.dayNumber}`}
              </Text>
              <TouchableOpacity
                onPress={() => handleLogDay(selectedPlan, selectedDay.dayNumber)}
                disabled={isLogging}
              >
                {isLogging ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <MaterialCommunityIcons name="plus-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Day Summary */}
              <View style={styles.daySummary}>
                <Text style={styles.daySummaryText}>
                  {selectedDay.totalCalories} cal • {selectedDay.totalProtein}g P •{' '}
                  {selectedDay.totalCarbs}g C • {selectedDay.totalFat}g F
                </Text>
              </View>

              {/* Meals */}
              {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map((mealType) => {
                const meals = selectedDay.meals[mealType];
                if (!meals || meals.length === 0) return null;

                const config = MEAL_CONFIG[mealType];
                return (
                  <View key={mealType} style={styles.mealSection}>
                    <View style={styles.mealHeader}>
                      <View style={[styles.mealIcon, { backgroundColor: config.color + '20' }]}>
                        <MaterialCommunityIcons
                          name={config.icon as any}
                          size={20}
                          color={config.color}
                        />
                      </View>
                      <Text style={styles.mealLabel}>{config.label}</Text>
                    </View>
                    {meals.map((meal, idx) => (
                      <View key={idx} style={styles.plannedMeal}>
                        <Text style={styles.plannedMealName}>{meal.name}</Text>
                        {meal.description && (
                          <Text style={styles.plannedMealDesc}>{meal.description}</Text>
                        )}
                        <View style={styles.foodsList}>
                          {meal.foods.map((food, foodIdx) => (
                            <View key={foodIdx} style={styles.foodRow}>
                              <View style={styles.foodInfo}>
                                <Text style={styles.foodName}>{food.name}</Text>
                                {food.servingSize && (
                                  <Text style={styles.foodServing}>{food.servingSize}</Text>
                                )}
                              </View>
                              <Text style={styles.foodCals}>{food.calories} cal</Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.mealTotals}>
                          {meal.totalCalories} cal • {meal.totalProtein}g P •{' '}
                          {meal.totalCarbs}g C • {meal.totalFat}g F
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}

              {/* Log Day Button */}
              <TouchableOpacity
                style={[styles.logDayButton, isLogging && { opacity: 0.5 }]}
                onPress={() => handleLogDay(selectedPlan, selectedDay.dayNumber)}
                disabled={isLogging}
              >
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.logDayButtonText}>
                  {isLogging ? 'Logging...' : 'Log This Day to Diary'}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
}

// Plan Card Component
function PlanCard({
  plan,
  isActive,
  onPress,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  plan: MealPlan;
  isActive: boolean;
  onPress: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.planCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.planCardHeader}>
        <View style={styles.planCardLeft}>
          <View style={[styles.planIcon, isActive && styles.planIconActive]}>
            <MaterialCommunityIcons
              name="calendar-month"
              size={24}
              color={isActive ? '#fff' : COLORS.primary}
            />
          </View>
          <View style={styles.planCardInfo}>
            <Text style={styles.planCardName} numberOfLines={1}>
              {plan.name}
            </Text>
            <Text style={styles.planCardMeta}>
              {plan.days.length} days • {plan.calorieTarget} cal/day
            </Text>
          </View>
        </View>
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
      </View>

      {plan.description && (
        <Text style={styles.planCardDesc} numberOfLines={2}>
          {plan.description}
        </Text>
      )}

      <View style={styles.planCardActions}>
        {isActive ? (
          <TouchableOpacity style={styles.actionButton} onPress={onDeactivate}>
            <MaterialCommunityIcons name="pause" size={18} color={COLORS.textSecondary} />
            <Text style={styles.actionButtonText}>Deactivate</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionButton} onPress={onActivate}>
            <MaterialCommunityIcons name="play" size={18} color={COLORS.success} />
            <Text style={[styles.actionButtonText, { color: COLORS.success }]}>
              Activate
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <MaterialCommunityIcons name="delete-outline" size={18} color={COLORS.error} />
          <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// Day Card Component
function DayCard({
  day,
  onPress,
  onLog,
  isLogging,
}: {
  day: MealPlanDay;
  onPress: () => void;
  onLog: () => void;
  isLogging: boolean;
}) {
  return (
    <TouchableOpacity style={styles.dayCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.dayCardLeft}>
        <View style={styles.dayNumber}>
          <Text style={styles.dayNumberText}>{day.dayNumber}</Text>
        </View>
        <View style={styles.dayCardInfo}>
          <Text style={styles.dayCardName}>
            {day.dayName || `Day ${day.dayNumber}`}
          </Text>
          <Text style={styles.dayCardMeta}>
            {day.totalCalories} cal • {day.totalProtein}g P
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.logButton}
        onPress={onLog}
        disabled={isLogging}
      >
        {isLogging ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <MaterialCommunityIcons
            name="calendar-plus"
            size={22}
            color={COLORS.primary}
          />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a2020',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  createPlanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Plan Card
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIconActive: {
    backgroundColor: COLORS.primary,
  },
  planCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  planCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  planCardMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  planCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 12,
    lineHeight: 18,
  },
  planCardActions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalContent: {
    flex: 1,
  },
  // Plan Summary
  planSummary: {
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  targetItem: {
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  targetLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  planDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Days
  daysTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dayCardInfo: {
    marginLeft: 12,
  },
  dayCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  dayCardMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Day Detail
  daySummary: {
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  daySummaryText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  mealSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  mealIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  plannedMeal: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plannedMealName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  plannedMealDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  foodsList: {
    gap: 6,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    color: COLORS.text,
  },
  foodServing: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  foodCals: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  mealTotals: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  logDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logDayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
