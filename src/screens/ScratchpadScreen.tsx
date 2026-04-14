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
import React from 'react';
import ResultBanner from '../components/ResultBanner';
import ScratchLine from '../components/ScratchLine';
import TargetDisplay from '../components/TargetDisplay';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  state: ScratchpadState;
  dispatch: React.Dispatch<ScratchpadAction>;
  onNewGame: () => void;
}

export default function ScratchpadScreen({ state, dispatch, onNewGame }: Props) {
  const { theme } = useTheme();
  const isPlaying = state.phase === 'playing';

  return (
    <View style={styles.safe}>
      {/* Fixed header — does not scroll */}
      <View style={[styles.header, { backgroundColor: theme.headerFooterBg }]}>
        <TargetDisplay target={state.target} exactSolvable={state.exactSolvable} />

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
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>

          {/* Scratch lines */}
          <View style={styles.linesArea}>
            {(() => {
              const lineNumberMap = new Map(state.lines.map((l, i) => [l.id, i + 1]));
              return state.lines.map(line => {
                const rt = state.resultTiles.find(r => r.sourceLineId === line.id) ?? null;
                return (
                  <ScratchLine
                    key={line.id}
                    line={line}
                    isActive={line.id === state.activeLineId}
                    isPlaying={isPlaying}
                    target={state.target}
                    resultTile={rt}
                    resultTileUsed={rt?.used ?? false}
                    lineNumber={lineNumberMap.get(line.id) ?? 0}
                    lineNumberMap={lineNumberMap}
                    onActivate={() => dispatch({ type: 'SP_SET_ACTIVE_LINE', lineId: line.id })}
                    onTokenPress={pos => dispatch({ type: 'SP_SET_CURSOR', lineId: line.id, pos })}
                    onResultTileTap={() => rt && dispatch({ type: 'SP_TAP_RESULT', resultId: rt.id })}
                    onCursorLeft={() => dispatch({ type: 'SP_MOVE_CURSOR', delta: -1 })}
                    onCursorRight={() => dispatch({ type: 'SP_MOVE_CURSOR', delta: 1 })}
                    onBackspace={() => dispatch({ type: 'SP_BACKSPACE' })}
                    onClear={() => dispatch({ type: 'SP_CLEAR_LINE' })}
                    cursorAtStart={line.cursorPos === 0}
                    cursorAtEnd={line.cursorPos === line.expression.length}
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
                />
              );
            })()
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.headerFooterBg }]}>
        {isPlaying && (
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: theme.resetBorder }]}
              onPress={() => dispatch({ type: 'SP_RESET' })}
              activeOpacity={0.8}
            >
              <Text style={[styles.resetBtnText, { color: theme.resetText }]}>Reset</Text>
            </TouchableOpacity>
            <View style={styles.snapshotCol}>
              <TouchableOpacity
                style={[styles.snapshotBtn, { borderColor: theme.snapshotBorder }]}
                onPress={() => dispatch({ type: 'SP_SAVE_SNAPSHOT' })}
                activeOpacity={0.8}
              >
                <Text style={[styles.snapshotBtnText, { color: theme.snapshotText }]}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.snapshotBtn,
                  { borderColor: state.snapshot ? theme.snapshotBorder : theme.snapshotBorderDisabled },
                  !state.snapshot && styles.snapshotBtnDisabled,
                ]}
                onPress={() => dispatch({ type: 'SP_RESTORE_SNAPSHOT' })}
                disabled={!state.snapshot}
                activeOpacity={0.8}
              >
                <Text style={[styles.snapshotBtnText, { color: theme.snapshotText }]}>
                  Restore {state.snapshot ? (state.snapshot.bestResult !== null ? `(${state.snapshot.bestResult})` : '(/)') : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {isPlaying ? (
          <TouchableOpacity
            style={[
              styles.submit,
              { backgroundColor: theme.submitBg },
              !state.lines.some(l => l.result !== null) && [styles.submitDisabled, { backgroundColor: theme.submitDisabledBg }],
            ]}
            onPress={() => dispatch({ type: 'SP_SUBMIT' })}
            disabled={!state.lines.some(l => l.result !== null)}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.newGame, { backgroundColor: theme.newGameBg }]}
            onPress={onNewGame}
            activeOpacity={0.8}
          >
            <Text style={styles.newGameText}>New Game</Text>
          </TouchableOpacity>
        )}
      </View>
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
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  snapshotCol: {
    flex: 1,
    gap: 6,
  },
  snapshotBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  snapshotBtnDisabled: {
    opacity: 0.4,
  },
  snapshotBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'nowrap',
    marginTop: 6,
  },
  operatorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  submit: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  newGame: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  newGameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
