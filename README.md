# Countdown — Numbers Game

A mobile puzzle game inspired by the Numbers Round from the TV show *Countdown*. Built with React Native and Expo, runs on Android, iOS, and in the browser.

---

## How to Play

You are given **6 numbers** — a mix of small numbers (1–10) and large numbers (25, 50, 75, 100) — and a **target** between 100 and 999.

Your goal is to combine the numbers using **addition, subtraction, multiplication, and division** to reach the target, or get as close as possible.

### Rules

- You may use any subset of the 6 numbers.
- Each number may only be used **once**.
- You may use parentheses to control the order of operations.
- Division is only allowed if it divides **exactly** (no fractions).
- All intermediate results must be **whole non-negative numbers**.

### Controls

1. Tap a **number tile** to add it to your expression.
2. Tap an **operator button** (`+` `-` `×` `÷` `(` `)`) to add an operator.
3. Use **◀ ▶** to move the cursor and insert tokens at any position.
4. Use **⌫** to delete the token before the cursor.
5. Use **✕** to clear the entire expression.
6. Tap **Submit** when you are happy with your expression.

### Scoring

| Result | Outcome |
|--------|---------|
| Exactly the target | You win! |
| Within 10 | So close! |
| More than 10 away | Better luck next time |

After submitting, the app reveals the best possible solution (or the closest reachable result if an exact solution does not exist).

### Hint

A small dot above the target number gives you a subtle clue:
- **Green dot** — an exact solution exists.
- **Soft red dot** — no exact solution is possible with these numbers.

---

## Technical Documentation

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| State management | React `useReducer` |
| Expression evaluation | Custom shunting-yard algorithm (no `eval()`) |
| Solver | Recursive brute-force search |
| Platforms | Android, iOS, Web |

---

### Prerequisites

#### All platforms

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org/) | 18 LTS or newer | Includes npm |
| npm | 9 or newer | Bundled with Node.js |

Install Node.js from [nodejs.org](https://nodejs.org/). Verify your installation:

```bash
node --version
npm --version
```

#### For Android builds (local)

| Tool | Notes |
|------|-------|
| [Android Studio](https://developer.android.com/studio) | Includes the Android SDK and emulator |
| Android SDK | API level 35 (installed via Android Studio → SDK Manager) |
| JDK 17 | Bundled with Android Studio; install separately if needed |
| [ADB](https://developer.android.com/tools/adb) | Bundled with Android Studio platform-tools |

After installing Android Studio, set the following environment variables:

**Windows:**
```
ANDROID_HOME = C:\Users\<you>\AppData\Local\Android\Sdk
JAVA_HOME    = C:\Program Files\Android\Android Studio\jbr
```
Add to `PATH`:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

**macOS / Linux:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk          # macOS
export ANDROID_HOME=$HOME/Android/Sdk                  # Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr  # macOS
```

---

### Installation

Clone or copy the project, then install dependencies:

```bash
cd cdc
npm install
```

---

### Running in Development

```bash
npm start
```

Metro Bundler starts and shows a QR code. Then:

| Key | Action |
|-----|--------|
| `w` | Open in browser (fastest on Windows, no setup needed) |
| `a` | Open in Android emulator (requires Android Studio) |
| `i` | Open in iOS simulator (macOS + Xcode only) |
| Scan QR | Open on a physical device with the [Expo Go](https://expo.dev/go) app |

The browser option (`w`) is the recommended development loop on Windows — it requires no native tooling and reflects changes instantly.

---

### Building an Android APK

A local Android build requires the Android SDK prerequisites listed above.

#### Step 1 — Generate the native Android project (first time only)

```bash
npx expo prebuild
```

This creates the `android/` directory. You only need to run this once, or again after adding native Expo plugins.

#### Step 2 — Build the release APK

```bash
npm run build:android
```

This runs Gradle's `assembleRelease` task. The output APK is located at:

```
android/app/build/outputs/apk/release/app-release.apk
```

#### Step 3 — Install on a device

Connect your Android device via USB with **USB debugging enabled** (Settings → Developer Options → USB Debugging), then:

```bash
npm run install:android
```

Alternatively, copy the APK file to the device and open it from the file manager. You may need to allow **Install from unknown sources** in the device security settings.

---

### Building via EAS (Cloud Build)

If you do not want to set up the Android SDK locally, Expo's cloud build service requires only Node.js and a free [Expo account](https://expo.dev).

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

When the build completes (typically 5–15 minutes), a download link for the APK is provided.

---

### Project Structure

```
cdc/
├── App.tsx                        # Entry point
├── app.json                       # Expo configuration (name, package, icons)
├── package.json
├── src/
│   ├── types/game.ts              # Shared TypeScript types
│   ├── logic/
│   │   ├── gameSetup.ts           # Number and target generation
│   │   ├── expressionEngine.ts    # Shunting-yard evaluator
│   │   ├── validation.ts          # Submission guard, scoring
│   │   └── solver.ts              # Brute-force best-solution finder
│   ├── hooks/
│   │   └── useGameState.ts        # useReducer — all game state and actions
│   ├── components/
│   │   ├── TargetDisplay.tsx
│   │   ├── ExpressionDisplay.tsx
│   │   ├── NumberTile.tsx
│   │   ├── OperatorButton.tsx
│   │   ├── ActionButtons.tsx
│   │   └── ResultBanner.tsx
│   └── screens/
│       └── GameScreen.tsx         # Main (and only) screen
└── assets/
```

---

### npm Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the Expo development server |
| `npm run android` | Run on Android via Expo (development build) |
| `npm run ios` | Run on iOS via Expo (macOS only) |
| `npm run web` | Run in the browser |
| `npm run build:android` | Build a release APK with Gradle |
| `npm run install:android` | Install the release APK via ADB |
