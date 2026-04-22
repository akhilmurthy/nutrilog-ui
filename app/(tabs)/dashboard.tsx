import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {BarChart, LineChart} from 'react-native-gifted-charts';
import {getAuth} from 'firebase/auth';
import {useApi} from '../../hooks/useApi';
import {useProfile} from '../../context/ProfileContext';
import {DiaryEntry, WeightEntry} from '../../types/food';

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
  protein: '#FF6B6B',
  carbs: '#4ECDC4',
  fat: '#FFE66D',
};

const DEFAULT_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

type DayTotals = {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged: boolean;
};

const toDateStr = (d: Date) => d.toISOString().split('T')[0];

const sumDiary = (entry: DiaryEntry | null) => {
  if (!entry) return {calories: 0, protein: 0, carbs: 0, fat: 0, exercise: 0};
  const totals = Object.values(entry.meals || {})
    .flat()
    .reduce(
      (acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0),
      }),
      {calories: 0, protein: 0, carbs: 0, fat: 0},
    );
  const exercise = (entry.exercises || []).reduce(
    (sum, ex) => sum + (ex.calories || 0),
    0,
  );
  return {...totals, exercise};
};

const dayLabel = (d: Date) =>
  d.toLocaleDateString('en-US', {weekday: 'short'}).slice(0, 1);

