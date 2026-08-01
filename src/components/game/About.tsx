import { ScreenHeader } from "./ScreenHeader";

export function About({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScreenHeader title="About" subtitle="Color Memory Challenge" onBack={onBack} />
      <section className="panel p-6 text-center">
        <p className="text-5xl">🧠</p>
        <h2 className="mt-2 text-2xl font-extrabold">Color Memory Challenge</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
          A fast-paced memory and observation game designed to test your focus, visual memory, and reaction speed.
        </p>
        <hr className="my-6 border-[var(--border)]" />
        <p className="text-lg font-extrabold">Created &amp; Designed by Satish Paskanti</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Game Concept • Game Design • Development</p>
        <p className="mt-6 text-xs text-[var(--muted-foreground)]">Version 1.0</p>
      </section>

      <section className="panel mt-4 p-5">
        <h3 className="font-extrabold">How to play</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
          <li>Colored tiles light up for a few seconds — memorise where they are.</li>
          <li>The colors disappear. From level 20 the grid may also slide one row or column.</li>
          <li>Tap the tile matching the requested color (or every highlighted tile).</li>
          <li>Build combos for score multipliers, earn coins, and keep your three lives.</li>
        </ol>
      </section>
    </div>
  );
}
