interface Props {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  actions?: React.ReactNode;
}

export function MobileHeader({ title, subtitle, onLogout, actions }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{title}</h1>
          {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
