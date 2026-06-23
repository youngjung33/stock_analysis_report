'use client';

import { QuoteChartRange } from '@sar/shared';
import { StockPricePoint } from '@/client/domain/models';

interface Props {
  points: StockPricePoint[];
  range: QuoteChartRange;
  changePercent: number | null;
  currency: string;
}

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 20, right: 16, bottom: 32, left: 52 };

function formatAxisDate(timestamp: string, range: QuoteChartRange): string {
  const date = new Date(timestamp);
  if (range === '1d') {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  if (range === '3d' || range === '1w') {
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  }
  if (range === '1mo' || range === '3mo' || range === '6mo' || range === 'ytd') {
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  }
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric' });
}

function formatPrice(value: number, currency: string): string {
  const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return currency === 'KRW' ? `₩${formatted}` : `$${formatted}`;
}

function lineColor(changePercent: number | null): string {
  if (changePercent === null) return '#94a3b8';
  if (changePercent > 0) return '#34d399';
  if (changePercent < 0) return '#fb7185';
  return '#94a3b8';
}

export function StockPriceChart({ points, range, changePercent, currency }: Props) {
  if (points.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30">
        <p className="text-sm text-slate-500">차트 데이터가 없습니다.</p>
      </div>
    );
  }

  const chartWidth = WIDTH - PAD.left - PAD.right;
  const chartHeight = HEIGHT - PAD.top - PAD.bottom;
  const closes = points.map((p) => p.close);
  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const padding = (maxClose - minClose) * 0.08 || maxClose * 0.01 || 1;
  const yMin = minClose - padding;
  const yMax = maxClose + padding;
  const ySpan = yMax - yMin || 1;

  const coords = points.map((point, index) => {
    const x = PAD.left + (index / (points.length - 1)) * chartWidth;
    const y = PAD.top + chartHeight - ((point.close - yMin) / ySpan) * chartHeight;
    return { x, y, point };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${(PAD.top + chartHeight).toFixed(2)} L ${coords[0].x.toFixed(2)} ${(PAD.top + chartHeight).toFixed(2)} Z`;
  const stroke = lineColor(changePercent);
  const gradientId = `stock-chart-gradient-${range}`;

  const yTicks = [yMax, (yMax + yMin) / 2, yMin];
  const xLabels = [
    { ...coords[0], align: 'start' as const },
    { ...coords[coords.length - 1], align: 'end' as const },
  ];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-2 sm:p-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-56 w-full"
        role="img"
        aria-label="종목 가격 차트"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = PAD.top + chartHeight - ((tick - yMin) / ySpan) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                y1={y}
                x2={WIDTH - PAD.right}
                y2={y}
                stroke="#334155"
                strokeDasharray="4 4"
                strokeOpacity="0.6"
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
              >
                {formatPrice(tick, currency)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {xLabels.map(({ point, x, align }, index) => (
          <text
            key={`${point.timestamp}-${index}`}
            x={x}
            y={HEIGHT - 8}
            textAnchor={align}
            fill="#64748b"
            fontSize="10"
          >
            {formatAxisDate(point.timestamp, range)}
          </text>
        ))}
      </svg>
    </div>
  );
}
