'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Market, type StockSearchResult } from '@sar/shared';
import { normalizeLocale } from '@sar/shared';
import { useServices } from '../../hooks/useServices';
import { useErrorToast } from '../../hooks/useErrorToast';
import { resolveAiFetchErrorMessage } from './ai-error-message';
import { AiInsightSections } from './AiInsightSections';

export function AiStockInsightPanel({ selected }: { selected: StockSearchResult }) {
  const { t, i18n } = useTranslation();
  const { fetchStockAiInsightUseCase } = useServices();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<Awaited<
    ReturnType<typeof fetchStockAiInsightUseCase.execute>
  > | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useErrorToast(Boolean(errorMessage), errorMessage ?? t('ai.loadFailed'));

  async function handleFetch() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchStockAiInsightUseCase.execute({
        symbol: selected.symbol,
        name: selected.name,
        market: selected.market as Market,
        yahooSymbol: selected.yahooSymbol,
        locale: normalizeLocale(i18n.language),
      });
      setInsight(result);
      if (!result.enabled) {
        setErrorMessage(t('ai.disabled'));
      }
    } catch (error) {
      setErrorMessage(resolveAiFetchErrorMessage(error, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-indigo-500/25 bg-indigo-950/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-indigo-100">{t('ai.stockTitle')}</h4>
          <p className="mt-1 text-xs text-indigo-200/70">{t('ai.stockDesc')}</p>
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
