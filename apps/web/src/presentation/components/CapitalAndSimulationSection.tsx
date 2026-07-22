'use client';

import { formatCashAmount, type SimulationAction, type SimulationActionType } from '@sar/shared';
import { useTranslation } from 'react-i18next';
import {
  translateSimulationDescription,
  translateSimulationHeadline,
  translateSimulationReason,
  translateTag,
} from '@/i18n';
import { Surface } from '../design-system';
import { AmountInput } from '../shared/AmountInput';
import { useCapitalScreen } from '../hooks/screens/useCapitalScreen';

const ACTION_CLASS: Record<SimulationActionType, string> = {
  keep: 'border-slate-700 bg-slate-900/40',
  trim: 'border-amber-800/50 bg-amber-950/30',
  add: 'border-emerald-800/50 bg-emerald-950/30',
  reserve_cash: 'border-indigo-800/50 bg-indigo-950/30',
};

const ACTION_LABEL_KEY: Record<SimulationActionType, string> = {
  keep: 'capital.actionKeep',
  trim: 'capital.actionTrim',
  add: 'capital.actionAdd',
  reserve_cash: 'capital.actionReserveCash',
};

interface Props {
  onPortfolioUpdated?: () => void;
}

export function CapitalAndSimulationSection({ onPortfolioUpdated }: Props) {
  const screen = useCapitalScreen(onPortfolioUpdated);
  const sim = screen.simulation?.simulation;
  const { t } = useTranslation();

  if (screen.loading) {
    return <p className="text-sm text-muted-foreground">{t('dashboard.loadingCapital')}</p>;
  }

  return (
    <div className="space-y-6">
      {screen.refreshing && (
        <p className="text-xs text-muted-foreground">{t('capital.refreshing')}</p>
      )}
      <Surface variant="section" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold md:text-lg">{t('capital.title')}</h2>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            {t('capital.cashSummary', {
              krw: screen.cashLabelKrw,
              usd: screen.cashUsd > 0 ? ` · ${screen.cashLabelUsd}` : '',
            })}
          </p>
        </div>

        <form onSubmit={screen.handleInitialCapital} className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs text-muted-foreground">{t('capital.krwLabel')}</span>
            <AmountInput
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
              value={screen.krwAmount}
              onValueChange={screen.setKrwAmount}
              formatOptions={{ maxFractionDigits: 0 }}
              placeholder={t('capital.krwPlaceholder')}
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">{t('capital.usdLabel')}</span>
            <AmountInput
              className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
              value={screen.usdAmount}
              onValueChange={screen.setUsdAmount}
              formatOptions={{ maxFractionDigits: 2 }}
              placeholder={t('capital.usdPlaceholder')}
            />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={screen.saving}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {t('capital.setCapital')}
            </button>
            <button
              type="button"
              disabled={screen.saving}
              onClick={() => screen.handleDeposit('KRW')}
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-accent"
            >
              {t('capital.depositKrw')}
            </button>
            <button
              type="button"
              disabled={screen.saving}
              onClick={() => screen.handleWithdraw('KRW')}
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-accent"
            >
              {t('capital.withdrawKrw')}
            </button>
            <button
              type="button"
              disabled={screen.saving}
              onClick={() => screen.handleDeposit('USD')}
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-accent"
            >
              {t('capital.depositUsd')}
            </button>
            <button
              type="button"
              disabled={screen.saving}
              onClick={() => screen.handleWithdraw('USD')}
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-accent"
            >
              {t('capital.withdrawUsd')}
            </button>
          </div>
        </form>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <h2 className="text-base font-semibold md:text-lg">{t('capital.targetAllocationTitle')}</h2>
        <form onSubmit={screen.handleSavePreferences} className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">{t('capital.targetKrPercent')}</span>
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
            <span className="text-xs text-muted-foreground">{t('capital.targetUsPercent')}</span>
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
            <span className="text-xs text-muted-foreground">{t('capital.maxWeightPercent')}</span>
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
            {t('capital.saveTarget')}
          </button>
        </form>
      </Surface>

      {sim && (
        <Surface variant="section" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold md:text-lg">{t('capital.simulationStatsTitle')}</h2>
            <p className="mt-1 text-sm font-medium text-foreground">
              {translateSimulationHeadline(sim, t)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              {translateSimulationDescription(sim, t)}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4 md:text-sm">
            <div>
              <dt className="text-muted-foreground">{t('capital.statTotalAssets')}</dt>
              <dd className="font-semibold">{formatCashAmount(sim.totalAssetsKrw, 'KRW')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('capital.statCashWeight')}</dt>
              <dd className="font-semibold">{sim.cashPercent.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('capital.statMarketSplit')}</dt>
              <dd className="font-semibold">
                {sim.stockAllocationByMarket.krPercent.toFixed(0)}% /{' '}
                {sim.stockAllocationByMarket.usPercent.toFixed(0)}%
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('capital.statProjectedCash')}</dt>
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
                    {t(ACTION_LABEL_KEY[action.type])}
                  </span>
                  {action.tagLabel && action.tag && (
                    <span className="text-xs text-emerald-400">{translateTag(action.tag, t)}</span>
                  )}
                  <span className="font-semibold text-foreground">
                    {action.symbol === 'CASH'
                      ? t('shared.simulation.cashName')
                      : `${action.symbol} · ${action.name}`}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground md:text-sm">
                  {translateSimulationReason(action, t)}
                </p>
                {action.suggestedAmountKrw !== null && action.type !== 'keep' && (
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {action.suggestedQuantity
                      ? t('capital.suggestedTrade', {
                          quantity: action.suggestedQuantity,
                          amount: formatCashAmount(action.suggestedAmountKrw, 'KRW'),
                        })
                      : t('capital.suggestedAmount', {
                          amount: formatCashAmount(action.suggestedAmountKrw, 'KRW'),
                        })}
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
