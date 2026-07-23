import type { TFunction } from 'i18next';
import {
  type EvidenceItem,
  type AnalysisInsight,
  type ApplicableTaxStatus,
  type IsaAccountType,
  type MacroIndicatorSnapshot,
  type OtherIncomeBracketId,
  type PortfolioPeriod,
  type PortfolioSimulationResult,
  type QuoteChartRange,
  type RecommendationTag,
  type RegionSentiment,
  type SectorEtfSnapshot,
  type SentimentLabel,
  type SimulationAction,
  type TaxLineItem,
  Market,
  KOREAN_TAX_RULES_REFERENCE,
} from '@sar/shared';

type TaxRuleItem = (typeof KOREAN_TAX_RULES_REFERENCE)[number];

function resolveInsightParams(
  params: Record<string, string | number> | undefined,
  t: TFunction,
): Record<string, string | number> {
  if (!params) return {};
  const resolved: Record<string, string | number> = { ...params };

  if (resolved.regionKey !== undefined) {
    const key = String(resolved.regionKey);
    if (key === 'kr') resolved.region = t('shared.market.sentiment.marketLabel.kr');
    else if (key === 'us') resolved.region = t('shared.market.sentiment.marketLabel.us');
    else if (key === 'usGlobal') resolved.region = t('shared.market.insights.regions.usGlobal');
    delete resolved.regionKey;
  }

  if (resolved.biasKey !== undefined) {
    resolved.bias = t(`shared.market.insights.breadth.bias.${resolved.biasKey}`);
    delete resolved.biasKey;
  }

  if (resolved.trendKey !== undefined) {
    resolved.trend = t(String(resolved.trendKey), {
      defaultValue: String(resolved.trendKey),
    });
    delete resolved.trendKey;
  }

  if (resolved.labelKey !== undefined) {
    resolved.label = t(String(resolved.labelKey), {
      defaultValue: String(resolved.label ?? resolved.labelKey),
    });
    delete resolved.labelKey;
  }

  if (resolved.interpretKey !== undefined) {
    resolved.interpret = t(String(resolved.interpretKey), {
      defaultValue: String(resolved.interpret ?? resolved.interpretKey),
    });
    delete resolved.interpretKey;
  }

  if (resolved.zoneKey !== undefined) {
    const zone = String(resolved.zoneKey);
    resolved.zone = t(`shared.market.rsiZone.${zone}`);
    resolved.zoneSummary = t(`shared.market.rsiZoneSummary.${zone}`);
    delete resolved.zoneKey;
  }

  if (resolved.sideKey !== undefined) {
    resolved.side = t(`shared.market.macdSide.${resolved.sideKey}`);
    delete resolved.sideKey;
  }

  if (resolved.alignedKey !== undefined) {
    resolved.aligned = t(`shared.market.macdAligned.${resolved.alignedKey}`);
    delete resolved.alignedKey;
  }

  if (resolved.aligned !== undefined && typeof resolved.aligned === 'string') {
    if (resolved.aligned === 'yes' || resolved.aligned === 'no') {
      resolved.alignedSuffix = t(`shared.market.macdAlignedSuffix.${resolved.aligned}`);
      delete resolved.aligned;
    }
  }

  if (resolved.toneKey !== undefined) {
    resolved.toneLabel = t(`shared.market.insights.news.tone.${resolved.toneKey}`);
    delete resolved.toneKey;
  }

  if (resolved.tagKey !== undefined) {
    resolved.tag = translateTag(resolved.tagKey as RecommendationTag, t);
    delete resolved.tagKey;
  }

  if (resolved.sectorSymbol !== undefined) {
    const symbol = String(resolved.sectorSymbol);
    resolved.sector = t(`shared.market.sectors.bySymbol.${symbol}`, {
      defaultValue: String(resolved.sectorLabel ?? symbol),
    });
    delete resolved.sectorSymbol;
    delete resolved.sectorLabel;
  }

  if (resolved.market !== undefined) {
    const m = String(resolved.market);
    if (m === 'domestic' || m === 'KR') {
      resolved.market = t('shared.market.sentiment.marketLabel.kr');
    } else if (m === 'us' || m === 'US') {
      resolved.market = t('shared.market.sentiment.marketLabel.us');
    }
  }

  return resolved;
}

function translateInsightField(
  key: string | undefined,
  params: Record<string, string | number> | undefined,
  fallback: string,
  t: TFunction,
): string {
  if (!key) return fallback;
  const resolved = resolveInsightParams(params, t);
  return t(key, { ...resolved, defaultValue: fallback });
}

export function translateQuoteRange(range: QuoteChartRange, t: TFunction): string {
  return t(`quoteRange.${range}`);
}

export function translateSentiment(label: SentimentLabel, t: TFunction): string {
  return t(`shared.sentiment.${label}`);
}

export function translateTag(tag: RecommendationTag, t: TFunction): string {
  return t(`shared.tag.${tag}`);
}

