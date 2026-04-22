export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Food {
  id?: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugars?: number;
  saturatedFat?: number;
  sodium?: number;
  salt?: number;
  brand?: string;
  barcode?: string;
  servingSize?: string;
  category?: string;
  imageUrl?: string;
  nutriScore?: string;
  novaGroup?: number;
  isVegan?: boolean;
  isVegetarian?: boolean;
  containsPalmOil?: boolean;
  ingredientsText?: string;
  allergens?: string[];
}

export interface SearchResult extends Food {
  source: 'history' | 'database';
}

export interface Exercise {
  id?: string;
  name: string;
  calories: number;
  durationMin: number;
}

export interface DiaryEntry {
  id?: string;
  userId: string;
  date: string;
  meals: {
    breakfast: Food[];
    lunch: Food[];
    dinner: Food[];
    snacks: Food[];
  };
  exercises: Exercise[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WeightEntry {
  id: string;
  userId: string;
  weight: number;
  unit: 'kg' | 'lb';
  date: string;
  createdAt: string;
}
