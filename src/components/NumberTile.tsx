import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
      <View style={styles.textContainer}>
        {/* Dark shadow below — depth of the engraving */}
        <Text style={[styles.value, styles.shadowDark, disabled && styles.disabledText]}>
          {tile.value}
        </Text>
        {/* Light highlight above — reflection on the upper edge */}
        <Text style={[styles.value, styles.shadowLight, styles.overlay, disabled && styles.disabledText]}>
          {tile.value}
        </Text>
        {/* Main text on top */}
        <Text style={[styles.value, styles.overlay, disabled && styles.disabledText]}>
          {tile.value}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f0b000',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  disabled: {
    backgroundColor: '#3a3a3a',
    opacity: 0.4,
    elevation: 0,
  },
  textContainer: {
    position: 'relative',
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  shadowDark: {
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  shadowLight: {
    textShadowColor: 'rgba(255,255,255,0.25)',
    textShadowOffset: { width: 0, height: -1 },
    textShadowRadius: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  disabledText: {
    color: '#888',
  },
});
