import { dailyConfig } from "@/lib/game/engine";
import { useGame } from "@/lib/game/GameProvider";
import { todayKey } from "@/lib/game/storage";
import { ScreenHeader } from "./ScreenHeader";

export function DailyScreen({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const { save } = useGame();
  const cfg = dailyConfig(todayKey());
  const playedToday = save.daily.lastCompleted === todayKey();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScreenHeader title="Daily Challenge" subtitle={new Date().toDateString()} onBack={onBack} />
      <section className="panel p-6 text-center">
        <p className="text-5xl">⚡</p>
        <h2 className="mt-2 text-xl font-extrabold">Today's Challenge</h2>
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          <li className="stat-chip">
            {cfg.grid}×{cfg.grid} grid
          </li>
          <li className="stat-chip">{(cfg.memoryMs / 1000).toFixed(1)}s memory</li>
          <li className="stat-chip">{cfg.colors} colors</li>
          <li className="stat-chip">{cfg.rounds} rounds</li>
          <li className="stat-chip">{cfg.label}</li>
        </ul>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Box label="Today's score" value={playedToday ? save.daily.score.toLocaleString() : "—"} />
          <Box label="Best daily" value={save.daily.best.toLocaleString()} />
          <Box label="Streak" value={`🔥 ${save.daily.streak}`} />
        </div>
        <button className="btn btn-primary mt-5 w-full" onClick={onStart}>
          {playedToday ? "Play again" : "Start challenge"}
        </button>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          A brand-new board is generated automatically every day at midnight.
        </p>
      </section>
    </div>
  );
}

export function EndlessScreen({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const { save } = useGame();
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScreenHeader title="Endless Mode" subtitle="How far can you go?" onBack={onBack} />
      <section className="panel p-6 text-center">
        <p className="text-5xl">♾️</p>
        <h2 className="mt-2 text-xl font-extrabold">Personal records</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Box label="Highest score" value={save.endlessHigh.toLocaleString()} />
          <Box label="Best round" value={String(save.endlessBestRound)} />
          <Box label="Best combo" value={`🔥 ${save.highestCombo}×`} />
          <Box label="All-time best" value={save.bestScore.toLocaleString()} />
        </div>
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          The grid grows and the memory time shrinks every round. Three lives, no finish line.
        </p>
        <button className="btn btn-primary mt-5 w-full" onClick={onStart}>
          Start endless run
        </button>
      </section>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-2">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  );
}
