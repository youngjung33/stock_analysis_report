'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ANALYSIS_TEST_IDS,
  GUIDE_ANALYSIS_TEST_LINKS,
  MAX_ADJUSTMENT_PERCENT,
  MIN_ADJUSTMENT_PERCENT,
  getInvestorTypeProfile,
  type AnalysisTestId,
} from '@sar/shared';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { translateTag } from '@/i18n';
import { useToast } from '../../components/Toast';
import { Surface } from '../../design-system';
import { useInvestorProfile } from '../../hooks/useInvestorProfile';
import { useAuth } from '../../hooks/useAuth';

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function InvestorProfileSection() {
  const { t, i18n } = useTranslation();
  const { isGuest } = useAuth();
  const { showError, showSuccess } = useToast();
  const {
    profile,
    stored,
    prefs,
    loading,
    saving,
    setAdjustmentPercent,
    saveManualPreferences,
  } = useInvestorProfile();

  const [localAdjustment, setLocalAdjustment] = useState(stored.adjustmentPercent);
  const [localKr, setLocalKr] = useState(prefs.targetKrPercent);
  const [localUs, setLocalUs] = useState(prefs.targetUsPercent);
  const [localMax, setLocalMax] = useState(prefs.maxSingleWeightPercent);

  useEffect(() => {
    setLocalAdjustment(stored.adjustmentPercent);
  }, [stored.adjustmentPercent]);

  useEffect(() => {
    setLocalKr(prefs.targetKrPercent);
    setLocalUs(prefs.targetUsPercent);
    setLocalMax(prefs.maxSingleWeightPercent);
  }, [prefs]);

  const typeName = t(`investorSurvey.types.${profile.typeId}.name`, {
    defaultValue: getInvestorTypeProfile(profile.typeId)?.id ?? profile.typeId,
  });

  const handleSave = useCallback(async () => {
    try {
      if (profile.compositePercent !== null && localAdjustment !== stored.adjustmentPercent) {
        await setAdjustmentPercent(localAdjustment);
      }
      await saveManualPreferences({
        targetKrPercent: localKr,
        targetUsPercent: localUs,
        maxSingleWeightPercent: localMax,
      });
      showSuccess(t('investorProfile.saved'));
    } catch (err) {
      showError(getErrorMessage(err, t('investorProfile.saveFailed')));
    }
  }, [
    localAdjustment,
    localKr,
    localMax,
    localUs,
    profile.compositePercent,
    saveManualPreferences,
    setAdjustmentPercent,
    showError,
    showSuccess,
    stored.adjustmentPercent,
    t,
  ]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
  }

  return (
    <div className="space-y-6">
      {isGuest && (
        <p className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-xs text-amber-200/90">
          {t('investorProfile.guestNotice')}
        </p>
      )}

      <Surface variant="section" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold md:text-lg">{t('investorProfile.title')}</h2>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{t('investorProfile.desc')}</p>
          </div>
          <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs tabular-nums">
            {t('investorProfile.testsReflected', { count: profile.completedTestCount })}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ANALYSIS_TEST_IDS.map((testId: AnalysisTestId) => {
            const entry = stored.ledger.entries[testId];
            const link = GUIDE_ANALYSIS_TEST_LINKS.find((l) => l.id === testId);
            return (
              <div
                key={testId}
                className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t(`investorProfile.slots.${testId}`)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t(`investorProfile.weights.${testId}`)}
                    </p>
                  </div>
                  {entry ? (
                    <span className="text-xs font-semibold tabular-nums text-primary">
                      {t('investorProfile.percentScore', {
                        value: entry.percentScore.toFixed(0),
                      })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('investorProfile.notCompleted')}</span>
                  )}
                </div>
                {entry && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {t('investorProfile.completedAt', {
                      date: formatDate(entry.completedAt, i18n.language),
                    })}
                  </p>
                )}
                <Link
                  href={link?.href ?? '/guide?category=type-analysis'}
                  className="mt-2 inline-block text-xs text-primary underline-offset-2 hover:underline"
                >
                  {entry ? t('investorProfile.retakeTest') : t('investorProfile.takeTest')}
                </Link>
              </div>
            );
          })}
        </div>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('investorProfile.compositeLabel')}</dt>
            <dd className="font-semibold tabular-nums">
              {profile.compositePercent !== null
                ? t('investorProfile.percentScore', { value: profile.compositePercent.toFixed(1) })
                : t('common.dash')}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('investorProfile.effectiveLabel')}</dt>
            <dd className="font-semibold tabular-nums">
              {profile.compositePercent !== null
                ? t('investorProfile.percentScore', { value: profile.effectivePercent.toFixed(1) })
                : t('common.dash')}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">{t('investorProfile.typeLabel')}</dt>
            <dd className="font-semibold">
              {typeName}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({t('investorProfile.levelLabel', { level: profile.level })})
              </span>
            </dd>
          </div>
        </dl>

        <div>
          <label className="text-xs text-muted-foreground">
            {t('investorProfile.adjustmentLabel')} ({localAdjustment}%)
          </label>
          <input
            type="range"
            min={MIN_ADJUSTMENT_PERCENT}
            max={MAX_ADJUSTMENT_PERCENT}
            step={1}
            value={localAdjustment}
            disabled={profile.compositePercent === null || saving}
            onChange={(e) => setLocalAdjustment(Number(e.target.value))}
            onMouseUp={() => {
              if (profile.compositePercent !== null) void setAdjustmentPercent(localAdjustment);
            }}
            onTouchEnd={() => {
              if (profile.compositePercent !== null) void setAdjustmentPercent(localAdjustment);
            }}
            className="mt-2 w-full disabled:opacity-40"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {profile.compositePercent === null
              ? t('investorProfile.adjustmentDisabled')
              : t('investorProfile.adjustmentHint')}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{t('investorProfile.tagsLabel')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.preferredTags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {translateTag(tag, t)}
              </span>
            ))}
          </div>
        </div>
      </Surface>

      <Surface variant="section" className="space-y-4">
        <h3 className="text-sm font-semibold">{t('investorProfile.allocationTitle')}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">{t('investorSurvey.allocationLabels.kr')}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={localKr}
              onChange={(e) => {
                const kr = Number(e.target.value);
                setLocalKr(kr);
                setLocalUs(100 - kr);
              }}
              className="mt-1 w-full"
            />
            <span className="tabular-nums">{localKr}%</span>
          </label>
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">{t('investorSurvey.allocationLabels.us')}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={localUs}
              onChange={(e) => {
                const us = Number(e.target.value);
                setLocalUs(us);
                setLocalKr(100 - us);
              }}
              className="mt-1 w-full"
            />
            <span className="tabular-nums">{localUs}%</span>
          </label>
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">
              {t('investorSurvey.allocationLabels.maxSingle')}
            </span>
            <input
              type="range"
              min={5}
              max={100}
              value={localMax}
              onChange={(e) => setLocalMax(Number(e.target.value))}
              className="mt-1 w-full"
            />
            <span className="tabular-nums">{localMax}%</span>
          </label>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {t('investorProfile.save')}
        </button>
        <p className="text-xs text-muted-foreground">{t('investorProfile.simulationHint')}</p>
      </Surface>
    </div>
  );
}
