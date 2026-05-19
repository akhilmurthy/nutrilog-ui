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

interface IngredientRowProps {
  name: string;
  quantity: string;
  unit: string;
  onChangeName: (value: string) => void;
  onChangeQuantity: (value: string) => void;
  onChangeUnit: (value: string) => void;
  onDelete: () => void;
  index: number;
}

export default function IngredientRow({
  name,
  quantity,
  unit,
  onChangeName,
  onChangeQuantity,
  onChangeUnit,
  onDelete,
  index,
}: IngredientRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bullet}>
        <MaterialCommunityIcons name="circle-small" size={24} color={COLORS.primary} />
      </View>

      <View style={styles.inputsContainer}>
        <TextInput
          style={[styles.input, styles.quantityInput]}
          value={quantity}
          onChangeText={onChangeQuantity}
          placeholder="2"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.unitInput]}
          value={unit}
          onChangeText={onChangeUnit}
          placeholder="cups"
          placeholderTextColor={COLORS.textSecondary}
        />
        <TextInput
          style={[styles.input, styles.nameInput]}
          value={name}
          onChangeText={onChangeName}
          placeholder="flour"
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <MaterialCommunityIcons name="close" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bullet: {
    marginRight: 4,
  },
  inputsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityInput: {
    width: 50,
    textAlign: 'center',
  },
  unitInput: {
    width: 70,
  },
  nameInput: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 6,
  },
});
