import type { TFunction } from 'i18next';
import { FigureShell, MiniTable } from './FigureShell';

type FigureRenderer = (caption?: string) => React.ReactNode;

function f(t: TFunction, id: string, key: string, fallback: string): string {
  return t(`guide.items.${id}.figure.${key}`, { defaultValue: fallback });
}

function SvgChart({ children, viewBox = '0 0 320 160' }: { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} className="mx-auto h-auto w-full max-w-md text-foreground" role="img">
      {children}
    </svg>
  );
}

export function getTradingFigureRenderers(t: TFunction): Record<string, FigureRenderer> {
  return {
    'trading-average-cost': (caption) => (
      <FigureShell caption={caption}>
        <MiniTable
          columns={[
            f(t, 'trading-average-cost', 'colBuy', '매수'),
            f(t, 'trading-average-cost', 'colQty', '수량'),
            f(t, 'trading-average-cost', 'colPrice', '단가'),
          ]}
          rows={[
            ['1', '10', '50,000'],
            ['2', '5', '60,000'],
            [f(t, 'trading-average-cost', 'avg', '평단'), '15', f(t, 'trading-average-cost', 'avgVal', '53,333')],
          ]}
        />
      </FigureShell>
    ),
    'trading-pnl': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="30" y="40" width="120" height="70" rx="8" fill="#6366f1" opacity="0.15" stroke="#6366f1" />
          <text x="90" y="70" textAnchor="middle" fontSize="11" fill="currentColor">
            {f(t, 'trading-pnl', 'unrealized', '평가손익')}
          </text>
          <text x="90" y="90" textAnchor="middle" fontSize="10" fill="#a1a1aa">
            {f(t, 'trading-pnl', 'hold', '보유 중')}
          </text>
          <rect x="170" y="40" width="120" height="70" rx="8" fill="#10b981" opacity="0.15" stroke="#10b981" />
          <text x="230" y="70" textAnchor="middle" fontSize="11" fill="currentColor">
            {f(t, 'trading-pnl', 'realized', '실현손익')}
          </text>
          <text x="230" y="90" textAnchor="middle" fontSize="10" fill="#a1a1aa">
            {f(t, 'trading-pnl', 'sold', '매도 후')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'trading-market-vs-limit': (caption) => (
      <FigureShell caption={caption}>
        <MiniTable
          columns={[
            f(t, 'trading-market-vs-limit', 'col', '주문'),
            f(t, 'trading-market-vs-limit', 'speed', '체결'),
            f(t, 'trading-market-vs-limit', 'price', '가격'),
          ]}
          rows={[
            [
              f(t, 'trading-market-vs-limit', 'market', '시장가'),
              f(t, 'trading-market-vs-limit', 'fast', '즉시'),
              f(t, 'trading-market-vs-limit', 'slip', '슬리피지 가능'),
            ],
            [
              f(t, 'trading-market-vs-limit', 'limit', '지정가'),
              f(t, 'trading-market-vs-limit', 'wait', '대기'),
              f(t, 'trading-market-vs-limit', 'fixed', '지정가'),
            ],
          ]}
        />
      </FigureShell>
    ),
    'trading-dividend-ex-date': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <line x1="20" y1="90" x2="300" y2="90" stroke="#71717a" strokeWidth="2" />
          <circle cx="120" cy="90" r="8" fill="#6366f1" />
          <text x="120" y="115" textAnchor="middle" fontSize="9" fill="currentColor">
            {f(t, 'trading-dividend-ex-date', 'before', '전일 보유')}
          </text>
          <line x1="180" y1="50" x2="180" y2="130" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" />
          <text x="180" y="45" textAnchor="middle" fontSize="9" fill="#f43f5e">
            {f(t, 'trading-dividend-ex-date', 'ex', '배당락')}
          </text>
          <polyline points="200,90 260,110" fill="none" stroke="#6366f1" strokeWidth="2" />
          <text x="260" y="125" fontSize="9" fill="#a1a1aa">
            {f(t, 'trading-dividend-ex-date', 'drop', '가격 조정')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'trading-corporate-actions': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <text x="60" y="50" textAnchor="middle" fontSize="11" fill="currentColor">1{f(t, 'trading-corporate-actions', 'share', '주')}</text>
          <rect x="35" y="60" width="50" height="50" rx="4" fill="#6366f1" opacity="0.3" />
          <text x="160" y="85" textAnchor="middle" fontSize="14" fill="currentColor">→ 1:2 →</text>
          <rect x="210" y="55" width="35" height="35" rx="4" fill="#6366f1" opacity="0.5" />
          <rect x="250" y="55" width="35" height="35" rx="4" fill="#6366f1" opacity="0.5" />
          <text x="242" y="110" textAnchor="middle" fontSize="11" fill="currentColor">2{f(t, 'trading-corporate-actions', 'shares', '주')}</text>
        </SvgChart>
      </FigureShell>
    ),
    'trading-quantity': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <text x="160" y="75" textAnchor="middle" fontSize="13" fill="currentColor">
            {f(t, 'trading-quantity', 'formula', '매수 − 매도 + 기업행위')}
          </text>
          <text x="160" y="100" textAnchor="middle" fontSize="12" fill="#6366f1">
            10 − 3 + 2 = 9{f(t, 'trading-quantity', 'unit', '주')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
  };
}

export function getAccountsFigureRenderers(t: TFunction): Record<string, FigureRenderer> {
  return {
    'accounts-brokerage': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="80" y="35" width="160" height="90" rx="10" fill="#6366f1" opacity="0.15" stroke="#6366f1" strokeWidth="2" />
          <text x="160" y="70" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">
            {f(t, 'accounts-brokerage', 'title', '위탁계좌')}
          </text>
          <text x="160" y="95" textAnchor="middle" fontSize="10" fill="#a1a1aa">
            {f(t, 'accounts-brokerage', 'sub', '주식·ETF 매매')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'accounts-isa-role': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart viewBox="0 0 320 180">
          {[
            { y: 20, label: f(t, 'accounts-isa-role', 'l1', '일반 위탁'), color: '#71717a' },
            { y: 70, label: f(t, 'accounts-isa-role', 'l2', 'ISA'), color: '#6366f1' },
            { y: 120, label: f(t, 'accounts-isa-role', 'l3', '연금'), color: '#10b981' },
          ].map(({ y, label, color }) => (
            <g key={y}>
              <rect x="60" y={y} width="200" height="40" rx="6" fill={color} opacity="0.15" stroke={color} />
              <text x="160" y={y + 25} textAnchor="middle" fontSize="11" fill="currentColor">
                {label}
              </text>
            </g>
          ))}
        </SvgChart>
      </FigureShell>
    ),
    'accounts-pension': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart viewBox="0 0 320 180">
          <rect x="120" y="20" width="80" height="40" rx="6" fill="#6366f1" opacity="0.2" stroke="#6366f1" />
          <text x="160" y="45" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'accounts-pension', 'save', '납입')}
          </text>
          <path d="M160 60 L160 90" stroke="#6366f1" strokeWidth="2" />
          <polygon points="160,130 130,90 190,90" fill="#10b981" opacity="0.2" stroke="#10b981" />
          <text x="160" y="150" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'accounts-pension', 'retire', '노후 수령')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'accounts-cma': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="40" y="50" width="80" height="50" rx="6" fill="#10b981" opacity="0.2" stroke="#10b981" />
          <text x="80" y="80" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'accounts-cma', 'cash', '현금')}
          </text>
          <path d="M120 75h40" stroke="#6366f1" strokeWidth="2" />
          <rect x="160" y="50" width="120" height="50" rx="6" fill="#6366f1" opacity="0.15" stroke="#6366f1" />
          <text x="220" y="80" textAnchor="middle" fontSize="10" fill="currentColor">CMA / RP</text>
        </SvgChart>
      </FigureShell>
    ),
  };
}

