import { describe, expect, it } from 'vitest';
import { GUIDE_CATEGORIES, GUIDE_FAQ_CATALOG } from '@sar/shared';
import { localeBundles } from '@/i18n/locale-bundles';

type GuideItems = Record<
  string,
  { title: string; paragraphs: string[]; tips?: string[]; figureCaption?: string; figure?: Record<string, string> }
>;

function guideItems(bundle: (typeof localeBundles)['ko']): GuideItems {
  return (bundle.guide as { items: GuideItems }).items;
}

describe('guide translations', () => {
  it('has matching category keys in ko and en', () => {
    for (const category of GUIDE_CATEGORIES) {
      expect(localeBundles.ko.guide.categories[category.id].label).toBeTruthy();
      expect(localeBundles.en.guide.categories[category.id].label).toBeTruthy();
    }
  });

  it('has title and paragraphs for every catalog item in ko and en', () => {
    for (const item of GUIDE_FAQ_CATALOG) {
      for (const bundle of [localeBundles.ko, localeBundles.en]) {
        const entry = guideItems(bundle)[item.id];
        expect(entry?.title, `${item.id} title`).toBeTruthy();
        expect(entry?.paragraphs?.length, `${item.id} paragraphs`).toBeGreaterThan(0);
        if (!item.id.startsWith('analysis-')) {
          expect(entry?.figureCaption, `${item.id} figureCaption`).toBeTruthy();
        }
      }
    }
  });

  it('has figure labels for every catalog item in ko and en', () => {
    for (const item of GUIDE_FAQ_CATALOG) {
      if (item.id.startsWith('analysis-')) continue;
      for (const bundle of [localeBundles.ko, localeBundles.en]) {
        const figure = guideItems(bundle)[item.id]?.figure;
        expect(figure && Object.keys(figure).length > 0, `${item.id} figure keys`).toBeTruthy();
      }
    }
  });
});
