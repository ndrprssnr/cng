import React from 'react';
import { View, SafeAreaView, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useGameState } from '../hooks/useGameState';
import { canSubmit } from '../logic/validation';
import { Operator } from '../types/game';
import TargetDisplay from '../components/TargetDisplay';
import ExpressionDisplay from '../components/ExpressionDisplay';
import NumberTile from '../components/NumberTile';
import OperatorButton from '../components/OperatorButton';
import ActionButtons from '../components/ActionButtons';
import ResultBanner from '../components/ResultBanner';

export default function GameScreen() {
  const { state, dispatch } = useGameState();

  const submitEnabled = canSubmit(state.expression, state.result, state.tiles);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <TargetDisplay target={state.target} exactSolvable={state.exactSolvable} />

          <ExpressionDisplay
            tokens={state.expression}
            cursorPos={state.cursorPos}
            result={state.result}
            target={state.target}
            onTokenPress={pos => dispatch({ type: 'SET_CURSOR', pos })}
          />

          <View style={styles.tilesGrid}>
            {[0, 1].map(row => (
              <View key={row} style={styles.tilesRow}>
                {state.tiles.slice(row * 3, row * 3 + 3).map(tile => (
                  <NumberTile
                    key={tile.id}
                    tile={tile}
                    onPress={id => dispatch({ type: 'TAP_TILE', tileId: id })}
                    disabled={tile.used || state.phase === 'submitted'}
                  />
                ))}
              </View>
            ))}
          </View>

          {state.phase === 'playing' && (
            <View style={styles.operatorsRow}>
              {(['+', '-', '×', '÷'] as Operator[]).map(op => (
                <OperatorButton
                  key={op}
                  operator={op}
                  onPress={o => dispatch({ type: 'TAP_OPERATOR', operator: o })}
                  disabled={false}
                />
              ))}
              <View style={styles.parenGroup}>
                {(['(', ')'] as Operator[]).map(op => (
                  <OperatorButton
                    key={op}
                    operator={op}
                    onPress={o => dispatch({ type: 'TAP_OPERATOR', operator: o })}
                    disabled={false}
                  />
                ))}
              </View>
            </View>
          )}

          {state.phase === 'playing' && (
            <ActionButtons
              onClear={() => dispatch({ type: 'CLEAR' })}
              onBackspace={() => dispatch({ type: 'BACKSPACE' })}
              onCursorLeft={() => dispatch({ type: 'MOVE_CURSOR', delta: -1 })}
              onCursorRight={() => dispatch({ type: 'MOVE_CURSOR', delta: 1 })}
              cursorAtStart={state.cursorPos === 0}
              cursorAtEnd={state.cursorPos === state.expression.length}
            />
          )}

          {state.phase === 'submitted' && state.score !== null && state.result !== null && (
            <ResultBanner
              score={state.score}
              result={state.result}
              target={state.target}
              bestSolution={state.bestSolution}
            />
          )}
        </View>
      </ScrollView>

      {/* Sticky footer button */}
      <View style={styles.footer}>
        {state.phase === 'playing' ? (
          <TouchableOpacity
            style={[styles.submit, !submitEnabled && styles.submitDisabled]}
            onPress={() => dispatch({ type: 'SUBMIT' })}
            disabled={!submitEnabled}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.newGame}
            onPress={() => dispatch({ type: 'NEW_GAME' })}
            activeOpacity={0.8}
          >
            <Text style={styles.newGameText}>New Game</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  tilesGrid: {
    alignItems: 'center',
    marginBottom: 8,
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  operatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  parenGroup: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
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
