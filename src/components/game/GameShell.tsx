import { useState } from "react";

import { About } from "@/components/game/About";
import { Achievements } from "@/components/game/Achievements";
import { AuthScreen } from "@/components/game/AuthScreen";
import { LevelSelect } from "@/components/game/LevelSelect";
import { MainMenu } from "@/components/game/MainMenu";
import { DailyScreen, EndlessScreen } from "@/components/game/ModeScreens";
import { PlayScreen } from "@/components/game/PlayScreen";
import { Profile } from "@/components/game/Profile";
import { Rewards } from "@/components/game/Rewards";
import { Settings } from "@/components/game/Settings";
import { ThemeShop } from "@/components/game/ThemeShop";
import type { Screen } from "@/components/game/types";
import { TOTAL_LEVELS } from "@/lib/game/config";
import { useGame } from "@/lib/game/GameProvider";

type Play = { mode: "level" | "daily" | "endless"; level: number };

export function GameShell() {
  const { save, loading, popup, dismissPopup } = useGame();
  const [screen, setScreen] = useState<Screen>("menu");
  const [play, setPlay] = useState<Play | null>(null);

  const go = (s: Screen) => {
    if (s === "play") {
      setPlay({ mode: "level", level: Math.min(save.currentLevel, TOTAL_LEVELS) });
      setScreen("play");
      return;
    }
    setScreen(s);
  };
  const home = () => {
    setPlay(null);
    setScreen("menu");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pop text-5xl">🧠</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {screen === "play" && play ? (
        <PlayScreen
          mode={play.mode}
          level={play.level}
          onExit={home}
          onPlayLevel={(level) => setPlay({ mode: "level", level })}
        />
      ) : screen === "levels" ? (
        <LevelSelect
          onBack={home}
          onPlay={(level) => {
            setPlay({ mode: "level", level });
            setScreen("play");
          }}
        />
      ) : screen === "daily" ? (
        <DailyScreen
          onBack={home}
          onStart={() => {
            setPlay({ mode: "daily", level: 1 });
            setScreen("play");
          }}
        />
      ) : screen === "endless" ? (
        <EndlessScreen
          onBack={home}
          onStart={() => {
            setPlay({ mode: "endless", level: 1 });
            setScreen("play");
          }}
        />
      ) : screen === "achievements" ? (
        <Achievements onBack={home} />
      ) : screen === "themes" ? (
        <ThemeShop onBack={home} />
      ) : screen === "rewards" ? (
        <Rewards onBack={home} />
      ) : screen === "profile" ? (
        <Profile onBack={home} onSignIn={() => setScreen("auth")} />
      ) : screen === "auth" ? (
        <AuthScreen onBack={() => setScreen("profile")} onDone={home} />
      ) : screen === "settings" ? (
        <Settings onBack={home} />
      ) : screen === "about" ? (
        <About onBack={home} />
      ) : (
        <MainMenu go={go} />
      )}

      {popup && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4" onClick={dismissPopup}>
          <div className="panel animate-pop max-w-xs p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-5xl">{popup.emoji}</p>
            <h2 className="mt-2 text-xl font-extrabold">{popup.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{popup.text}</p>
            <button className="btn btn-primary mt-4 w-full" onClick={dismissPopup}>
              Nice!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
