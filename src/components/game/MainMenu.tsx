import { TOTAL_LEVELS } from "@/lib/game/config";
import { useGame } from "@/lib/game/GameProvider";
import { sfx } from "@/lib/game/sound";
import { todayKey } from "@/lib/game/storage";
import type { Screen } from "./types";

const MENU: { id: Screen; label: string; emoji: string; hint: string }[] = [
  { id: "play", label: "Play", emoji: "🎮", hint: "Continue your journey" },
  { id: "levels", label: "Levels", emoji: "🗺️", hint: "Pick any unlocked level" },
  { id: "daily", label: "Daily Challenge", emoji: "⚡", hint: "A new board every day" },
  { id: "endless", label: "Endless Mode", emoji: "♾️", hint: "Beat your high score" },
  { id: "achievements", label: "Achievements", emoji: "🏆", hint: "Trophies and rewards" },
  { id: "themes", label: "Themes", emoji: "🎨", hint: "Spend coins on new looks" },
  { id: "rewards", label: "Rewards", emoji: "🎁", hint: "Mystery boxes & bonuses" },
  { id: "profile", label: "Profile", emoji: "👤", hint: "Stats and account" },
  { id: "settings", label: "Settings", emoji: "⚙️", hint: "Sound, motion, reset" },
  { id: "about", label: "About", emoji: "ℹ️", hint: "Credits and version" },
];

export function MainMenu({ go }: { go: (s: Screen) => void }) {
  const { save, session, profile, syncState } = useGame();
  const name = profile?.username ?? save.guestName;
  const levelsDone = Object.keys(save.levelStars).length;
  const totalStars = Object.values(save.levelStars).reduce((a, b) => a + b, 0);
  const endlessUnlocked = save.currentLevel > TOTAL_LEVELS;
  const dailyDoneToday = save.daily.lastCompleted === todayKey();
  const progressPct = Math.round((Math.min(save.currentLevel - 1, TOTAL_LEVELS) / TOTAL_LEVELS) * 100);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <header className="animate-rise text-center">
        <p className="text-4xl">🧠</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Color Memory Challenge</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Watch the colors. Remember the tiles. Beat all {TOTAL_LEVELS} levels.
        </p>
      </header>

      <button
        className="panel animate-rise mt-5 flex w-full items-center gap-4 p-4 text-left"
        onClick={() => {
          sfx.click();
          go("profile");
        }}
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--input)] text-3xl">
          {save.avatar}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-extrabold">
            {session ? `Welcome back, ${name}! 👋` : `Playing as ${name}`}
          </span>
          <span className="block text-xs text-[var(--muted-foreground)]">
            {session
              ? syncState === "offline"
                ? "Offline mode — progress saved on this device"
                : "Progress synced to your account"
              : "Create an account to save progress on any device"}
          </span>
          <span className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-[var(--input)]">
            <span
              className="block h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
              style={{ width: `${progressPct}%` }}
            />
          </span>
          <span className="mt-1 block text-xs font-bold">
            Level {Math.min(save.currentLevel, TOTAL_LEVELS)} / {TOTAL_LEVELS}
          </span>
        </span>
      </button>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <span className="stat-chip">🪙 {save.coins.toLocaleString()}</span>
        <span className="stat-chip">⭐ {totalStars}</span>
        <span className="stat-chip">🏅 Best {save.bestScore.toLocaleString()}</span>
        <span className="stat-chip">🔥 Combo {save.highestCombo}×</span>
        <span className="stat-chip">✅ {levelsDone} cleared</span>
      </div>

      <button
        className="btn btn-primary animate-rise mt-5 w-full !min-h-16 !text-xl"
        onClick={() => {
          sfx.click();
          go("play");
        }}
      >
        ▶ {save.currentLevel > 1 ? `Continue — Level ${Math.min(save.currentLevel, TOTAL_LEVELS)}` : "Start Game"}
      </button>

      <nav className="mt-4 grid gap-3 sm:grid-cols-2">
        {MENU.slice(1).map((item) => {
          const locked = item.id === "endless" && !endlessUnlocked;
          return (
            <button
              key={item.id}
              className="panel flex items-center gap-3 p-4 text-left disabled:opacity-50"
              disabled={locked}
              onClick={() => {
                sfx.click();
                go(item.id);
              }}
            >
              <span className="text-2xl">{locked ? "🔒" : item.emoji}</span>
              <span className="min-w-0">
                <span className="block font-extrabold">{item.label}</span>
                <span className="block text-xs text-[var(--muted-foreground)]">
                  {locked
                    ? "Complete level 50 to unlock"
                    : item.id === "daily" && dailyDoneToday
                      ? `Today's best: ${save.daily.score.toLocaleString()} · 🔥 ${save.daily.streak} day streak`
                      : item.hint}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <p className="mt-8 text-center text-xs text-[var(--muted-foreground)]">
        Created &amp; Designed by Satish Paskanti · v1.0
      </p>
    </div>
  );
}
