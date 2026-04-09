import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, PanResponder,
  Platform, StyleSheet,
} from 'react-native';
import { ScratchLine as ScratchLineData, ResultTile } from '../types/scratchpad';
import ExpressionDisplay from './ExpressionDisplay';

interface Props {
  line: ScratchLineData;
  isActive: boolean;
  target: number;
  resultTile: ResultTile | null;
  resultTileUsed: boolean;
  onTokenPress: (pos: number) => void;
  onActivate: () => void;
  onResultTileTap: () => void;
  onDelete: () => void;
}

const SWIPE_THRESHOLD = -60;

export default function ScratchLine({
  line,
  isActive,
  target,
  resultTile,
  resultTileUsed,
  onTokenPress,
  onActivate,
  onResultTileTap,
  onDelete,
}: Props) {
  const [swipeRevealed, setSwipeRevealed] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const isWeb = Platform.OS === 'web';

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8 && Math.abs(gs.dy) < 20,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, SWIPE_THRESHOLD));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < SWIPE_THRESHOLD / 2) {
          Animated.spring(translateX, { toValue: SWIPE_THRESHOLD, useNativeDriver: true }).start();
          setSwipeRevealed(true);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          setSwipeRevealed(false);
        }
      },
    })
  ).current;

  const resultColor =
    line.result === null ? '#888'
    : line.result === target ? '#4caf50'
    : Math.abs(line.result - target) <= 10 ? '#ff9800'
    : '#90caf9';

  const canTapResultTile = resultTile !== null && !resultTileUsed;

  return (
    <View style={styles.wrapper}>
      {/* Delete button revealed behind swipe (mobile) */}
      {!isWeb && (
        <TouchableOpacity style={styles.deleteBack} onPress={onDelete} activeOpacity={0.8}>
          <Text style={styles.deleteBackText}>🗑</Text>
        </TouchableOpacity>
      )}

      <Animated.View
        style={[
          styles.row,
          isActive && styles.rowActive,
          !isWeb && { transform: [{ translateX }] },
        ]}
        {...(!isWeb ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          style={styles.exprArea}
          onPress={onActivate}
          activeOpacity={1}
        >
          <ExpressionDisplay
            tokens={line.expression}
            cursorPos={line.cursorPos}
            result={line.result}
            target={target}
            onTokenPress={pos => { onActivate(); onTokenPress(pos); }}
            cursorActive={isActive}
            showResult={false}
            compact
          />
        </TouchableOpacity>

        <View style={styles.rightCol}>
          {/* Result tile button */}
          {resultTile !== null && (
            <TouchableOpacity
              style={[
                styles.resultTile,
                resultTileUsed && styles.resultTileUsed,
              ]}
              onPress={onResultTileTap}
              disabled={!canTapResultTile}
              activeOpacity={0.7}
            >
              <Text style={[styles.resultTileText, { color: resultColor }]}>
                {resultTile.value}
              </Text>
            </TouchableOpacity>
          )}

          {/* Trash icon — always visible on web, hidden on mobile (swipe instead) */}
          {isWeb && (
            <TouchableOpacity style={styles.trashBtn} onPress={onDelete} activeOpacity={0.7}>
              <Text style={styles.trashText}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  deleteBack: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 6,
    width: 56,
    backgroundColor: '#b71c1c',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBackText: {
    fontSize: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    borderColor: '#1565c0',
  },
  exprArea: {
    flex: 1,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
  },
  resultTile: {
    height: 32,
    minWidth: 44,
    borderRadius: 8,
    backgroundColor: '#263238',
    borderWidth: 1,
    borderColor: '#546e7a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  resultTileUsed: {
    opacity: 0.35,
  },
  resultTileText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  trashBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#37474f',
  },
  trashText: {
    fontSize: 16,
  },
});
