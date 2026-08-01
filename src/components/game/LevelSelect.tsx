import { getLevelConfig, TOTAL_LEVELS } from "@/lib/game/config";
import { useGame } from "@/lib/game/GameProvider";
import { sfx } from "@/lib/game/sound";
import { ScreenHeader } from "./ScreenHeader";

export function LevelSelect({ onBack, onPlay }: { onBack: () => void; onPlay: (level: number) => void }) {
  const { save } = useGame();
  const unlockedThrough = Math.min(save.currentLevel, TOTAL_LEVELS);
  const totalStars = Object.values(save.levelStars).reduce((a, b) => a + b, 0);
  const progressPct = Math.round((Math.min(save.currentLevel - 1, TOTAL_LEVELS) / TOTAL_LEVELS) * 100);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <ScreenHeader
        title="Levels"
        subtitle={`Level ${unlockedThrough} / ${TOTAL_LEVELS} · ⭐ ${totalStars} of ${TOTAL_LEVELS * 3} stars`}
        onBack={onBack}
      />

      <div className="mb-5 h-3 w-full overflow-hidden rounded-full bg-[var(--input)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-[width]"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
          const level = i + 1;
          const locked = level > unlockedThrough;
          const stars = save.levelStars[String(level)] ?? 0;
          const cfg = getLevelConfig(level);
          return (
            <button
              key={level}
              className="panel flex flex-col items-center gap-1 p-3 disabled:opacity-40"
              disabled={locked}
              onClick={() => {
                sfx.click();
                onPlay(level);
              }}
              aria-label={locked ? `Level ${level} locked` : `Play level ${level}, ${stars} stars`}
            >
              <span className="text-lg font-extrabold">{locked ? "🔒" : level}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {cfg.grid}×{cfg.grid}
              </span>
              <span className="text-xs">
                {"⭐".repeat(stars)}
                <span className="opacity-25">{"⭐".repeat(3 - stars)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
