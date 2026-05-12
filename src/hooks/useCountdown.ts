import { useEffect, useRef, useState } from 'react';

import { ScratchpadAction } from '../types/scratchpad';
import { TimerSettings } from '../contexts/TimerSettingsContext';

export function useCountdown(
  settings: TimerSettings,
  gamePhase: 'playing' | 'submitted',
  gameId: number,
  dispatch: React.Dispatch<ScratchpadAction>,
  hasAnyResult: boolean
): { secondsRemaining: number | null } {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasResultRef = useRef(hasAnyResult);
  hasResultRef.current = hasAnyResult;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!settings.enabled || gamePhase !== 'playing') {
      setSecondsRemaining(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    firedRef.current = false;
    const end = Date.now() + settings.durationSeconds * 1000;
    endTimeRef.current = end;
    setSecondsRemaining(settings.durationSeconds);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current! - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (hasResultRef.current) {
          dispatch({ type: 'SP_SUBMIT' });
        } else {
          dispatch({ type: 'SP_TIMEOUT' });
        }
      }
    }, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameId, settings.enabled, settings.durationSeconds, gamePhase, dispatch]);

  useEffect(() => {
    if (gamePhase === 'submitted' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [gamePhase]);

  return { secondsRemaining: settings.enabled ? secondsRemaining : null };
}
