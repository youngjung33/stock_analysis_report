import type { TFunction } from 'i18next';
import { FigureShell, MiniTable } from './FigureShell';

type FigureRenderer = (caption?: string) => React.ReactNode;

function f(t: TFunction, id: string, key: string, fallback: string): string {
  return t(`guide.items.${id}.figure.${key}`, { defaultValue: fallback });
}

function SvgChart({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 160" className="mx-auto h-auto w-full max-w-md text-foreground" role="img">
      {children}
    </svg>
  );
}

export function getTaxFigureRenderers(t: TFunction): Record<string, FigureRenderer> {
  return {
    'tax-domestic-capital-gains': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="80" y="40" width="160" height="80" rx="12" fill="#10b981" opacity="0.2" stroke="#10b981" strokeWidth="2" />
          <text x="160" y="78" textAnchor="middle" fontSize="22" fontWeight="700" fill="#10b981">
            0%
          </text>
          <text x="160" y="100" textAnchor="middle" fontSize="11" fill="currentColor">
            {f(t, 'tax-domestic-capital-gains', 'label', '일반 투자자 매매차익')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'tax-dividend-154': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <circle cx="160" cy="80" r="55" fill="none" stroke="#71717a" strokeWidth="20" opacity="0.3" />
          <circle cx="160" cy="80" r="55" fill="none" stroke="#6366f1" strokeWidth="20" strokeDasharray="34 312" transform="rotate(-90 160 80)" />
          <text x="160" y="85" textAnchor="middle" fontSize="18" fontWeight="700" fill="currentColor">
            15.4%
          </text>
          <text x="160" y="145" textAnchor="middle" fontSize="10" fill="#a1a1aa">
            {f(t, 'tax-dividend-154', 'split', '14% + 1.4%')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'tax-foreign-gains': (caption) => (
      <FigureShell caption={caption}>
        <MiniTable
          columns={[f(t, 'tax-foreign-gains', 'col', '항목'), f(t, 'tax-foreign-gains', 'val', '세율')]}
          rows={[
            [f(t, 'tax-foreign-gains', 'rate', '양도소득세'), '22%'],
            [f(t, 'tax-foreign-gains', 'deduct', '기본공제'), f(t, 'tax-foreign-gains', 'deductVal', '250만 원/년')],
            [f(t, 'tax-foreign-gains', 'file', '신고'), f(t, 'tax-foreign-gains', 'fileVal', '5월 종합소득세')],
          ]}
        />
      </FigureShell>
    ),
    'tax-foreign-dividend': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="20" y="55" width="70" height="50" rx="6" fill="#6366f1" opacity="0.2" stroke="#6366f1" />
          <text x="55" y="85" textAnchor="middle" fontSize="10" fill="currentColor">US</text>
          <path d="M90 80h40" stroke="#6366f1" strokeWidth="2" />
          <text x="110" y="70" textAnchor="middle" fontSize="9" fill="#a1a1aa">
            {f(t, 'tax-foreign-dividend', 'withhold', '원천징수')}
          </text>
          <rect x="130" y="55" width="70" height="50" rx="6" fill="#10b981" opacity="0.15" stroke="#10b981" />
          <text x="165" y="85" textAnchor="middle" fontSize="10" fill="currentColor">KR</text>
          <path d="M200 80h40" stroke="#6366f1" strokeWidth="2" />
          <rect x="240" y="55" width="60" height="50" rx="6" fill="#f43f5e" opacity="0.1" stroke="#f43f5e" />
          <text x="270" y="85" textAnchor="middle" fontSize="9" fill="currentColor">
            {f(t, 'tax-foreign-dividend', 'may', '5월 신고')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'tax-financial-comprehensive': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <line x1="30" y1="100" x2="290" y2="100" stroke="#71717a" strokeWidth="2" />
          <line x1="180" y1="30" x2="180" y2="130" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" />
          <text x="180" y="22" textAnchor="middle" fontSize="10" fill="#f43f5e">
            2,000{f(t, 'tax-financial-comprehensive', 'unit', '만 원')}
          </text>
          <rect x="30" y="60" width="150" height="40" fill="#10b981" opacity="0.25" />
          <text x="105" y="85" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'tax-financial-comprehensive', 'safe', '분리과세 구간')}
          </text>
          <rect x="180" y="60" width="110" height="40" fill="#f43f5e" opacity="0.15" />
          <text x="235" y="85" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'tax-financial-comprehensive', 'over', '종합과세')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'tax-filing-schedule': (caption) => (
      <FigureShell caption={caption}>
        <MiniTable
          columns={[f(t, 'tax-filing-schedule', 'colMonth', '월'), f(t, 'tax-filing-schedule', 'colAction', '내용')]}
          rows={[
            ['1~4', f(t, 'tax-filing-schedule', 'prepare', '자료 정리')],
            [f(t, 'tax-filing-schedule', 'may', '5월'), f(t, 'tax-filing-schedule', 'file', '종합소득세 신고·납부')],
            ['6~12', f(t, 'tax-filing-schedule', 'done', '해외·종합과세 완료')],
          ]}
        />
      </FigureShell>
    ),
    'tax-securities-transaction': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="40" y="50" width="100" height="50" rx="6" fill="#6366f1" opacity="0.2" stroke="#6366f1" />
          <text x="90" y="80" textAnchor="middle" fontSize="11" fill="currentColor">
            {f(t, 'tax-securities-transaction', 'sell', '매도')}
          </text>
          <path d="M140 75h50" stroke="#6366f1" strokeWidth="2" />
          <text x="165" y="65" textAnchor="middle" fontSize="9" fill="#f43f5e">~0.2%</text>
          <rect x="190" y="50" width="90" height="50" rx="6" fill="#10b981" opacity="0.15" stroke="#10b981" />
          <text x="235" y="80" textAnchor="middle" fontSize="11" fill="currentColor">
            {f(t, 'tax-securities-transaction', 'proceeds', '실수령')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
  };
}
