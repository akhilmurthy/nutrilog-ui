import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {LineChart} from 'react-native-gifted-charts';
import {useApi} from '../../hooks/useApi';
import {useProfile} from '../../context/ProfileContext';
import {WeightEntry} from '../../types/food';
import SwipeableWeightRow from '../../components/SwipeableWeightRow';

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
};

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 200;
const PAGE_SIZE = 20;

// Format a Date as a local yyyy-mm-dd string (avoid UTC drift).
const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Parse a yyyy-mm-dd string as a local Date (avoid UTC-midnight shift).
const parseLocalDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const {loading, error, execute, apiClient} = useApi();
  const {settings, refresh: refreshProfile} = useProfile();
  const preferredUnit: 'kg' | 'lb' = settings.weightUnit ?? 'lb';
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateStr(new Date()));
  const [hasMore, setHasMore] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetchedRef = useRef(false);

  // Weight conversion helpers (database stores kg)
  const kgToPreferred = (kg: number): number => {
    return preferredUnit === 'lb' ? kg * 2.20462 : kg;
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    loadWeightHistory();
  }, []);

  // Normalize Firestore timestamp to ISO string
  const normalizeDate = (date: any): string => {
    if (typeof date === 'string') return date;
    if (date && date._seconds) {
      return new Date(date._seconds * 1000).toISOString();
    }
    if (date instanceof Date) return date.toISOString();
    return new Date().toISOString();
  };

  const normalizeEntries = (entries: any[]): WeightEntry[] => {
    // Deduplicate by ID
    const seen = new Set<string>();
    return entries
      .map(entry => ({
        ...entry,
        date: normalizeDate(entry.date),
        createdAt: normalizeDate(entry.createdAt),
      }))
      .filter(entry => {
        if (seen.has(entry.id)) return false;
        seen.add(entry.id);
        return true;
      });
  };

  const loadWeightHistory = async (reset: boolean = true) => {
    if (reset) {
      const result = await execute(() =>
        apiClient.getWeightHistory(PAGE_SIZE, 0),
      );
      if (result) {
        // Handle both array response and { entries, hasMore } response
        const rawEntries = Array.isArray(result) ? result : (result.entries || []);
        const normalized = normalizeEntries(rawEntries);
        const hasMoreData = Array.isArray(result) ? rawEntries.length >= PAGE_SIZE : (result.hasMore ?? false);
        setWeightHistory(normalized);
        setHasMore(hasMoreData);
      }
      setInitialLoadDone(true);
    }
  };

  const loadMoreWeights = async () => {
    if (!initialLoadDone || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const result = await apiClient.getWeightHistory(
        PAGE_SIZE,
        weightHistory.length,
      );
      if (result) {
        // Handle both array response and { entries, hasMore } response
        const rawEntries = Array.isArray(result) ? result : (result.entries || []);
        const hasMoreData = Array.isArray(result) ? rawEntries.length >= PAGE_SIZE : (result.hasMore ?? false);
        setWeightHistory(prev => [
          ...(prev || []),
          ...normalizeEntries(rawEntries),
        ]);
        setHasMore(hasMoreData);
      }
    } catch (err) {
      console.error('Error loading more weights:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWeightHistory(true);
    setRefreshing(false);
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight value.');
      return;
    }

    // Pass weight in user's preferred unit - backend will convert to kg
    const result = await execute(() => apiClient.addWeightEntry(weight, preferredUnit, selectedDate));
    if (result) {
      setNewWeight('');
      setSelectedDate(toLocalDateStr(new Date()));
      setShowAddForm(false);
      await Promise.all([loadWeightHistory(true), refreshProfile()]);
    }
  };

  const handleEditWeight = async () => {
    if (!editingEntry) return;

    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight value.');
      return;
    }

    // Pass weight in user's preferred unit - backend will convert to kg
    const result = await execute(() =>
      apiClient.updateWeightEntry(editingEntry.id, weight, preferredUnit),
    );
    if (result) {
      setNewWeight('');
      setShowEditForm(false);
      setEditingEntry(null);
      await Promise.all([loadWeightHistory(true), refreshProfile()]);
    }
  };

  const handleDeleteEntry = (entry: WeightEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this weight entry?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await execute(() => apiClient.deleteWeightEntry(entry.id));
            await Promise.all([loadWeightHistory(true), refreshProfile()]);
          },
        },
      ],
    );
  };

  const handleEditEntry = (entry: WeightEntry) => {
    setEditingEntry(entry);
    // Convert from kg to user's preferred unit for editing
    const displayWeight = kgToPreferred(entry.weight);
    setNewWeight(displayWeight.toFixed(1));
    setShowEditForm(true);
  };

  const closeEditModal = () => {
    setShowEditForm(false);
    setEditingEntry(null);
    setNewWeight('');
  };

  // Calculate stats (weights are stored in kg, convert for display)
  const sortedHistory = [...(weightHistory || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const latestWeight = (weightHistory || [])[0];
  const oldestWeight = sortedHistory[0];
  // Calculate change in kg, then convert to display unit
  const totalChangeKg =
    latestWeight && oldestWeight
      ? latestWeight.weight - oldestWeight.weight
      : 0;
  const totalChange = kgToPreferred(Math.abs(totalChangeKg)) * (totalChangeKg < 0 ? -1 : 1);

  // Filter by time range
  const getFilteredHistory = () => {
    const now = new Date();
    let cutoffDate = new Date();

    switch (timeRange) {
      case '1W':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
      default:
        return sortedHistory;
    }

    return sortedHistory.filter(e => new Date(e.date) >= cutoffDate);
  };

  const filteredHistory = getFilteredHistory();

  // Get min/max for chart scaling (convert to display unit)
  const weights = filteredHistory.map(e => kgToPreferred(e.weight));
  const minWeight = weights.length ? Math.min(...weights) - 2 : 0;
  const maxWeight = weights.length ? Math.max(...weights) + 2 : 100;

  // Backend stores calendar dates as UTC midnight; format in UTC so viewers in
  // timezones west of UTC don't see the previous day.
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const renderHeader = () => (
    <View>
      {/* Current Weight Card */}
      <View style={styles.summaryCard}>
        <View style={styles.currentWeightSection}>
          <Text style={styles.sectionLabel}>Current Weight</Text>
          {latestWeight ? (
            <>
              <Text style={styles.currentWeight}>
                {kgToPreferred(latestWeight.weight).toFixed(1)}
                <Text style={styles.weightUnit}> {preferredUnit}</Text>
              </Text>
              <Text style={styles.lastUpdated}>
                Last updated: {formatDate(latestWeight.date)}
              </Text>
            </>
          ) : (
            <Text style={styles.noDataText}>No weight entries yet</Text>
          )}
        </View>

        {weightHistory.length >= 2 && (
          <View style={styles.changeSection}>
            <View style={styles.changeRow}>
              <MaterialCommunityIcons
                name={
                  totalChange < 0
                    ? 'trending-down'
                    : totalChange > 0
                      ? 'trending-up'
                      : 'trending-neutral'
                }
                size={24}
                color={
                  totalChange < 0
                    ? COLORS.success
                    : totalChange > 0
                      ? COLORS.error
                      : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.changeValue,
                  {
                    color:
                      totalChange < 0
                        ? COLORS.success
                        : totalChange > 0
                          ? COLORS.error
                          : COLORS.textSecondary,
                  },
                ]}>
                {totalChange > 0 ? '+' : ''}
                {totalChange.toFixed(1)} {preferredUnit}
              </Text>
            </View>
            <Text style={styles.changePeriod}>
              Since {formatDate(oldestWeight.date)}
            </Text>
          </View>
        )}
      </View>

      {/* Weight Chart */}
      {filteredHistory.length >= 1 && (
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weight Trend</Text>
          </View>

          {/* Time Range Filter */}
          <View style={styles.timeRangeContainer}>
            {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const).map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  timeRange === range && styles.timeRangeButtonActive,
                ]}
                onPress={() => setTimeRange(range)}>
                <Text
                  style={[
                    styles.timeRangeText,
                    timeRange === range && styles.timeRangeTextActive,
                  ]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <LineChart
            data={filteredHistory.map((entry, index) => ({
              value: kgToPreferred(entry.weight) - minWeight,
              label: index === 0 || index === filteredHistory.length - 1 || index === Math.floor(filteredHistory.length / 2)
                ? formatDateShort(entry.date)
                : '',
            }))}
            width={CHART_WIDTH - 40}
            height={140}
            maxValue={maxWeight - minWeight}
            color={COLORS.primary}
            thickness={2}
            dataPointsColor={COLORS.primary}
            dataPointsRadius={5}
            yAxisTextStyle={{color: COLORS.textSecondary, fontSize: 10}}
            xAxisLabelTextStyle={{color: COLORS.textSecondary, fontSize: 10}}
            yAxisColor="transparent"
            xAxisColor={COLORS.border}
            rulesColor={COLORS.border}
            rulesType="dashed"
            noOfSections={2}
            yAxisLabelWidth={35}
            formatYLabel={(val) => `${(parseFloat(val) + minWeight).toFixed(0)}`}
            hideDataPoints={filteredHistory.length > 15}
            curved
            adjustToWidth
            scrollable={false}
            initialSpacing={10}
            endSpacing={10}
            spacing={(CHART_WIDTH - 80) / Math.max(filteredHistory.length - 1, 1)}
          />
        </View>
      )}

      {/* History Title */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Weight History</Text>
        <Text style={styles.swipeHintText}>Swipe left to edit or delete</Text>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="scale-bathroom"
        size={48}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyStateText}>No weight entries yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Tap the + button to log your weight
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  const renderItem = useCallback(
    ({item, index}: {item: WeightEntry; index: number}) => (
      <SwipeableWeightRow
        entry={item}
        isLast={index === weightHistory.length - 1}
        preferredUnit={preferredUnit}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
      />
    ),
    [weightHistory.length, preferredUnit],
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setNewWeight('');
            setSelectedDate(toLocalDateStr(new Date()));
            setShowAddForm(true);
          }}>
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={weightHistory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreWeights}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: 80 },
          weightHistory.length === 0 && styles.emptyContainer,
        ]}
      />

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Add Weight Modal */}
      {showAddForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Weight</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={styles.dateArrowButton}
                onPress={() => {
                  const date = parseLocalDate(selectedDate);
                  date.setDate(date.getDate() - 1);
                  setSelectedDate(toLocalDateStr(date));
                }}>
                <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.datePickerText}>
                {parseLocalDate(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <TouchableOpacity
                style={styles.dateArrowButton}
                onPress={() => {
                  const date = parseLocalDate(selectedDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  date.setDate(date.getDate() + 1);
                  if (date <= today) {
                    setSelectedDate(toLocalDateStr(date));
                  }
                }}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={selectedDate === toLocalDateStr(new Date()) ? COLORS.border : COLORS.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.weightInput}
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="Enter weight"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
                autoFocus
              />
              <View style={styles.unitDisplay}>
                <Text style={styles.unitDisplayText}>{preferredUnit}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleAddWeight}
              disabled={loading}>
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Weight'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit Weight Modal */}
      {showEditForm && editingEntry && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Weight</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.editDateText}>
              {formatDate(editingEntry.date)}
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.weightInput}
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="Enter weight"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
                autoFocus
              />
              <View style={styles.unitDisplay}>
                <Text style={styles.unitDisplayText}>{preferredUnit}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleEditWeight}
              disabled={loading}>
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Update Weight'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flexGrow: 1,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentWeightSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  currentWeight: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  weightUnit: {
    fontSize: 24,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  noDataText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  changeSection: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  changePeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Chart
  chartCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 4,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  // History
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  swipeHintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // Loading More
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a2020',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  dateArrowButton: {
    padding: 8,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 120,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  editDateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  weightInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitDisplay: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
