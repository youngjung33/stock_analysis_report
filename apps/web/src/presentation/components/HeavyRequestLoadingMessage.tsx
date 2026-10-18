'use client';

import type { HeavyAnalysisKind } from '@sar/shared';
import { useHeavyRequestLoadingProgress } from '../hooks/useHeavyRequestLoadingProgress';

export function HeavyRequestLoadingMessage({
  active,
  kind,
}: {
  active: boolean;
  kind: HeavyAnalysisKind;
}) {
  const state = useHeavyRequestLoadingProgress(active, kind);
  if (!state) return null;

  return (
    <div className="heavy-loading space-y-2" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="heavy-loading__title text-slate-400">{state.title}</span>
        <span className="heavy-loading__percent tabular-nums text-slate-500">{state.percent}%</span>
      </div>
      <div
        className="sar-progress-track h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={state.percent}
        aria-label={state.title}
      >
        <div
          className="sar-progress-fill h-full rounded-full bg-indigo-500/90 transition-[width] duration-700 ease-out"
          style={{ width: `${state.percent}%` }}
        />
      </div>
      <p className="heavy-loading__hint text-[11px] leading-relaxed text-slate-500">{state.hint}</p>
    </div>
  );
}
