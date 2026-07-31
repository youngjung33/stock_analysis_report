import enBase from './locales/en.json';
import koBase from './locales/ko.json';
import guideEn from './locales/guide.en.json';
import guideKo from './locales/guide.ko.json';
import investorSurveyEn from './locales/investor-survey.en.json';
import investorSurveyKo from './locales/investor-survey.ko.json';

export const localeBundles = {
  en: { ...enBase, guide: guideEn, investorSurvey: investorSurveyEn },
  ko: { ...koBase, guide: guideKo, investorSurvey: investorSurveyKo },
} as const;

export type LocaleBundle = (typeof localeBundles)['en'];