export default function DashboardScreen() {
  const {apiClient} = useApi();
  const {settings} = useProfile();
  const preferredUnit: 'kg' | 'lb' = settings.weightUnit ?? 'lb';
  const goals = {
    calories: settings.calorieGoal ?? DEFAULT_GOALS.calories,
    protein: settings.proteinGoal ?? DEFAULT_GOALS.protein,
    carbs: settings.carbsGoal ?? DEFAULT_GOALS.carbs,
    fat: settings.fatGoal ?? DEFAULT_GOALS.fat,
  };
  const [name, setName] = useState('');
  const [weekTotals, setWeekTotals] = useState<DayTotals[]>([]);
  const [todayExercise, setTodayExercise] = useState(0);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetchedRef = useRef(false);

  const kgToPreferred = useCallback(
    (kg: number) => (preferredUnit === 'lb' ? kg * 2.20462 : kg),
    [preferredUnit],
  );

  const loadAll = useCallback(async () => {
    const today = new Date();
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }

    const [diaries, weights] = await Promise.all([
      Promise.all(
        days.map(d =>
          apiClient.getDiaryByDate(toDateStr(d)).catch(() => null),
        ),
      ),
      apiClient.getWeightHistory(30, 0).catch(() => null),
    ]);

    const totals: DayTotals[] = diaries.map((entry, i) => {
      const s = sumDiary(entry as DiaryEntry | null);
      return {
        date: toDateStr(days[i]),
        label: dayLabel(days[i]),
        calories: Math.round(s.calories),
        protein: Math.round(s.protein),
        carbs: Math.round(s.carbs),
        fat: Math.round(s.fat),
        logged: !!entry && s.calories > 0,
      };
    });
    setWeekTotals(totals);
    setTodayExercise(sumDiary(diaries[diaries.length - 1] as DiaryEntry | null).exercise);

    const rawEntries = Array.isArray(weights)
      ? weights
      : (weights as any)?.entries || [];
    const normalized = rawEntries
      .map((e: any) => ({
        ...e,
        date:
          typeof e.date === 'string'
            ? e.date
            : e.date?._seconds
              ? new Date(e.date._seconds * 1000).toISOString()
              : new Date().toISOString(),
      }))
      .sort(
        (a: WeightEntry, b: WeightEntry) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    setWeightHistory(normalized);
  }, [apiClient]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    const displayName = getAuth().currentUser?.displayName || '';
    setName(displayName.split(' ')[0]);
    (async () => {
      setLoading(true);
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const today = weekTotals[weekTotals.length - 1];
  const todayFood = today?.calories ?? 0;
  const remaining = goals.calories - todayFood + todayExercise;
  const caloriePct = Math.min(
    100,
    Math.round(((todayFood - todayExercise) / goals.calories) * 100),
  );

  const loggedDays = weekTotals.filter(d => d.logged).length;
  const weekAvg = loggedDays
    ? Math.round(
        weekTotals.filter(d => d.logged).reduce((s, d) => s + d.calories, 0) /
          loggedDays,
      )
    : 0;

  // Weight chart data (last 30 days in preferred unit)
  const sortedWeight = [...weightHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const latestWeight = weightHistory[0];
  const weightValues = sortedWeight.map(e => kgToPreferred(e.weight));
  const minW = weightValues.length ? Math.min(...weightValues) - 1 : 0;
  const maxW = weightValues.length ? Math.max(...weightValues) + 1 : 100;
  const firstVsLast =
    sortedWeight.length >= 2
      ? kgToPreferred(latestWeight.weight) -
        kgToPreferred(sortedWeight[0].weight)
      : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greeting}
              {name ? `, ${name}` : ''}
            </Text>
            <Text style={styles.dateText}>{todayDateStr}</Text>
          </View>
          <View style={styles.streakBadge}>
            <MaterialCommunityIcons
              name="fire"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.streakText}>{loggedDays}/7</Text>
          </View>
        </View>

        {/* Today Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Today</Text>
            <Text style={styles.cardSubtitle}>{caloriePct}% of goal</Text>
          </View>

          <View style={styles.calorieRow}>
            <View style={styles.calorieMainBlock}>
              <Text
                style={[
                  styles.remainingNumber,
                  remaining < 0 && {color: COLORS.error},
                ]}>
                {remaining}
              </Text>
              <Text style={styles.remainingLabel}>Remaining</Text>
            </View>
            <View style={styles.calorieStats}>
              <CalStat
                label="Goal"
                value={goals.calories}
                color={COLORS.text}
              />
              <CalStat label="Food" value={todayFood} color={COLORS.text} />
              <CalStat
                label="Exercise"
                value={todayExercise}
                color={COLORS.success}
              />
            </View>
          </View>

          <View style={styles.caloriePill}>
            <View
              style={[
                styles.caloriePillFill,
                {
                  width: `${Math.min(100, Math.max(0, caloriePct))}%`,
                  backgroundColor:
                    remaining < 0 ? COLORS.error : COLORS.primary,
                },
              ]}
            />
          </View>

          <View style={styles.macroContainer}>
            <MacroBar
              label="Protein"
              current={today?.protein ?? 0}
              goal={goals.protein}
              color={COLORS.protein}
            />
            <MacroBar
              label="Carbs"
              current={today?.carbs ?? 0}
              goal={goals.carbs}
              color={COLORS.carbs}
            />
            <MacroBar
              label="Fat"
              current={today?.fat ?? 0}
              goal={goals.fat}
              color={COLORS.fat}
            />
          </View>
        </View>

        {/* Weekly Calories Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Last 7 Days</Text>
            <Text style={styles.cardSubtitle}>
              {weekAvg ? `${weekAvg} avg` : 'No data'}
            </Text>
          </View>

          {loggedDays === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="chart-line"
                size={36}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>
                Log your meals to see weekly trends
              </Text>
            </View>
          ) : (
            <BarChart
              data={weekTotals.map(d => ({
                value: d.calories,
                label: d.label,
                frontColor:
                  d.calories > goals.calories
                    ? COLORS.error
                    : d.logged
                      ? COLORS.primary
                      : COLORS.border,
                topLabelComponent: () => null,
              }))}
              width={CHART_WIDTH - 40}
              height={140}
              barWidth={22}
              barBorderRadius={6}
              spacing={14}
              initialSpacing={8}
              yAxisTextStyle={{color: COLORS.textSecondary, fontSize: 10}}
              xAxisLabelTextStyle={{
                color: COLORS.textSecondary,
                fontSize: 11,
              }}
              yAxisColor="transparent"
              xAxisColor={COLORS.border}
              rulesColor={COLORS.border}
              rulesType="dashed"
              noOfSections={3}
              yAxisLabelWidth={36}
              maxValue={Math.max(
                goals.calories + 500,
                ...weekTotals.map(d => d.calories),
              )}
              showReferenceLine1
              referenceLine1Position={goals.calories}
              referenceLine1Config={{
                color: COLORS.success,
                dashWidth: 4,
                dashGap: 4,
                thickness: 1,
              }}
            />
          )}
        </View>

        {/* Weight Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Weight</Text>
            {sortedWeight.length >= 2 && (
              <View style={styles.trendRow}>
                <MaterialCommunityIcons
                  name={
                    firstVsLast < 0
                      ? 'trending-down'
                      : firstVsLast > 0
                        ? 'trending-up'
                        : 'trending-neutral'
                  }
                  size={16}
                  color={
                    firstVsLast < 0
                      ? COLORS.success
                      : firstVsLast > 0
                        ? COLORS.error
                        : COLORS.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.trendText,
                    {
                      color:
                        firstVsLast < 0
                          ? COLORS.success
                          : firstVsLast > 0
                            ? COLORS.error
                            : COLORS.textSecondary,
                    },
                  ]}>
                  {firstVsLast > 0 ? '+' : ''}
                  {firstVsLast.toFixed(1)} {preferredUnit}
                </Text>
              </View>
            )}
          </View>

          {latestWeight ? (
            <>
              <Text style={styles.weightValue}>
                {kgToPreferred(latestWeight.weight).toFixed(1)}
                <Text style={styles.weightUnit}> {preferredUnit}</Text>
              </Text>
              {sortedWeight.length >= 2 && (
                <LineChart
                  data={sortedWeight.map(e => ({
                    value: kgToPreferred(e.weight) - minW,
                  }))}
                  width={CHART_WIDTH - 40}
                  height={90}
                  maxValue={maxW - minW}
                  color={COLORS.primary}
                  thickness={2}
                  hideDataPoints
                  curved
                  adjustToWidth
                  yAxisColor="transparent"
                  xAxisColor="transparent"
                  hideRules
                  hideYAxisText
                  initialSpacing={0}
                  endSpacing={0}
                  areaChart
                  startFillColor={COLORS.primary}
                  endFillColor={COLORS.primary}
                  startOpacity={0.25}
                  endOpacity={0.02}
                />
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="scale-bathroom"
                size={36}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>Log your weight to get started</Text>
            </View>
          )}
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CalStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.calStat}>
      <Text style={[styles.calStatValue, {color}]}>{value}</Text>
      <Text style={styles.calStatLabel}>{label}</Text>
    </View>
  );
}

function MacroBar({
  label,
  current,
  goal,
  color,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
}) {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroLabelRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {current}
          <Text style={styles.macroGoal}>/{goal}g</Text>
        </Text>
      </View>
      <View style={styles.macroBarBg}>
        <View
          style={[
            styles.macroBarFill,
            {width: `${pct}%`, backgroundColor: color},
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
  },
  streakText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieMainBlock: {
    alignItems: 'center',
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  remainingNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.primary,
  },
  remainingLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  calorieStats: {
    flex: 1,
    paddingLeft: 16,
    gap: 10,
  },
  calStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calStatLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calStatValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  caloriePill: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  caloriePillFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroContainer: {
    gap: 12,
  },
  macroRow: {
    gap: 6,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  macroGoal: {
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  macroBarBg: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weightValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  weightUnit: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
});
