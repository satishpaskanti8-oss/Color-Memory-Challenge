// Static game configuration: colors, level curve, themes, achievements, avatars.

export type TileColor = {
  id: string;
  name: string;
  /** CSS color used for the tile face */
  css: string;
  /** Accessibility glyph so colors are never the only signal */
  glyph: string;
};

export const PALETTE: TileColor[] = [
  { id: "red", name: "Red", css: "oklch(0.63 0.24 27)", glyph: "▲" },
  { id: "blue", name: "Blue", css: "oklch(0.62 0.19 255)", glyph: "●" },
  { id: "green", name: "Green", css: "oklch(0.72 0.19 145)", glyph: "■" },
  { id: "yellow", name: "Yellow", css: "oklch(0.85 0.17 95)", glyph: "★" },
  { id: "purple", name: "Purple", css: "oklch(0.60 0.21 305)", glyph: "◆" },
  { id: "orange", name: "Orange", css: "oklch(0.72 0.19 55)", glyph: "⬟" },
  { id: "cyan", name: "Cyan", css: "oklch(0.79 0.14 195)", glyph: "✚" },
  { id: "pink", name: "Pink", css: "oklch(0.72 0.20 350)", glyph: "❤" },
  { id: "lime", name: "Lime", css: "oklch(0.86 0.20 130)", glyph: "✦" },
  { id: "indigo", name: "Indigo", css: "oklch(0.52 0.20 275)", glyph: "◼" },
];

export type LevelConfig = {
  level: number;
  grid: number;
  memoryMs: number;
  colors: number;
  rounds: number;
  moving: boolean;
  extreme: boolean;
  label: string;
};

/** Difficulty curve from the game design doc (levels 1-50). */
export function getLevelConfig(level: number): LevelConfig {
  let grid = 4;
  let memory = 5000;
  let colors = 3;
  let moving = false;
  let extreme = false;

  if (level <= 2) { grid = 4; memory = 5000; colors = 3; }
  else if (level === 3) { grid = 4; memory = 5000; colors = 4; }
  else if (level === 4) { grid = 4; memory = 5000; colors = 4; }
  else if (level <= 6) { grid = 5; memory = 5000; colors = 6; }
  else if (level === 7) { grid = 5; memory = 5000; colors = 7; }
  else if (level === 8) { grid = 5; memory = 5000; colors = 7; }
  else if (level === 9) { grid = 5; memory = 5000; colors = 8; }
  else if (level <= 16) { grid = 6; memory = 5000; colors = 8; }
  else if (level <= 18) { grid = 6; memory = 5000; colors = 8; }
  else if (level === 19) { grid = 6; memory = 5000; colors = 8; }
  else if (level <= 30) { grid = 7; memory = 5000; colors = 8; moving = true; }
  else if (level <= 32) { grid = 7; memory = 5000; colors = 8; moving = true; }
  else if (level <= 36) { grid = 7; memory = 5000; colors = 8; moving = true; }
  else if (level <= 39) { grid = 8; memory = 5000; colors = 8; extreme = true; moving = true; }
  else if (level <= 46) { grid = 8; memory = 5000; colors = 8; extreme = true; moving = true; }
  else if (level <= 48) { grid = 8; memory = 5000; colors = 9; extreme = true; moving = true; }
  else if (level === 49) { grid = 8; memory = 5000; colors = 10; extreme = true; moving = true; }
  else { grid = 8; memory = 5000; colors = 10; extreme = true; moving = true; }

  const rounds = Math.min(10, 5 + Math.floor((level - 1) / 6));

  const tags: string[] = [];
  if (moving) tags.push("Moving");
  if (extreme) tags.push("Extreme");
  if (memory <= 1500) tags.push("Fast");
  const label = tags.length ? tags.join(" • ") : "Normal";

  return { level, grid, memoryMs: memory, colors, rounds, moving, extreme, label };
}

export const TOTAL_LEVELS = 50;

