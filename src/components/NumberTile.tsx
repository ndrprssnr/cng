import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { NumberTileData } from '../types/game';
import React from 'react';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  tile: NumberTileData;
  onPress: (id: string) => void;
  disabled: boolean;
}

export default function NumberTile({ tile, onPress, disabled }: Props) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        { backgroundColor: disabled ? theme.numberTileDisabledBg : theme.numberTileBg },
        disabled && styles.disabled,
      ]}
      onPress={() => onPress(tile.id)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.value, { color: disabled ? theme.numberTileDisabledText : theme.targetNumber }]}>
        {tile.value}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  disabled: {
    opacity: 0.4,
    elevation: 0,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
