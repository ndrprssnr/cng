import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface Props {
  target: number;
  exactSolvable: boolean | null;
}

export default function TargetDisplay({ target, exactSolvable }: Props) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (exactSolvable !== null) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [exactSolvable]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>TARGET</Text>
      <Text style={styles.target}>{target}</Text>
      {exactSolvable === null ? (
        <Animated.View style={[styles.dot, styles.dotSolving, { opacity: pulse }]} />
      ) : (
        <View style={[styles.dot, exactSolvable ? styles.dotSolvable : styles.dotUnsolvable]} />
      )}
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  dotSolving: {
    backgroundColor: '#ffffff',
  },
  dotSolvable: {
    backgroundColor: '#69f0ae',
  },
  dotUnsolvable: {
    backgroundColor: 'rgba(255,100,100,0.35)',
  },
});
