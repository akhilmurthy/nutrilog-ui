import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
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
};

interface MealPlan {
  id: string;
  name: string;
  description?: string;
  days: any[];
  calorieTarget: number;
  isActive: boolean;
  generatedBy: 'ai' | 'manual';
  createdAt: string;
}

export default function MealPlansScreen() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMealPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const plans = await apiClient.getMealPlans();
      setMealPlans(plans);
    } catch (err: any) {
      setError(err.message || 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMealPlans();
    }, [])
  );

  const handleDelete = (plan: MealPlan) => {
    Alert.alert(
      'Delete Meal Plan',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteMealPlan(plan.id);
              setMealPlans((prev) => prev.filter((p) => p.id !== plan.id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete meal plan');
            }
          },
        },
      ]
    );
  };

  const handleActivate = async (plan: MealPlan) => {
    try {
      await apiClient.activateMealPlan(plan.id);
      setMealPlans((prev) =>
        prev.map((p) => ({
          ...p,
          isActive: p.id === plan.id,
        }))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to activate meal plan');
    }
  };

  const renderMealPlan = ({ item }: { item: MealPlan }) => (
    <TouchableOpacity
      style={[styles.planCard, item.isActive && styles.activePlanCard]}
      onPress={() => router.push(`/agent/meal-plans/${item.id}`)}
    >
      <View style={styles.planHeader}>
        <View style={styles.planTitleRow}>
          <MaterialCommunityIcons
            name={item.generatedBy === 'ai' ? 'robot-outline' : 'pencil-outline'}
            size={20}
            color={item.isActive ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={styles.planName}>{item.name}</Text>
        </View>
        {item.isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
      </View>

      {item.description && (
        <Text style={styles.planDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.planStats}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="calendar" size={16} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{item.days.length} days</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="fire" size={16} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{item.calorieTarget} cal/day</Text>
        </View>
      </View>

      <View style={styles.planActions}>
        {!item.isActive && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleActivate(item)}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.success} />
            <Text style={[styles.actionText, { color: COLORS.success }]}>Activate</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
        >
          <MaterialCommunityIcons name="delete-outline" size={18} color="#ff6b6b" />
          <Text style={[styles.actionText, { color: '#ff6b6b' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="calendar-blank-outline"
        size={64}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyTitle}>No Meal Plans</Text>
      <Text style={styles.emptySubtitle}>
        Ask the Coach to create a personalized meal plan for you!
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/(tabs)/chat')}
      >
        <MaterialCommunityIcons name="robot-happy-outline" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Go to Coach</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Plans</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMealPlans}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mealPlans}
          renderItem={renderMealPlan}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
  },
  placeholder: {
    width: 32,
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
  list: {
    padding: 16,
    flexGrow: 1,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activePlanCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
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
  planDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  planStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
