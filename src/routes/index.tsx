import { createFileRoute } from "@tanstack/react-router";

import { GameShell } from "@/components/game/GameShell";
import { GameProvider } from "@/lib/game/GameProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Color Memory Challenge — 50-Level Color Memory Game" },
      {
        name: "description",
        content:
          "Memorise the colored tiles, beat 50 levels, build combos and unlock themes in Color Memory Challenge — a free brain-training memory game.",
      },
      { property: "og:title", content: "Color Memory Challenge — 50-Level Color Memory Game" },
      {
        property: "og:description",
        content: "Test your visual memory across 50 levels, daily challenges and endless mode. Play free in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
