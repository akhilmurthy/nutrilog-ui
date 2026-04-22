import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeightEntry } from '../types/food';

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
  error: '#FF6B6B',
  edit: '#4ECDC4',
};

interface SwipeableWeightRowProps {
  entry: WeightEntry;
  isLast: boolean;
  preferredUnit: 'kg' | 'lb';
  onEdit: (entry: WeightEntry) => void;
  onDelete: (entry: WeightEntry) => void;
}

export default function SwipeableWeightRow({
  entry,
  isLast,
  preferredUnit,
  onEdit,
  onDelete,
}: SwipeableWeightRowProps) {
  const swipeableRef = React.useRef<Swipeable>(null);

  // Convert from kg (storage) to preferred display unit
  const displayWeight = preferredUnit === 'lb' ? entry.weight * 2.20462 : entry.weight;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateEdit = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [160, 0],
    });

    const translateDelete = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <View style={styles.rightActionsContainer}>
        <Animated.View style={{ transform: [{ translateX: translateEdit }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              swipeableRef.current?.close();
              onEdit(entry);
            }}
          >
            <MaterialCommunityIcons name="pencil" size={22} color="#fff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ translateX: translateDelete }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              swipeableRef.current?.close();
              onDelete(entry);
            }}
          >
            <MaterialCommunityIcons name="trash-can" size={22} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={[styles.rowContainer, isLast && styles.rowContainerLast]}>
        <View style={styles.rowContent}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
          </View>
          <Text style={styles.weightText}>
            {displayWeight.toFixed(1)} {preferredUnit}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowContainerLast: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.text,
  },
  weightText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary,
  },
  rightActionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.edit,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
