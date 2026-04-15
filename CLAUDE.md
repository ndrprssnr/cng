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
│   ├── GameScreen.tsx          # Root screen: mounts ScratchpadScreen inside SafeAreaView; provides ThemeProvider
│   └── ScratchpadScreen.tsx    # Full scratchpad UI (header, lines, footer)
├── theme/
│   ├── index.ts                # Theme interface + darkTheme + lightTheme token objects
│   └── ThemeContext.tsx        # ThemeProvider, useTheme() hook
└── types/
    ├── game.ts                 # Shared: Operator, NumberTileData, ExpressionToken, ScoreResult, BestSolution
    └── scratchpad.ts           # ScratchpadState, ScratchpadAction, ScratchLine, ResultTile
```

## Key design decisions

### Theming
- Two themes: `darkTheme` (default) and `lightTheme`, defined in `src/theme/index.ts`
- All color values are theme tokens — no hardcoded colors in components or screens
- `ThemeProvider` wraps the app in `GameScreen`; components call `useTheme()` to access `theme`, `themeName`, and `toggleTheme`
- Toggle button is overlaid top-right on the `TargetDisplay` card (absolutely positioned, does not affect layout)
- Dynamic colors applied via inline styles; non-color properties use `StyleSheet.create`

### Scratchpad mode
- Exactly 5 fixed expression lines — no dynamic add or delete
- Each line has its own result tile; result tiles from completed lines can be used as inputs in other lines (chaining)
- Tokens referencing another line's result carry `tileId = sourceLineId` (not `num-*`)
- Stale tokens: when a source line's result changes, consuming tokens are marked `stale: true` and shown struck-through
- Placeholder text ("Tap numbers and operators...") shown only on line 1
- **No auto-submit**: user always manually presses Submit

### Expression engine
- Negative intermediate results are disallowed: `applyOp` returns `null` for any result `< 0`

### Paper-look expression area
- Outer container (`linesArea`) provides the background and border
- Each `ScratchLine` renders only a bottom rule (`borderBottomWidth: 1`); the last line suppresses it via `isLast` prop
- Active line rule uses `theme.rowActiveBorder`; inactive uses `theme.paperRule`

### Footer layout (top to bottom, fixed — does not scroll)
1. Number tiles row
2. Operator buttons row
3. Controls row: "Clear all" button (left) + stacked "Save" / "Restore" buttons (right), with 24px vertical margins above and below
4. Submit / New Game button (full width)

### Action buttons (Submit, Clear all, Save, Restore)
- Shared `actionBtn` style: `borderRadius: 10`, `paddingVertical: 12`
- Colors: `theme.actionBtnBg` (background), `theme.actionBtnText` (active text)
- Disabled state: `opacity: 0.2` on the button + `theme.actionBtnDisabledText` on the text (dark grey in light theme, white in dark theme)
- "Clear all" and the Submit/New Game button do not use `flex: 1`; "Clear all" gets `flex: 1` inline as it sits in a row next to the snapshot column

### Solver integration
- Solver runs inside `useScratchpadState` via `useEffect` on `state.gameId`
- Dispatches `SP_SOLUTION_READY` with `gameId` guard to discard stale results
- `exactSolvable: null` drives the pulsing animation in `TargetDisplay` (not a separate `solving` prop)
- Dot colours: white pulsing = solving, green = solvable, dim red = unsolvable

### Best solution display
- After submit, `ResultBanner` shows the solver's best solution if:
  - User did **not** reach the target (always show), OR
  - User **did** reach the target but used **more** original number tiles than the solver (`state.tiles.filter(t => t.used).length > pre.numCount`)
- "Original numbers used" is counted from `state.tiles.filter(t => t.used).length`

### SP_NEW_GAME action
- Takes no arguments — generates fresh tiles and target internally via `buildTiles()` / `generateTarget()`

### SP_RESET action
- Clears all 5 lines in place (keeps line IDs), frees all tiles, resets cursor to line 1

## What was removed
- Classic mode (single-expression, cursor-based input)
- `useGameState.ts` hook
- `ModeToggle.tsx` component
- `ActionButtons.tsx` component (cursor/clear bar — replaced by inline bar inside ScratchLine)
- `GameState` / `GameAction` types from `game.ts`
- Compact variant of `TargetDisplay`
- `solving` prop on `TargetDisplay` (animation driven purely by `exactSolvable === null`)
- Dynamic line add/delete (replaced by fixed 5 lines)
- Per-line delete button and swipe-to-delete gesture
