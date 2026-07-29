import { describe, expect, it } from 'vitest';
import {
  GUIDE_CATEGORIES,
  GUIDE_FAQ_CATALOG,
  isGuideCategoryId,
} from '@sar/shared';

describe('guide catalog', () => {
  it('has unique FAQ ids', () => {
    const ids = GUIDE_FAQ_CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses valid category ids', () => {
    const categoryIds = new Set(GUIDE_CATEGORIES.map((c) => c.id));
    for (const item of GUIDE_FAQ_CATALOG) {
      expect(categoryIds.has(item.categoryId)).toBe(true);
      expect(isGuideCategoryId(item.categoryId)).toBe(true);
    }
  });

  it('uses internal hrefs for related links', () => {
    for (const item of GUIDE_FAQ_CATALOG) {
      for (const link of item.relatedLinks ?? []) {
        expect(link.href.startsWith('/')).toBe(true);
        expect(link.labelKey.startsWith('guide.links.')).toBe(true);
      }
    }
  });

  it('covers every category with at least one item', () => {
    for (const category of GUIDE_CATEGORIES) {
      const count = GUIDE_FAQ_CATALOG.filter((item) => item.categoryId === category.id).length;
      expect(count).toBeGreaterThan(0);
    }
  });
});
