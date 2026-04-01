import React from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
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
          <TargetDisplay target={state.target} />

          <ExpressionDisplay
            tokens={state.expression}
            cursorPos={state.cursorPos}
            result={state.result}
            target={state.target}
          />

          <View style={styles.tilesRow}>
            {state.tiles.map(tile => (
              <NumberTile
                key={tile.id}
                tile={tile}
                onPress={id => dispatch({ type: 'TAP_TILE', tileId: id })}
                disabled={tile.used || state.phase === 'submitted'}
              />
            ))}
          </View>

          <View style={styles.operatorsRow}>
            {(['+', '-', '×', '÷'] as Operator[]).map(op => (
              <OperatorButton
                key={op}
                operator={op}
                onPress={o => dispatch({ type: 'TAP_OPERATOR', operator: o })}
                disabled={state.phase === 'submitted'}
              />
            ))}
            <View style={styles.parenGroup}>
              {(['(', ')'] as Operator[]).map(op => (
                <OperatorButton
                  key={op}
                  operator={op}
                  onPress={o => dispatch({ type: 'TAP_OPERATOR', operator: o })}
                  disabled={state.phase === 'submitted'}
                />
              ))}
            </View>
          </View>

          <ActionButtons
            onClear={() => dispatch({ type: 'CLEAR' })}
            onBackspace={() => dispatch({ type: 'BACKSPACE' })}
            onSubmit={() => dispatch({ type: 'SUBMIT' })}
            onNewGame={() => dispatch({ type: 'NEW_GAME' })}
            onCursorLeft={() => dispatch({ type: 'MOVE_CURSOR', delta: -1 })}
            onCursorRight={() => dispatch({ type: 'MOVE_CURSOR', delta: 1 })}
            submitEnabled={submitEnabled}
            cursorAtStart={state.cursorPos === 0}
            cursorAtEnd={state.cursorPos === state.expression.length}
            phase={state.phase}
          />

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
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 8,
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
});
