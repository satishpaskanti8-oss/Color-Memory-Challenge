import { useState } from "react";

import { useGame } from "@/lib/game/GameProvider";
import { sfx } from "@/lib/game/sound";
import { todayKey } from "@/lib/game/storage";
import { ScreenHeader } from "./ScreenHeader";

const BOX_PRICE = 500;

const REWARDS = [
  { label: "+300 coins", coins: 300 },
  { label: "+600 coins", coins: 600 },
  { label: "+150 coins & a sparkle", coins: 150 },
  { label: "+1,000 coins jackpot", coins: 1000 },
  { label: "+400 coins", coins: 400 },
];

export function Rewards({ onBack }: { onBack: () => void }) {
  const { save, update, showToast } = useGame();
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const bonusClaimed = save.daily.date === todayKey() && save.daily.score > 0;

  const openBox = () => {
    if (save.coins < BOX_PRICE) {
      showToast("🎁", "Not enough coins", `Mystery boxes cost ${BOX_PRICE} coins. Keep playing!`);
      return;
    }
    setOpening(true);
    setResult(null);
    sfx.mystery();
    update((d) => ({ ...d, coins: d.coins - BOX_PRICE }));
    setTimeout(() => {
      const reward = REWARDS[Math.floor(Math.random() * REWARDS.length)]!;
      update((d) => ({
        ...d,
        coins: d.coins + reward.coins,
        stats: { ...d.stats, coinsEarned: d.stats.coinsEarned + reward.coins },
      }));
      sfx.coin();
      setResult(reward.label);
      setOpening(false);
    }, 1200);
  };

  const claimDaily = () => {
    sfx.coin();
    update((d) => ({
      ...d,
      coins: d.coins + 100,
      stats: { ...d.stats, coinsEarned: d.stats.coinsEarned + 100 },
      daily: { ...d.daily, date: todayKey(), score: Math.max(d.daily.score, 1) },
    }));
    showToast("🪙", "Daily bonus claimed", "+100 coins added to your wallet.");
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScreenHeader title="Rewards" subtitle={`🪙 ${save.coins.toLocaleString()} coins`} onBack={onBack} />

      <section className="panel p-6 text-center">
        <p className={`text-6xl ${opening ? "animate-pop" : ""}`}>{opening ? "✨" : "🎁"}</p>
        <h2 className="mt-2 text-xl font-extrabold">Mystery Box</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Virtual rewards only — no real money, ever. Costs {BOX_PRICE} coins.
        </p>
        {result && <p className="animate-pop mt-3 text-lg font-extrabold text-[var(--success)]">You got {result}!</p>}
        <button className="btn btn-primary mt-4 w-full" onClick={openBox} disabled={opening}>
          {opening ? "Opening…" : `Open for 🪙 ${BOX_PRICE}`}
        </button>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-extrabold">🪙 Daily bonus</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Come back every day for free coins. Streak: 🔥 {save.daily.streak} day{save.daily.streak === 1 ? "" : "s"}
        </p>
        <button className="btn mt-3 w-full" onClick={claimDaily} disabled={bonusClaimed}>
          {bonusClaimed ? "Claimed today ✅" : "Claim +100 coins"}
        </button>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-extrabold">How to earn more</h2>
        <ul className="mt-2 space-y-1 text-sm text-[var(--muted-foreground)]">
          <li>✅ Correct answer — +10 coins</li>
          <li>🔥 Combo of 3+ — +10 / +20 bonus coins</li>
          <li>🏁 Level completion — +100 coins and up</li>
          <li>🏆 Achievements — up to +1,500 coins</li>
          <li>⚡ Daily challenge — special rewards</li>
        </ul>
      </section>
    </div>
  );
}
