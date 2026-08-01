export function ScreenHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <header className="mb-5 flex items-center gap-3">
      <button className="btn btn-ghost !min-h-11 !px-3 !text-sm" onClick={onBack}>
        ← Back
      </button>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="truncate text-xs text-[var(--muted-foreground)]">{subtitle}</p>}
      </div>
    </header>
  );
}
