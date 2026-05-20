import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    showAlert(title, message);
  }
};
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import IngredientRow from '../../components/recipe/IngredientRow';
import StepRow from '../../components/recipe/StepRow';
import AddButton from '../../components/recipe/AddButton';
import { useRecipes } from '../../hooks/useRecipes';

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
};

interface IngredientInput {
  key: string;
  name: string;
  quantity: string;
  unit: string;
}

interface StepInput {
  key: string;
  instruction: string;
}

export default function NewRecipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { createRecipe, updateRecipe, fetchRecipe, loading } = useRecipes();

  const isEditing = !!editId;
  const [isLoading, setIsLoading] = useState(isEditing);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [yields, setYields] = useState('');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { key: '1', name: '', quantity: '', unit: '' },
  ]);
  const [steps, setSteps] = useState<StepInput[]>([
    { key: '1', instruction: '' },
  ]);

  useEffect(() => {
    if (editId) {
      loadRecipe();
    }
  }, [editId]);

  const loadRecipe = async () => {
    if (!editId) return;
    const recipe = await fetchRecipe(editId);
    if (recipe) {
      setName(recipe.name);
      setDescription(recipe.description || '');
      setYields(recipe.yields || '');
      setIngredients(
        recipe.ingredients?.map((ing) => ({
          key: ing.id || Date.now().toString() + Math.random(),
          name: ing.name,
          quantity: ing.quantity.toString(),
          unit: ing.unit,
        })) || [{ key: '1', name: '', quantity: '', unit: '' }]
      );
      setSteps(
        recipe.steps?.map((step) => ({
          key: step.id || Date.now().toString() + Math.random(),
          instruction: step.instruction,
        })) || [{ key: '1', instruction: '' }]
      );
    }
    setIsLoading(false);
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { key: Date.now().toString(), name: '', quantity: '', unit: '' },
    ]);
  };

  const handleUpdateIngredient = (
    index: number,
    field: 'name' | 'quantity' | 'unit',
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleDeleteIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleAddStep = () => {
    setSteps([
      ...steps,
      { key: Date.now().toString(), instruction: '' },
    ]);
  };

  const handleUpdateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index].instruction = value;
    setSteps(updated);
  };

  const handleDeleteStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Missing Name', 'Please enter a recipe name.');
      return;
    }

    const validIngredients = ingredients.filter(
      (ing) => ing.name.trim() && ing.quantity.trim()
    );

    const validSteps = steps.filter((step) => step.instruction.trim());

    if (validIngredients.length === 0) {
      showAlert('Missing Ingredients', 'Please add at least one ingredient.');
      return;
    }

    if (validSteps.length === 0) {
      showAlert('Missing Steps', 'Please add at least one step.');
      return;
    }

    const recipeData = {
      name: name.trim(),
      description: description.trim() || undefined,
      yields: yields.trim() || undefined,
      ingredients: validIngredients.map((ing) => ({
        name: ing.name.trim(),
        quantity: parseFloat(ing.quantity) || 0,
        unit: ing.unit.trim(),
      })),
      steps: validSteps.map((step, index) => ({
        instruction: step.instruction.trim(),
        order: index + 1,
      })),
    };

    const recipe = isEditing
      ? await updateRecipe(editId!, recipeData)
      : await createRecipe(recipeData);

    if (recipe) {
      router.replace(isEditing ? `/recipes/${editId}` : '/(tabs)/recipes');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace(isEditing ? `/recipes/${editId}` : '/(tabs)/recipes')} style={styles.backButton}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Recipe' : 'New Recipe'}</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Recipe Info Card */}
          <View style={styles.card}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Recipe Name"
              placeholderTextColor={COLORS.textSecondary}
            />

            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a short description..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={2}
            />

            <View style={styles.yieldsContainer}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={18}
                color={COLORS.textSecondary}
              />
              <TextInput
                style={styles.yieldsInput}
                value={yields}
                onChangeText={setYields}
                placeholder="e.g., 4 servings, 12 cookies"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={20}
                color={COLORS.text}
              />
              <Text style={styles.sectionTitle}>Ingredients</Text>
            </View>
            <View style={styles.sectionContent}>
              {ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={ingredient.key}
                  index={index}
                  name={ingredient.name}
                  quantity={ingredient.quantity}
                  unit={ingredient.unit}
                  onChangeName={(value) => handleUpdateIngredient(index, 'name', value)}
                  onChangeQuantity={(value) => handleUpdateIngredient(index, 'quantity', value)}
                  onChangeUnit={(value) => handleUpdateIngredient(index, 'unit', value)}
                  onDelete={() => handleDeleteIngredient(index)}
                />
              ))}
              <AddButton onPress={handleAddIngredient} label="Add ingredient" />
            </View>
          </View>

          {/* Steps Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="format-list-numbered"
                size={20}
                color={COLORS.text}
              />
              <Text style={styles.sectionTitle}>Instructions</Text>
            </View>
            <View style={styles.sectionContent}>
              {steps.map((step, index) => (
                <StepRow
                  key={step.key}
                  stepNumber={index + 1}
                  instruction={step.instruction}
                  onChange={(value) => handleUpdateStep(index, value)}
                  onDelete={() => handleDeleteStep(index)}
                />
              ))}
              <AddButton onPress={handleAddStep} label="Add step" />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: 32,
    textAlignVertical: 'center',
  },
  descriptionInput: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
    lineHeight: 20,
    padding: 0,
  },
  yieldsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  yieldsInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  sectionContent: {
    padding: 12,
  },
});
