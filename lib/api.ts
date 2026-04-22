import { auth } from './firebase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    return await user.getIdToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new ApiError(401, 'User not authenticated');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    };

    console.log(`API Request: ${config.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('Request body:', options.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch {
        errorMessage = errorText || 'An error occurred';
      }
      throw new ApiError(response.status, errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // User endpoints
  async createUser(userData: any) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMyUser() {
    return this.request('/api/users/me');
  }

  async updateMyUser(userData: any) {
    return this.request('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async deleteMyUser() {
    return this.request('/api/users/me', {
      method: 'DELETE',
    });
  }

  // Diary endpoints
  async createDiary(diaryData: any) {
    return this.request('/api/diaries', {
      method: 'POST',
      body: JSON.stringify(diaryData),
    });
  }

  async getDiary(id: string) {
    return this.request(`/api/diaries/${id}`);
  }

  async getDiaryByDate(date: string) {
    return this.request(`/api/users/me/diaries/date/${date}`);
  }

  async updateDiary(id: string, diaryData: any) {
    return this.request(`/api/diaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(diaryData),
    });
  }

  async deleteDiary(id: string) {
    return this.request(`/api/diaries/${id}`, {
      method: 'DELETE',
    });
  }

  async addFoodToDiary(diaryId: string, mealType: string, food: any) {
    return this.request(`/api/diaries/${diaryId}/meals/${mealType}`, {
      method: 'POST',
      body: JSON.stringify(food),
    });
  }

  async addExerciseToDiary(diaryId: string, exercise: { name: string; calories: number; durationMin: number }) {
    return this.request(`/api/diaries/${diaryId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(exercise),
    });
  }

  async removeExerciseFromDiary(diaryId: string, exerciseId: string) {
    return this.request(`/api/diaries/${diaryId}/exercises/${exerciseId}`, {
      method: 'DELETE',
    });
  }

  // Food endpoints
  async searchFoodByBarcode(barcode: string) {
    return this.request(`/api/food/search/barcode/${barcode}`);
  }

  async searchFoods(query: string) {
    return this.request(`/api/food/search?q=${encodeURIComponent(query)}`);
  }

  // Weight tracking endpoints
  async getWeightHistory(limit: number = 20, offset: number = 0) {
    return this.request<{ entries: any[]; hasMore: boolean }>(
      `/api/users/me/weights?limit=${limit}&offset=${offset}`
    );
  }

  async addWeightEntry(weight: number, unit: 'kg' | 'lb' = 'lb', date?: string) {
    return this.request('/api/users/me/weights', {
      method: 'POST',
      body: JSON.stringify({ weight, unit, date }),
    });
  }

  async updateWeightEntry(entryId: string, weight: number, unit: 'kg' | 'lb') {
    return this.request(`/api/users/me/weights/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify({ weight, unit }),
    });
  }

  async deleteWeightEntry(entryId: string) {
    return this.request(`/api/users/me/weights/${entryId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();