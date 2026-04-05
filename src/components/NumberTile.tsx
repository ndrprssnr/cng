import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { NumberTileData } from '../types/game';
import React from 'react';

interface Props {
  tile: NumberTileData;
  onPress: (id: string) => void;
  disabled: boolean;
}

export default function NumberTile({ tile, onPress, disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.tile, disabled && styles.disabled]}
      onPress={() => onPress(tile.id)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.value, disabled && styles.disabledText]}>
        {tile.value}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#daa000',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    elevation: 4,
  },
  disabled: {
    backgroundColor: '#3a3a3a',
    opacity: 0.4,
    elevation: 0,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  disabledText: {
    color: '#888',
    textShadowColor: 'transparent',
  },
});
