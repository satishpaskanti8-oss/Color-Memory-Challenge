import { useState } from "react";

import { useGame } from "@/lib/game/GameProvider";
import { sfx } from "@/lib/game/sound";
import { ScreenHeader } from "./ScreenHeader";

export function Settings({ onBack }: { onBack: () => void }) {
  const { save, update, session, resetProgress, deleteAccount, showToast } = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggle = (key: keyof typeof save.settings) => {
    update((d) => ({ ...d, settings: { ...d.settings, [key]: !d.settings[key] } }));
    sfx.click();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScreenHeader title="Settings" subtitle="Sound, motion and your data" onBack={onBack} />

      <section className="panel divide-y divide-[var(--border)] p-2">
        <Row label="🔊 Sound effects" value={save.settings.sound} onToggle={() => toggle("sound")} />
        <Row label="🎵 Background music" value={save.settings.music} onToggle={() => toggle("music")} />
        <Row label="📳 Vibration" value={save.settings.vibration} onToggle={() => toggle("vibration")} />
        <Row label="✨ Animations" value={save.settings.animations} onToggle={() => toggle("animations")} />
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-extrabold text-[var(--destructive)]">Danger zone</h2>

        {!confirmReset ? (
          <button className="btn mt-3 w-full" onClick={() => setConfirmReset(true)}>
            ♻️ Reset progress
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm font-bold">
              Resetting your progress will permanently remove your saved levels, stars, coins and achievements.
            </p>
            <div className="flex gap-2">
              <button
                className="btn btn-danger flex-1"
                onClick={() => {
                  void resetProgress();
                  setConfirmReset(false);
                  showToast("♻️", "Progress reset", "You're starting fresh from level 1.");
                }}
              >
                Yes, reset everything
              </button>
              <button className="btn flex-1" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {session &&
          (!confirmDelete ? (
            <button className="btn btn-ghost mt-3 w-full !text-[var(--destructive)]" onClick={() => setConfirmDelete(true)}>
              🗑️ Delete account
            </button>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm font-bold">
                Deleting your account permanently removes your game progress, achievements, coins, profile and
                statistics. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button className="btn btn-danger flex-1" onClick={() => void deleteAccount()}>
                  Delete my account
                </button>
                <button className="btn flex-1" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}

function Row({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <button className="flex w-full items-center justify-between gap-3 px-3 py-4 text-left" onClick={onToggle} role="switch" aria-checked={value}>
      <span className="font-bold">{label}</span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full border border-[var(--border)] transition-colors ${
          value ? "bg-[var(--primary)]" : "bg-[var(--input)]"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-[var(--foreground)] transition-[left] ${
            value ? "left-6" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