export function translatePortfolioPeriod(period: PortfolioPeriod, t: TFunction): string {
  return t(`shared.periods.${period}`);
}

export function translateTaxRule(rule: TaxRuleItem, t: TFunction): {
  category: string;
  title: string;
  summary: string;
  rateLabel: string;
  thresholdLabel: string;
  filingLabel: string;
  notes: string[];
} {
  const base = `shared.tax.rules.${rule.id}`;
  return {
    category: t(`${base}.category`),
    title: t(`${base}.title`),
    summary: t(`${base}.summary`),
    rateLabel: t(`${base}.rateLabel`),
    thresholdLabel: t(`${base}.thresholdLabel`),
    filingLabel: t(`${base}.filingLabel`),
    notes: rule.notes.map((_, i) => t(`${base}.notes.${i}`)),
  };
}

export function translateIsaOption(id: IsaAccountType, t: TFunction): { label: string; description: string } {
  return {
    label: t(`shared.tax.isa.${id}.label`),
    description: t(`shared.tax.isa.${id}.description`),
  };
}

export function translateOtherIncomeBracket(id: OtherIncomeBracketId, t: TFunction): {
  label: string;
  rateLabel: string;
} {
  return {
    label: t(`shared.tax.otherIncome.${id}.label`),
    rateLabel: t(`shared.tax.otherIncome.${id}.rateLabel`),
  };
}

export function translateApplicableTaxStatus(status: ApplicableTaxStatus, t: TFunction): string {
  return t(`shared.tax.applicableStatus.${status}`);
}

export function translateApplicableTaxReason(
  ruleId: string,
  status: ApplicableTaxStatus,
  t: TFunction,
  fallback: string,
  params?: Record<string, string | number>,
): string {
  const key = `shared.tax.applicableReasons.${ruleId}.${status}`;
  const translated = t(key, { ...(params ?? {}), defaultValue: '' });
  return translated || fallback;
}

export function translateForeignDividendCountry(
  source: string,
  t: TFunction,
): { label: string; note: string } {
  return {
    label: t(`shared.tax.foreignDividend.${source}.label`),
    note: t(`shared.tax.foreignDividend.${source}.note`),
  };
}

export function translateMarketLabel(market: 'KR' | 'US', t: TFunction): string {
  return market === 'KR' ? t('common.marketKr') : t('common.marketUs');
}

function resolveRegionLabel(regionKey: string | number | undefined, t: TFunction): string {
  if (regionKey === 'domestic') return t('market.region.krShort');
  if (regionKey === 'us') return t('common.usMarket');
  return String(regionKey ?? '');
}

export function translateSimulationHeadline(
  sim: Pick<PortfolioSimulationResult, 'headlineKey' | 'headlineParams' | 'headline'>,
  t: TFunction,
): string {
  return t(sim.headlineKey, { ...(sim.headlineParams ?? {}), defaultValue: sim.headline });
}

export function translateSimulationDescription(
  sim: Pick<PortfolioSimulationResult, 'descriptionKey' | 'descriptionParams' | 'description'>,
  t: TFunction,
): string {
  const params = { ...(sim.descriptionParams ?? {}) };
  if (params.region !== undefined) {
    params.region = resolveRegionLabel(params.region, t);
  }
  return t(sim.descriptionKey, { ...params, defaultValue: sim.description });
}

export function translateSimulationReason(action: SimulationAction, t: TFunction): string {
  const params = { ...(action.reasonParams ?? {}) };
  if (action.tag) {
    const tagLabel = translateTag(action.tag, t);
    return t(action.reasonKey, { ...params, tag: tagLabel, defaultValue: action.reason });
  }
  if (params.market !== undefined) {
    params.market = resolveInsightParams({ market: params.market }, t).market ?? params.market;
  }
  return t(action.reasonKey, { ...params, defaultValue: action.reason });
}

export function translateRegionSentiment(
  sentiment: RegionSentiment,
  t: TFunction,
): { headline: string; description: string } {
  const marketKey = sentiment.market === Market.KR ? 'kr' : 'us';
  const marketLabel = t(`shared.market.sentiment.marketLabel.${marketKey}`);
  const sentimentLabel = translateSentiment(sentiment.label, t);
  const descParams = resolveInsightParams(sentiment.descriptionParams, t);
  return {
    headline: t(sentiment.headlineKey, {
      ...(sentiment.headlineParams ?? {}),
      market: marketLabel,
      sentiment: sentimentLabel,
      defaultValue: sentiment.headline,
    }),
    description: t(sentiment.descriptionKey, {
      ...descParams,
      defaultValue: sentiment.description,
    }),
  };
}

export function translateTaxLineItem(
  line: TaxLineItem,
  t: TFunction,
  extraParams?: Record<string, string | number>,
): { category: string; label: string; note?: string } {
  const base = `shared.tax.estimateLines.${line.id}`;
  const params = extraParams ?? {};
  return {
    category: t(`${base}.category`, { defaultValue: line.category }),
    label: t(`${base}.label`, { ...params, defaultValue: line.label }),
    note: line.note
      ? t(`${base}.note`, { ...params, defaultValue: line.note })
      : undefined,
  };
}

