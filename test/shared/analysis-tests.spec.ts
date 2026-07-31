import { describe, expect, it } from 'vitest';
import {
  GUIDE_ANALYSIS_TEST_LINKS,
  GUIDE_FAQ_CATALOG,
  MINI_ANALYSIS_TEST_IDS,
  MINI_ANALYSIS_TESTS,
  computeMiniAnalysisResult,
} from '@sar/shared';

describe('analysis test links', () => {
  it('links match type-analysis guide catalog items', () => {
    const analysisItems = GUIDE_FAQ_CATALOG.filter((i) => i.categoryId === 'type-analysis');
    expect(analysisItems).toHaveLength(GUIDE_ANALYSIS_TEST_LINKS.length);

    for (const link of GUIDE_ANALYSIS_TEST_LINKS) {
      const item = analysisItems.find((i) => i.id === link.guideItemId);
      expect(item, link.guideItemId).toBeTruthy();
      expect(item?.relatedLinks?.[0]?.href).toBe(link.href);
    }
  });

  it('computes mini test results for all tiers', () => {
    for (const testId of MINI_ANALYSIS_TEST_IDS) {
      const steps = MINI_ANALYSIS_TESTS[testId].stepIds;
      const allA = Object.fromEntries(steps.map((id) => [id, 'a' as const]));
      const allD = Object.fromEntries(steps.map((id) => [id, 'd' as const]));
      expect(computeMiniAnalysisResult(testId, allA)?.tierId).toBe('tier-1');
      expect(computeMiniAnalysisResult(testId, allD)?.tierId).toBe('tier-5');
    }
  });
});
