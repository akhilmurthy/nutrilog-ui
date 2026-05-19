import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { Recipe, CreateRecipeInput, UpdateRecipeInput } from '../types/recipe';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getRecipes();
      setRecipes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipe = useCallback(async (id: string): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getRecipe(id);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipe');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecipe = useCallback(async (input: CreateRecipeInput): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.createRecipe(input);
      setRecipes((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to create recipe');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRecipe = useCallback(async (id: string, input: UpdateRecipeInput): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.updateRecipe(id, input);
      setRecipes((prev) => prev.map((r) => (r.id === id ? data : r)));
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to update recipe');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecipe = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete recipe');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    fetchRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  };
}