export function translateTaxDisclaimer(index: number, fallback: string, t: TFunction): string {
  return t(`shared.tax.disclaimers.${index}`, { defaultValue: fallback });
}

export function translateMacroIndicator(
  item: MacroIndicatorSnapshot,
  t: TFunction,
): { interpretLabel: string; interpretDetail: string } {
  const params = resolveInsightParams(item.interpretDetailParams, t);
  return {
    interpretLabel: t(item.interpretKey, { defaultValue: item.interpretLabel }),
    interpretDetail: t(item.interpretDetailKey, { ...params, defaultValue: item.interpretDetail }),
  };
}

export function translateTrendLabel(
  snapshot: { trendKey: string; trendLabel: string },
  t: TFunction,
): string {
  return t(snapshot.trendKey, { defaultValue: snapshot.trendLabel });
}

export function translateBollingerLabel(
  snapshot: { labelKey: string; label: string },
  t: TFunction,
): string {
  return t(snapshot.labelKey, { defaultValue: snapshot.label });
}

export function translateStrengthLabel(
  snapshot: Pick<SectorEtfSnapshot, 'strengthKey' | 'strengthLabel'>,
  t: TFunction,
): string {
  return t(snapshot.strengthKey, { defaultValue: snapshot.strengthLabel });
}

export function translateSectorLabel(
  snapshot: Pick<SectorEtfSnapshot, 'yahooSymbol' | 'sectorLabel'>,
  t: TFunction,
): string {
  return t(`shared.market.sectors.bySymbol.${snapshot.yahooSymbol}`, {
    defaultValue: snapshot.sectorLabel,
  });
}

export function translateRsiLabel(value: number | null, fallback: string, t: TFunction): string {
  if (value === null) return t('common.dash');
  if (value >= 70) return t('shared.market.rsi.overbought');
  if (value <= 30) return t('shared.market.rsi.oversold');
  return t('shared.market.rsi.neutral', { defaultValue: fallback });
}

function translateEvidenceItem(item: EvidenceItem, fallback: string, t: TFunction): string {
  const params: Record<string, string | number> = { ...(item.params ?? {}) };

  if (item.key === 'shared.market.insights.evidence.regionSentiment') {
    const regionKey = String(params.regionKey ?? '');
    const labelKey = String(params.labelKey ?? '');
    return t(item.key, {
      region: t(regionKey === 'kr' ? 'market.korea' : 'market.us'),
      sentiment: t(`shared.market.sentiment.${labelKey}`),
      avg: params.avg,
      defaultValue: fallback,
    });
  }

  if (item.key === 'shared.market.insights.evidence.dispersion' && params.levelKey) {
    params.level = t(`shared.market.insights.evidence.dispersionLevel.${params.levelKey}`);
    delete params.levelKey;
  }
  if (
    (item.key === 'shared.market.insights.evidence.sma20' ||
      item.key === 'shared.market.insights.evidence.sma200') &&
    params.positionKey
  ) {
    params.position = t(`shared.market.insights.evidence.smaPosition.${params.positionKey}`);
    delete params.positionKey;
  }
  if (item.key === 'shared.market.insights.evidence.rangePosition' && params.zoneKey) {
    params.zone = t(`shared.market.insights.evidence.rangeZone.${params.zoneKey}`);
    delete params.zoneKey;
  }
  if (item.key === 'shared.market.insights.evidence.macdSign' && params.signKey) {
    params.sign = t(`shared.market.insights.evidence.macdSignValue.${params.signKey}`);
    delete params.signKey;
  }
  if (item.key === 'shared.market.insights.evidence.volumeRatio' && params.activeKey) {
    params.activity = t(`shared.market.insights.evidence.volumeActivity.${params.activeKey}`);
    delete params.activeKey;
  }
  if (item.key === 'shared.market.insights.evidence.recTag' && params.tagKey) {
    params.tag = t(`shared.market.tag.${params.tagKey}`);
    delete params.tagKey;
  }

  return t(item.key, { ...params, defaultValue: fallback });
}

export function translateAnalysisInsight(
  insight: AnalysisInsight,
  t: TFunction,
): Pick<AnalysisInsight, 'categoryLabel' | 'title' | 'summary' | 'reasoning'> & { evidence: string[] } {
  const categoryLabel = t(`shared.market.categories.${insight.category}`);
  const title = translateInsightField(insight.titleKey, insight.titleParams, insight.title, t);
  const summary = translateInsightField(insight.summaryKey, insight.summaryParams, insight.summary, t);
  const reasoning = translateInsightField(insight.reasoningKey, insight.reasoningParams, insight.reasoning, t);
  const evidence =
    insight.evidenceItems?.map((item, index) =>
      translateEvidenceItem(item, insight.evidence[index] ?? '', t),
    ) ?? insight.evidence;
  return { categoryLabel, title, summary, reasoning, evidence };
}
