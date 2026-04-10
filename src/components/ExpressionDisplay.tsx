import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ExpressionToken } from '../types/game';
import { useTheme } from '../theme/ThemeContext';

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
  const { theme } = useTheme();
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
    result === null ? theme.resultNull
    : result === target ? theme.resultExact
    : Math.abs(result - target) <= 10 ? theme.resultClose
    : theme.resultFar;

  const cursor = (
    <Text key="cursor" style={[styles.tick, { color: theme.cursorActive }, !cursorVisible && styles.tickHidden]}>
      |
    </Text>
  );

  let exprContent: React.ReactNode;
  if (tokens.length === 0) {
    exprContent = (
      <>
        {cursor}
        <Text style={[styles.placeholder, { color: theme.placeholder }]}>Tap numbers and operators...</Text>
      </>
    );
  } else {
    const parts: React.ReactNode[] = [];

    parts.push(
      <TouchableOpacity key="gap-0" onPress={() => onTokenPress(0)} style={styles.gap}>
        <Text style={[styles.tick, { color: cursorPos === 0 ? (cursorVisible ? theme.cursorActive : 'transparent') : theme.cursorDefault }]}>|</Text>
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
          <Text style={[styles.token, { color: token.stale ? theme.tokenStale : theme.tokenText }, token.stale && styles.tokenStale]}>{token.display}</Text>
          {srcNum !== null && (
            <Text style={[styles.tokenSub, { color: token.stale ? theme.tokenSubStale : theme.tokenSubColor }]}>{srcNum}</Text>
          )}
        </View>
      );
      const isActive = cursorPos === index + 1;
      parts.push(
        <TouchableOpacity key={`gap-${index + 1}`} onPress={() => onTokenPress(index + 1)} style={styles.gap}>
          <Text style={[styles.tick, { color: isActive ? (cursorVisible ? theme.cursorActive : 'transparent') : theme.cursorDefault }]}>|</Text>
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
    fontFamily: 'monospace',
  },
  tokenStale: {
    textDecorationLine: 'line-through',
  },
  tokenWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tokenSub: {
    fontSize: 9,
    lineHeight: 14,
    marginBottom: 1,
  },
  gap: {
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tick: {
    fontSize: 20,
    fontWeight: '200',
    fontFamily: 'monospace',
  },
  tickHidden: {
    opacity: 0,
  },
  placeholder: {
    fontStyle: 'italic',
    fontSize: 15,
  },
});