/** How many tiles get highlighted in a round. */
export function tilesForRound(cfg: LevelConfig, round: number): number {
  const base = 1 + Math.floor(cfg.level / 8);
  const growth = Math.floor(round / 3);
  return Math.max(1, Math.min(cfg.colors, Math.min(5, base + growth)));
}

export type Theme = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
};

export const THEMES: Theme[] = [
  { id: "default", name: "Classic", emoji: "🎨", price: 0, description: "The original midnight board" },
  { id: "neon", name: "Neon", emoji: "🌌", price: 500, description: "Electric magenta glow" },
  { id: "ocean", name: "Ocean", emoji: "🌊", price: 800, description: "Deep blue calm" },
  { id: "nature", name: "Nature", emoji: "🌲", price: 1000, description: "Forest greens" },
  { id: "dark", name: "Midnight", emoji: "🌙", price: 1200, description: "Pure contrast dark" },
  { id: "space", name: "Space", emoji: "🚀", price: 1500, description: "Cosmic violet" },
  { id: "galaxy", name: "Galaxy", emoji: "✨", price: 2000, description: "Nebula shimmer" },
  { id: "sunset", name: "Sunset", emoji: "🔥", price: 2500, description: "Warm amber dusk" },
  { id: "legend", name: "Legend", emoji: "🏆", price: 0, description: "Unlocked by finishing level 50" },
];

export type Achievement = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  reward: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_win", name: "First Win", emoji: "🏆", description: "Complete your first round", reward: 50 },
  { id: "combo_master", name: "Combo Master", emoji: "🔥", description: "Reach a 10× combo", reward: 200 },
  { id: "speed_master", name: "Speed Master", emoji: "⚡", description: "Clear a level with 1.5s memory time", reward: 250 },
  { id: "memory_master", name: "Memory Master", emoji: "🧠", description: "Complete level 20", reward: 300 },
  { id: "perfect_player", name: "Perfect Player", emoji: "👑", description: "Finish a level without losing a life", reward: 150 },
  { id: "accuracy_expert", name: "Accuracy Expert", emoji: "🎯", description: "Finish a level with 100% accuracy", reward: 200 },
  { id: "coin_collector", name: "Coin Collector", emoji: "🪙", description: "Earn 2,000 coins in total", reward: 100 },
  { id: "daily_streak", name: "Daily Devotee", emoji: "📅", description: "Reach a 3 day challenge streak", reward: 250 },
  { id: "endless_1000", name: "Endless Runner", emoji: "♾️", description: "Score 1,000 in Endless Mode", reward: 200 },
  { id: "champion_50", name: "Level 50 Champion", emoji: "🥇", description: "Complete all 50 levels", reward: 1000 },
  { id: "memory_legend", name: "Memory Legend", emoji: "🎉", description: "Beat the final challenge", reward: 1500 },
];

export type Avatar = { id: string; emoji: string; requirement: string; unlockedAt: (p: { level: number; achievements: number }) => boolean };

export const AVATARS: Avatar[] = [
  { id: "gamer", emoji: "🎮", requirement: "Always available", unlockedAt: () => true },
  { id: "cat", emoji: "🐱", requirement: "Always available", unlockedAt: () => true },
  { id: "fox", emoji: "🦊", requirement: "Always available", unlockedAt: () => true },
  { id: "robot", emoji: "🤖", requirement: "Reach level 5", unlockedAt: (p) => p.level >= 5 },
  { id: "alien", emoji: "👽", requirement: "Reach level 10", unlockedAt: (p) => p.level >= 10 },
  { id: "ninja", emoji: "🥷", requirement: "Reach level 20", unlockedAt: (p) => p.level >= 20 },
  { id: "wizard", emoji: "🧙", requirement: "Reach level 30", unlockedAt: (p) => p.level >= 30 },
  { id: "dragon", emoji: "🐲", requirement: "Reach level 40", unlockedAt: (p) => p.level >= 40 },
  { id: "crown", emoji: "👑", requirement: "Complete all 50 levels", unlockedAt: (p) => p.level > 50 },
  { id: "star", emoji: "🌟", requirement: "Unlock 5 achievements", unlockedAt: (p) => p.achievements >= 5 },
];
