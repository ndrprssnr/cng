import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ExpressionToken } from '../types/game';

interface Props {
  tokens: ExpressionToken[];
  cursorPos: number;
  result: number | null;
  target: number;
  onTokenPress: (index: number) => void;
  /** When false, cursor is hidden and the blink timer is not started. Default: true */
  cursorActive?: boolean;
  /** When false, the "= result" row is not rendered. Default: true */
  showResult?: boolean;
  /** When true, the container uses compact single-line sizing. Default: false */
  compact?: boolean;
}

export default function ExpressionDisplay({ tokens, cursorPos, result, target, onTokenPress, cursorActive = true, showResult = true, compact = false }: Props) {
  const [cursorVisible, setCursorVisible] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!cursorActive) { setCursorVisible(false); return; }
    setCursorVisible(true);
    timerRef.current = setInterval(() => setCursorVisible(v => !v), 530);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cursorPos, tokens.length, cursorActive]);

  const resultColor =
    result === null ? '#888'
    : result === target ? '#4caf50'
    : Math.abs(result - target) <= 10 ? '#ff9800'
    : '#90caf9';

  const cursor = (
    <Text key="cursor" style={[styles.tick, styles.tickActive, !cursorVisible && styles.tickHidden]}>
      |
    </Text>
  );

  let exprContent: React.ReactNode;
  if (tokens.length === 0) {
    exprContent = (
      <>
        {cursor}
        <Text style={styles.placeholder}>Tap numbers and operators...</Text>
      </>
    );
  } else {
    const parts: React.ReactNode[] = [];

    // Tappable gap before the first token (cursor position 0)
    parts.push(
      <TouchableOpacity key="gap-0" onPress={() => onTokenPress(0)} style={styles.gap}>
        <Text style={[styles.tick, cursorPos === 0 && (cursorVisible ? styles.tickActive : styles.tickHidden)]}>|</Text>
      </TouchableOpacity>
    );

    tokens.forEach((token, index) => {
      parts.push(
        <Text key={`t-${index}`} style={styles.token}>{token.display}</Text>
      );
      // Tappable gap after each token (cursor position index + 1)
      const isActive = cursorPos === index + 1;
      parts.push(
        <TouchableOpacity key={`gap-${index + 1}`} onPress={() => onTokenPress(index + 1)} style={styles.gap}>
          <Text style={[styles.tick, isActive && (cursorVisible ? styles.tickActive : styles.tickHidden)]}>|</Text>
        </TouchableOpacity>
      );
    });

    exprContent = parts;
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.exprRow}>
        {exprContent}
      </View>
      {showResult && (
        <View style={styles.resultRow}>
          <Text style={[styles.result, { color: resultColor }]}>
            {result !== null ? `= ${result}` : ' '}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    minHeight: 116,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  containerCompact: {
    padding: 6,
    minHeight: 0,
    marginBottom: 0,
    borderRadius: 6,
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
  gap: {
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tick: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.1)',
    fontWeight: '200',
    fontFamily: 'monospace',
  },
  tickActive: {
    color: '#64b5f6',
  },
  tickHidden: {
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
  },
  resultRow: {
    justifyContent: 'flex-end',
  },
});
