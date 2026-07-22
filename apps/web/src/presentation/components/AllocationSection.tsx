'use client';

import { useTranslation } from 'react-i18next';
import { AllocationByMarket, AllocationItem } from '@sar/shared';
import { translateMarketLabel } from '@/i18n/translate-shared';
import { Surface } from '../design-system';
import { formatNumber } from '../shared/formatters';

interface Props {
  items: AllocationItem[];
  allocationByMarket: AllocationByMarket;
}

const COLORS = ['#6366f1', '#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#38bdf8'];

function DonutChart({ items }: { items: AllocationItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex h-40 w-40 items-center justify-center rounded-full border border-dashed border-slate-700 text-xs text-slate-500">
        —
      </div>
    );
  }

  let offset = 0;
  const segments = items.map((item, i) => {
    const dash = item.weightPercent;
    const segment = { ...item, dash, offset, color: COLORS[i % COLORS.length] };
    offset += dash;
    return segment;
  });

  return (
    <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90">
      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4" />
      {segments.map((s) => (
        <circle
          key={`${s.symbol}-${s.market}`}
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke={s.color}
          strokeWidth="4"
          strokeDasharray={`${s.dash} ${100 - s.dash}`}
          strokeDashoffset={100 - s.offset}
        />
      ))}
    </svg>
  );
}

export function AllocationSection({ items, allocationByMarket }: Props) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  const hasMixed = allocationByMarket.krPercent > 0 && allocationByMarket.usPercent > 0;

  return (
    <Surface>
      <h2 className="text-base font-semibold tracking-tight">{t('portfolio.allocation.title')}</h2>
      {hasMixed && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t('portfolio.allocation.marketSplit', {
            kr: allocationByMarket.krPercent.toFixed(1),
            us: allocationByMarket.usPercent.toFixed(1),
          })}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex justify-center">
          <DonutChart items={items} />
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2 pr-4">{t('common.symbol')}</th>
                <th className="pb-2 pr-4">{t('common.marketColumn')}</th>
                <th className="pb-2 pr-4">{t('common.valuationKrw')}</th>
                <th className="pb-2">{t('common.weight')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={`${item.symbol}-${item.market}`} className="border-t border-slate-800/80">
                  <td className="py-2 pr-4">
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-white">{item.symbol}</span>
                    <span className="ml-1 text-xs text-slate-500">{item.name}</span>
                  </td>
                  <td className="py-2 pr-4 text-slate-400">
                    {translateMarketLabel(item.market, t)}
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{formatNumber(item.marketValueKrw, 'KRW')}</td>
                  <td className="py-2 font-medium text-white">{item.weightPercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Surface>
  );
}
