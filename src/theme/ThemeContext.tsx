import React, { createContext, useContext, useState } from 'react';
import { Theme, darkTheme, lightTheme } from './index';

interface ThemeContextValue {
  theme: Theme;
  themeName: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  themeName: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => setThemeName(n => (n === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme: themeName === 'dark' ? darkTheme : lightTheme, themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
