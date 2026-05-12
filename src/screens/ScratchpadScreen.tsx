import { ScratchpadAction, ScratchpadState } from '../types/scratchpad';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import NumberTile from '../components/NumberTile';
import { Operator } from '../types/game';
import OperatorButton from '../components/OperatorButton';
import React, { useState } from 'react';
import ResultBanner from '../components/ResultBanner';
import ScratchLine from '../components/ScratchLine';
import TargetDisplay from '../components/TargetDisplay';
import TimerSettingsModal from '../components/TimerSettingsModal';
import { useCountdown } from '../hooks/useCountdown';
import { useTheme } from '../theme/ThemeContext';
import { useTimerSettings } from '../contexts/TimerSettingsContext';

interface Props {
  state: ScratchpadState;
  dispatch: React.Dispatch<ScratchpadAction>;
  onNewGame: () => void;
}

export default function ScratchpadScreen({ state, dispatch, onNewGame }: Props) {
  const { theme } = useTheme();
  const isPlaying = state.phase === 'playing';
  const activeLine = state.lines.find(l => l.id === state.activeLineId);
  const cursorAtStart = (activeLine?.cursorPos ?? 0) === 0;
  const cursorAtEnd = (activeLine?.cursorPos ?? 0) === (activeLine?.expression.length ?? 0);

  const { settings } = useTimerSettings();
  const hasAnyResult = state.lines.some(l => l.result !== null);
  const { secondsRemaining } = useCountdown(settings, state.phase, state.gameId, dispatch, hasAnyResult);
  const [timerModalVisible, setTimerModalVisible] = useState(false);

  return (
    <View style={styles.safe}>
      {/* Fixed header — does not scroll */}
      <View style={[styles.header, { backgroundColor: theme.headerFooterBg }]}>
        <TargetDisplay
          target={state.target}
          exactSolvable={state.exactSolvable}
          timerSecondsRemaining={secondsRemaining}
          timerEnabled={settings.enabled}
          timerDurationSeconds={settings.durationSeconds}
          onTimerIconPress={() => setTimerModalVisible(true)}
        />

      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>

          {/* Scratch lines — paper container */}
          <View style={[styles.linesArea, { backgroundColor: theme.paperBg, borderColor: theme.paperBorder }]}>
            {(() => {
              const lineNumberMap = new Map(state.lines.map((l, i) => [l.id, i + 1]));
              return state.lines.map((line, idx) => {
                const rt = state.resultTiles.find(r => r.sourceLineId === line.id) ?? null;
                return (
                  <ScratchLine
                    key={line.id}
                    line={line}
                    isActive={line.id === state.activeLineId}
                    isLast={idx === state.lines.length - 1}
                    target={state.target}
                    resultTile={rt}
                    resultTileUsed={rt?.used ?? false}
                    lineNumber={lineNumberMap.get(line.id) ?? 0}
                    lineNumberMap={lineNumberMap}
                    onActivate={() => dispatch({ type: 'SP_SET_ACTIVE_LINE', lineId: line.id })}
                    onTokenPress={pos => dispatch({ type: 'SP_SET_CURSOR', lineId: line.id, pos })}
                    onResultTileTap={() => rt && dispatch({ type: 'SP_TAP_RESULT', resultId: rt.id })}
                  />
                );
              });
            })()}
          </View>



          {state.phase === 'submitted' && state.score !== null && (
            (() => {
              const candidateLines = state.lines.filter(l => l.result !== null);
              const bestLine = candidateLines.length > 0
                ? candidateLines.reduce((best, l) => {
                    const bestDiff = Math.abs((best.result as number) - state.target);
                    const lDiff = Math.abs((l.result as number) - state.target);
                    return lDiff < bestDiff ? l : best;
                  })
                : null;
              const result = bestLine?.result ?? state.target;
              return (
                <ResultBanner
                  score={state.score}
                  result={result}
                  target={state.target}
                  bestSolution={state.bestSolution}
                  timedOut={state.timedOut}
                />
              );
            })()
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.headerFooterBg }]}>
        {/* Number tiles — single row */}
        <View style={styles.tilesRow}>
          {state.tiles.map(tile => (
            <NumberTile
              key={tile.id}
              tile={tile}
              onPress={id => dispatch({ type: 'SP_TAP_TILE', tileId: id })}
              disabled={tile.used || !isPlaying}
            />
          ))}
        </View>

        {/* Operators */}
        {isPlaying && (
          <View style={styles.operatorsRow}>
            {(['+', '-', '×', '÷', '(', ')'] as Operator[]).map(op => (
              <OperatorButton
                key={op}
                operator={op}
                onPress={o => dispatch({ type: 'SP_TAP_OPERATOR', operator: o })}
                disabled={false}
              />
            ))}
          </View>
        )}
        {/* Navigation */}
        {isPlaying && (
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: theme.inlineBtnBg }, cursorAtStart && styles.navBtnDimmed]}
              onPress={() => dispatch({ type: 'SP_MOVE_CURSOR', delta: -1 })}
              disabled={cursorAtStart} activeOpacity={0.8}
            >
              <Text style={[styles.navBtnText, { color: theme.inlineBtnText }]}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: theme.inlineBtnBg }, cursorAtEnd && styles.navBtnDimmed]}
              onPress={() => dispatch({ type: 'SP_MOVE_CURSOR', delta: 1 })}
              disabled={cursorAtEnd} activeOpacity={0.8}
            >
              <Text style={[styles.navBtnText, { color: theme.inlineBtnText }]}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: theme.inlineBtnBg }]}
              onPress={() => dispatch({ type: 'SP_BACKSPACE' })}
              activeOpacity={0.8}
            >
              <Text style={[styles.navBtnText, { color: theme.inlineBtnText }]}>⌫</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: theme.inlineBtnBg }]}
              onPress={() => dispatch({ type: 'SP_CLEAR_LINE' })}
              activeOpacity={0.8}
            >
              <Text style={[styles.navBtnText, { color: theme.inlineBtnText }]}>⌧</Text>
            </TouchableOpacity>
          </View>
        )}
        {isPlaying && (
          <View style={styles.controlsRow}>
            <View style={styles.snapshotCol}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.inlineBtnBg, borderColor: theme.inlineBtnBorder }]}
                onPress={() => dispatch({ type: 'SP_SAVE_SNAPSHOT' })}
                activeOpacity={0.8}
              >
                <Text style={[styles.controlBtnText, { color: theme.inlineBtnText }]}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: theme.inlineBtnBg, borderColor: theme.inlineBtnBorder },
                  !state.snapshot && styles.actionBtnDisabled,
                ]}
                onPress={() => dispatch({ type: 'SP_RESTORE_SNAPSHOT' })}
                disabled={!state.snapshot}
                activeOpacity={0.8}
              >
                <Text style={[styles.controlBtnText, { color: state.snapshot ? theme.inlineBtnText : theme.actionBtnDisabledText }]}>
                  Restore {state.snapshot ? (state.snapshot.bestResult !== null ? `(${state.snapshot.bestResult})` : '(/)') : ''}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: theme.inlineBtnBg, borderColor: theme.inlineBtnBorder }]}
              onPress={() => dispatch({ type: 'SP_RESET' })}
              activeOpacity={0.8}
            >
              <Text style={[styles.controlBtnText, { color: theme.inlineBtnText }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}
        {isPlaying ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.actionBtnBg, borderColor: theme.actionBtnBorder },
              !state.lines.some(l => l.result !== null) && styles.actionBtnDisabled,
            ]}
            onPress={() => dispatch({ type: 'SP_SUBMIT' })}
            disabled={!state.lines.some(l => l.result !== null)}
            activeOpacity={0.8}
          >
            <Text style={[styles.submitText, { color: state.lines.some(l => l.result !== null) ? theme.actionBtnText : theme.actionBtnDisabledText }]}>Submit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.newGameBtn}
            onPress={onNewGame}
            activeOpacity={0.8}
          >
            <Text style={styles.newGameText}>New Game</Text>
          </TouchableOpacity>
        )}
      </View>
      <TimerSettingsModal visible={timerModalVisible} onClose={() => setTimerModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 6,
  },
  linesArea: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    marginBottom: 24,
  },
  actionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.2,
  },
  snapshotCol: {
    flex: 1,
    gap: 6,
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  operatorsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  navBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDimmed: {
    opacity: 0.3,
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  newGameBtn: {
    borderRadius: 10,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00695c',
    borderWidth: 1,
    borderColor: '#004d40',
  },
  newGameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
