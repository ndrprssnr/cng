import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ExpressionToken } from '../types/game';

interface Props {
  tokens: ExpressionToken[];
  cursorPos: number;
  result: number | null;
  target: number;
  onTokenPress: (index: number) => void;
  cursorActive?: boolean;
  lineNumberMap?: Map<string, number>;
}

export default function ExpressionDisplay({ tokens, cursorPos, result, target, onTokenPress, cursorActive = true, lineNumberMap }: Props) {
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

    parts.push(
      <TouchableOpacity key="gap-0" onPress={() => onTokenPress(0)} style={styles.gap}>
        <Text style={[styles.tick, cursorPos === 0 && (cursorVisible ? styles.tickActive : styles.tickHidden)]}>|</Text>
      </TouchableOpacity>
    );

    tokens.forEach((token, index) => {
      const isResultRef =
        token.type === 'number' && token.tileId && !token.tileId.startsWith('num-');
      const srcNum = isResultRef && lineNumberMap
        ? (lineNumberMap.get(token.tileId!) ?? null)
        : null;

      parts.push(
        <View key={`t-${index}`} style={styles.tokenWrapper}>
          <Text style={[styles.token, token.stale && styles.tokenStale]}>{token.display}</Text>
          {srcNum !== null && (
            <Text style={[styles.tokenSub, token.stale && styles.tokenSubStale]}>{srcNum}</Text>
          )}
        </View>
      );
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
    <View style={styles.container}>
      <View style={styles.exprRow}>
        {exprContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 6,
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
  tokenStale: {
    color: '#e53935',
    textDecorationLine: 'line-through',
  },
  tokenWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tokenSub: {
    fontSize: 9,
    color: '#546e7a',
    lineHeight: 14,
    marginBottom: 1,
  },
  tokenSubStale: {
    color: '#b71c1c',
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
});
