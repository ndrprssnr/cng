import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  mode: 'classic' | 'scratchpad';
  onModeChange: (mode: 'classic' | 'scratchpad') => void;
}

export default function ModeToggle({ mode, onModeChange }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, mode === 'classic' && styles.tabActive]}
        onPress={() => onModeChange('classic')}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, mode === 'classic' && styles.labelActive]}>Classic</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, mode === 'scratchpad' && styles.tabActive]}
        onPress={() => onModeChange('scratchpad')}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, mode === 'scratchpad' && styles.labelActive]}>Scratchpad</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1565c0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#607d8b',
  },
  labelActive: {
    color: '#ffffff',
  },
});
