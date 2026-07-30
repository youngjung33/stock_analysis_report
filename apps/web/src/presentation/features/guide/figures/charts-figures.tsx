import type { TFunction } from 'i18next';
import { FigureShell } from './FigureShell';

type FigureRenderer = (caption?: string) => React.ReactNode;

function f(t: TFunction, id: string, key: string, fallback: string): string {
  return t(`guide.items.${id}.figure.${key}`, { defaultValue: fallback });
}

function SvgChart({ children, viewBox = '0 0 320 180' }: { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} className="mx-auto h-auto w-full max-w-md text-foreground" role="img">
      {children}
    </svg>
  );
}

export function getChartsFigureRenderers(t: TFunction): Record<string, FigureRenderer> {
  return {
    'charts-trendline': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <line x1="20" y1="140" x2="300" y2="140" stroke="#71717a" strokeWidth="1" />
          <polyline points="30,120 80,100 130,85 180,70 230,55 290,40" fill="none" stroke="#6366f1" strokeWidth="2.5" />
          <line x1="30" y1="120" x2="290" y2="55" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" />
          <text x="290" y="50" fontSize="10" fill="#10b981">
            {f(t, 'charts-trendline', 'line', '추세선')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'charts-support-resistance': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <line x1="20" y1="50" x2="300" y2="50" stroke="#f43f5e" strokeWidth="2" strokeDasharray="8 4" />
          <text x="300" y="45" textAnchor="end" fontSize="10" fill="#f43f5e">
            {f(t, 'charts-support-resistance', 'resistance', '저항')}
          </text>
          <polyline points="40,100 100,60 160,90 220,55 280,75" fill="none" stroke="#6366f1" strokeWidth="2" />
          <line x1="20" y1="120" x2="300" y2="120" stroke="#10b981" strokeWidth="2" strokeDasharray="8 4" />
          <text x="300" y="130" textAnchor="end" fontSize="10" fill="#10b981">
            {f(t, 'charts-support-resistance', 'support', '지지')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'charts-rsi': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart viewBox="0 0 320 200">
          <rect x="30" y="20" width="260" height="160" fill="#6366f1" opacity="0.05" />
          <line x1="30" y1="50" x2="290" y2="50" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" />
          <text x="295" y="54" fontSize="9" fill="#f43f5e">{f(t, 'charts-rsi', 'overbought', '70')}</text>
          <line x1="30" y1="150" x2="290" y2="150" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" />
          <text x="295" y="154" fontSize="9" fill="#10b981">{f(t, 'charts-rsi', 'oversold', '30')}</text>
          <polyline points="40,120 90,80 140,130 190,70 250,100 280,85" fill="none" stroke="#6366f1" strokeWidth="2" />
          <text x="160" y="185" textAnchor="middle" fontSize="10" fill="currentColor">{f(t, 'charts-rsi', 'label', 'RSI')}</text>
        </SvgChart>
      </FigureShell>
    ),
    'charts-macd': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart viewBox="0 0 320 200">
          <polyline points="30,60 80,55 130,50 180,45 230,40 280,38" fill="none" stroke="#6366f1" strokeWidth="2" />
          <polyline points="30,70 80,68 130,65 180,62 230,58 280,55" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 3" />
          {[40, 90, 140, 190, 240].map((x, i) => (
            <rect
              key={x}
              x={x}
              y={i % 2 === 0 ? 120 : 130}
              width="20"
              height={i % 2 === 0 ? 40 : 25}
              fill={i % 2 === 0 ? '#10b981' : '#f43f5e'}
              opacity="0.7"
            />
          ))}
          <text x="160" y="185" textAnchor="middle" fontSize="10" fill="currentColor">{f(t, 'charts-macd', 'label', 'MACD')}</text>
        </SvgChart>
      </FigureShell>
    ),
    'charts-moving-average': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <polyline points="30,100 90,85 150,95 210,60 270,70" fill="none" stroke="#a1a1aa" strokeWidth="2" />
          <text x="275" y="68" fontSize="9" fill="#a1a1aa">{f(t, 'charts-moving-average', 'price', '가격')}</text>
          <polyline points="30,105 90,92 150,98 210,72 270,78" fill="none" stroke="#6366f1" strokeWidth="2" />
          <text x="275" y="76" fontSize="9" fill="#6366f1">MA20</text>
          <polyline points="30,110 90,98 150,100 210,85 270,88" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" />
          <text x="275" y="86" fontSize="9" fill="#10b981">MA60</text>
        </SvgChart>
      </FigureShell>
    ),
    'charts-volume': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart viewBox="0 0 320 200">
          <polyline points="30,50 90,40 150,55 210,30 270,45" fill="none" stroke="#6366f1" strokeWidth="2" />
          {[35, 85, 135, 185, 235, 275].map((x, i) => (
            <rect key={x} x={x} y={120 - i * 8} width="18" height={30 + i * 10} fill="#6366f1" opacity="0.5" />
          ))}
          <text x="160" y="185" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'charts-volume', 'vol', '거래량')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'charts-vix': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <path d="M160 140 A60 60 0 0 1 100 80" fill="none" stroke="#10b981" strokeWidth="12" opacity="0.5" />
          <path d="M160 140 A60 60 0 0 1 220 60" fill="none" stroke="#f43f5e" strokeWidth="12" opacity="0.6" />
          <line x1="160" y1="140" x2="130" y2="90" stroke="currentColor" strokeWidth="3" />
          <text x="160" y="155" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">VIX</text>
          <text x="90" y="75" fontSize="9" fill="#10b981">{f(t, 'charts-vix', 'calm', '안정')}</text>
          <text x="215" y="55" fontSize="9" fill="#f43f5e">{f(t, 'charts-vix', 'fear', '공포')}</text>
        </SvgChart>
      </FigureShell>
    ),
    'charts-caution': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <polygon points="160,30 220,130 100,130" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" strokeWidth="2" />
          <text x="160" y="95" textAnchor="middle" fontSize="24" fill="#f59e0b">!</text>
          <text x="160" y="150" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'charts-caution', 'msg', '차트 + 펀더멘털 + 리스크 관리')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
  };
}
