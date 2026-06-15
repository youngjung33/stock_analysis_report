export function DesktopFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-6 py-3 text-center text-xs text-slate-500">
        Stock Portfolio Dashboard &copy; {new Date().getFullYear()}
      </div>
    </footer>
  );
}
