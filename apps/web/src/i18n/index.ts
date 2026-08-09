export { default as i18n, changeAppLocale, getAppLocale } from './config';
export { I18nProvider } from './I18nProvider';
export { useAppNavItems } from './useAppNavItems';
export { useLocale } from './useLocale';
export {
  translateAnalysisInsight,
  translateApplicableTaxReason,
  translateApplicableTaxStatus,
  translateForeignDividendCountry,
  translateIsaOption,
  translateMarketLabel,
  translateOtherIncomeBracket,
  translatePortfolioPeriod,
  translateQuoteRange,
  translateRegionSentiment,
  translateSentiment,
  translateSimulationDescription,
  translateSimulationHeadline,
  translateSimulationReason,
  translateTag,
  translateRegime,
  translateRecommendationEvidence,
  translateTaxDisclaimer,
  translateTaxLineItem,
  translateTaxRule,
  translateGuideCategory,
  translateGuideFaqItem,
} from './translate-shared';
export type { TranslatedGuideFaqItem } from './translate-shared';
