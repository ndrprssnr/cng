import { createInitialState, reducer } from './useScratchpadState';
import { ScratchpadState } from '../types/scratchpad';

/**
 * Mirrors the hasAnyResult check used in ScratchpadScreen to decide
 * whether SP_SUBMIT or SP_TIMEOUT is dispatched when the timer expires.
 */
function hasSubmittableResult(state: ScratchpadState): boolean {
  return state.lines.some(l => l.result !== null) || state.snapshot?.bestResult != null;
}

describe('Timer expiry with snapshot result and empty scratchpad', () => {
  let baseState: ScratchpadState;

  beforeEach(() => {
    baseState = createInitialState(0);
    // Simulate: user had a result, saved snapshot, then cleared scratchpad
    baseState = {
      ...baseState,
      snapshot: {
        lines: baseState.lines.map((l, i) => i === 0
          ? { ...l, expression: [], cursorPos: 0, result: 250 }
          : l),
        tiles: baseState.tiles.map(t => ({ ...t, used: true })),
        activeLineId: baseState.lines[0].id,
        resultTiles: [],
        bestResult: 250,
      },
      // Current lines are completely empty (user cleared all after saving)
      lines: baseState.lines.map(l => ({ ...l, expression: [], cursorPos: 0, result: null })),
      target: 250,
    };
  });

  test('hasSubmittableResult should be true when snapshot has a result even if lines are empty', () => {
    // Lines are all empty
    expect(baseState.lines.some(l => l.result !== null)).toBe(false);
    // But the snapshot has a result
    expect(baseState.snapshot?.bestResult).toBe(250);
    // The combined check should detect the stored result
    expect(hasSubmittableResult(baseState)).toBe(true);
  });

  test('SP_SUBMIT should use snapshot bestResult when lines are empty', () => {
    const result = reducer(baseState, { type: 'SP_SUBMIT' });
    expect(result.phase).toBe('submitted');
    expect(result.submittedResult).toBe(250);
    expect(result.score?.diff).toBe(0);
    expect(result.score?.label).toBe('exact');
    expect(result.timedOut).toBe(false);
  });

  test('SP_TIMEOUT should NOT be dispatched when snapshot has a result (regression)', () => {
    // This test documents the bug: if SP_TIMEOUT is dispatched instead of SP_SUBMIT
    // when the user has a stored result, the stored result is lost.
    const timeoutResult = reducer(baseState, { type: 'SP_TIMEOUT' });
    expect(timeoutResult.timedOut).toBe(true);
    expect(timeoutResult.submittedResult).toBeNull();
    // ^ SP_TIMEOUT doesn't set submittedResult — proving that dispatching
    // SP_TIMEOUT in this scenario loses the user's stored work.

    // The correct outcome (SP_SUBMIT) should account for the snapshot:
    const submitResult = reducer(baseState, { type: 'SP_SUBMIT' });
    expect(submitResult.timedOut).toBe(false);
    expect(submitResult.submittedResult).toBe(250);
  });
});
