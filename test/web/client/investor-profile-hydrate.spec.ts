/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  INVESTOR_SURVEY_STEP_IDS,
  createDefaultStoredProfile,
  upsertTestScore,
  type TestScoreEntry,
} from '@sar/shared';
import {
  hydrateLedgerFromLocalAnswers,
  hydrateStoredProfile,
  normalizeStoredProfile,
} from '@/client/data/investor-profile-hydrate';

const SURVEY_KEY = 'sar_investor_survey';

function makeEntry(testId: TestScoreEntry['testId'], percentScore = 80): TestScoreEntry {
  return {
    testId,
    rawScore: 80,
    minScore: 10,
    maxScore: 100,
    percentScore,
    completedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('investor-profile-hydrate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizeStoredProfile returns default when input is null', () => {
    const profile = normalizeStoredProfile(null);
    expect(profile.ledger.entries).toEqual({});
    expect(profile.adjustmentPercent).toBe(100);
  });

  it('hydrateStoredProfile merges local survey answers into ledger', () => {
    const answers = Object.fromEntries(INVESTOR_SURVEY_STEP_IDS.map((id) => [id, 'a']));
    localStorage.setItem(SURVEY_KEY, JSON.stringify({ answers }));

    const stored = createDefaultStoredProfile();
    const hydrated = hydrateStoredProfile(stored, { fromLocalAnswers: true });
    expect(hydrated.ledger.entries['investor-type']).toBeTruthy();
  });

  it('hydrateStoredProfile skips local answers when fromLocalAnswers is false', () => {
    localStorage.setItem(
      SURVEY_KEY,
      JSON.stringify({ answers: { q1: 'a' } }),
    );

    const stored = createDefaultStoredProfile();
    const result = hydrateStoredProfile(stored, { fromLocalAnswers: false });
    expect(result).toBe(stored);
    expect(result.ledger.entries['investor-type']).toBeUndefined();
  });

  it('hydrateLedgerFromLocalAnswers does not overwrite existing entries', () => {
    const ledger = upsertTestScore(createDefaultStoredProfile().ledger, makeEntry('investor-type', 90));
    const next = hydrateLedgerFromLocalAnswers(ledger);
    expect(next.entries['investor-type']?.percentScore).toBe(90);
  });
});
