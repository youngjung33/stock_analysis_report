import type { TFunction } from 'i18next';
import { FigureShell, MiniBars, MiniTable } from './FigureShell';

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

export function getIsaFigureRenderers(t: TFunction): Record<string, FigureRenderer> {
  return {
    'isa-what-is': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="10" y="60" width="70" height="40" rx="6" fill="#6366f1" opacity="0.25" stroke="#6366f1" />
          <text x="45" y="85" textAnchor="middle" fontSize="11" fill="currentColor">
            {f(t, 'isa-what-is', 'deposit', '납입')}
          </text>
          <path d="M80 80h30" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow)" />
          <rect x="110" y="40" width="100" height="80" rx="8" fill="#6366f1" opacity="0.15" stroke="#6366f1" />
          <text x="160" y="70" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">
            ISA
          </text>
          <text x="160" y="88" textAnchor="middle" fontSize="10" fill="#a1a1aa">
            {f(t, 'isa-what-is', 'products', '주식·펀드·채권')}
          </text>
          <path d="M210 80h30" stroke="#6366f1" strokeWidth="2" />
          <rect x="240" y="55" width="70" height="50" rx="6" fill="#10b981" opacity="0.2" stroke="#10b981" />
          <text x="275" y="78" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'isa-what-is', 'benefit', '세제혜택')}
          </text>
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="#6366f1" />
            </marker>
          </defs>
        </SvgChart>
      </FigureShell>
    ),
    'isa-yearly-limit': (caption) => (
      <FigureShell caption={caption}>
        <MiniTable
          columns={[f(t, 'isa-yearly-limit', 'colType', '유형'), f(t, 'isa-yearly-limit', 'colLimit', '연 비과세 한도')]}
          rows={[
            [f(t, 'isa-yearly-limit', 'rowGeneral', '일반형'), f(t, 'isa-yearly-limit', 'valGeneral', '200만 원')],
            [f(t, 'isa-yearly-limit', 'rowWorker', '서민·농어민형'), f(t, 'isa-yearly-limit', 'valWorker', '400만 원')],
            [f(t, 'isa-yearly-limit', 'rowSenior', '노후형'), f(t, 'isa-yearly-limit', 'valSenior', '400만 원')],
          ]}
        />
      </FigureShell>
    ),
    'isa-early-withdrawal': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <line x1="20" y1="100" x2="300" y2="100" stroke="#71717a" strokeWidth="2" />
          <circle cx="40" cy="100" r="6" fill="#6366f1" />
          <text x="40" y="125" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'isa-early-withdrawal', 'start', '가입')}
          </text>
          <circle cx="160" cy="100" r="6" fill="#f43f5e" />
          <text x="160" y="75" textAnchor="middle" fontSize="10" fill="#f43f5e">
            {f(t, 'isa-early-withdrawal', 'early', '중도인출 ✕')}
          </text>
          <circle cx="280" cy="100" r="8" fill="#10b981" />
          <text x="280" y="125" textAnchor="middle" fontSize="10" fill="currentColor">
            {f(t, 'isa-early-withdrawal', 'maturity', '3년 만기')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'isa-vs-regular': (caption) => (
      <FigureShell caption={caption}>
        <MiniTable
          columns={[
            f(t, 'isa-vs-regular', 'colItem', '항목'),
            f(t, 'isa-vs-regular', 'colRegular', '일반 위탁'),
            f(t, 'isa-vs-regular', 'colIsa', 'ISA'),
          ]}
          rows={[
            [
              f(t, 'isa-vs-regular', 'rowGain', '손익 통산'),
              f(t, 'isa-vs-regular', 'no', '종목별'),
              f(t, 'isa-vs-regular', 'yes', '계좌 전체'),
            ],
            [
              f(t, 'isa-vs-regular', 'rowTaxFree', '비과세'),
              f(t, 'isa-vs-regular', 'dash', '—'),
              f(t, 'isa-vs-regular', 'limit', '200~400만'),
            ],
          ]}
        />
      </FigureShell>
    ),
    'isa-overflow-tax': (caption) => (
      <FigureShell caption={caption}>
        <MiniBars
          bars={[
            {
              label: f(t, 'isa-overflow-tax', 'taxFree', '비과세 구간'),
              value: 200,
              max: 300,
              color: '#10b981',
              suffix: f(t, 'isa-overflow-tax', 'taxFreeVal', '200만 원'),
            },
            {
              label: f(t, 'isa-overflow-tax', 'overflow', '초과분'),
              value: 100,
              max: 300,
              color: '#6366f1',
              suffix: f(t, 'isa-overflow-tax', 'overflowVal', '9.9%'),
            },
          ]}
        />
      </FigureShell>
    ),
    'isa-comprehensive-tax-exclusion': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="30" y="30" width="120" height="100" rx="8" fill="#6366f1" opacity="0.15" stroke="#6366f1" />
          <text x="90" y="60" textAnchor="middle" fontSize="11" fill="currentColor">
            {f(t, 'isa-comprehensive-tax-exclusion', 'isa', 'ISA 소득')}
          </text>
          <text x="90" y="80" textAnchor="middle" fontSize="10" fill="#10b981">
            {f(t, 'isa-comprehensive-tax-exclusion', 'exclude', '종합과세 제외')}
          </text>
          <rect x="170" y="30" width="120" height="100" rx="8" fill="#f43f5e" opacity="0.1" stroke="#f43f5e" />
          <text x="230" y="60" textAnchor="middle" fontSize="11" fill="currentColor">
            {f(t, 'isa-comprehensive-tax-exclusion', 'general', '일반 금융소득')}
          </text>
          <text x="230" y="80" textAnchor="middle" fontSize="10" fill="#a1a1aa">
            {f(t, 'isa-comprehensive-tax-exclusion', 'threshold', '2,000만 원 기준')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'isa-eligibility-types': (caption) => (
      <FigureShell caption={caption}>
        <MiniTable
          columns={[
            f(t, 'isa-eligibility-types', 'colType', '유형'),
            f(t, 'isa-eligibility-types', 'colReq', '요건'),
            f(t, 'isa-eligibility-types', 'colLimit', '비과세'),
          ]}
          rows={[
            [f(t, 'isa-eligibility-types', 'general', '일반형'), f(t, 'isa-eligibility-types', 'none', '없음'), '200만'],
            [f(t, 'isa-eligibility-types', 'worker', '서민형'), f(t, 'isa-eligibility-types', 'income', '소득요건'), '400만'],
            [f(t, 'isa-eligibility-types', 'senior', '노후형'), f(t, 'isa-eligibility-types', 'age', '만 65세+'), '400만'],
          ]}
        />
      </FigureShell>
    ),
    'isa-contribution-limit': (caption) => (
      <FigureShell caption={caption}>
        <MiniBars
          bars={[
            {
              label: f(t, 'isa-contribution-limit', 'annual', '연 납입 한도'),
              value: 2000,
              max: 2000,
              color: '#6366f1',
              suffix: f(t, 'isa-contribution-limit', 'val', '2,000만 원'),
            },
          ]}
        />
      </FigureShell>
    ),
    'isa-maturity-options': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="120" y="10" width="80" height="36" rx="6" fill="#6366f1" opacity="0.2" stroke="#6366f1" />
          <text x="160" y="32" textAnchor="middle" fontSize="11" fill="currentColor">
            {f(t, 'isa-maturity-options', 'maturity', '만기')}
          </text>
          <path d="M100 46 L60 70 M160 46 L160 70 M220 46 L260 70" stroke="#71717a" strokeWidth="1.5" />
          <rect x="20" y="70" width="80" height="40" rx="6" fill="#10b981" opacity="0.15" stroke="#10b981" />
          <text x="60" y="95" textAnchor="middle" fontSize="9" fill="currentColor">
            {f(t, 'isa-maturity-options', 'cash', '현금화')}
          </text>
          <rect x="120" y="70" width="80" height="40" rx="6" fill="#6366f1" opacity="0.15" stroke="#6366f1" />
          <text x="160" y="95" textAnchor="middle" fontSize="9" fill="currentColor">
            {f(t, 'isa-maturity-options', 'pension', '연금전환')}
          </text>
          <rect x="220" y="70" width="80" height="40" rx="6" fill="#a1a1aa" opacity="0.15" stroke="#71717a" />
          <text x="260" y="95" textAnchor="middle" fontSize="9" fill="currentColor">
            {f(t, 'isa-maturity-options', 'extend', '연장')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
    'isa-loss-offset': (caption) => (
      <FigureShell caption={caption}>
        <SvgChart>
          <rect x="40" y="50" width="50" height="60" fill="#10b981" opacity="0.7" />
          <text x="65" y="85" textAnchor="middle" fontSize="10" fill="white">
            +100
          </text>
          <text x="65" y="125" textAnchor="middle" fontSize="9" fill="currentColor">A</text>
          <rect x="110" y="70" width="50" height="40" fill="#f43f5e" opacity="0.7" />
          <text x="135" y="95" textAnchor="middle" fontSize="10" fill="white">
            -30
          </text>
          <text x="135" y="125" textAnchor="middle" fontSize="9" fill="currentColor">B</text>
          <text x="200" y="80" fontSize="14" fill="currentColor">=</text>
          <rect x="230" y="60" width="60" height="50" fill="#6366f1" opacity="0.6" />
          <text x="260" y="90" textAnchor="middle" fontSize="11" fill="white">
            70
          </text>
          <text x="260" y="125" textAnchor="middle" fontSize="9" fill="currentColor">
            {f(t, 'isa-loss-offset', 'net', '순소득')}
          </text>
        </SvgChart>
      </FigureShell>
    ),
  };
}
