'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@sar/shared';
import { useServices } from '../../hooks/useServices';
import { useErrorToast } from '../../hooks/useErrorToast';
import { AiInsightSections } from './AiInsightSections';

export function AiPortfolioInsightCard() {
  const { t, i18n } = useTranslation();
  const { fetchPortfolioAiInsightUseCase } = useServices();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<Awaited<
    ReturnType<typeof fetchPortfolioAiInsightUseCase.execute>
  > | null>(null);
  const [error, setError] = useState(false);

  useErrorToast(error, t('ai.loadFailed'));

  async function handleFetch() {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchPortfolioAiInsightUseCase.execute(normalizeLocale(i18n.language));
      setInsight(result);
      if (!result.enabled) setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-indigo-500/25 bg-indigo-950/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-indigo-100">{t('ai.portfolioTitle')}</h3>
          <p className="mt-1 text-xs text-indigo-200/70">{t('ai.portfolioDesc')}</p>
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          {loading ? t('ai.loading') : t('ai.fetchButton')}
        </button>
      </div>

      {insight?.enabled && insight.insight && (
        <div className="mt-4">
          <AiInsightSections insight={insight.insight} />
        </div>
      )}

      {insight && !insight.enabled && (
        <p className="mt-3 text-xs text-slate-500">{t('ai.disabled')}</p>
      )}
    </div>
  );
}
