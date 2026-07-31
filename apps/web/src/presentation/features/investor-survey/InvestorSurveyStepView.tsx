'use client';

import { useTranslation } from 'react-i18next';
import {
  INVESTOR_SURVEY_OPTION_IDS,
  type InvestorSurveyOptionId,
  type InvestorSurveyStepId,
} from '@sar/shared';
import { Surface } from '../../design-system';
import { cn } from '../../lib/cn';

interface Props {
  stepId: InvestorSurveyStepId;
  stepIndex: number;
  stepCount: number;
  selected?: InvestorSurveyOptionId;
  onSelect: (optionId: InvestorSurveyOptionId) => void;
}

function OptionBtn({
  selected,
  onClick,
  label,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
        selected
          ? 'border-primary/50 bg-primary/10 font-medium text-foreground'
          : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      )}
    >
      <span className="block">{label}</span>
      {desc && <span className="mt-0.5 block text-xs opacity-80">{desc}</span>}
    </button>
  );
}

export function InvestorSurveyStepView({
  stepId,
  stepIndex,
  stepCount,
  selected,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const base = `investorSurvey.steps.${stepId}`;

  return (
    <Surface variant="section" className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">
          {t('investorSurvey.stepOf', { current: stepIndex + 1, total: stepCount })}
        </p>
        <h2 className="mt-1 text-lg font-semibold">{t(`${base}.title`)}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t(`${base}.question`)}</p>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={stepCount}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((stepIndex + 1) / stepCount) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {INVESTOR_SURVEY_OPTION_IDS.map((optionId) => (
          <OptionBtn
            key={optionId}
            selected={selected === optionId}
            onClick={() => onSelect(optionId)}
            label={t(`${base}.options.${optionId}.label`)}
            desc={t(`${base}.options.${optionId}.desc`)}
          />
        ))}
      </div>
    </Surface>
  );
}
