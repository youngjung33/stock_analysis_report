'use client';

import { useTranslation } from 'react-i18next';
import {
  isEnrichmentBatchIncomplete,
  type MarketReportDataQuality,
  type StockReportDataQuality,
} from '@sar/shared';

export function hasMarketReportDataQualityNotice(
  quality?: MarketReportDataQuality,
): boolean {
  if (!quality) return false;
  if (quality.incompleteEnrichment || isEnrichmentBatchIncomplete(quality.enrichment)) {
    return true;
  }
  return Object.values(quality.news).some((status) => status === 'failed');
}

export function hasStockReportDataQualityNotice(quality?: StockReportDataQuality): boolean {
  if (!quality) return false;
  return quality.incompleteEnrichment || isEnrichmentBatchIncomplete(quality.enrichment);
}

function marketNewsFailureLabels(
  news: MarketReportDataQuality['news'],
  t: (key: string) => string,
): string[] {
  const labels: string[] = [];
  if (news.krGoogle === 'failed') labels.push(t('market.dataQualityFootnote.newsKrGoogle'));
  if (news.usGoogle === 'failed') labels.push(t('market.dataQualityFootnote.newsUsGoogle'));
  if (news.finnhubGeneral === 'failed') labels.push(t('market.dataQualityFootnote.newsFinnhub'));
  return labels;
}

export function MarketReportDataQualityNotice({
  quality,
}: {
  quality?: MarketReportDataQuality;
}) {
  const { t } = useTranslation();
  if (!hasMarketReportDataQualityNotice(quality)) return null;

  const lines: string[] = [];
  if (
    quality!.incompleteEnrichment ||
    isEnrichmentBatchIncomplete(quality!.enrichment)
  ) {
    lines.push(t('market.dataQualityFootnote.incompleteEnrichment'));
  }
  const failedNews = marketNewsFailureLabels(quality!.news, t);
  if (failedNews.length > 0) {
    lines.push(
      t('market.dataQualityFootnote.newsSourceFailed', {
        sources: failedNews.join(', '),
      }),
    );
  }

  return (
    <aside
      className="mt-3 border-t border-slate-800/80 pt-3 text-[11px] leading-relaxed text-amber-200/80"
      aria-label={t('market.dataQualityFootnote.title')}
    >
      <span className="font-medium text-amber-300/90">{t('market.dataQualityFootnote.title')}: </span>
      {lines.join(' ')}
    </aside>
  );
}

export function StockReportDataQualityNotice({
  quality,
}: {
  quality?: StockReportDataQuality;
}) {
  const { t } = useTranslation();
  if (!hasStockReportDataQualityNotice(quality)) return null;

  return (
    <aside
      className="mt-3 border-t border-slate-800/80 pt-3 text-[11px] leading-relaxed text-amber-200/80"
      aria-label={t('market.dataQualityFootnote.title')}
    >
      <span className="font-medium text-amber-300/90">{t('market.dataQualityFootnote.title')}: </span>
      {t('market.dataQualityFootnote.incompleteEnrichment')}
    </aside>
  );
}
