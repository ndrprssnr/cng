import { NumberTileData } from '../types/game';

const LARGE_NUMBERS = [25, 50, 75, 100];
const SMALL_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateNumbers(): number[] {
  // Weighted pick: 2 large = 60%, 1 large = 35%, 3 large = 5%
  const r = Math.random();
  const largeCount = r < 0.60 ? 2 : r < 0.95 ? 1 : 3;
  const largePick = shuffle(LARGE_NUMBERS).slice(0, largeCount);
  const smallCount = 6 - largeCount;
  const smallPick = Array.from({ length: smallCount }, () => pickRandom(SMALL_RANGE));
  return shuffle([...largePick, ...smallPick]);
}

export function generateTarget(): number {
  return Math.floor(Math.random() * 900) + 100; // 100–999
}

export function buildTiles(numbers: number[]): NumberTileData[] {
  return numbers.map((value, index) => ({
    id: `num-${index}`,
    value,
    used: false,
  }));
}
