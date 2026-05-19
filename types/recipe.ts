export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeStep {
  id: string;
  order: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  yields?: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecipeInput {
  name: string;
  description?: string;
  imageUrl?: string;
  yields?: string;
  ingredients: Omit<Ingredient, 'id'>[];
  steps: Omit<RecipeStep, 'id'>[];
}

export interface UpdateRecipeInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  yields?: string;
  ingredients?: Omit<Ingredient, 'id'>[];
  steps?: Omit<RecipeStep, 'id'>[];
}
