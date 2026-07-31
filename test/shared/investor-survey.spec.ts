import { describe, expect, it } from 'vitest';
import {
  INVESTOR_SURVEY_STEP_COUNT,
  INVESTOR_SURVEY_STEP_IDS,
  INVESTOR_TYPE_IDS,
  INVESTOR_TYPE_PROFILES,
  computeInvestorSurveyResult,
  computeSurveyTotalScore,
  resolveInvestorTypeFromScore,
} from '@sar/shared';

describe('investor survey catalog', () => {
  it('has 10 survey steps', () => {
    expect(INVESTOR_SURVEY_STEP_IDS).toHaveLength(INVESTOR_SURVEY_STEP_COUNT);
    expect(new Set(INVESTOR_SURVEY_STEP_IDS).size).toBe(INVESTOR_SURVEY_STEP_COUNT);
  });

  it('has 10 investor types with unique ids and levels 1-10', () => {
    expect(INVESTOR_TYPE_IDS).toHaveLength(10);
    expect(INVESTOR_TYPE_PROFILES.map((p) => p.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Set(INVESTOR_TYPE_IDS).size).toBe(10);
  });

  it('maps min score to ultra-safe and max to ultra-aggressive', () => {
    expect(resolveInvestorTypeFromScore(10).id).toBe('ultra-safe');
    expect(resolveInvestorTypeFromScore(40).id).toBe('ultra-aggressive');
  });

  it('returns null until all steps answered', () => {
    const partial = Object.fromEntries(
      INVESTOR_SURVEY_STEP_IDS.slice(0, 5).map((id) => [id, 'a' as const]),
    );
    expect(computeInvestorSurveyResult(partial)).toBeNull();
  });

  it('computes result when all steps answered', () => {
    const allA = Object.fromEntries(INVESTOR_SURVEY_STEP_IDS.map((id) => [id, 'a' as const]));
    const result = computeInvestorSurveyResult(allA);
    expect(result?.totalScore).toBe(computeSurveyTotalScore(allA));
    expect(result?.typeId).toBe('ultra-safe');

    const allD = Object.fromEntries(INVESTOR_SURVEY_STEP_IDS.map((id) => [id, 'd' as const]));
    expect(computeInvestorSurveyResult(allD)?.typeId).toBe('ultra-aggressive');
  });

  it('asset mix sums to 100 for every type', () => {
    for (const profile of INVESTOR_TYPE_PROFILES) {
      const sum =
        profile.assetMix.stocks +
        profile.assetMix.etf +
        profile.assetMix.bonds +
        profile.assetMix.cash;
      expect(sum).toBe(100);
    }
  });

  it('kr + us preferences sum to 100', () => {
    for (const profile of INVESTOR_TYPE_PROFILES) {
      expect(profile.preferences.targetKrPercent + profile.preferences.targetUsPercent).toBe(100);
    }
  });
});
