import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScoreResult, BestSolution } from '../types/game';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  score: ScoreResult;
  result: number;
  target: number;
  bestSolution: BestSolution | null;
}

export default function ResultBanner({ score, result, target, bestSolution }: Props) {
  const { theme } = useTheme();
  const isExact = score.label === 'exact';
  const isClose = score.label === 'close';

  const bannerBg = isExact ? theme.bannerExactBg : isClose ? theme.bannerCloseBg : theme.bannerOffBg;

  const message = isExact
    ? `Exact! You got ${target}!`
    : isClose
    ? `So close! You got ${result}, just ${score.diff} away!`
    : `You got ${result}, which is ${score.diff} away from ${target}.`;

  return (
    <View style={styles.container}>
      <View style={[styles.banner, { backgroundColor: bannerBg }]}>
        <Text style={[styles.text, { color: theme.bannerText }]}>{message}</Text>
      </View>

      {bestSolution && (
        <View style={[styles.solutionBox, { backgroundColor: theme.solutionBoxBg }]}>
          {bestSolution.result === target ? (
            <>
              <Text style={[styles.solutionLabel, { color: theme.solutionLabel }]}>{isExact ? 'Simpler solution:' : 'Best solution:'}</Text>
              <Text style={[styles.solutionExpr, { color: theme.solutionExpr }]}>{bestSolution.expression} = {bestSolution.result}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.solutionLabel, { color: theme.solutionLabel }]}>Closest possible:</Text>
              <Text style={[styles.solutionExpr, { color: theme.solutionExpr }]}>{bestSolution.expression} = {bestSolution.result}</Text>
              <Text style={[styles.solutionSub, { color: theme.solutionLabel }]}>(off by {Math.abs(bestSolution.result - target)})</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 10,
  },
  banner: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  solutionBox: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  solutionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  solutionExpr: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  solutionSub: {
    fontSize: 13,
    marginTop: 4,
  },
});
