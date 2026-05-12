import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

import { useTheme } from '../theme/ThemeContext';

interface Props {
  target: number;
  exactSolvable: boolean | null;
  timerSecondsRemaining?: number | null;
  timerEnabled?: boolean;
  timerDurationSeconds?: number;
  onTimerIconPress?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TargetDisplay({
  target,
  exactSolvable,
  timerSecondsRemaining,
  timerEnabled,
  timerDurationSeconds,
  onTimerIconPress,
}: Props) {
  const { theme, themeName, toggleTheme } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  const timerPulse = useRef(new Animated.Value(0)).current;

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

  const isUrgent = timerSecondsRemaining != null && timerSecondsRemaining <= 10;

  useEffect(() => {
    if (!isUrgent) {
      timerPulse.setValue(1);
      return;
    }
    timerPulse.setValue(0);
    const anim = Animated.loop(
      Animated.timing(timerPulse, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => { anim.stop(); timerPulse.setValue(1); };
  }, [isUrgent]);

  const opacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.25, 1, 0.25],
  });

  const timerOpacity = timerPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });

  const timerColor = isUrgent ? theme.timerUrgent : theme.timerText;

  return (
    <View style={[styles.container, { backgroundColor: theme.targetBg }]}>
      {onTimerIconPress && (
        <View style={styles.timerCol}>
          <TouchableOpacity style={styles.timerBtn} onPress={onTimerIconPress} activeOpacity={0.7}>
            <Text style={[styles.timerIcon, { color: theme.targetLabel }]}>
              {'⏱︎'}
            </Text>
          </TouchableOpacity>
          {timerEnabled && (
            <Animated.Text style={[styles.timer, { color: timerColor, opacity: timerOpacity }]}>
              {timerSecondsRemaining != null ? formatTime(timerSecondsRemaining) : formatTime(timerDurationSeconds ?? 30)}
            </Animated.Text>
          )}
        </View>
      )}
      <TouchableOpacity style={styles.toggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
        <Text style={[styles.toggleIcon, { color: theme.targetLabel }]}>{themeName === 'dark' ? '☉︎' : '☾'}</Text>
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
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
    elevation: 6,
    position: 'relative',
  },
  timerCol: {
    position: 'absolute',
    top: 8,
    left: 8,
    alignItems: 'center',
  },
  timerBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerIcon: {
    fontSize: 26,
    textAlign: 'center',
  },
  toggleBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 26,
    textAlign: 'center',
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
  timer: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
