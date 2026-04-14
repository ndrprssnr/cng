import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Operator } from '../types/game';
import React from 'react';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  operator: Operator;
  onPress: (op: Operator) => void;
  disabled: boolean;
}

export default function OperatorButton({ operator, onPress, disabled }: Props) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled ? theme.operatorBtnDisabledBg : theme.operatorBtnBg },
        disabled && styles.disabled,
      ]}
      onPress={() => onPress(operator)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, { color: disabled ? theme.operatorBtnDisabledText : theme.targetNumber }]}>
        {operator}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  disabled: {
    opacity: 0.4,
    elevation: 0,
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
