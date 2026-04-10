import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

import { useTheme } from '../theme/ThemeContext';

interface Props {
  target: number;
  exactSolvable: boolean | null;
}

export default function TargetDisplay({ target, exactSolvable }: Props) {
  const { theme, themeName, toggleTheme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.targetBg }]}>
      <TouchableOpacity style={styles.toggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
        <Text style={styles.toggleIcon}>{themeName === 'dark' ? '☀' : '🌙'}</Text>
      </TouchableOpacity>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.targetLabel }]}>TARGET</Text>
        {exactSolvable === null ? (
          <Animated.View style={[styles.dot, { backgroundColor: theme.dotSolving, opacity }]} />
        ) : (
          <View style={[styles.dot, { backgroundColor: exactSolvable ? theme.dotSolvable : theme.dotUnsolvable }]} />
        )}
      </View>
      <Text style={[styles.target, { color: theme.targetNumber }]}>{target}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
    elevation: 6,
    position: 'relative',
  },
  toggleBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  toggleIcon: {
    fontSize: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  target: {
    fontSize: 64,
    fontWeight: 'bold',
    lineHeight: 72,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
