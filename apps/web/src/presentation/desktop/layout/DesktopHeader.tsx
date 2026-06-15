interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DesktopHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}
