// Save data shape + safe localStorage access + merge strategy for cloud sync.

export type Settings = {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  animations: boolean;
};

export type Stats = {
  gamesPlayed: number;
  roundsPlayed: number;
  correct: number;
  wrong: number;
  coinsEarned: number;
};

export type DailyState = {
  date: string;
  score: number;
  best: number;
  streak: number;
  lastCompleted: string;
};

export type SaveData = {
  version: number;
  currentLevel: number;
  levelStars: Record<string, number>;
  levelScores: Record<string, number>;
  coins: number;
  achievements: string[];
  bestScore: number;
  highestCombo: number;
  daily: DailyState;
  endlessHigh: number;
  endlessBestRound: number;
  unlockedThemes: string[];
  theme: string;
  avatar: string;
  guestName: string;
  settings: Settings;
  stats: Stats;
  updatedAt: number;
};

export const STORAGE_KEY = "cmc:save:v1";

export function defaultSave(): SaveData {
  return {
    version: 1,
    currentLevel: 1,
    levelStars: {},
    levelScores: {},
    coins: 0,
    achievements: [],
    bestScore: 0,
    highestCombo: 0,
    daily: { date: "", score: 0, best: 0, streak: 0, lastCompleted: "" },
    endlessHigh: 0,
    endlessBestRound: 0,
    unlockedThemes: ["default"],
    theme: "default",
    avatar: "🎮",
    guestName: "Guest",
    settings: { sound: true, music: false, vibration: true, animations: true },
    stats: { gamesPlayed: 0, roundsPlayed: 0, correct: 0, wrong: 0, coinsEarned: 0 },
    updatedAt: 0,
  };
}

export function normalize(raw: unknown): SaveData {
  const base = defaultSave();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<SaveData>;
  return {
    ...base,
    ...r,
    levelStars: { ...base.levelStars, ...(r.levelStars ?? {}) },
    levelScores: { ...base.levelScores, ...(r.levelScores ?? {}) },
    achievements: Array.isArray(r.achievements) ? r.achievements : [],
    unlockedThemes: Array.isArray(r.unlockedThemes) && r.unlockedThemes.length
      ? Array.from(new Set(["default", ...r.unlockedThemes]))
      : base.unlockedThemes,
    daily: { ...base.daily, ...(r.daily ?? {}) },
    settings: { ...base.settings, ...(r.settings ?? {}) },
    stats: { ...base.stats, ...(r.stats ?? {}) },
  };
}

export function loadLocal(): SaveData {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function saveLocal(data: SaveData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable — keep playing in memory */
  }
}

export function clearLocal() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Conflict-safe merge: never lose progress, always keep the best of both. */
export function mergeSaves(a: SaveData, b: SaveData): SaveData {
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  const levelStars: Record<string, number> = { ...a.levelStars };
  for (const [k, v] of Object.entries(b.levelStars)) {
    levelStars[k] = Math.max(levelStars[k] ?? 0, v);
  }
  const levelScores: Record<string, number> = { ...a.levelScores };
  for (const [k, v] of Object.entries(b.levelScores)) {
    levelScores[k] = Math.max(levelScores[k] ?? 0, v);
  }
  return {
    ...newer,
    currentLevel: Math.max(a.currentLevel, b.currentLevel),
    coins: Math.max(a.coins, b.coins),
    bestScore: Math.max(a.bestScore, b.bestScore),
    highestCombo: Math.max(a.highestCombo, b.highestCombo),
    endlessHigh: Math.max(a.endlessHigh, b.endlessHigh),
    endlessBestRound: Math.max(a.endlessBestRound, b.endlessBestRound),
    levelStars,
    levelScores,
    achievements: Array.from(new Set([...a.achievements, ...b.achievements])),
    unlockedThemes: Array.from(new Set([...a.unlockedThemes, ...b.unlockedThemes])),
    daily: {
      ...newer.daily,
      best: Math.max(a.daily.best, b.daily.best),
      streak: Math.max(a.daily.streak, b.daily.streak),
    },
    stats: {
      gamesPlayed: Math.max(a.stats.gamesPlayed, b.stats.gamesPlayed),
      roundsPlayed: Math.max(a.stats.roundsPlayed, b.stats.roundsPlayed),
      correct: Math.max(a.stats.correct, b.stats.correct),
      wrong: Math.max(a.stats.wrong, b.stats.wrong),
      coinsEarned: Math.max(a.stats.coinsEarned, b.stats.coinsEarned),
    },
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}
