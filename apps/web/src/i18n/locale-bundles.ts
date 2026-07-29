import enBase from './locales/en.json';
import koBase from './locales/ko.json';
import guideEn from './locales/guide.en.json';
import guideKo from './locales/guide.ko.json';

export const localeBundles = {
  en: { ...enBase, guide: guideEn },
  ko: { ...koBase, guide: guideKo },
} as const;

export type LocaleBundle = (typeof localeBundles)['en'];
