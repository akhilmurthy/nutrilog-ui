import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  protein: '#FF6B6B',
  carbs: '#4ECDC4',
  fat: '#FFE66D',
};

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  result?: any;
}

interface ToolResultCardProps {
  toolCalls: ToolCall[];
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
    default:
      return COLORS.textSecondary;
  }
}

function formatToolResult(toolCall: ToolCall): string {
  const { name, result } = toolCall;

  if (!result) return 'Processing...';

  if (result.success === false) {
    return result.message || 'Failed';
  }

  switch (name) {
    case 'log_food':
      return `${result.food?.name || 'Food'} (${result.food?.calories || 0} cal) → ${result.mealType}`;
    case 'log_exercise':
      return `${result.exercise?.name || 'Exercise'} - ${result.exercise?.durationMin || 0} min`;
    case 'save_memory':
      return result.message || 'Memory saved';
    case 'create_meal_plan':
      return result.message || `Created meal plan "${result.mealPlan?.name || 'Meal Plan'}"`;
    default:
      return result.message || 'Done';
  }
}

export default function ToolResultCard({ toolCalls }: ToolResultCardProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <View style={styles.container}>
      {toolCalls.map((toolCall) => {
        const icon = getToolIcon(toolCall.name);
        const color = getToolColor(toolCall.name);
        const isSuccess = toolCall.result?.success !== false;

        return (
          <View key={toolCall.id} style={styles.toolCard}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <MaterialCommunityIcons name={icon as any} size={16} color={color} />
            </View>
            <View style={styles.content}>
              <Text style={styles.toolName}>
                {toolCall.name.replace(/_/g, ' ')}
              </Text>
              <Text style={[styles.result, !isSuccess && styles.errorResult]}>
                {formatToolResult(toolCall)}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={isSuccess ? 'check-circle' : 'alert-circle'}
              size={16}
              color={isSuccess ? COLORS.success : COLORS.protein}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 6,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  toolName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  result: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 2,
  },
  errorResult: {
    color: COLORS.protein,
  },
});
