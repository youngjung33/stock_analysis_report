'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import type { InvestorSurveyResult } from '@sar/shared';
import { translateTag } from '@/i18n';
import { MiniBars } from '../guide/figures/FigureShell';
import { Surface } from '../../design-system';
import { useInvestorSurveyApply } from '../../hooks/useInvestorSurveyApply';

interface Props {
  result: InvestorSurveyResult;
  onRetake: () => void;
}

const ASSET_KEYS = ['stocks', 'etf', 'bonds', 'cash'] as const;

export function InvestorSurveyResultView({ result, onRetake }: Props) {
  const { t } = useTranslation();
  const { profile, totalScore, maxScore, typeId, typeLevel } = result;
  const typeBase = `investorSurvey.types.${typeId}`;
  const { applyPreferences, applied, saving } = useInvestorSurveyApply();

  const traits = t(`${typeBase}.traits`, { returnObjects: true, defaultValue: [] }) as string[];
  const strategies = t(`${typeBase}.strategies`, { returnObjects: true, defaultValue: [] }) as string[];
  const warnings = t(`${typeBase}.warnings`, { returnObjects: true, defaultValue: [] }) as string[];

  const assetBars = ASSET_KEYS.map((key) => ({
    label: t(`investorSurvey.assetLabels.${key}`),
    value: profile.assetMix[key],
    max: 100,
    suffix: `${profile.assetMix[key]}%`,
    color: key === 'stocks' ? '#6366f1' : key === 'etf' ? '#10b981' : key === 'bonds' ? '#f59e0b' : '#71717a',
  }));

  return (
    <div className="space-y-6">
      <Surface variant="section" className="space-y-4 border-primary/20 bg-primary/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('investorSurvey.resultTitle')}</p>
            <h2 className="mt-1 text-xl font-bold">{t(`${typeBase}.name`)}</h2>
            <p className="mt-0.5 text-sm text-primary">{t('investorSurvey.typeLevel', { level: typeLevel })}</p>
          </div>
          <div className="rounded-lg border border-border bg-card/80 px-3 py-2 text-right">
            <p className="text-[10px] text-muted-foreground">{t('investorSurvey.scoreLabel')}</p>
            <p className="text-sm font-semibold tabular-nums">
              {t('investorSurvey.scoreOf', { score: totalScore, max: maxScore })}
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{t(`${typeBase}.summary`)}</p>
        {Array.isArray(traits) && traits.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {traits.map((trait) => (
              <li
                key={trait}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs text-foreground"
              >
                {trait}
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <Surface variant="section" className="space-y-3">
        <h3 className="text-sm font-semibold">{t('investorSurvey.assetMixTitle')}</h3>
        <MiniBars bars={assetBars} />
        <p className="text-xs text-muted-foreground">
          {t('investorSurvey.horizonLabel')}:{' '}
          {t('investorSurvey.horizonRange', {
            min: profile.horizonYearsMin,
            max: profile.horizonYearsMax,
          })}
        </p>
      </Surface>

      <Surface variant="section" className="space-y-3">
        <h3 className="text-sm font-semibold">{t('investorSurvey.allocationTitle')}</h3>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('investorSurvey.allocationLabels.kr')}</dt>
            <dd className="font-semibold tabular-nums">{profile.preferences.targetKrPercent}%</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('investorSurvey.allocationLabels.us')}</dt>
            <dd className="font-semibold tabular-nums">{profile.preferences.targetUsPercent}%</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('investorSurvey.allocationLabels.maxSingle')}</dt>
            <dd className="font-semibold tabular-nums">{profile.preferences.maxSingleWeightPercent}%</dd>
          </div>
        </dl>
      </Surface>

      <Surface variant="section" className="space-y-3">
        <h3 className="text-sm font-semibold">{t('investorSurvey.tagsTitle')}</h3>
        <div className="flex flex-wrap gap-2">
          {profile.preferredTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary"
            >
              {translateTag(tag, t)}
            </span>
          ))}
        </div>
      </Surface>

      {Array.isArray(strategies) && strategies.length > 0 && (
        <Surface variant="section" className="space-y-2">
          <h3 className="text-sm font-semibold">{t('investorSurvey.strategyTitle')}</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {strategies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Surface>
      )}

      {Array.isArray(warnings) && warnings.length > 0 && (
        <Surface variant="section" className="space-y-2 border-amber-900/30 bg-amber-950/20">
          <h3 className="text-sm font-semibold text-amber-200">{t('investorSurvey.warningsTitle')}</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Surface>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={saving || applied}
          onClick={() => applyPreferences(profile.preferences)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {applied ? t('investorSurvey.applyPrefsDone') : t('investorSurvey.applyPrefs')}
        </button>
        <button
          type="button"
          onClick={onRetake}
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50"
        >
          {t('investorSurvey.retake')}
        </button>
        <Link
          href="/my-info#capital"
          className="rounded-lg border border-border px-4 py-2.5 text-center text-sm text-primary hover:bg-accent"
        >
          {t('investorSurvey.goCapital')}
        </Link>
        <Link
          href="/guide?category=type-analysis"
          className="rounded-lg border border-border px-4 py-2.5 text-center text-sm text-muted-foreground hover:bg-muted/50"
        >
          {t('investorSurvey.backToGuide')}
        </Link>
      </div>
      {applied && (
        <p className="text-xs text-muted-foreground">{t('investorSurvey.applyPrefsHint')}</p>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{t('investorSurvey.disclaimer')}</p>
    </div>
  );
}
