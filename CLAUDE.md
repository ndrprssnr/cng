# Project: Countdown Numbers Game (CDC)

A React Native / Expo app implementing the Countdown numbers game (as seen on the UK TV show). The player is given 6 numbers and a 3-digit target and must reach (or get close to) the target using +, −, ×, ÷ and parentheses.

## Architecture

**Single mode: Scratchpad only.** Classic mode was removed.

```
src/
├── components/
│   ├── ExpressionDisplay.tsx   # Renders a tokenised expression with cursor and result
│   ├── NumberTile.tsx          # Tappable number tile (greyed out when used)
│   ├── OperatorButton.tsx      # Operator tap button (+, −, ×, ÷, (, ))
│   ├── ResultBanner.tsx        # Shown after submit: score + optional solver solution
│   ├── ScratchLine.tsx         # One row of the scratchpad (expression + result tile)
│   └── TargetDisplay.tsx       # Red card showing target number + solvability dot
├── hooks/
│   └── useScratchpadState.ts   # All game state + reducer + solver (self-contained)
├── logic/
│   ├── expressionEngine.ts     # Token evaluation (getLiveResult, evaluateExpression)
│   ├── gameSetup.ts            # generateNumbers(), generateTarget(), buildTiles()
│   ├── solver.ts               # Brute-force exact/closest solver
│   └── validation.ts          # canSubmit(), computeScore()
├── screens/
│   ├── GameScreen.tsx          # Root screen: mounts ScratchpadScreen inside SafeAreaView
│   └── ScratchpadScreen.tsx    # Full scratchpad UI (header, lines, footer)
└── types/
    ├── game.ts                 # Shared: Operator, NumberTileData, ExpressionToken, ScoreResult, BestSolution
    └── scratchpad.ts           # ScratchpadState, ScratchpadAction, ScratchLine, ResultTile
```

## Key design decisions

### Scratchpad mode
- Multiple expression lines; each line has its own result tile
- Result tiles from completed lines can be used as inputs in other lines (chaining)
- Tokens referencing another line's result carry `tileId = sourceLineId` (not `num-*`)
- Stale tokens: when a source line's result changes, consuming tokens are marked `stale: true` and shown struck-through
- Auto-append: when the active line gets a valid result and is the last line, a new empty line is added automatically
- **No auto-submit**: user always manually presses Submit

### Solver integration
- Solver runs inside `useScratchpadState` via `useEffect` on `state.gameId`
- Dispatches `SP_SOLUTION_READY` with `gameId` guard to discard stale results
- `solving: true` while pending → `TargetDisplay` dot pulses
- `exactSolvable: null` drives the pulsing animation (not a separate `solving` prop)

### TargetDisplay
- Large format only (compact mode removed)
- Solvability dot sits inline next to the "TARGET" label
- Dot colours: white pulsing = solving, green = solvable, dim red = unsolvable

### Best solution display
- After submit, `ResultBanner` shows the solver's best solution if:
  - User did **not** reach the target (always show), OR
  - User **did** reach the target but used **more** original number tiles than the solver (`state.tiles.filter(t => t.used).length > pre.numCount`)
- "Original numbers used" is counted from `state.tiles.filter(t => t.used).length` — correct for multi-line scratchpad (not token-counting within a single line)

### SP_NEW_GAME action
- Takes no arguments — generates fresh tiles and target internally via `buildTiles()` / `generateTarget()`

## What was removed
- Classic mode (single-expression, cursor-based input)
- `useGameState.ts` hook
- `ModeToggle.tsx` component
- `ActionButtons.tsx` component (cursor/clear bar — replaced by inline bar inside ScratchLine)
- `GameState` / `GameAction` types from `game.ts`
- Compact variant of `TargetDisplay`
- `solving` prop on `TargetDisplay` (animation driven purely by `exactSolvable === null`)
