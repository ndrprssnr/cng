import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useScratchpadState } from '../hooks/useScratchpadState';
import ScratchpadScreen from './ScratchpadScreen';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';

function GameScreenInner() {
  const { state, dispatch } = useScratchpadState();
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScratchpadScreen
        state={state}
        dispatch={dispatch}
        onNewGame={() => dispatch({ type: 'SP_NEW_GAME' })}
      />
    </SafeAreaView>
  );
}

export default function GameScreen() {
  return (
    <ThemeProvider>
      <GameScreenInner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
