import { describe, expect, it } from 'vitest';
import {
  INVESTOR_SURVEY_OPTION_IDS,
  INVESTOR_SURVEY_STEP_IDS,
  INVESTOR_TYPE_IDS,
  MINI_ANALYSIS_TEST_IDS,
} from '@sar/shared';
import { localeBundles } from '@/i18n/locale-bundles';

type SurveyBundle = (typeof localeBundles)['ko']['investorSurvey'];

function survey(bundle: (typeof localeBundles)['ko']): SurveyBundle {
  return bundle.investorSurvey;
}

describe('investor survey translations', () => {
  it('has all step questions and options in ko and en', () => {
    for (const stepId of INVESTOR_SURVEY_STEP_IDS) {
      for (const bundle of [localeBundles.ko, localeBundles.en]) {
        const steps = survey(bundle).steps as Record<string, { title: string; question: string; options: Record<string, { label: string }> }>;
        const step = steps[stepId];
        expect(step?.title, `${stepId} title`).toBeTruthy();
        expect(step?.question, `${stepId} question`).toBeTruthy();
        for (const opt of INVESTOR_SURVEY_OPTION_IDS) {
          expect(step?.options[opt]?.label, `${stepId}.${opt}`).toBeTruthy();
        }
      }
    }
  });

  it('has all investor type copy in ko and en', () => {
    for (const typeId of INVESTOR_TYPE_IDS) {
      for (const bundle of [localeBundles.ko, localeBundles.en]) {
        const types = survey(bundle).types as Record<
          string,
          { name: string; summary: string; traits: string[]; strategies: string[]; warnings: string[] }
        >;
        const entry = types[typeId];
        expect(entry?.name, `${typeId} name`).toBeTruthy();
        expect(entry?.summary, `${typeId} summary`).toBeTruthy();
        expect(entry?.traits?.length, `${typeId} traits`).toBeGreaterThan(0);
        expect(entry?.strategies?.length, `${typeId} strategies`).toBeGreaterThan(0);
        expect(entry?.warnings?.length, `${typeId} warnings`).toBeGreaterThan(0);
      }
    }
  });

  it('has mini test copy in ko and en', () => {
    for (const testId of MINI_ANALYSIS_TEST_IDS) {
      for (const bundle of [localeBundles.ko, localeBundles.en]) {
        const mini = survey(bundle).miniTests as Record<
          string,
          { title: string; intro: string; results: Record<string, { name: string; summary: string }> }
        >;
        const entry = mini[testId];
        expect(entry?.title, `${testId} title`).toBeTruthy();
        expect(entry?.intro, `${testId} intro`).toBeTruthy();
        for (let i = 1; i <= 5; i++) {
          const tier = entry?.results[`tier-${i}`];
          expect(tier?.name, `${testId} tier-${i}`).toBeTruthy();
          expect(tier?.summary, `${testId} tier-${i} summary`).toBeTruthy();
        }
      }
    }
  });
});
