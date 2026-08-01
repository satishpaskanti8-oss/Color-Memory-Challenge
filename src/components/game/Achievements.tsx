import { ACHIEVEMENTS } from "@/lib/game/config";
import { useGame } from "@/lib/game/GameProvider";
import { ScreenHeader } from "./ScreenHeader";

export function Achievements({ onBack }: { onBack: () => void }) {
  const { save } = useGame();
  const unlocked = new Set(save.achievements);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScreenHeader
        title="Achievements"
        subtitle={`${unlocked.size} of ${ACHIEVEMENTS.length} unlocked`}
        onBack={onBack}
      />
      <ul className="grid gap-3">
        {ACHIEVEMENTS.map((a) => {
          const done = unlocked.has(a.id);
          return (
            <li key={a.id} className={`panel flex items-center gap-3 p-4 ${done ? "" : "opacity-60"}`}>
              <span className="text-3xl">{done ? a.emoji : "🔒"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{a.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{a.description}</p>
              </div>
              <span className="stat-chip shrink-0">{done ? "✅ Done" : `🪙 ${a.reward}`}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
