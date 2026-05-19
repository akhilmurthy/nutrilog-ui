import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Platform } from 'react-native';

// Use environment variable for production, localhost for dev
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  || (Platform.OS === 'web' ? 'http://localhost:8000' : 'http://localhost:8000');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Streaming event types
export type StreamEvent =
  | { type: 'message_start'; conversationId: string }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_start'; id: string; name: string; input: Record<string, any> }
  | { type: 'tool_result'; id: string; name: string; success: boolean; result: any }
  | { type: 'message_complete'; message: any; toolsUsed: string[] }
  | { type: 'error'; message: string };

// Wait for auth to be ready (needed for web where session is restored async)
const waitForAuth = (): Promise<void> => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve();
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve();
    });
  });
};

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    await waitForAuth();
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

  async removeFoodFromDiary(diaryId: string, mealType: string, foodId: string) {
    return this.request(`/api/diaries/${diaryId}/meals/${mealType}/foods/${foodId}`, {
      method: 'DELETE',
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

  // Agent endpoints
  async sendChatMessage(message: string, conversationId?: string) {
    return this.request<{
      conversationId: string;
      message: {
        id: string;
        role: 'assistant';
        content: string;
        timestamp: string;
        toolCalls?: {
          id: string;
          name: string;
          input: Record<string, any>;
          result?: any;
        }[];
      };
      toolsUsed?: string[];
    }>('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });
  }

  async sendChatMessageStream(
    message: string,
    conversationId: string | undefined,
    onEvent: (event: StreamEvent) => void
  ): Promise<void> {
    const token = await this.getAuthToken();

    if (!token) {
      throw new ApiError(401, 'User not authenticated');
    }

    const url = `${API_BASE_URL}/api/agent/chat/stream`;

    // React Native doesn't support ReadableStream, so we use XMLHttpRequest
    // to handle streaming responses
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      let buffer = '';
      let lastProcessedIndex = 0;

      xhr.onprogress = () => {
        // Get only the new data since last progress event
        const newData = xhr.responseText.substring(lastProcessedIndex);
        lastProcessedIndex = xhr.responseText.length;
        buffer += newData;

        // Process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              onEvent(event);
            } catch (e) {
              console.error('Failed to parse SSE event:', line);
            }
          }
        }
      };

      xhr.onload = () => {
        // Process any remaining data in buffer
        if (buffer.startsWith('data: ')) {
          try {
            const event = JSON.parse(buffer.slice(6));
            onEvent(event);
          } catch (e) {
            console.error('Failed to parse final SSE event:', buffer);
          }
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new ApiError(xhr.status, xhr.responseText || 'Stream request failed'));
        }
      };

      xhr.onerror = () => {
        reject(new ApiError(0, 'Network error'));
      };

      xhr.send(JSON.stringify({ message, conversationId }));
    });
  }

  async listConversations(limit: number = 20) {
    return this.request<any[]>(`/api/agent/conversations?limit=${limit}`);
  }

  async getConversation(id: string) {
    return this.request<any>(`/api/agent/conversations/${id}`);
  }

  async deleteConversation(id: string) {
    return this.request(`/api/agent/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  // Meal plan endpoints
  async getMealPlans() {
    return this.request<any[]>('/api/agent/meal-plans');
  }

  async getMealPlan(id: string) {
    return this.request<any>(`/api/agent/meal-plans/${id}`);
  }

  async getActiveMealPlan() {
    return this.request<any>('/api/agent/meal-plans/active');
  }

  async updateMealPlan(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    return this.request(`/api/agent/meal-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMealPlan(id: string) {
    return this.request(`/api/agent/meal-plans/${id}`, {
      method: 'DELETE',
    });
  }

  async activateMealPlan(id: string) {
    return this.request(`/api/agent/meal-plans/${id}/activate`, {
      method: 'POST',
    });
  }

  async logMealPlanDay(id: string, dayNumber: number, date?: string) {
    return this.request<{ success: boolean; diaryId: string; itemsLogged: number }>(
      `/api/agent/meal-plans/${id}/log/${dayNumber}`,
      {
        method: 'POST',
        body: JSON.stringify({ date }),
      }
    );
  }

  // Recipe endpoints
  async getRecipes() {
    return this.request<any[]>('/api/recipes');
  }

  async getRecipe(id: string) {
    return this.request<any>(`/api/recipes/${id}`);
  }

  async createRecipe(data: any) {
    return this.request('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecipe(id: string, data: any) {
    return this.request(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecipe(id: string) {
    return this.request(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();