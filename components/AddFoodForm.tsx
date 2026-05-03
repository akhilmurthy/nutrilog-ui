import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Food, MealType } from '../types/food';
import BarcodeScanner from './BarcodeScanner';

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
  success: '#34C759',
};

interface AddFoodFormProps {
  onAddFood: (food: Food, mealType: MealType) => Promise<void>;
  loading?: boolean;
  initialMealType?: MealType;
}

const MEAL_OPTIONS = [
  { key: 'breakfast' as MealType, label: 'Breakfast', icon: 'weather-sunset-up', color: '#FF9500' },
  { key: 'lunch' as MealType, label: 'Lunch', icon: 'weather-sunny', color: '#34C759' },
  { key: 'dinner' as MealType, label: 'Dinner', icon: 'weather-night', color: '#5856D6' },
  { key: 'snacks' as MealType, label: 'Snacks', icon: 'food-apple', color: '#FF2D55' },
];

export default function AddFoodForm({ onAddFood, loading, initialMealType = 'breakfast' }: AddFoodFormProps) {
  const [foodData, setFoodData] = useState<Food>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType);
  const [showScanner, setShowScanner] = useState(false);

  const resetForm = () => {
    setFoodData({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  };

  const handleSubmit = async () => {
    if (!foodData.name.trim()) {
      Alert.alert('Missing Information', 'Please enter a food name');
      return;
    }
    if (foodData.calories <= 0) {
      Alert.alert('Missing Information', 'Please enter calories greater than 0');
      return;
    }

    try {
      await onAddFood(foodData, selectedMeal);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to add food');
    }
  };

  const handleBarcodeScanned = (scannedFood: Food) => {
    setFoodData(scannedFood);
    setShowScanner(false);
    Alert.alert('Food Found', `${scannedFood.name} has been added to the form`);
  };

  const updateNumericField = (field: keyof Food, value: string) => {
    const numValue = parseInt(value) || 0;
    setFoodData({ ...foodData, [field]: numValue });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Meal Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Meal</Text>
        <View style={styles.mealButtons}>
          {MEAL_OPTIONS.map((meal) => {
            const isSelected = selectedMeal === meal.key;
            return (
              <TouchableOpacity
                key={meal.key}
                style={[
                  styles.mealButton,
                  isSelected && { backgroundColor: meal.color + '20', borderColor: meal.color },
                ]}
                onPress={() => setSelectedMeal(meal.key)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={meal.icon as any}
                  size={22}
                  color={isSelected ? meal.color : COLORS.textSecondary}
                />
                <Text style={[
                  styles.mealButtonText,
                  isSelected && { color: meal.color },
                ]}>
                  {meal.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Quick Add Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
          disabled={loading}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="barcode-scan" size={24} color="#fff" />
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or enter manually</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Manual Entry */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Food Details</Text>

        {/* Food Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Food Name</Text>
          <TextInput
            style={styles.input}
            value={foodData.name}
            onChangeText={(text) => setFoodData({ ...foodData, name: text })}
            placeholder="e.g. Grilled Chicken Breast"
            placeholderTextColor={COLORS.textSecondary}
            returnKeyType="next"
          />
        </View>

        {/* Calories */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Calories</Text>
          <View style={styles.calorieInputContainer}>
            <TextInput
              style={[styles.input, styles.calorieInput]}
              value={foodData.calories === 0 ? '' : foodData.calories.toString()}
              onChangeText={(text) => updateNumericField('calories', text)}
              placeholder="0"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              returnKeyType="next"
            />
            <Text style={styles.unitLabel}>kcal</Text>
          </View>
        </View>
      </View>

      {/* Macros */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Macronutrients</Text>
        <View style={styles.macroRow}>
          <View style={styles.macroInput}>
            <View style={[styles.macroIndicator, { backgroundColor: COLORS.protein }]} />
            <View style={styles.macroInputContent}>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroTextInput}
                  value={foodData.protein === 0 ? '' : foodData.protein?.toString()}
                  onChangeText={(text) => updateNumericField('protein', text)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>
          </View>

          <View style={styles.macroInput}>
            <View style={[styles.macroIndicator, { backgroundColor: COLORS.carbs }]} />
            <View style={styles.macroInputContent}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroTextInput}
                  value={foodData.carbs === 0 ? '' : foodData.carbs?.toString()}
                  onChangeText={(text) => updateNumericField('carbs', text)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>
          </View>

          <View style={styles.macroInput}>
            <View style={[styles.macroIndicator, { backgroundColor: COLORS.fat }]} />
            <View style={styles.macroInputContent}>
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroTextInput}
                  value={foodData.fat === 0 ? '' : foodData.fat?.toString()}
                  onChangeText={(text) => updateNumericField('fat', text)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <Text style={styles.submitButtonText}>Adding...</Text>
        ) : (
          <>
            <MaterialCommunityIcons name="plus-circle" size={22} color="#fff" />
            <Text style={styles.submitButtonText}>
              Add to {MEAL_OPTIONS.find(m => m.key === selectedMeal)?.label}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={showScanner}
        onFoodScanned={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // Meal Selection
  mealButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  mealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  // Scan Button
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginHorizontal: 16,
  },
  // Input Groups
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calorieInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieInput: {
    flex: 1,
  },
  unitLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 12,
    fontWeight: '500',
  },
  // Macro Inputs
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  macroIndicator: {
    width: 4,
    borderRadius: 2,
  },
  macroInputContent: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroTextInput: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    padding: 0,
  },
  macroUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Submit Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
