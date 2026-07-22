'use client';

import { useTranslation } from 'react-i18next';
import { QUOTE_CHART_RANGES, QuoteChartRange } from '@sar/shared';
import { translateQuoteRange } from '@/i18n/translate-shared';

interface Props {
  selected: QuoteChartRange;
  onSelect: (range: QuoteChartRange) => void;
  disabled?: boolean;
}

export function StockRangeSelector({ selected, onSelect, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1.5">
      {QUOTE_CHART_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(range)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            selected === range
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          } disabled:opacity-50`}
        >
          {translateQuoteRange(range, t)}
        </button>
      ))}
    </div>
  );
}
