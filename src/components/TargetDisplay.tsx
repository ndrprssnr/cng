import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  target: number;
}

export default function TargetDisplay({ target }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>TARGET</Text>
      <Text style={styles.target}>{target}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#c0392b',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffcdd2',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  target: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 72,
  },
});
