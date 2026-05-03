import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
  success: '#34C759',
  error: '#FF3B30',
  protein: '#FF6B6B',
  carbs: '#4ECDC4',
  fat: '#FFE66D',
};

export interface ToolStatus {
  id: string;
  name: string;
  input: Record<string, any>;
  status: 'running' | 'success' | 'error';
  result?: any;
}

interface ToolStatusCardProps {
  tools: ToolStatus[];
}

function getToolIcon(toolName: string): string {
  switch (toolName) {
    case 'log_food':
      return 'food-apple';
    case 'log_exercise':
      return 'run';
    case 'save_memory':
      return 'brain';
    case 'create_meal_plan':
      return 'calendar-check';
    case 'get_diary':
      return 'book-open-variant';
    case 'remove_food':
      return 'food-off';
    case 'remove_exercise':
      return 'run-fast';
    case 'log_weight':
      return 'scale-bathroom';
    case 'edit_food':
      return 'pencil';
    default:
      return 'cog';
  }
}

function getToolColor(toolName: string): string {
  switch (toolName) {
    case 'log_food':
      return COLORS.success;
    case 'log_exercise':
      return COLORS.primary;
    case 'save_memory':
      return COLORS.carbs;
    case 'create_meal_plan':
      return COLORS.protein;
    case 'get_diary':
      return COLORS.fat;
    case 'remove_food':
    case 'remove_exercise':
      return COLORS.error;
    case 'log_weight':
      return COLORS.carbs;
    case 'edit_food':
      return COLORS.primary;
    default:
      return COLORS.textSecondary;
  }
}

function getToolLabel(toolName: string): string {
  switch (toolName) {
    case 'log_food':
      return 'Logging food';
    case 'log_exercise':
      return 'Logging exercise';
    case 'save_memory':
      return 'Saving memory';
    case 'create_meal_plan':
      return 'Creating meal plan';
    case 'get_diary':
      return 'Reading diary';
    case 'remove_food':
      return 'Removing food';
    case 'remove_exercise':
      return 'Removing exercise';
    case 'log_weight':
      return 'Logging weight';
    case 'edit_food':
      return 'Editing food';
    default:
      return toolName.replace(/_/g, ' ');
  }
}

function getToolDescription(tool: ToolStatus): string {
  const { name, input, status, result } = tool;

  if (status === 'running') {
    switch (name) {
      case 'log_food':
        return input.name || 'food item';
      case 'log_exercise':
        return input.name || 'exercise';
      case 'save_memory':
        return input.category || 'preference';
      case 'create_meal_plan':
        return input.name || 'meal plan';
      case 'get_diary':
        return input.date || 'today';
      case 'remove_food':
        return 'food item';
      case 'remove_exercise':
        return 'exercise';
      case 'log_weight':
        return `${input.weight} ${input.unit || 'lb'}`;
      case 'edit_food':
        return input.name || 'food item';
      default:
        return '';
    }
  }

  // Completed states
  if (status === 'error') {
    return result?.message || 'Failed';
  }

  switch (name) {
    case 'log_food':
      return `${result?.food?.name || input.name || 'Food'} (${result?.food?.calories || input.calories || 0} cal)`;
    case 'log_exercise':
      return `${result?.exercise?.name || input.name || 'Exercise'} - ${result?.exercise?.durationMin || input.durationMin || 0} min`;
    case 'save_memory':
      return result?.message || 'Memory saved';
    case 'create_meal_plan':
      return result?.mealPlan?.name || input.name || 'Meal plan created';
    case 'get_diary':
      return 'Diary loaded';
    case 'remove_food':
    case 'remove_exercise':
      return result?.message || 'Removed';
    case 'log_weight':
      return result?.message || `${input.weight} ${input.unit || 'lb'}`;
    case 'edit_food':
      return result?.message || 'Food updated';
    default:
      return result?.message || 'Done';
  }
}

export default function ToolStatusCard({ tools }: ToolStatusCardProps) {
  if (!tools || tools.length === 0) return null;

  return (
    <View style={styles.container}>
      {tools.map((tool) => {
        const icon = getToolIcon(tool.name);
        const color = getToolColor(tool.name);
        const label = getToolLabel(tool.name);
        const description = getToolDescription(tool);

        return (
          <View key={tool.id} style={styles.toolCard}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <MaterialCommunityIcons name={icon as any} size={16} color={color} />
            </View>
            <View style={styles.content}>
              <Text style={styles.toolLabel}>{label}</Text>
              <Text
                style={[
                  styles.description,
                  tool.status === 'error' && styles.errorDescription,
                ]}
                numberOfLines={1}
              >
                {description}
              </Text>
            </View>
            {tool.status === 'running' ? (
              <ActivityIndicator size="small" color={color} />
            ) : (
              <MaterialCommunityIcons
                name={tool.status === 'success' ? 'check-circle' : 'alert-circle'}
                size={18}
                color={tool.status === 'success' ? COLORS.success : COLORS.error}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginVertical: 8,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  description: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  errorDescription: {
    color: COLORS.error,
  },
});
