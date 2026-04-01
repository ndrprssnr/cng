import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: () => void;
  onNewGame: () => void;
  submitEnabled: boolean;
  phase: 'playing' | 'submitted';
}

export default function ActionButtons({
  onClear,
  onBackspace,
  onSubmit,
  onNewGame,
  submitEnabled,
  phase,
}: Props) {
  if (phase === 'submitted') {
    return (
      <TouchableOpacity style={styles.newGame} onPress={onNewGame} activeOpacity={0.8}>
        <Text style={styles.newGameText}>New Game</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.secondary} onPress={onBackspace} activeOpacity={0.8}>
          <Text style={styles.secondaryText}>⌫ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={onClear} activeOpacity={0.8}>
          <Text style={styles.secondaryText}>✕ Clear</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.submit, !submitEnabled && styles.submitDisabled]}
        onPress={onSubmit}
        disabled={!submitEnabled}
        activeOpacity={0.8}
      >
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondary: {
    flex: 1,
    backgroundColor: '#37474f',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#eceff1',
    fontSize: 16,
    fontWeight: '600',
  },
  submit: {
    backgroundColor: '#1565c0',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#263238',
    opacity: 0.5,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newGame: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  newGameText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