export function getPortfolioFigureRenderers(t: TFunction): Record<string, FigureRenderer> {
  return {
    'portfolio-diversification': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          {[
            { start: 0, size: 120, color: '#6366f1', label: '40%' },
            { start: 120, size: 90, color: '#10b981', label: '30%' },
            { start: 210, size: 75, color: '#f59e0b', label: '25%' },
            { start: 285, size: 35, color: '#71717a', label: '5%' },
          ].map(({ start, size, color }) => (
            <g key={start}>
              <circle cx="160" cy="80" r="55" fill="none" stroke={color} strokeWidth={size / 10} strokeDasharray={`${size} 345`} strokeDashoffset={-start} transform="rotate(-90 160 80)" />
            </g>
          ))}
          <text x="160" y="150" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'portfolio-diversification', 'label', '섹터·종목 분산')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'portfolio-rebalancing': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <text x="80" y="30" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'portfolio-rebalancing', 'before', '리밸런싱 전')}
          </text>
          <rect x="40" y="40" width="80" height="80" fill="#6366f1" opacity="0.7" />
          <rect x="40" y="120" width="40" height="30" fill="#10b981" opacity="0.7" />
          <text x="220" y="30" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'portfolio-rebalancing', 'after', '리밸런싱 후')}
          </text>
          <rect x="180" y="55" width="60" height="65" fill="#6366f1" opacity="0.7" />
          <rect x="180" y="120" width="60" height="30" fill="#10b981" opacity="0.7" />
          <path d="M130 90h40" stroke="#a1a1aa" strokeWidth="2" markerEnd="url(#arr)" />
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="#a1a1aa" />
            </marker>
          </defs>
        </SvgChart>
      </FigureShell>
    ),
    'portfolio-cash-ratio': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <circle cx="160" cy="80" r="55" fill="none" stroke="#6366f1" strokeWidth="35" strokeDasharray="220 125" transform="rotate(-90 160 80)" />
          <circle cx="160" cy="80" r="55" fill="none" stroke="#10b981" strokeWidth="35" strokeDasharray="125 220" strokeDashoffset="-220" transform="rotate(-90 160 80)" />
          <text x="160" y="75" textAnchor="middle" fontSize="11" fill="currentColor">70/30</text>
          <text x="100" y="145" fontSize="9" fill="#6366f1">{f(t, 'portfolio-cash-ratio', 'stock', '주식')}</text>
          <text x="200" y="145" fontSize="9" fill="#10b981">{f(t, 'portfolio-cash-ratio', 'cash', '현금')}</text>
        </SvgChart>
      </FigureShell>
    ),
    'portfolio-long-term': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <polyline points="30,130 80,110 130,95 180,70 230,50 280,30" fill="none" stroke="#6366f1" strokeWidth="2.5" />
          <polyline points="30,130 80,120 130,115 180,105 230,100 280,95" fill="none" stroke="#71717a" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="285" y="35" fontSize="9" fill="#6366f1">{f(t, 'portfolio-long-term', 'invest', '투자')}</text>
          <text x="285" y="98" fontSize="9" fill="#71717a">{f(t, 'portfolio-long-term', 'save', '예금')}</text>
        </SvgChart>
      </FigureShell>
    ),
  };
}
