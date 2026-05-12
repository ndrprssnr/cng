import React, { createContext, useContext, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'timer-settings';

export interface TimerSettings {
  enabled: boolean;
  durationSeconds: number;
}

const DEFAULTS: TimerSettings = { enabled: false, durationSeconds: 30 };

interface ContextValue {
  settings: TimerSettings;
  updateSettings: (partial: Partial<TimerSettings>) => void;
}

const TimerSettingsContext = createContext<ContextValue>({
  settings: DEFAULTS,
  updateSettings: () => {},
});

export function TimerSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        setSettings({
          enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULTS.enabled,
          durationSeconds: typeof parsed.durationSeconds === 'number'
            ? Math.min(300, Math.max(10, parsed.durationSeconds))
            : DEFAULTS.durationSeconds,
        });
      } catch { /* use defaults */ }
    });
  }, []);

  const updateSettings = (partial: Partial<TimerSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      if (next.durationSeconds < 10) next.durationSeconds = 10;
      if (next.durationSeconds > 300) next.durationSeconds = 300;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <TimerSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </TimerSettingsContext.Provider>
  );
}

export function useTimerSettings() {
  return useContext(TimerSettingsContext);
}
