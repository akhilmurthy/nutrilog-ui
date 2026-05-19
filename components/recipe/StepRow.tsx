import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  surfaceLight: '#1e5c3a',
  primary: '#FF6F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
  error: '#FF6B6B',
};

interface StepRowProps {
  instruction: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  stepNumber: number;
}

export default function StepRow({
  instruction,
  onChange,
  onDelete,
  stepNumber,
}: StepRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{stepNumber}</Text>
      </View>

      <TextInput
        style={styles.input}
        value={instruction}
        onChangeText={onChange}
        placeholder={`Step ${stepNumber}...`}
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />

      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <MaterialCommunityIcons name="close" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  numberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  number: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
    lineHeight: 20,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 6,
    marginTop: 4,
  },
});
