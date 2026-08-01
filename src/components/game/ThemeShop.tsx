import { THEMES, TOTAL_LEVELS } from "@/lib/game/config";
import { useGame } from "@/lib/game/GameProvider";
import { sfx } from "@/lib/game/sound";
import { ScreenHeader } from "./ScreenHeader";

export function ThemeShop({ onBack }: { onBack: () => void }) {
  const { save, update, showToast } = useGame();

  const buy = (id: string, price: number, name: string) => {
    if (save.coins < price) {
      showToast("🪙", "Not enough coins", `You need ${price - save.coins} more coins for ${name}.`);
      return;
    }
    sfx.coin();
    update((d) => ({
      ...d,
      coins: d.coins - price,
      unlockedThemes: Array.from(new Set([...d.unlockedThemes, id])),
      theme: id,
    }));
    showToast("🎨", `${name} unlocked!`, "Theme applied — enjoy the new look.");
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScreenHeader title="Themes" subtitle={`🪙 ${save.coins.toLocaleString()} coins available`} onBack={onBack} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((t) => {
          const owned = save.unlockedThemes.includes(t.id);
          const active = save.theme === t.id;
          const legendLocked = t.id === "legend" && !owned;
          return (
            <li key={t.id} className="panel flex items-center gap-3 p-4">
              <span className="text-3xl">{owned ? t.emoji : "🔒"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{t.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{t.description}</p>
              </div>
              {active ? (
                <span className="stat-chip shrink-0">✅ Active</span>
              ) : owned ? (
                <button
                  className="btn !min-h-10 !px-3 !text-sm"
                  onClick={() => {
                    sfx.click();
                    update((d) => ({ ...d, theme: t.id }));
                  }}
                >
                  Apply
                </button>
              ) : legendLocked ? (
                <span className="stat-chip shrink-0">Level {TOTAL_LEVELS}</span>
              ) : (
                <button className="btn btn-primary !min-h-10 !px-3 !text-sm" onClick={() => buy(t.id, t.price, t.name)}>
                  🪙 {t.price}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
