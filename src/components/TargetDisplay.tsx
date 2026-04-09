import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

interface Props {
  target: number;
  exactSolvable: boolean | null;
  compact?: boolean;
}

export default function TargetDisplay({ target, exactSolvable, compact = false }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (exactSolvable !== null) return;
    pulse.setValue(0);
    const anim = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => { anim.stop(); pulse.setValue(0); };
  }, [exactSolvable]);

  const opacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.25, 1, 0.25],
  });

  const dot = exactSolvable === null ? (
    <Animated.View style={[styles.dot, styles.dotSolving, { opacity }]} />
  ) : (
    <View style={[styles.dot, exactSolvable ? styles.dotSolvable : styles.dotUnsolvable]} />
  );

  if (compact) {
    return (
      <View style={styles.containerCompact}>
        <View style={styles.compactLeft}>
          <Text style={styles.labelCompact}>TARGET</Text>
          {dot}
        </View>
        <Text style={styles.targetCompact}>{target}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>TARGET</Text>
      <Text style={styles.target}>{target}</Text>
      {exactSolvable === null ? (
        <Animated.View style={[styles.dot, styles.dotSolving, { opacity, marginTop: 6 }]} />
      ) : (
        <View style={[styles.dot, exactSolvable ? styles.dotSolvable : styles.dotUnsolvable, { marginTop: 6 }]} />
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
    elevation: 6,
  },
  containerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#c0392b',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
    elevation: 6,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffcdd2',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  labelCompact: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffcdd2',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  target: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 72,
  },
  targetCompact: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
