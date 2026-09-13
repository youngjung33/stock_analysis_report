'use client';

import type { AiInsightEnvelope } from '@sar/shared';

const SEVERITY_CLASS: Record<string, string> = {
  info: 'border-slate-700 bg-slate-950/40',
  watch: 'border-amber-500/30 bg-amber-950/20',
  highlight: 'border-violet-500/30 bg-violet-950/20',
};

export function AiInsightSections({ insight }: { insight: AiInsightEnvelope }) {
  return (
    <div className="space-y-3">
      {insight.sections.map((section) => (
        <article
          key={section.id}
          className={`rounded-xl border p-4 ${SEVERITY_CLASS[section.severity ?? 'info']}`}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {section.id}
          </span>
          <h4 className="mt-1 text-base font-semibold text-white">{section.title}</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{section.body}</p>
        </article>
      ))}
      <p className="text-[11px] leading-relaxed text-slate-500">{insight.disclaimer}</p>
    </div>
  );
}
