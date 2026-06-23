'use client';

import { QUOTE_CHART_RANGES, QUOTE_RANGE_LABELS, QuoteChartRange } from '@sar/shared';

interface Props {
  selected: QuoteChartRange;
  onSelect: (range: QuoteChartRange) => void;
  disabled?: boolean;
}

export function StockRangeSelector({ selected, onSelect, disabled }: Props) {
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
          {QUOTE_RANGE_LABELS[range]}
        </button>
      ))}
    </div>
  );
}
