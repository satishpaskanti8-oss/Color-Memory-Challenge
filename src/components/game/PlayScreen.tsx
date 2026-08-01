import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PALETTE, getLevelConfig, TOTAL_LEVELS, type LevelConfig } from "@/lib/game/config";
import {
  applyShift,
  comboMultiplier,
  createRound,
  dailyConfig,
  endlessConfig,
  expectedAnswers,
  roundScore,
  shiftLabel,
  starsFor,
  type Round,
} from "@/lib/game/engine";
import { useGame } from "@/lib/game/GameProvider";
import { sfx } from "@/lib/game/sound";
import { todayKey, yesterdayKey } from "@/lib/game/storage";
import { Confetti } from "./Confetti";

export type PlayMode = "level" | "daily" | "endless";

type Phase = "intro" | "memorize" | "shift" | "answer" | "correct" | "wrong" | "complete" | "over";

type Props = {
  mode: PlayMode;
  level: number;
  onExit: () => void;
  onPlayLevel: (level: number) => void;
};

const LIVES = 3;

export function PlayScreen({ mode, level, onExit, onPlayLevel }: Props) {
  const { save, update, unlock, buzz } = useGame();

  const [cfg, setCfg] = useState<LevelConfig>(() =>
    mode === "level" ? getLevelConfig(level) : mode === "daily" ? dailyConfig(todayKey()) : endlessConfig(1),
  );
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState<Round | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [floating, setFloating] = useState<{ id: number; text: string } | null>(null);
  const [mystery, setMystery] = useState<{ open: boolean; reward: string } | null>(null);
  const answerStart = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const totalRounds = mode === "endless" ? Infinity : cfg.rounds;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const beginRound = useCallback(
    (index: number, config: LevelConfig) => {
      clearTimers();
      const next = createRound(config, index);
      setRound(next);
      setPicked([]);
      setPhase("memorize");
      sfx.reveal();
      setCountdown(Math.ceil(config.memoryMs / 1000));
      const ticks = Math.ceil(config.memoryMs / 1000);
      for (let i = 1; i <= ticks; i++) {
        later(() => setCountdown(Math.max(0, ticks - i)), i * 1000);
      }
      later(() => {
        if (next.shift) {
          setPhase("shift");
          later(() => {
            answerStart.current = Date.now();
            setPhase("answer");
          }, 900);
        } else {
          answerStart.current = Date.now();
          setPhase("answer");
        }
      }, config.memoryMs);
    },
    [clearTimers, later],
  );

  const startGame = useCallback(() => {
    const config =
      mode === "level" ? getLevelConfig(level) : mode === "daily" ? dailyConfig(todayKey()) : endlessConfig(1);
    setCfg(config);
    setRoundIndex(0);
    setLives(LIVES);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setCorrect(0);
    setWrong(0);
    setCoinsEarned(0);
    update((d) => ({ ...d, stats: { ...d.stats, gamesPlayed: d.stats.gamesPlayed + 1 } }));
    beginRound(0, config);
  }, [beginRound, level, mode, update]);

  useEffect(() => {
    startGame();
    // Restart whenever the mode/level changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, level]);

  const finishLevel = useCallback(
    (finalScore: number, finalCorrect: number, finalWrong: number, livesLeft: number, maxCombo: number) => {
      clearTimers();
      const attempts = finalCorrect + finalWrong;
      const accuracy = attempts ? Math.round((finalCorrect / attempts) * 100) : 0;
      const stars = starsFor(accuracy, livesLeft);
      const bonus = mode === "level" ? 100 + level * 5 : 120;
      setCoinsEarned((c) => c + bonus);
      sfx.levelComplete();
      buzz([30, 60, 30]);

      update((d) => {
        const key = String(level);
        const next = { ...d };
        next.coins = d.coins + bonus;
        next.stats = { ...d.stats, coinsEarned: d.stats.coinsEarned + bonus };
        next.bestScore = Math.max(d.bestScore, finalScore);
        next.highestCombo = Math.max(d.highestCombo, maxCombo);
        if (mode === "level") {
          next.levelStars = { ...d.levelStars, [key]: Math.max(d.levelStars[key] ?? 0, stars) };
          next.levelScores = { ...d.levelScores, [key]: Math.max(d.levelScores[key] ?? 0, finalScore) };
          next.currentLevel = Math.max(d.currentLevel, Math.min(TOTAL_LEVELS + 1, level + 1));
          if (level === TOTAL_LEVELS) {
            next.unlockedThemes = Array.from(new Set([...d.unlockedThemes, "legend"]));
          }
        }
        if (mode === "daily") {
          const today = todayKey();
          const continued = d.daily.lastCompleted === yesterdayKey();
          const alreadyToday = d.daily.lastCompleted === today;
          next.daily = {
            date: today,
            score: finalScore,
            best: Math.max(d.daily.best, finalScore),
            streak: alreadyToday ? d.daily.streak : continued ? d.daily.streak + 1 : 1,
            lastCompleted: today,
          };
        }
        return next;
      });

      if (mode === "level") {
        if (livesLeft === LIVES) unlock("perfect_player");
        if (accuracy >= 100) unlock("accuracy_expert");
        if (cfg.memoryMs <= 1500) unlock("speed_master");
        if (level >= 20) unlock("memory_master");
        if (level === TOTAL_LEVELS) {
          unlock("champion_50");
          unlock("memory_legend");
        }
        if (level % 5 === 0) {
          const rewards = ["+250 coins", "Bonus life next run", "Score booster", "Sparkle effect", "+400 coins"];
          setMystery({ open: false, reward: rewards[Math.floor(Math.random() * rewards.length)]! });
        }
      }
      if (mode === "daily") unlock("first_win");
      setPhase("complete");
    },
    [buzz, cfg.memoryMs, clearTimers, level, mode, unlock, update],
  );

  const endGame = useCallback(
    (finalScore: number, maxCombo: number) => {
      clearTimers();
      sfx.gameOver();
      buzz(200);
      update((d) => ({
        ...d,
        bestScore: Math.max(d.bestScore, finalScore),
        highestCombo: Math.max(d.highestCombo, maxCombo),
        endlessHigh: mode === "endless" ? Math.max(d.endlessHigh, finalScore) : d.endlessHigh,
        endlessBestRound: mode === "endless" ? Math.max(d.endlessBestRound, roundIndex) : d.endlessBestRound,
      }));
      if (mode === "endless" && finalScore >= 1000) unlock("endless_1000");
      setPhase("over");
    },
    [buzz, clearTimers, mode, roundIndex, unlock, update],
  );

  const nextRound = useCallback(
    (nextIndex: number, currentScore: number, c: number, w: number, livesLeft: number, maxCombo: number) => {
      if (mode === "endless") {
        const config = endlessConfig(nextIndex + 1);
        setCfg(config);
        beginRound(nextIndex, config);
        return;
      }
      if (nextIndex >= totalRounds) {
        finishLevel(currentScore, c, w, livesLeft, maxCombo);
        return;
      }
      beginRound(nextIndex, cfg);
    },
    [beginRound, cfg, finishLevel, mode, totalRounds],
  );

  const handleWrong = useCallback(() => {
    sfx.wrong();
    buzz(120);
    const livesLeft = lives - 1;
    const w = wrong + 1;
    setLives(livesLeft);
    setWrong(w);
    setCombo(0);
    setPhase("wrong");
    update((d) => ({
      ...d,
      stats: { ...d.stats, wrong: d.stats.wrong + 1, roundsPlayed: d.stats.roundsPlayed + 1 },
    }));
    later(() => {
      if (livesLeft <= 0) {
        endGame(score, bestCombo);
      } else {
        const idx = roundIndex + 1;
        setRoundIndex(idx);
        nextRound(idx, score, correct, w, livesLeft, bestCombo);
      }
    }, 1400);
  }, [bestCombo, buzz, correct, endGame, later, lives, nextRound, roundIndex, score, update, wrong]);

  const handleCorrect = useCallback(() => {
    const elapsed = Date.now() - answerStart.current;
    const nextCombo = combo + 1;
    const gained = roundScore(cfg, nextCombo, elapsed);
    const coinGain = 10 + (nextCombo >= 5 ? 20 : nextCombo >= 3 ? 10 : 0);
    const newScore = score + gained;
    const maxCombo = Math.max(bestCombo, nextCombo);
    const c = correct + 1;

    sfx.correct();
    if (nextCombo >= 3) sfx.combo(nextCombo);
    sfx.coin();
    buzz(30);
    setScore(newScore);
    setCombo(nextCombo);
    setBestCombo(maxCombo);
    setCorrect(c);
    setCoinsEarned((v) => v + coinGain);
    setFloating({ id: Date.now(), text: `+${gained}` });
    setPhase("correct");

    update((d) => ({
      ...d,
      coins: d.coins + coinGain,
      highestCombo: Math.max(d.highestCombo, maxCombo),
      stats: {
        ...d.stats,
        correct: d.stats.correct + 1,
        roundsPlayed: d.stats.roundsPlayed + 1,
        coinsEarned: d.stats.coinsEarned + coinGain,
      },
    }));
    unlock("first_win");
    if (maxCombo >= 10) unlock("combo_master");

    later(() => {
      const idx = roundIndex + 1;
      setRoundIndex(idx);
      nextRound(idx, newScore, c, wrong, lives, maxCombo);
    }, 800);
  }, [bestCombo, buzz, cfg, combo, correct, later, lives, nextRound, roundIndex, score, unlock, update, wrong]);

  const answers = useMemo(() => (round ? expectedAnswers(round) : []), [round]);

  const onTileClick = (displayIndex: number) => {
    if (phase !== "answer" || !round) return;
    if (!answers.includes(displayIndex)) {
      setPicked((p) => [...p, displayIndex]);
      handleWrong();
      return;
    }
    if (picked.includes(displayIndex)) return;
    const nextPicked = [...picked, displayIndex];
    setPicked(nextPicked);
    if (nextPicked.length >= answers.length) {
      handleCorrect();
    } else {
      sfx.tick();
    }
  };

  const targetColor = round?.targetColorId ? PALETTE.find((c) => c.id === round.targetColorId) : null;

  // Map display index -> highlight (colors are shown during memorize, and again on a miss).
  const litByDisplayIndex = useMemo(() => {
    const map = new Map<number, (typeof PALETTE)[number]>();
    if (!round) return map;
    const showShifted = phase === "wrong";
    for (const h of round.highlights) {
      map.set(showShifted ? applyShift(h.index, round.grid, round.shift) : h.index, h.color);
    }
    return map;
  }, [phase, round]);

  const accuracy = correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const stars = starsFor(accuracy, lives);

  const title =
    mode === "level" ? `Level ${level}` : mode === "daily" ? "Daily Challenge" : `Endless · Round ${roundIndex + 1}`;

  if (phase === "complete") {
    return (
      <div className="relative mx-auto w-full max-w-lg px-4 py-10">
        <Confetti />
        <div className="panel animate-pop p-7 text-center">
          <p className="text-5xl">🎉</p>
          <h2 className="mt-3 text-3xl font-extrabold">
            {mode === "level" && level === TOTAL_LEVELS ? "MEMORY MASTER!" : "Level Complete!"}
          </h2>
          {mode === "level" && level === TOTAL_LEVELS && (
            <p className="mt-2 text-sm text-[var(--accent)]">
              You completed all 50 levels — Endless Mode and the Legend theme are unlocked!
            </p>
          )}
          <p className="mt-3 text-3xl" aria-label={`${stars} out of 3 stars`}>
            {"⭐".repeat(stars)}
            <span className="opacity-25">{"⭐".repeat(3 - stars)}</span>
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-left">
            <Stat label="Score" value={score.toLocaleString()} />
            <Stat label="Best score" value={Math.max(save.bestScore, score).toLocaleString()} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Best combo" value={`🔥 ${bestCombo}×`} />
            <Stat label="Coins earned" value={`🪙 ${coinsEarned}`} />
            <Stat label="Lives left" value={"❤️".repeat(lives) || "—"} />
          </dl>

          {mystery && (
            <div className="panel mt-5 p-4">
              {!mystery.open ? (
                <button
                  className="btn btn-primary w-full"
                  onClick={() => {
                    sfx.mystery();
                    setMystery({ ...mystery, open: true });
                    update((d) => ({ ...d, coins: d.coins + 250 }));
                  }}
                >
                  🎁 Open Mystery Box
                </button>
              ) : (
                <p className="animate-pop text-lg font-bold">🎁 You got: {mystery.reward} (+250 🪙)</p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {mode === "level" && level < TOTAL_LEVELS && (
              <button className="btn btn-primary" onClick={() => onPlayLevel(level + 1)}>
                Next level →
              </button>
            )}
            <button className="btn" onClick={startGame}>
              Replay
            </button>
            <button className="btn btn-ghost" onClick={onExit}>
              Main menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "over") {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-10">
        <div className="panel animate-pop p-7 text-center">
          <p className="text-5xl">💔</p>
          <h2 className="mt-3 text-3xl font-extrabold">Game Over</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Great effort — try that one again!</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-left">
            <Stat label="Final score" value={score.toLocaleString()} />
            <Stat label="Best score" value={Math.max(save.bestScore, score).toLocaleString()} />
            <Stat label="Highest combo" value={`🔥 ${bestCombo}×`} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label={mode === "endless" ? "Rounds survived" : "Level reached"} value={mode === "endless" ? String(roundIndex) : String(level)} />
            <Stat label="Coins earned" value={`🪙 ${coinsEarned}`} />
          </dl>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn btn-primary" onClick={startGame}>
              Try again
            </button>
            <button className="btn btn-ghost" onClick={onExit}>
              Main menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4">
      <header className="flex items-center justify-between gap-2">
        <button className="btn btn-ghost !min-h-10 !px-3 !text-sm" onClick={onExit}>
          ← Menu
        </button>
        <div className="text-center">
          <h1 className="text-lg font-extrabold sm:text-xl">{title}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            {cfg.grid}×{cfg.grid} · {(cfg.memoryMs / 1000).toFixed(1)}s · {cfg.label}
          </p>
        </div>
        <div className="text-right text-lg" aria-label={`${lives} lives left`}>
          {"❤️".repeat(lives)}
          <span className="opacity-30">{"🤍".repeat(LIVES - lives)}</span>
        </div>
      </header>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="stat-chip">🏅 {score.toLocaleString()}</span>
        <span className="stat-chip">🪙 {coinsEarned}</span>
        {combo > 1 && (
          <span key={combo} className="stat-chip animate-pop !bg-[var(--primary)] !text-[var(--primary-foreground)]">
            🔥 COMBO ×{combo} ({comboMultiplier(combo)}× pts)
          </span>
        )}
        {mode !== "endless" && (
          <span className="stat-chip">
            Round {Math.min(roundIndex + 1, cfg.rounds)}/{cfg.rounds}
          </span>
        )}
      </div>

      <div className="relative mt-4">
        {floating && (
          <span
            key={floating.id}
            className="animate-float-up pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 text-2xl font-extrabold text-[var(--success)]"
            onAnimationEnd={() => setFloating(null)}
          >
            {floating.text}
          </span>
        )}

        <div
          className={`panel p-2 sm:p-3 ${phase === "wrong" ? "animate-shake" : ""}`}
          style={{ boxShadow: phase === "correct" ? "0 0 0 3px var(--success)" : undefined }}
        >
          <div
            className="grid gap-1.5 sm:gap-2"
            style={{ gridTemplateColumns: `repeat(${cfg.grid}, minmax(0, 1fr))` }}
            role="grid"
            aria-label="Memory grid"
          >
            {Array.from({ length: cfg.grid * cfg.grid }, (_, i) => {
              const lit = (phase === "memorize" || phase === "wrong") && litByDisplayIndex.get(i);
              const chosen = picked.includes(i);
              const isRight = phase !== "memorize" && chosen && answers.includes(i);
              const isWrongPick = chosen && !answers.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  className={`tile ${lit ? "tile-lit" : ""}`}
                  style={{
                    backgroundColor: lit ? lit.css : undefined,
                    color: lit ? lit.css : undefined,
                    boxShadow: isRight
                      ? "0 0 0 3px var(--success)"
                      : isWrongPick
                        ? "0 0 0 3px var(--destructive)"
                        : undefined,
                  }}
                  onClick={() => onTileClick(i)}
                  disabled={phase !== "answer"}
                  aria-label={lit ? `${lit.name} tile` : `Tile ${i + 1}`}
                >
                  <span aria-hidden className="font-black" style={{ color: "oklch(0.15 0.02 280)" }}>
                    {lit ? lit.glyph : ""}
                  </span>
                  {isRight && <span aria-hidden className="absolute text-base">✅</span>}
                  {isWrongPick && <span aria-hidden className="absolute text-base">❌</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-20 text-center">
        {phase === "memorize" && (
          <p className="animate-pop text-lg font-bold">
            👀 Memorise! <span className="text-[var(--accent)]">{countdown}s</span>
          </p>
        )}
        {phase === "shift" && round?.shift && (
          <p className="animate-pop text-lg font-bold text-[var(--warning)]">{shiftLabel(round.shift)}</p>
        )}
        {phase === "answer" && (
          <p className="animate-pop text-lg font-bold">
            {targetColor ? (
              <>
                Tap the{" "}
                <span
                  className="rounded-lg px-2 py-1 text-[oklch(0.15_0.02_280)]"
                  style={{ backgroundColor: targetColor.css }}
                >
                  {targetColor.glyph} {targetColor.name}
                </span>{" "}
                tile
              </>
            ) : (
              <>Tap the highlighted tile{answers.length > 1 ? "s" : ""}</>
            )}
          </p>
        )}
        {phase === "correct" && <p className="animate-pop text-xl font-extrabold text-[var(--success)]">✅ Correct!</p>}
        {phase === "wrong" && (
          <p className="animate-pop text-lg font-bold text-[var(--destructive)]">
            ❌ Not quite — the right tile{answers.length > 1 ? "s are" : " is"} shown above.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-2">
      <dt className="text-xs text-[var(--muted-foreground)]">{label}</dt>
      <dd className="text-lg font-extrabold">{value}</dd>
    </div>
  );
}
