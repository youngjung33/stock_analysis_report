import { describe, expect, it } from 'vitest';
import investorProfileEn from '@/i18n/locales/investor-profile.en.json';
import investorProfileKo from '@/i18n/locales/investor-profile.ko.json';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === 'object' && !Array.isArray(nested)) {
      return collectKeys(nested, path);
    }
    return [path];
  });
}

describe('investor-profile i18n parity', () => {
  it('ko and en have the same keys', () => {
    const koKeys = collectKeys(investorProfileKo).sort();
    const enKeys = collectKeys(investorProfileEn).sort();
    expect(koKeys).toEqual(enKeys);
  });

  it('slot and weight keys match analysis test ids', () => {
    const slotIds = Object.keys(investorProfileKo.slots);
    const weightIds = Object.keys(investorProfileKo.weights);
    expect(slotIds.sort()).toEqual(weightIds.sort());
    expect(slotIds).toEqual(
      expect.arrayContaining(['investor-type', 'risk-check', 'horizon-goal', 'allocation-style']),
    );
  });
});
