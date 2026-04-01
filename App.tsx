import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import GameScreen from './src/screens/GameScreen';

export default function App() {
  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
  }, []);

  return (
    <>
      <StatusBar style="light" hidden />
      <GameScreen />
    </>
  );
}
