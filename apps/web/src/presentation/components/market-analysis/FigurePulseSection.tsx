'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Market, type FigureStatementSnapshot } from '@sar/shared';
import { stockDetailHref } from '../../shared/stock-routes';

const TONE_CLASS = {
  bullish: 'text-emerald-400',
  bearish: 'text-rose-400',
  neutral: 'text-slate-400',
} as const;

function sortStatements(statements: FigureStatementSnapshot[]): FigureStatementSnapshot[] {
  return [...statements].sort((a, b) => {
    if (a.impactTier !== b.impactTier) return a.impactTier - b.impactTier;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

function formatRelativeTime(iso: string, locale: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return locale.startsWith('ko') ? '1시간 이내' : '<1h ago';
  if (hours < 48) return locale.startsWith('ko') ? `${hours}시간 전` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale.startsWith('ko') ? `${days}일 전` : `${days}d ago`;
}

interface Props {
  figureStatements: FigureStatementSnapshot[];
  policyUncertainty: boolean;
}

/** 영향력 인물 발언 pulse — RSS/SNS 2차 소스 */
export function FigurePulseSection({ figureStatements, policyUncertainty }: Props) {
  const { t, i18n } = useTranslation();
  const sorted = useMemo(() => sortStatements(figureStatements).slice(0, 8), [figureStatements]);

  if (sorted.length === 0 && !policyUncertainty) return null;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-300">{t('market.figurePulse.title')}</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">{t('market.figurePulse.desc')}</p>
      </div>

      {policyUncertainty && (
        <p className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200/90">
          {t('market.figurePulse.policyUncertainty')}
        </p>
      )}

      {sorted.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {sorted.map((snap) => (
            <li
              key={snap.dedupeKey}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-white">{snap.figureName}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${TONE_CLASS[snap.tone]}`}
                >
                  {t(`market.figurePulse.tone.${snap.tone}`)}
                </span>
                <span className="rounded-full border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {snap.sourceChannel === 'rss'
                    ? t('market.figurePulse.sourceRss')
                    : t('market.figurePulse.sourceSns')}
                </span>
                <span className="text-[10px] text-slate-600">
                  {formatRelativeTime(snap.publishedAt, i18n.language)}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {snap.headline}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-600">
                  {t(`market.figurePulse.linkScope.${snap.linkScope}`)}
                </span>
                {snap.linkScope === 'symbol_direct' &&
                  snap.primarySymbols.slice(0, 3).map((symbol) => {
                    const market = /^\d{6}$/.test(symbol) ? Market.KR : Market.US;
                    return (
                    <Link
                      key={`${snap.dedupeKey}-${symbol}`}
                      href={stockDetailHref(symbol, market)}
                      className="rounded border border-indigo-900/60 px-1.5 py-0.5 text-[10px] text-indigo-300 hover:text-indigo-200"
                    >
                      {symbol}
                    </Link>
                    );
                  })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
