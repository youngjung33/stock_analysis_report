'use client';

import { useState } from 'react';
import { KOREAN_TAX_RULES_REFERENCE } from '@sar/shared';
import { Surface } from '../../design-system';

export function TaxRulesReference() {
  const [open, setOpen] = useState(true);

  return (
    <Surface variant="section" className="space-y-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-base font-semibold">한국인 주식 세금 기준 (2026년 참고)</h3>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            국세청·소득세법 기준 요약 — {KOREAN_TAX_RULES_REFERENCE.length}개 항목
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{open ? '접기' : '펼치기'}</span>
      </button>

      {open && (
        <div className="space-y-3">
          {KOREAN_TAX_RULES_REFERENCE.map((rule) => (
            <article
              key={rule.id}
              className="rounded-lg border border-border bg-muted/30 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                  {rule.category}
                </span>
                <h4 className="text-sm font-semibold">{rule.title}</h4>
              </div>
              <p className="mt-2 text-xs text-muted-foreground md:text-sm">{rule.summary}</p>
              <dl className="mt-3 grid gap-2 text-xs md:grid-cols-3 md:text-sm">
                <div>
                  <dt className="text-muted-foreground">세율</dt>
                  <dd className="font-medium">{rule.rateLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">기준·공제</dt>
                  <dd className="font-medium">{rule.thresholdLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">신고</dt>
                  <dd className="font-medium">{rule.filingLabel}</dd>
                </div>
              </dl>
              {rule.notes.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-[11px] text-muted-foreground md:text-xs">
                  {rule.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </Surface>
  );
}
