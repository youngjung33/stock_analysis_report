'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  scoreEntryFromInvestorSurvey,
  type InvestorSurveyAnswers,
  type InvestorSurveyResult,
} from '@sar/shared';
import { translateTag } from '@/i18n';
import { useToast } from '../../components/Toast';
import { MiniBars } from '../guide/figures/FigureShell';
import { Surface } from '../../design-system';
import { useInvestorProfile } from '../../hooks/useInvestorProfile';

interface Props {
  result: InvestorSurveyResult;
  answers: InvestorSurveyAnswers;
  sessionCompleted: boolean;
  onRetake: () => void;
}

const ASSET_KEYS = ['stocks', 'etf', 'bonds', 'cash'] as const;

export function InvestorSurveyResultView({ result, answers, sessionCompleted, onRetake }: Props) {
  const { t } = useTranslation();
  const { showSuccess } = useToast();
  const { profile, upsertTestScoreEntry, stored } = useInvestorProfile();
  const appliedRef = useRef(false);

  const { profile: typeProfile, totalScore, maxScore, typeId, typeLevel } = result;
  const typeBase = `investorSurvey.types.${typeId}`;

  useEffect(() => {
    if (!sessionCompleted || appliedRef.current) return;
    const entry = scoreEntryFromInvestorSurvey(answers);
    if (!entry) return;
    appliedRef.current = true;
    const hadBefore = Boolean(stored.ledger.entries['investor-type']);
    void upsertTestScoreEntry(entry).then(() => {
      showSuccess(t(hadBefore ? 'investorSurvey.ledgerUpdated' : 'investorSurvey.ledgerAccumulated'));
    });
  }, [answers, sessionCompleted, showSuccess, stored.ledger.entries, t, upsertTestScoreEntry]);

  const traits = t(`${typeBase}.traits`, { returnObjects: true, defaultValue: [] }) as string[];
  const strategies = t(`${typeBase}.strategies`, { returnObjects: true, defaultValue: [] }) as string[];
  const warnings = t(`${typeBase}.warnings`, { returnObjects: true, defaultValue: [] }) as string[];

  const assetBars = ASSET_KEYS.map((key) => ({
    label: t(`investorSurvey.assetLabels.${key}`),
    value: typeProfile.assetMix[key],
    max: 100,
    suffix: `${typeProfile.assetMix[key]}%`,
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
        {profile.compositePercent !== null && (
          <p className="text-xs text-primary">
            {t('investorSurvey.profilePreview', {
              composite: profile.compositePercent.toFixed(1),
              effective: profile.effectivePercent.toFixed(1),
            })}
          </p>
        )}
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
            min: typeProfile.horizonYearsMin,
            max: typeProfile.horizonYearsMax,
          })}
        </p>
      </Surface>

      <Surface variant="section" className="space-y-3">
        <h3 className="text-sm font-semibold">{t('investorSurvey.allocationTitle')}</h3>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('investorSurvey.allocationLabels.kr')}</dt>
            <dd className="font-semibold tabular-nums">{typeProfile.preferences.targetKrPercent}%</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('investorSurvey.allocationLabels.us')}</dt>
            <dd className="font-semibold tabular-nums">{typeProfile.preferences.targetUsPercent}%</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('investorSurvey.allocationLabels.maxSingle')}</dt>
            <dd className="font-semibold tabular-nums">{typeProfile.preferences.maxSingleWeightPercent}%</dd>
          </div>
        </dl>
      </Surface>

      <Surface variant="section" className="space-y-3">
        <h3 className="text-sm font-semibold">{t('investorSurvey.tagsTitle')}</h3>
        <div className="flex flex-wrap gap-2">
          {typeProfile.preferredTags.map((tag) => (
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
        <Link
          href="/my-info#investor-profile"
          className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
        >
          {t('investorSurvey.goProfile')}
        </Link>
        <button
          type="button"
          onClick={onRetake}
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50"
        >
          {t('investorSurvey.retake')}
        </button>
        <Link
          href="/guide?category=type-analysis"
          className="rounded-lg border border-border px-4 py-2.5 text-center text-sm text-muted-foreground hover:bg-muted/50"
        >
          {t('investorSurvey.backToGuide')}
        </Link>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{t('investorSurvey.disclaimer')}</p>
    </div>
  );
}
