'use client';

import { useTranslation } from 'react-i18next';
import { QuoteRefreshNotice } from '@/client/domain/services/quote-notice';

const VARIANT_CLASS: Record<QuoteRefreshNotice['variant'], string> = {
  success: 'border-emerald-900/50 bg-emerald-950/40 text-emerald-100/90',
  warning: 'border-amber-900/50 bg-amber-950/40 text-amber-100/90',
  error: 'border-rose-900/50 bg-rose-950/40 text-rose-100/90',
};

interface Props {
  notice: QuoteRefreshNotice;
}

export function QuoteRefreshNoticeBox({ notice }: Props) {
  const { t } = useTranslation();

  const variantTitle: Record<QuoteRefreshNotice['variant'], string> = {
    success: t('quotes.refresh.successTitle'),
    warning: t('quotes.refresh.warningTitle'),
    error: t('quotes.refresh.errorTitle'),
  };

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${VARIANT_CLASS[notice.variant]}`}>
      <p className="font-medium">{variantTitle[notice.variant]}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed opacity-90">
        {notice.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
