import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpressionToken } from '../types/game';
import { expressionToString } from '../logic/expressionEngine';

interface Props {
  tokens: ExpressionToken[];
  result: number | null;
  target: number;
}

export default function ExpressionDisplay({ tokens, result, target }: Props) {
  const exprStr = tokens.length > 0
    ? expressionToString(tokens)
    : 'Tap numbers and operators...';

  const resultColor =
    result === null ? '#888'
    : result === target ? '#4caf50'
    : Math.abs(result - target) <= 10 ? '#ff9800'
    : '#90caf9';

  return (
    <View style={styles.container}>
      <Text style={[styles.expression, tokens.length === 0 && styles.placeholder]}>
        {exprStr}
      </Text>
      {result !== null && (
        <Text style={[styles.result, { color: resultColor }]}>
          = {result}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    minHeight: 70,
    marginBottom: 16,
    justifyContent: 'center',
  },
  expression: {
    fontSize: 20,
    color: '#e0e0e0',
    fontFamily: 'monospace',
  },
  placeholder: {
    color: '#555',
    fontStyle: 'italic',
    fontSize: 15,
  },
  result: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
