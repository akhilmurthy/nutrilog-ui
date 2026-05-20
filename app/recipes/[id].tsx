import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useRecipes } from '../../hooks/useRecipes';
import { Recipe } from '../../types/recipe';

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
  error: '#FF6B6B',
};

export default function RecipeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchRecipe, deleteRecipe, loading } = useRecipes();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadRecipe();
      }
    }, [id])
  );

  const loadRecipe = async () => {
    if (!id) return;
    const data = await fetchRecipe(id);
    setRecipe(data);
  };

  const handleDelete = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this recipe? This cannot be undone.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Delete Recipe',
            'Are you sure you want to delete this recipe? This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed || !id) return;

    setIsDeleting(true);
    const success = await deleteRecipe(id);
    if (success) {
      router.replace('/(tabs)/recipes');
    } else {
      setIsDeleting(false);
    }
  };

  if (loading && !recipe) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Recipe not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/recipes')} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push(`/recipes/new?editId=${id}`)}
            style={styles.headerButton}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerButton}
            disabled={isDeleting}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={22}
              color={isDeleting ? COLORS.textSecondary : COLORS.error}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Header Card */}
        <View style={styles.card}>
          <Text style={styles.recipeName}>{recipe.name}</Text>

          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          {recipe.yields && (
            <View style={styles.yieldsContainer}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.yieldsText}>{recipe.yields}</Text>
            </View>
          )}
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
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {recipe.ingredients?.length || 0}
              </Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            {recipe.ingredients?.map((ingredient, index) => (
              <View key={ingredient.id || index} style={styles.ingredientRow}>
                <MaterialCommunityIcons
                  name="circle-small"
                  size={24}
                  color={COLORS.primary}
                />
                <Text style={styles.ingredientText}>
                  <Text style={styles.ingredientQty}>
                    {ingredient.quantity} {ingredient.unit}
                  </Text>
                  {'  '}
                  {ingredient.name}
                </Text>
              </View>
            ))}
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
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{recipe.steps?.length || 0}</Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            {recipe.steps
              ?.sort((a, b) => a.order - b.order)
              .map((step, index) => (
                <View key={step.id || index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                </View>
              ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  yieldsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  yieldsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
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
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sectionContent: {
    padding: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  ingredientQty: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stepInstruction: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  backLink: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backLinkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
