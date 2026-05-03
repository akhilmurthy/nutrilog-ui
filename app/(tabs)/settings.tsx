import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {getAuth} from 'firebase/auth';
import {router} from 'expo-router';
import {useAuth} from '../../context/AuthContext';
import {useProfile, UserSettings} from '../../context/ProfileContext';
import {useApi} from '../../hooks/useApi';

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  primaryLight: '#FF8F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
  success: '#4ECDC4',
  error: '#FF6B6B',
  warning: '#FFD93D',
};

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {signOut} = useAuth();
  const {loading, execute, apiClient} = useApi();
  const {settings, updateSettings} = useProfile();
  const firebaseUser = getAuth().currentUser;
  const currentWeight = settings.currentWeight ?? null;
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [editHeightFeet, setEditHeightFeet] = useState('');
  const [editHeightInches, setEditHeightInches] = useState('');
  const [editDobMonth, setEditDobMonth] = useState('');
  const [editDobDay, setEditDobDay] = useState('');
  const [editDobYear, setEditDobYear] = useState('');

  // Height conversion helpers (database stores cm)
  const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  const feetInchesToCm = (feet: number, inches: number): number => {
    const totalInches = feet * 12 + inches;
    return Math.round(totalInches * 2.54);
  };

  const formatHeightDisplay = (heightCm: number | undefined, unit: 'in' | 'cm' | undefined): string => {
    if (!heightCm) return 'Not set';
    if (unit === 'cm') return `${heightCm} cm`;
    const { feet, inches } = cmToFeetInches(heightCm);
    return `${feet}'${inches}"`;
  };

  // DOB helpers
  const computeAge = (dob: string | undefined): number | null => {
    if (!dob) return null;
    const [y, m, d] = dob.split('-').map(Number);
    if (!y || !m || !d) return null;
    const today = new Date();
    let age = today.getFullYear() - y;
    const monthDiff = today.getMonth() + 1 - m;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
    return age;
  };

  const formatDobDisplay = (dob: string | undefined): string => {
    if (!dob) return 'Not set';
    const [y, m, d] = dob.split('-').map(Number);
    if (!y || !m || !d) return 'Not set';
    const date = new Date(y, m - 1, d);
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const age = computeAge(dob);
    return age !== null ? `${formatted} (${age})` : formatted;
  };

  // Weight conversion helpers (database stores kg)
  const kgToPreferred = (kg: number): number => {
    return settings.weightUnit === 'lb' ? kg * 2.20462 : kg;
  };

  const preferredToKg = (weight: number): number => {
    return settings.weightUnit === 'lb' ? weight * 0.453592 : weight;
  };

  const saveSettings = async (updates: Partial<UserSettings>) => {
    setSaving(true);
    try {
      await updateSettings(updates);
    } catch (err) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditField = (field: string, currentValue: string | number) => {
    setEditingField(field);
    // Convert goalWeight from kg to preferred unit for editing
    if (field === 'goalWeight' && typeof currentValue === 'number') {
      setEditValue(kgToPreferred(currentValue).toFixed(1));
    } else {
      setEditValue(String(currentValue || ''));
    }
  };

  const handleEditHeight = () => {
    setEditingField('height');
    if (settings.heightUnit === 'in' && settings.height) {
      const { feet, inches } = cmToFeetInches(settings.height);
      setEditHeightFeet(String(feet));
      setEditHeightInches(String(inches));
    } else {
      setEditValue(String(settings.height || ''));
    }
  };

  const handleSaveHeight = async () => {
    let heightCm: number;

    if (settings.heightUnit === 'in') {
      const feet = parseInt(editHeightFeet) || 0;
      const inches = parseInt(editHeightInches) || 0;
      if (feet < 0 || inches < 0 || inches >= 12) {
        Alert.alert('Invalid Height', 'Please enter valid feet and inches (0-11).');
        return;
      }
      heightCm = feetInchesToCm(feet, inches);
    } else {
      heightCm = parseFloat(editValue);
      if (isNaN(heightCm) || heightCm <= 0) {
        Alert.alert('Invalid Height', 'Please enter a valid height in centimeters.');
        return;
      }
    }

    await saveSettings({ height: heightCm });
    setEditingField(null);
    setEditValue('');
    setEditHeightFeet('');
    setEditHeightInches('');
  };

  const cancelHeightEdit = () => {
    setEditingField(null);
    setEditValue('');
    setEditHeightFeet('');
    setEditHeightInches('');
  };

  const handleEditDob = () => {
    setEditingField('dob');
    if (settings.dob) {
      const [y, m, d] = settings.dob.split('-');
      setEditDobYear(y || '');
      setEditDobMonth(String(parseInt(m || '0', 10) || ''));
      setEditDobDay(String(parseInt(d || '0', 10) || ''));
    } else {
      setEditDobMonth('');
      setEditDobDay('');
      setEditDobYear('');
    }
  };

  const handleSaveDob = async () => {
    const month = parseInt(editDobMonth, 10);
    const day = parseInt(editDobDay, 10);
    const year = parseInt(editDobYear, 10);
    const thisYear = new Date().getFullYear();

    if (
      isNaN(month) || isNaN(day) || isNaN(year) ||
      month < 1 || month > 12 ||
      day < 1 || day > 31 ||
      year < 1900 || year > thisYear
    ) {
      Alert.alert('Invalid Date', 'Please enter a valid date of birth.');
      return;
    }

    const candidate = new Date(year, month - 1, day);
    if (
      candidate.getFullYear() !== year ||
      candidate.getMonth() !== month - 1 ||
      candidate.getDate() !== day ||
      candidate > new Date()
    ) {
      Alert.alert('Invalid Date', 'Please enter a valid date of birth.');
      return;
    }

    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await saveSettings({ dob: iso });
    setEditingField(null);
    setEditDobMonth('');
    setEditDobDay('');
    setEditDobYear('');
  };

  const cancelDobEdit = () => {
    setEditingField(null);
    setEditDobMonth('');
    setEditDobDay('');
    setEditDobYear('');
  };

  const handleSaveField = async (field: string) => {
    const numericFields = ['calorieGoal', 'proteinGoal', 'carbsGoal', 'fatGoal', 'goalWeight'];
    let value: string | number = editValue;

    if (numericFields.includes(field)) {
      value = parseFloat(editValue);
      if (isNaN(value) || value < 0) {
        Alert.alert('Invalid Value', 'Please enter a valid number.');
        return;
      }

      // Convert goalWeight to kg for storage
      if (field === 'goalWeight') {
        value = preferredToKg(value);
      }
    }

    await saveSettings({[field]: value});
    setEditingField(null);
    setEditValue('');
  };

  const handleSignOut = () => {
    signOut();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await execute(() => apiClient.deleteMyUser());
              signOut();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Calculate recommended daily calories using Mifflin-St Jeor equation
  const calculateRecommendedCalories = (): number | null => {
    const { height, dob, sex, activityLevel, weeklyWeightLossGoal } = settings;
    const age = computeAge(dob);

    if (!currentWeight || !height || !age || !sex || !activityLevel) {
      return null;
    }

    // currentWeight is already in kg, height is already in cm
    const weightKg = currentWeight;
    const heightCm = height;

    // Mifflin-St Jeor BMR formula
    let bmr: number;
    if (sex === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2,      // Little or no exercise
      light: 1.375,        // Light exercise 1-3 days/week
      moderate: 1.55,      // Moderate exercise 3-5 days/week
      active: 1.725,       // Hard exercise 6-7 days/week
      very_active: 1.9,    // Very hard exercise, physical job
    };

    const tdee = bmr * activityMultipliers[activityLevel];

    // Calorie deficit for weight loss (1 lb = 3500 calories)
    const weeklyDeficit = (weeklyWeightLossGoal || 0) * 3500;
    const dailyDeficit = weeklyDeficit / 7;

    const recommendedCalories = Math.round(tdee - dailyDeficit);

    // Don't go below 1200 for safety
    return Math.max(1200, recommendedCalories);
  };

  const applyCalculatedCalories = async () => {
    const calculated = calculateRecommendedCalories();
    if (calculated) {
      await saveSettings({ calorieGoal: calculated });
    }
  };

  const calculatedCalories = calculateRecommendedCalories();
  const hasAllMetrics = currentWeight && settings.height && settings.dob && settings.sex && settings.activityLevel;

  const renderSectionHeader = (title: string, icon: IconName, subtitle?: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconContainer}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const renderEditableRow = (
    label: string,
    field: string,
    value: string | number | undefined,
    suffix?: string,
    keyboardType: 'default' | 'decimal-pad' = 'default'
  ) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {editingField === field ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editValue}
            onChangeText={setEditValue}
            keyboardType={keyboardType}
            autoFocus
            selectTextOnFocus
          />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleSaveField(field)}>
            <MaterialCommunityIcons name="check" size={20} color={COLORS.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditingField(null)}>
            <MaterialCommunityIcons name="close" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.settingValue}
          onPress={() => handleEditField(field, value ?? '')}>
          <Text style={styles.settingValueText}>
            {value}{suffix ? ` ${suffix}` : ''}
          </Text>
          <MaterialCommunityIcons name="pencil" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderToggleRow = (
    label: string,
    field: keyof UserSettings,
    description?: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.toggleLabelContainer}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={Boolean(settings[field])}
        onValueChange={(value) => saveSettings({[field]: value})}
        trackColor={{false: COLORS.border, true: COLORS.primary + '80'}}
        thumbColor={settings[field] ? COLORS.primary : COLORS.textSecondary}
      />
    </View>
  );

  const renderSelectRow = (
    label: string,
    field: keyof UserSettings,
    options: {value: string; label: string}[]
  ) => (
    <View style={styles.settingRowVertical}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              settings[field] === option.value && styles.optionButtonActive,
            ]}
            onPress={() => saveSettings({[field]: option.value as any})}>
            <Text
              style={[
                styles.optionButtonText,
                settings[field] === option.value && styles.optionButtonTextActive,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderComingSoonRow = (label: string, icon: IconName) => (
    <View style={styles.settingRow}>
      <View style={styles.comingSoonRow}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.textSecondary} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.comingSoonBadge}>
        <Text style={styles.comingSoonText}>Coming Soon</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        {saving && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Profile Section */}
        <View style={styles.section}>
          {renderSectionHeader('Profile', 'account-circle', 'Your personal information')}
          <View style={styles.sectionContent}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account" size={40} color={COLORS.text} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{settings.displayName || firebaseUser?.email?.split('@')[0] || 'User'}</Text>
                <Text style={styles.profileEmail}>{firebaseUser?.email}</Text>
              </View>
            </View>
            {renderEditableRow('Display Name', 'displayName', settings.displayName || '')}
          </View>
        </View>

        {/* Units Section - Moved to top */}
        <View style={styles.section}>
          {renderSectionHeader('Units', 'ruler', 'Measurement preferences')}
          <View style={styles.sectionContent}>
            {renderSelectRow('Weight', 'weightUnit', [
              {value: 'lb', label: 'Pounds (lb)'},
              {value: 'kg', label: 'Kilograms (kg)'},
            ])}
            {renderSelectRow('Height', 'heightUnit', [
              {value: 'in', label: 'Feet & Inches'},
              {value: 'cm', label: 'Centimeters (cm)'},
            ])}
          </View>
        </View>

        {/* Body Metrics Section */}
        <View style={styles.section}>
          {renderSectionHeader('Body Metrics', 'human', 'Used to calculate your calorie needs')}
          <View style={styles.sectionContent}>
            {/* Current Weight - Read only, from Progress */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Current Weight</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>
                  {currentWeight ? `${kgToPreferred(currentWeight).toFixed(1)} ${settings.weightUnit}` : 'Log in Progress'}
                </Text>
                <MaterialCommunityIcons name="chart-line" size={16} color={COLORS.textSecondary} />
              </View>
            </View>
            {/* Height - Custom editing for feet/inches vs cm */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Height</Text>
              {editingField === 'height' ? (
                <View style={styles.editContainer}>
                  {settings.heightUnit === 'in' ? (
                    <>
                      <TextInput
                        style={[styles.editInput, styles.heightInput]}
                        value={editHeightFeet}
                        onChangeText={setEditHeightFeet}
                        keyboardType="number-pad"
                        placeholder="ft"
                        placeholderTextColor={COLORS.textSecondary}
                        autoFocus
                      />
                      <Text style={styles.heightLabel}>ft</Text>
                      <TextInput
                        style={[styles.editInput, styles.heightInput]}
                        value={editHeightInches}
                        onChangeText={setEditHeightInches}
                        keyboardType="number-pad"
                        placeholder="in"
                        placeholderTextColor={COLORS.textSecondary}
                      />
                      <Text style={styles.heightLabel}>in</Text>
                    </>
                  ) : (
                    <TextInput
                      style={styles.editInput}
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="decimal-pad"
                      placeholder="cm"
                      placeholderTextColor={COLORS.textSecondary}
                      autoFocus
                    />
                  )}
                  <TouchableOpacity style={styles.editButton} onPress={handleSaveHeight}>
                    <MaterialCommunityIcons name="check" size={20} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} onPress={cancelHeightEdit}>
                    <MaterialCommunityIcons name="close" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.settingValue} onPress={handleEditHeight}>
                  <Text style={styles.settingValueText}>
                    {formatHeightDisplay(settings.height, settings.heightUnit)}
                  </Text>
                  <MaterialCommunityIcons name="pencil" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {/* Date of Birth - custom editor; age derived from dob */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Date of Birth</Text>
              {editingField === 'dob' ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[styles.editInput, styles.dobInput]}
                    value={editDobMonth}
                    onChangeText={setEditDobMonth}
                    keyboardType="number-pad"
                    placeholder="MM"
                    placeholderTextColor={COLORS.textSecondary}
                    maxLength={2}
                    autoFocus
                  />
                  <Text style={styles.dobSeparator}>/</Text>
                  <TextInput
                    style={[styles.editInput, styles.dobInput]}
                    value={editDobDay}
                    onChangeText={setEditDobDay}
                    keyboardType="number-pad"
                    placeholder="DD"
                    placeholderTextColor={COLORS.textSecondary}
                    maxLength={2}
                  />
                  <Text style={styles.dobSeparator}>/</Text>
                  <TextInput
                    style={[styles.editInput, styles.dobYearInput]}
                    value={editDobYear}
                    onChangeText={setEditDobYear}
                    keyboardType="number-pad"
                    placeholder="YYYY"
                    placeholderTextColor={COLORS.textSecondary}
                    maxLength={4}
                  />
                  <TouchableOpacity style={styles.editButton} onPress={handleSaveDob}>
                    <MaterialCommunityIcons name="check" size={20} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} onPress={cancelDobEdit}>
                    <MaterialCommunityIcons name="close" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.settingValue} onPress={handleEditDob}>
                  <Text style={styles.settingValueText}>
                    {formatDobDisplay(settings.dob)}
                  </Text>
                  <MaterialCommunityIcons name="pencil" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {renderSelectRow('Sex', 'sex', [
              {value: 'male', label: 'Male'},
              {value: 'female', label: 'Female'},
            ])}
            {renderSelectRow('Activity Level', 'activityLevel', [
              {value: 'sedentary', label: 'Sedentary'},
              {value: 'light', label: 'Light'},
              {value: 'moderate', label: 'Moderate'},
              {value: 'active', label: 'Active'},
            ])}
          </View>
        </View>

        {/* Weight Goals Section */}
        <View style={styles.section}>
          {renderSectionHeader('Weight Goals', 'scale-bathroom', 'Your target weight and timeline')}
          <View style={styles.sectionContent}>
            {/* Goal Weight - stored in kg, displayed in preferred unit */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Goal Weight</Text>
              {editingField === 'goalWeight' ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="decimal-pad"
                    autoFocus
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleSaveField('goalWeight')}>
                    <MaterialCommunityIcons name="check" size={20} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditingField(null)}>
                    <MaterialCommunityIcons name="close" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.settingValue}
                  onPress={() => handleEditField('goalWeight', settings.goalWeight ?? 0)}>
                  <Text style={styles.settingValueText}>
                    {settings.goalWeight ? `${kgToPreferred(settings.goalWeight).toFixed(1)} ${settings.weightUnit}` : 'Not set'}
                  </Text>
                  <MaterialCommunityIcons name="pencil" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {renderSelectRow('Weekly Goal', 'weeklyWeightLossGoal', [
              {value: 0.5, label: 'Lose 0.5 lb/wk'},
              {value: 1, label: 'Lose 1 lb/wk'},
              {value: 1.5, label: 'Lose 1.5 lb/wk'},
              {value: 2, label: 'Lose 2 lb/wk'},
            ])}
            {/* Calculated Calories Display */}
            {hasAllMetrics && calculatedCalories && (
              <View style={styles.calculatedCaloriesContainer}>
                <View style={styles.calculatedCaloriesInfo}>
                  <Text style={styles.calculatedCaloriesLabel}>Recommended Daily Calories</Text>
                  <Text style={styles.calculatedCaloriesValue}>{calculatedCalories} cal</Text>
                  <Text style={styles.calculatedCaloriesHint}>
                    Based on your metrics and weight loss goal
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyCalculatedCalories}>
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
            {!hasAllMetrics && (
              <View style={styles.missingMetricsHint}>
                <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.missingMetricsText}>
                  Fill in all body metrics above to get personalized calorie recommendations
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Nutrition Goals Section */}
        <View style={styles.section}>
          {renderSectionHeader('Nutrition Goals', 'target', 'Daily macronutrient targets')}
          <View style={styles.sectionContent}>
            {renderEditableRow('Daily Calories', 'calorieGoal', settings.calorieGoal, 'cal', 'decimal-pad')}
            {renderEditableRow('Protein Goal', 'proteinGoal', settings.proteinGoal, 'g', 'decimal-pad')}
            {renderEditableRow('Carbs Goal', 'carbsGoal', settings.carbsGoal, 'g', 'decimal-pad')}
            {renderEditableRow('Fat Goal', 'fatGoal', settings.fatGoal, 'g', 'decimal-pad')}
          </View>
        </View>

        {/* AI Coach Section */}
        <View style={styles.section}>
          {renderSectionHeader('AI Coach', 'robot', 'Personalized AI-powered guidance')}
          <View style={styles.sectionContent}>
            {renderToggleRow('Enable AI Coach', 'aiCoachEnabled', 'Get personalized nutrition insights and suggestions')}
            {settings.aiCoachEnabled && (
              <>
                {renderSelectRow('Insights Frequency', 'aiInsightsFrequency', [
                  {value: 'daily', label: 'Daily'},
                  {value: 'weekly', label: 'Weekly'},
                  {value: 'off', label: 'Off'},
                ])}
                {renderToggleRow('Meal Suggestions', 'aiMealSuggestions', 'AI-powered meal recommendations based on your goals')}
                {renderSelectRow('Coaching Style', 'aiCoachingStyle', [
                  {value: 'encouraging', label: 'Encouraging'},
                  {value: 'data-driven', label: 'Data-Driven'},
                  {value: 'balanced', label: 'Balanced'},
                ])}
              </>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/agent/meal-plans')}>
              <MaterialCommunityIcons name="calendar-check" size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>View Meal Plans</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} style={{marginLeft: 'auto'}} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Integrations Section */}
        <View style={styles.section}>
          {renderSectionHeader('Integrations', 'connection', 'Connect with other apps & devices')}
          <View style={styles.sectionContent}>
            {renderComingSoonRow('Apple Health', 'apple')}
            {renderComingSoonRow('Strava', 'run')}
            {renderComingSoonRow('Garmin Connect', 'watch')}
            {renderComingSoonRow('Fitbit', 'heart-pulse')}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          {renderSectionHeader('Notifications', 'bell', 'Reminders and updates')}
          <View style={styles.sectionContent}>
            {renderToggleRow('Meal Reminders', 'mealReminders', 'Get reminded to log your meals')}
            {renderToggleRow('Weekly Progress Report', 'weeklyReportEnabled', 'Receive a summary of your weekly progress')}
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          {renderSectionHeader('Privacy', 'shield-lock', 'Control your data and visibility')}
          <View style={styles.sectionContent}>
            {renderSelectRow('Profile Visibility', 'profileVisibility', [
              {value: 'private', label: 'Private'},
              {value: 'friends', label: 'Friends'},
              {value: 'public', label: 'Public'},
            ])}
            {renderToggleRow('Share Progress', 'shareProgress', 'Allow friends to see your progress updates')}
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          {renderSectionHeader('Account', 'account-cog', 'Manage your account')}
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
              <MaterialCommunityIcons name="logout" size={20} color={COLORS.text} />
              <Text style={styles.actionButtonText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleDeleteAccount}>
              <MaterialCommunityIcons name="delete" size={20} color={COLORS.error} />
              <Text style={[styles.actionButtonText, styles.dangerText]}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Nutrilog v1.0.0</Text>
          <Text style={styles.appTagline}>Track. Learn. Transform.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Section Styles
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  // Profile Styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Setting Row Styles
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingRowVertical: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    maxWidth: '80%',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  // Edit Styles
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.primary,
    minWidth: 100,
  },
  heightInput: {
    minWidth: 50,
    width: 50,
    textAlign: 'center',
  },
  heightLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  dobInput: {
    minWidth: 40,
    width: 40,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  dobYearInput: {
    minWidth: 60,
    width: 60,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  dobSeparator: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginHorizontal: 2,
  },
  editButton: {
    padding: 8,
  },
  // Options Styles
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  // Calculated Calories Styles
  calculatedCaloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.primary + '15',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  calculatedCaloriesInfo: {
    flex: 1,
  },
  calculatedCaloriesLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calculatedCaloriesValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  calculatedCaloriesHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  applyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  missingMetricsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  missingMetricsText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // Coming Soon Styles
  comingSoonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.warning + '20',
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.warning,
  },
  // Action Button Styles
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 15,
    color: COLORS.text,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: COLORS.error,
  },
  // App Info
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  appTagline: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
