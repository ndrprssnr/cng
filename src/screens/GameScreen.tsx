import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useScratchpadState } from '../hooks/useScratchpadState';
import ScratchpadScreen from './ScratchpadScreen';

export default function GameScreen() {
  const { state, dispatch } = useScratchpadState();

  return (
    <SafeAreaView style={styles.safe}>
      <ScratchpadScreen
        state={state}
        dispatch={dispatch}
        onNewGame={() => dispatch({ type: 'SP_NEW_GAME' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
});
