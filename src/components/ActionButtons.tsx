import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onClear: () => void;
  onBackspace: () => void;
  onCursorLeft: () => void;
  onCursorRight: () => void;
  cursorAtStart: boolean;
  cursorAtEnd: boolean;
}

export default function ActionButtons({
  onClear,
  onBackspace,
  onCursorLeft,
  onCursorRight,
  cursorAtStart,
  cursorAtEnd,
}: Props) {
  return (
    <View style={styles.topRow}>
      <TouchableOpacity
        style={[styles.secondary, cursorAtStart && styles.dimmed]}
        onPress={onCursorLeft}
        disabled={cursorAtStart}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryText}>◀</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.secondary, cursorAtEnd && styles.dimmed]}
        onPress={onCursorRight}
        disabled={cursorAtEnd}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryText}>▶</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={onBackspace} activeOpacity={0.8}>
        <Text style={styles.secondaryText}>⌫</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={onClear} activeOpacity={0.8}>
        <Text style={styles.secondaryText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  secondary: {
    flex: 1,
    backgroundColor: '#37474f',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dimmed: {
    opacity: 0.3,
  },
  secondaryText: {
    color: '#eceff1',
    fontSize: 18,
    fontWeight: '600',
  },
});
