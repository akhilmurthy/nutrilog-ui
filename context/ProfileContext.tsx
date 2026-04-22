import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {apiClient} from '../lib/api';
import {useAuth} from './AuthContext';

export interface UserSettings {
  displayName?: string;
  weightUnit?: 'kg' | 'lb';
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  avatarUrl?: string;
  goalWeight?: number;
  // Body metrics for calorie calculation
  currentWeight?: number;
  height?: number;
  heightUnit?: 'in' | 'cm';
  dob?: string; // ISO date (yyyy-mm-dd); age is derived from this
  sex?: 'male' | 'female';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  weeklyWeightLossGoal?: number;
  // AI Coach settings
  aiCoachEnabled?: boolean;
  aiInsightsFrequency?: 'daily' | 'weekly' | 'off';
  aiMealSuggestions?: boolean;
  aiCoachingStyle?: 'encouraging' | 'data-driven' | 'balanced';
  // Notification settings
  mealReminders?: boolean;
  weeklyReportEnabled?: boolean;
  // Privacy settings
  profileVisibility?: 'private' | 'friends' | 'public';
  shareProgress?: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  weightUnit: 'lb',
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
  heightUnit: 'in',
  activityLevel: 'moderate',
  weeklyWeightLossGoal: 1,
  aiCoachEnabled: true,
  aiInsightsFrequency: 'daily',
  aiMealSuggestions: true,
  aiCoachingStyle: 'balanced',
  mealReminders: true,
  weeklyReportEnabled: true,
  profileVisibility: 'private',
  shareProgress: false,
};

type ProfileContextType = {
  settings: UserSettings;
  loaded: boolean;
  refresh: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType>({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  refresh: async () => {},
  updateSettings: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({children}: {children: React.ReactNode}) {
  const {token} = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const userData = (await apiClient.getMyUser()) as
        | {settings?: UserSettings}
        | null;
      setSettings({...DEFAULT_SETTINGS, ...(userData?.settings || {})});
      setLoaded(true);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setLoaded(true);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      const prev = settings;
      setSettings(current => ({...current, ...updates}));
      try {
        await apiClient.updateMyUser(updates);
      } catch (err) {
        setSettings(prev);
        throw err;
      }
    },
    [settings],
  );

  useEffect(() => {
    if (!token) {
      setSettings(DEFAULT_SETTINGS);
      setLoaded(false);
      return;
    }
    refresh();
  }, [token, refresh]);

  return (
    <ProfileContext.Provider value={{settings, loaded, refresh, updateSettings}}>
      {children}
    </ProfileContext.Provider>
  );
}
