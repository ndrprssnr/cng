import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

interface Props {
  target: number;
  exactSolvable: boolean | null;
}

export default function TargetDisplay({ target, exactSolvable }: Props) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>TARGET</Text>
      <Text style={styles.target}>{target}</Text>
      {exactSolvable === null ? (
        <Animated.View style={[styles.dot, styles.dotSolving, { opacity }]} />
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
