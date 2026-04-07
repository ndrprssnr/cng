import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScoreResult, BestSolution } from '../types/game';

interface Props {
  score: ScoreResult;
  result: number;
  target: number;
  bestSolution: BestSolution | null;
}

export default function ResultBanner({ score, result, target, bestSolution }: Props) {
  const isExact = score.label === 'exact';
  const isClose = score.label === 'close';

  const bannerStyle = isExact ? styles.exact : isClose ? styles.close : styles.off;

  const message = isExact
    ? `Exact! You got ${target}!`
    : isClose
    ? `So close! You got ${result}, just ${score.diff} away!`
    : `You got ${result}, which is ${score.diff} away from ${target}.`;

  return (
    <View style={styles.container}>
      <View style={[styles.banner, bannerStyle]}>
        <Text style={styles.text}>{message}</Text>
      </View>

      {bestSolution && (
        <View style={styles.solutionBox}>
          {bestSolution.result === target ? (
            <>
              <Text style={styles.solutionLabel}>{isExact ? 'Simpler solution:' : 'Best solution:'}</Text>
              <Text style={styles.solutionExpr}>{bestSolution.expression} = {bestSolution.result}</Text>
            </>
          ) : (
            <>
              <Text style={styles.solutionLabel}>Closest possible:</Text>
              <Text style={styles.solutionExpr}>{bestSolution.expression} = {bestSolution.result}</Text>
              <Text style={styles.solutionSub}>(off by {Math.abs(bestSolution.result - target)})</Text>
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
  exact: {
    backgroundColor: '#1b5e20',
  },
  close: {
    backgroundColor: '#e65100',
  },
  off: {
    backgroundColor: '#37474f',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  solutionBox: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  solutionLabel: {
    color: '#90caf9',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  solutionExpr: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  solutionSub: {
    color: '#90caf9',
    fontSize: 13,
    marginTop: 4,
  },
});
