'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { estimateHeavyAnalysisWaitSec, type HeavyAnalysisKind } from '@sar/shared';

export interface HeavyRequestLoadingState {
  percent: number;
  title: string;
  hint: string;
}

function roundToNearest10(sec: number): number {
  return Math.max(10, Math.round(sec / 10) * 10);
}

function formatRoughWaitHint(
  typicalMinSec: number,
  typicalMaxSec: number,
  elapsedSec: number,
  t: (key: string, params?: Record<string, number>) => string,
): string {
  if (elapsedSec > typicalMaxSec + 15) {
    return t('market.heavyLoading.hintAlmostDone');
  }
  if (elapsedSec > typicalMaxSec) {
    return t('market.heavyLoading.hintStillWorking');
  }

  if (typicalMaxSec < 55) {
    return t('market.heavyLoading.hintSeconds', {
      min: roundToNearest10(typicalMinSec),
      max: roundToNearest10(typicalMaxSec),
    });
  }

  const minMin = Math.max(1, Math.round(typicalMinSec / 60));
  const maxMin = Math.max(minMin, Math.round(typicalMaxSec / 60));
  return t('market.heavyLoading.hintMinutes', { min: minMin, max: maxMin });
}

function computeDisplayPercent(elapsedSec: number, typicalMaxSec: number): number {
  const scale = Math.max(20, typicalMaxSec * 0.9);
  const eased = (1 - Math.exp(-elapsedSec / scale)) * 92;
  let percent = Math.round(eased);
  if (elapsedSec > typicalMaxSec) {
    percent = Math.min(97, percent + Math.floor((elapsedSec - typicalMaxSec) / 8));
  }
  return Math.min(97, Math.max(3, percent));
}

export function useHeavyRequestLoadingProgress(
  active: boolean,
  kind: HeavyAnalysisKind,
): HeavyRequestLoadingState | null {
  const { t } = useTranslation();
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedSec(0);
      return;
    }
    const started = Date.now();
    setElapsedSec(0);
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [active, kind]);

  const { typicalMinSec, typicalMaxSec } = estimateHeavyAnalysisWaitSec(kind);

  return useMemo(() => {
    if (!active) return null;

    const title =
      kind === 'marketDeep'
        ? t('market.heavyLoading.titleMarket')
        : t('market.heavyLoading.titleStock');

    return {
      percent: computeDisplayPercent(elapsedSec, typicalMaxSec),
      title,
      hint: formatRoughWaitHint(typicalMinSec, typicalMaxSec, elapsedSec, t),
    };
  }, [active, elapsedSec, kind, t, typicalMinSec, typicalMaxSec]);
}
