// Pure round generation + scoring helpers. No React, easy to reason about and test.

import { PALETTE, type LevelConfig, type TileColor, tilesForRound } from "./config";

export type Shift = { dir: "left" | "right" | "up" | "down"; amount: number };

export type Highlight = { index: number; color: TileColor };

export type Round = {
  grid: number;
  highlights: Highlight[];
  /** When set, the player must tap the tile that had this color. Otherwise: tap every highlighted tile. */
  targetColorId: string | null;
  shift: Shift | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Where an original tile index ends up on screen after the grid shifts. */
export function applyShift(index: number, grid: number, shift: Shift | null): number {
  if (!shift) return index;
  const row = Math.floor(index / grid);
  const col = index % grid;
  const { dir, amount } = shift;
  if (dir === "left") return row * grid + (col - amount + grid) % grid;
  if (dir === "right") return row * grid + (col + amount) % grid;
  if (dir === "up") return ((row - amount + grid) % grid) * grid + col;
  return ((row + amount) % grid) * grid + col;
}

export function shiftLabel(shift: Shift): string {
  const arrows = { left: "⬅️", right: "➡️", up: "⬆️", down: "⬇️" } as const;
  const words = { left: "left", right: "right", up: "up", down: "down" } as const;
  return `${arrows[shift.dir]} The whole grid slid one ${shift.dir === "left" || shift.dir === "right" ? "column" : "row"} ${words[shift.dir]}`;
}

export function createRound(cfg: LevelConfig, roundIndex: number): Round {
  const total = cfg.grid * cfg.grid;
  const count = tilesForRound(cfg, roundIndex);
  const positions = shuffle(Array.from({ length: total }, (_, i) => i)).slice(0, count);
  const colors = shuffle(PALETTE.slice(0, cfg.colors)).slice(0, count);
  const highlights: Highlight[] = positions.map((index, i) => ({ index, color: colors[i] }));

  // With several colors on screen we ask for one specific color; a single tile just gets tapped.
  const targetColorId = highlights.length > 1 ? highlights[Math.floor(Math.random() * highlights.length)].color.id : null;

  const shift: Shift | null = cfg.moving
    ? { dir: (["left", "right", "up", "down"] as const)[Math.floor(Math.random() * 4)], amount: 1 }
    : null;

  return { grid: cfg.grid, highlights, targetColorId, shift };
}

/** Display-space indices that count as a correct answer. */
export function expectedAnswers(round: Round): number[] {
  const targets = round.targetColorId
    ? round.highlights.filter((h) => h.color.id === round.targetColorId)
    : round.highlights;
  return targets.map((h) => applyShift(h.index, round.grid, round.shift));
}

export function comboMultiplier(combo: number): number {
  if (combo >= 5) return 3;
  if (combo >= 3) return 2;
  return 1;
}

export function roundScore(cfg: LevelConfig, combo: number, elapsedMs: number): number {
  const base = 20 + cfg.level * 3 + (cfg.grid - 4) * 8 + Math.round((5000 - cfg.memoryMs) / 250);
  const speedBonus = Math.max(0, 40 - Math.floor(elapsedMs / 150));
  const extreme = cfg.extreme ? 1.25 : 1;
  const moving = cfg.moving ? 1.2 : 1;
  return Math.round((base + speedBonus) * comboMultiplier(combo) * extreme * moving);
}

export function starsFor(accuracy: number, livesLeft: number): number {
  if (accuracy >= 100 && livesLeft === 3) return 3;
  if (accuracy >= 80) return 2;
  return 1;
}

/** Endless mode difficulty ramps forever. */
export function endlessConfig(round: number): LevelConfig {
  const grid = Math.min(9, 4 + Math.floor(round / 4));
  const memoryMs = Math.max(700, 4000 - round * 140);
  const colors = Math.min(10, 3 + Math.floor(round / 3));
  return {
    level: 25 + round,
    grid,
    memoryMs,
    colors,
    rounds: Infinity,
    moving: round >= 8 && round % 3 === 0,
    extreme: round >= 12,
    label: "Endless",
  };
}

/** Deterministic daily challenge derived from the date, so everyone gets the same board. */
export function dailyConfig(dateKey: string): LevelConfig {
  let seed = 0;
  for (let i = 0; i < dateKey.length; i++) seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0;
  const grid = 5 + (seed % 3);
  const memoryMs = 1500 + (seed % 4) * 500;
  const colors = 5 + (seed % 5);
  return {
    level: 20,
    grid,
    memoryMs,
    colors,
    rounds: 8,
    moving: seed % 3 === 0,
    extreme: seed % 5 === 0,
    label: "Daily Challenge",
  };
}
