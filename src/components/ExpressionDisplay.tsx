import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpressionToken } from '../types/game';

interface Props {
  tokens: ExpressionToken[];
  cursorPos: number;
  result: number | null;
  target: number;
}

export default function ExpressionDisplay({ tokens, cursorPos, result, target }: Props) {
  const [cursorVisible, setCursorVisible] = useState(true);

  // Blink the cursor every 530ms
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setCursorVisible(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCursorVisible(v => !v), 530);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cursorPos, tokens.length]);

  const resultColor =
    result === null ? '#888'
    : result === target ? '#4caf50'
    : Math.abs(result - target) <= 10 ? '#ff9800'
    : '#90caf9';

  const cursor = (
    <Text key="cursor" style={[styles.cursor, !cursorVisible && styles.cursorHidden]}>
      |
    </Text>
  );

  if (tokens.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.exprRow}>
          {cursor}
          <Text style={styles.placeholder}>Tap numbers and operators...</Text>
        </View>
      </View>
    );
  }

  const parts: React.ReactNode[] = [];
  tokens.forEach((token, index) => {
    if (index === cursorPos) parts.push(cursor);
    parts.push(
      <Text key={index} style={styles.token}>{token.display}</Text>
    );
    // Add a thin space between tokens for readability
    if (index < tokens.length - 1 || cursorPos !== tokens.length) {
      parts.push(<Text key={`sp-${index}`} style={styles.space}> </Text>);
    }
  });
  if (cursorPos === tokens.length) parts.push(cursor);

  return (
    <View style={styles.container}>
      <View style={styles.exprRow}>
        {parts}
      </View>
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
  exprRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  token: {
    fontSize: 20,
    color: '#e0e0e0',
    fontFamily: 'monospace',
  },
  space: {
    fontSize: 20,
    color: '#e0e0e0',
    fontFamily: 'monospace',
  },
  cursor: {
    fontSize: 22,
    color: '#64b5f6',
    fontWeight: '200',
    fontFamily: 'monospace',
  },
  cursorHidden: {
    opacity: 0,
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
