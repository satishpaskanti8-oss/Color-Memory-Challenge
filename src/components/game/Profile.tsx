import { useState } from "react";

import { ACHIEVEMENTS, AVATARS, TOTAL_LEVELS } from "@/lib/game/config";
import { useGame } from "@/lib/game/GameProvider";
import { sfx } from "@/lib/game/sound";
import { ScreenHeader } from "./ScreenHeader";

export function Profile({ onBack, onSignIn }: { onBack: () => void; onSignIn: () => void }) {
  const { save, session, profile, updateProfile, signOut, syncState } = useGame();
  const [name, setName] = useState(profile?.username ?? save.guestName);
  const [saving, setSaving] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  const levelsDone = Object.keys(save.levelStars).length;
  const totalStars = Object.values(save.levelStars).reduce((a, b) => a + b, 0);
  const attempts = save.stats.correct + save.stats.wrong;
  const accuracy = attempts ? Math.round((save.stats.correct / attempts) * 100) : 0;
  const unlockedAvatars = AVATARS.filter((a) =>
    a.unlockedAt({ level: save.currentLevel, achievements: save.achievements.length }),
  );

  const submit = async () => {
    const trimmed = name.trim().slice(0, 20);
    if (trimmed.length < 2) return;
    setSaving(true);
    await updateProfile({ username: trimmed });
    setSaving(false);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScreenHeader
        title="Profile"
        subtitle={session ? (syncState === "offline" ? "Offline — saved locally" : "Cloud save active") : "Guest — local save only"}
        onBack={onBack}
      />

      <section className="panel flex items-center gap-4 p-5">
        <span className="grid size-16 place-items-center rounded-2xl bg-[var(--input)] text-4xl">{save.avatar}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-extrabold">{profile?.username ?? save.guestName}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {session?.user.email ?? "Playing as guest"}
            {profile?.created_at ? ` · joined ${new Date(profile.created_at).toLocaleDateString()}` : ""}
          </p>
          <p className="mt-1 text-sm font-bold">
            Level {Math.min(save.currentLevel, TOTAL_LEVELS)} / {TOTAL_LEVELS}
          </p>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card label="Levels completed" value={`${levelsDone}`} />
        <Card label="Stars" value={`⭐ ${totalStars}`} />
        <Card label="Coins" value={`🪙 ${save.coins.toLocaleString()}`} />
        <Card label="Best score" value={save.bestScore.toLocaleString()} />
        <Card label="Highest combo" value={`🔥 ${save.highestCombo}×`} />
        <Card label="Achievements" value={`🏆 ${save.achievements.length}/${ACHIEVEMENTS.length}`} />
        <Card label="Daily streak" value={`🔥 ${save.daily.streak}`} />
        <Card label="Daily best" value={save.daily.best.toLocaleString()} />
        <Card label="Endless best" value={save.endlessHigh.toLocaleString()} />
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-extrabold">📊 Statistics</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <Card label="Games played" value={String(save.stats.gamesPlayed)} />
          <Card label="Rounds played" value={String(save.stats.roundsPlayed)} />
          <Card label="Correct answers" value={String(save.stats.correct)} />
          <Card label="Wrong answers" value={String(save.stats.wrong)} />
          <Card label="Overall accuracy" value={`${accuracy}%`} />
          <Card label="Total coins earned" value={save.stats.coinsEarned.toLocaleString()} />
        </dl>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-extrabold">🙂 Avatar</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {AVATARS.map((a) => {
            const unlocked = unlockedAvatars.includes(a);
            return (
              <button
                key={a.id}
                className={`grid size-12 place-items-center rounded-xl border text-2xl ${
                  save.avatar === a.emoji ? "border-[var(--primary)] bg-[var(--input)]" : "border-[var(--border)]"
                } ${unlocked ? "" : "opacity-40"}`}
                disabled={!unlocked}
                title={unlocked ? a.requirement : `Locked · ${a.requirement}`}
                onClick={() => {
                  sfx.click();
                  void updateProfile({ avatar: a.emoji });
                }}
              >
                {unlocked ? a.emoji : "🔒"}
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-extrabold">✏️ Edit profile</h2>
        <label className="mt-3 block text-sm font-bold" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-base"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          2–20 characters. Your email can't be changed here for security reasons.
        </p>
        <button className="btn btn-primary mt-3 w-full" onClick={() => void submit()} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </section>

      <section className="panel mt-4 p-5">
        {session ? (
          confirmOut ? (
            <div className="space-y-3">
              <p className="font-bold">Are you sure you want to log out?</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Your progress is synced first and stays safe in your account.
              </p>
              <div className="flex gap-2">
                <button className="btn btn-danger flex-1" onClick={() => void signOut()}>
                  Yes, log out
                </button>
                <button className="btn flex-1" onClick={() => setConfirmOut(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="btn w-full" onClick={() => setConfirmOut(true)}>
              🚪 Log out
            </button>
          )
        ) : (
          <>
            <p className="font-bold">Playing as Guest</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Create an account to securely save your progress and continue on any device. Your current progress will be
              transferred.
            </p>
            <button className="btn btn-primary mt-3 w-full" onClick={onSignIn}>
              Create account or log in
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-2">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  );
}
