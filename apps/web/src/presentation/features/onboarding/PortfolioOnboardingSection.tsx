'use client';

import Link from 'next/link';
import { ArrowRight, Banknote, LineChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Surface } from '../../design-system';

interface Props {
  isGuest: boolean;
}

/** 자본금·종목 미등록 시 대시보드 첫 화면 안내 */
export function PortfolioOnboardingSection({ isGuest }: Props) {
  const { t } = useTranslation();

  return (
    <Surface
      variant="section"
      className="border-dashed border-primary/30 bg-primary/5 space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight md:text-xl">
          {t('onboarding.title')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isGuest ? t('onboarding.guestDesc') : t('onboarding.memberDesc')}
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        <li className="flex gap-3 rounded-xl border border-border bg-card/60 p-4">
          <Banknote className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium">{t('onboarding.step1Title')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('onboarding.step1Desc')}</p>
          </div>
        </li>
        <li className="flex gap-3 rounded-xl border border-border bg-card/60 p-4">
          <LineChart className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium">{t('onboarding.step2Title')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('onboarding.step2Desc')}</p>
          </div>
        </li>
      </ol>

      <Link
        href="/my-info"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
      >
        {t('onboarding.cta')}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Surface>
  );
}
