import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Operator } from '../types/game';
import React from 'react';

interface Props {
  operator: Operator;
  onPress: (op: Operator) => void;
  disabled: boolean;
}

export default function OperatorButton({ operator, onPress, disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={() => onPress(operator)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, disabled && styles.disabledText]}>
        {operator}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2d5a8e',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    elevation: 4,
  },
  disabled: {
    backgroundColor: '#333',
    opacity: 0.4,
    elevation: 0,
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  disabledText: {
    color: '#666',
  },
});
