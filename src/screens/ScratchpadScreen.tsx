import React from 'react';
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet,
} from 'react-native';
import { Operator } from '../types/game';
import { ScratchpadState, ScratchpadAction } from '../types/scratchpad';
import TargetDisplay from '../components/TargetDisplay';
import NumberTile from '../components/NumberTile';
import OperatorButton from '../components/OperatorButton';
import ResultBanner from '../components/ResultBanner';
import ScratchLine from '../components/ScratchLine';

interface Props {
  state: ScratchpadState;
  dispatch: React.Dispatch<ScratchpadAction>;
  onNewGame: () => void;
}

export default function ScratchpadScreen({ state, dispatch, onNewGame }: Props) {
  const isPlaying = state.phase === 'playing';

  return (
    <View style={styles.safe}>
      {/* Fixed header — does not scroll */}
      <View style={styles.header}>
        <TargetDisplay target={state.target} exactSolvable={state.exactSolvable} compact />

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
                    onDelete={() => dispatch({ type: 'SP_DELETE_LINE', lineId: line.id })}
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

            {isPlaying && (
              <TouchableOpacity
                style={styles.addLine}
                onPress={() => dispatch({ type: 'SP_ADD_LINE' })}
                activeOpacity={0.8}
              >
                <Text style={styles.addLineText}>+ Add line</Text>
              </TouchableOpacity>
            )}

            {isPlaying && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => dispatch({ type: 'SP_RESET' })}
                activeOpacity={0.8}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
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

      <View style={styles.footer}>
        {isPlaying ? (
          <TouchableOpacity
            style={[
              styles.submit,
              !state.lines.some(l => l.result !== null) && styles.submitDisabled,
            ]}
            onPress={() => dispatch({ type: 'SP_SUBMIT' })}
            disabled={!state.lines.some(l => l.result !== null)}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.newGame} onPress={onNewGame} activeOpacity={0.8}>
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
    backgroundColor: '#0d1117',
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
    marginBottom: 12,
  },
  addLine: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#37474f',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addLineText: {
    color: '#607d8b',
    fontSize: 14,
    fontWeight: '600',
  },
  resetBtn: {
    marginTop: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b71c1c',
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#e57373',
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
    backgroundColor: '#0d1117',
  },
  submit: {
    backgroundColor: '#1565c0',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#263238',
    opacity: 0.5,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newGame: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  newGameText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
