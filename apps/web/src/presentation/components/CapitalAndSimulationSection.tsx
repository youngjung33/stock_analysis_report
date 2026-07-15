'use client';

import { formatCashAmount, type SimulationAction, type SimulationActionType } from '@sar/shared';
import { Surface } from '../design-system';
import { AmountInput } from '../shared/AmountInput';
import { useCapitalScreen } from '../hooks/screens/useCapitalScreen';

const ACTION_LABEL: Record<SimulationActionType, string> = {
  keep: '유지',
  trim: '비중 축소',
  add: '매수 검토',
  reserve_cash: '남는 현금',
};

const ACTION_CLASS: Record<SimulationActionType, string> = {
  keep: 'border-slate-700 bg-slate-900/40',
  trim: 'border-amber-800/50 bg-amber-950/30',
  add: 'border-emerald-800/50 bg-emerald-950/30',
  reserve_cash: 'border-indigo-800/50 bg-indigo-950/30',
};

interface Props {
  onPortfolioUpdated?: () => void;
}

export function CapitalAndSimulationSection({ onPortfolioUpdated }: Props) {
  const screen = useCapitalScreen(onPortfolioUpdated);
  const sim = screen.simulation?.simulation;

  if (screen.loading) {
    return <p className="text-sm text-muted-foreground">자본·시뮬레이션 불러오는 중...</p>;
  }

  return (
    <div className="space-y-6">
      {screen.refreshing && (
        <p className="text-xs text-muted-foreground">잔액 반영 중...</p>
      )}
      <Surface variant="section" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold md:text-lg">자본금 · 현금</h2>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            가용 현금 {screen.cashLabelKrw}
            {screen.cashUsd > 0 && ` · ${screen.cashLabelUsd}`}
          </p>
        </div>

        <form onSubmit={screen.handleInitialCapital} className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs text-muted-foreground">원화 (KRW)</span>
            <AmountInput
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
              value={screen.krwAmount}
              onValueChange={screen.setKrwAmount}
              formatOptions={{ maxFractionDigits: 0 }}
              placeholder="예: 10,000,000"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">달러 (USD)</span>
            <AmountInput
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
              value={screen.usdAmount}
              onValueChange={screen.setUsdAmount}
              formatOptions={{ maxFractionDigits: 2 }}
              placeholder="예: 5,000"
            />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={screen.saving}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              초기 자본 설정
            </button>
            <button
              type="button"
              disabled={screen.saving}
              onClick={() => screen.handleDeposit('KRW')}
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-accent"
            >
              KRW 입금
            </button>
            <button
              type="button"
              disabled={screen.saving}
              onClick={() => screen.handleWithdraw('KRW')}
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-accent"
            >
              KRW 출금
            </button>
            <button
              type="button"
              disabled={screen.saving}
              onClick={() => screen.handleDeposit('USD')}
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-accent"
            >
              USD 입금
            </button>
            <button
              type="button"
              disabled={screen.saving}
              onClick={() => screen.handleWithdraw('USD')}
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-accent"
            >
              USD 출금
            </button>
          </div>
        </form>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <h2 className="text-base font-semibold md:text-lg">목표 비중 · 집중도</h2>
        <form onSubmit={screen.handleSavePreferences} className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">국내(KR) %</span>
            <input
              type="number"
              min="0"
              max="100"
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
              value={screen.targetKr}
              onChange={(e) => screen.setTargetKr(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">미국(US) %</span>
            <input
              type="number"
              min="0"
              max="100"
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
              value={screen.targetUs}
              onChange={(e) => screen.setTargetUs(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">종목 최대 비중 %</span>
            <input
              type="number"
              min="5"
              max="100"
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
              value={screen.maxWeight}
              onChange={(e) => screen.setMaxWeight(Number(e.target.value))}
            />
          </label>
          <button
            type="submit"
            disabled={screen.saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:col-span-3 sm:w-fit disabled:opacity-50"
          >
            목표 저장
          </button>
        </form>
      </Surface>

      {sim && (
        <Surface variant="section" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold md:text-lg">포트폴리오 시뮬레이션</h2>
            <p className="mt-1 text-sm font-medium text-foreground">{sim.headline}</p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{sim.description}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4 md:text-sm">
            <div>
              <dt className="text-muted-foreground">총 자산</dt>
              <dd className="font-semibold">{formatCashAmount(sim.totalAssetsKrw, 'KRW')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">현금 비중</dt>
              <dd className="font-semibold">{sim.cashPercent.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">KR / US (주식)</dt>
              <dd className="font-semibold">
                {sim.stockAllocationByMarket.krPercent.toFixed(0)}% /{' '}
                {sim.stockAllocationByMarket.usPercent.toFixed(0)}%
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">시뮬 후 현금</dt>
              <dd className="font-semibold">
                {formatCashAmount(sim.projectedCashTotalKrw, 'KRW')}
              </dd>
            </div>
          </dl>

          <ul className="space-y-3">
            {sim.actions.map((action: SimulationAction, index: number) => (
              <li
                key={`${action.type}-${action.symbol}-${index}`}
                className={`rounded-xl border p-4 ${ACTION_CLASS[action.type]}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium">
                    {ACTION_LABEL[action.type]}
                  </span>
                  {action.tagLabel && (
                    <span className="text-xs text-emerald-400">{action.tagLabel}</span>
                  )}
                  <span className="font-semibold text-foreground">
                    {action.symbol === 'CASH' ? action.name : `${action.symbol} · ${action.name}`}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground md:text-sm">{action.reason}</p>
                {action.suggestedAmountKrw !== null && action.type !== 'keep' && (
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {action.suggestedQuantity
                      ? `${action.suggestedQuantity}주 · 약 ${formatCashAmount(action.suggestedAmountKrw, 'KRW')}`
                      : `약 ${formatCashAmount(action.suggestedAmountKrw, 'KRW')}`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </div>
  );
}
