'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

function formatAxisDate(timestamp: string, range: QuoteChartRange, locale: string): string {
  const date = new Date(timestamp);
  if (range === '1d') {
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
  if (range === '3d' || range === '1w') {
    return date.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' });
  }
  if (range === '1mo' || range === '3mo' || range === '6mo' || range === 'ytd') {
    return date.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' });
  }
  return date.toLocaleDateString(locale, { year: '2-digit', month: 'numeric' });
}

function formatTooltipDate(timestamp: string, range: QuoteChartRange, locale: string): string {
  const date = new Date(timestamp);
  if (range === '1d') {
    return date.toLocaleString(locale, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

function indexFromClientX(svg: SVGSVGElement, clientX: number, pointCount: number, chartWidth: number): number {
  const rect = svg.getBoundingClientRect();
  const svgX = ((clientX - rect.left) / rect.width) * WIDTH;
  const relX = svgX - PAD.left;
  const ratio = relX / chartWidth;
  const index = Math.round(ratio * (pointCount - 1));
  return Math.max(0, Math.min(pointCount - 1, index));
}

export function StockPriceChart({ points, range, changePercent, currency }: Props) {
  const { t, i18n } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartWidth = WIDTH - PAD.left - PAD.right;
  const chartHeight = HEIGHT - PAD.top - PAD.bottom;

  const updateActiveIndex = useCallback(
    (clientX: number) => {
      if (!svgRef.current) return;
      setActiveIndex(indexFromClientX(svgRef.current, clientX, points.length, chartWidth));
    },
    [points.length, chartWidth],
  );

  useEffect(() => {
    setActiveIndex(null);
  }, [points, range]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      updateActiveIndex(e.clientX);
    },
    [updateActiveIndex],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      if (e.pointerType === 'mouse' || e.buttons > 0) {
        updateActiveIndex(e.clientX);
      }
    },
    [updateActiveIndex],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const handlePointerLeave = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    if (e.pointerType === 'mouse') {
      setActiveIndex(null);
    }
  }, []);

  if (points.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30">
        <p className="text-sm text-slate-500">{t('stock.chart.empty')}</p>
      </div>
    );
  }

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

  const active = activeIndex !== null ? coords[activeIndex] : null;
  const tooltipAlign =
    active && active.x > WIDTH * 0.72 ? 'right' : active && active.x < WIDTH * 0.28 ? 'left' : 'center';

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-2 sm:p-3">
      <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-56 w-full touch-none select-none"
        role="img"
        aria-label={t('stock.chart.ariaLabel')}
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
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                {formatPrice(tick, currency)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {active && (
          <g pointerEvents="none">
            <line
              x1={active.x}
              y1={PAD.top}
              x2={active.x}
              y2={PAD.top + chartHeight}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.8"
            />
            <circle cx={active.x} cy={active.y} r="5" fill={stroke} stroke="#0f172a" strokeWidth="2" />
          </g>
        )}

        {xLabels.map(({ point, x, align }, index) => (
          <text
            key={`${point.timestamp}-${index}`}
            x={x}
            y={HEIGHT - 8}
            textAnchor={align}
            fill="#64748b"
            fontSize="10"
          >
            {formatAxisDate(point.timestamp, range, i18n.language)}
          </text>
        ))}

        <rect
          x={PAD.left}
          y={PAD.top}
          width={chartWidth}
          height={chartHeight}
          fill="transparent"
          className="cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerUp}
        />
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-slate-700/80 bg-slate-950/90 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur-sm sm:px-3 sm:py-2 sm:text-sm"
          style={{
            left: `${(active.x / WIDTH) * 100}%`,
            top: `${(active.y / HEIGHT) * 100}%`,
            transform:
              tooltipAlign === 'right'
                ? 'translate(-100%, calc(-100% - 10px))'
                : tooltipAlign === 'left'
                  ? 'translate(0, calc(-100% - 10px))'
                  : 'translate(-50%, calc(-100% - 10px))',
          }}
          aria-live="polite"
        >
          <p className="text-slate-400">{formatTooltipDate(active.point.timestamp, range, i18n.language)}</p>
          <p className="mt-0.5 font-semibold text-white">{formatPrice(active.point.close, currency)}</p>
        </div>
      )}
      </div>
    </div>
  );
}
