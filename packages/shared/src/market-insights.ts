import { Market } from './enums';

/** 시세 기반 인사이트 입력 (주요 종목 시세와 동일 shape) */
export interface QuoteInsightInput {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  currentPrice: number | null;
  changePercent: number | null;
}

export type SentimentLabel = 'strong_bull' | 'bull' | 'neutral' | 'bear' | 'strong_bear';

export interface RegionSentiment {
  market: Market;
  label: SentimentLabel;
  avgChangePercent: number | null;
  upCount: number;
  downCount: number;
  flatCount: number;
  /** @deprecated use headlineKey */
  headline: string;
  /** @deprecated use descriptionKey */
  description: string;
  headlineKey: string;
  headlineParams?: Record<string, string | number>;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
}

export type RecommendationTag = 'momentum' | 'watchlist' | 'pullback' | 'defensive';

export interface StockRecommendation {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  currentPrice: number;
  changePercent: number;
  tag: RecommendationTag;
  /** @deprecated use tag + translateTag */
  tagLabel: string;
  /** @deprecated use reasonKey */
  reason: string;
  reasonKey: string;
  reasonParams?: Record<string, string | number>;
}

export interface MarketInsightsResult {
  kr: RegionSentiment;
  us: RegionSentiment;
  recommendations: StockRecommendation[];
}

const SENTIMENT_LABEL_KO: Record<SentimentLabel, string> = {
  strong_bull: '강세',
  bull: '우호',
  neutral: '혼조',
  bear: '약세',
  strong_bear: '급락',
};

const TAG_LABEL_KO: Record<RecommendationTag, string> = {
  momentum: '상승 흐름',
  watchlist: '관심',
  pullback: '조정 구간',
  defensive: '방어',
};

function validQuotes(quotes: QuoteInsightInput[]): Array<QuoteInsightInput & { changePercent: number; currentPrice: number }> {
  return quotes.filter(
    (q): q is QuoteInsightInput & { changePercent: number; currentPrice: number } =>
      q.changePercent !== null && q.currentPrice !== null,
  );
}

function sentimentFromAvg(avg: number): SentimentLabel {
  if (avg > 1.5) return 'strong_bull';
  if (avg > 0.3) return 'bull';
  if (avg >= -0.3) return 'neutral';
  if (avg >= -1.5) return 'bear';
  return 'strong_bear';
}

function regionHeadline(market: Market, label: SentimentLabel): string {
  const region = market === Market.KR ? '한국' : '미국';
  const tone = SENTIMENT_LABEL_KO[label];
  return `${region} 대표 종목 · ${tone}`;
}

function regionDescription(market: Market, label: SentimentLabel, avg: number, up: number, down: number): string {
  const region = market === Market.KR ? '국내' : '미국';
  const avgText = `${avg >= 0 ? '+' : ''}${avg.toFixed(2)}%`;
  const breadth = `상승 ${up} · 하락 ${down}`;

  switch (label) {
    case 'strong_bull':
      return `${region} 대표주 평균 ${avgText}. ${breadth} — 단기 상승세 우세.`;
    case 'bull':
      return `${region} 대표주 평균 ${avgText}. ${breadth} — 완만한 상승 분위기.`;
    case 'neutral':
      return `${region} 대표주 평균 ${avgText}. ${breadth} — 뚜렷한 방향성 없음.`;
    case 'bear':
      return `${region} 대표주 평균 ${avgText}. ${breadth} — 조정·매도 우위.`;
    case 'strong_bear':
      return `${region} 대표주 평균 ${avgText}. ${breadth} — 전반적 약세.`;
  }
}

export function computeRegionSentiment(market: Market, quotes: QuoteInsightInput[]): RegionSentiment {
  const valid = validQuotes(quotes);

  if (valid.length === 0) {
    const marketKey = market === Market.KR ? 'kr' : 'us';
    return {
      market,
      label: 'neutral',
      avgChangePercent: null,
      upCount: 0,
      downCount: 0,
      flatCount: 0,
      headline: regionHeadline(market, 'neutral'),
      description: '시세 데이터가 부족해 정세를 판단하기 어렵습니다.',
      headlineKey: 'shared.market.sentiment.headline',
      headlineParams: { market: marketKey, sentiment: 'neutral' },
      descriptionKey: 'shared.market.sentiment.noData',
    };
  }

  const avgChangePercent = valid.reduce((sum, q) => sum + q.changePercent, 0) / valid.length;
  const upCount = valid.filter((q) => q.changePercent > 0.05).length;
  const downCount = valid.filter((q) => q.changePercent < -0.05).length;
  const flatCount = valid.length - upCount - downCount;
  const label = sentimentFromAvg(avgChangePercent);

  const marketKey = market === Market.KR ? 'kr' : 'us';

  return {
    market,
    label,
    avgChangePercent,
    upCount,
    downCount,
    flatCount,
    headline: regionHeadline(market, label),
    description: regionDescription(market, label, avgChangePercent, upCount, downCount),
    headlineKey: 'shared.market.sentiment.headline',
    headlineParams: { market: marketKey, sentiment: label },
    descriptionKey: `shared.market.sentiment.description.${label}`,
    descriptionParams: {
      market: marketKey,
      avg: `${avgChangePercent >= 0 ? '+' : ''}${avgChangePercent.toFixed(2)}`,
      up: upCount,
      down: downCount,
    },
  };
}

function byChangeDesc(a: QuoteInsightInput, b: QuoteInsightInput): number {
  return (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity);
}

function byChangeAsc(a: QuoteInsightInput, b: QuoteInsightInput): number {
  return (a.changePercent ?? Infinity) - (b.changePercent ?? Infinity);
}

function byAbsChangeAsc(a: QuoteInsightInput, b: QuoteInsightInput): number {
  return Math.abs(a.changePercent ?? 0) - Math.abs(b.changePercent ?? 0);
}

function toRecommendation(
  quote: QuoteInsightInput & { changePercent: number; currentPrice: number },
  tag: RecommendationTag,
  reason: string,
  reasonKey: string,
  reasonParams?: Record<string, string | number>,
): StockRecommendation {
  return {
    symbol: quote.symbol,
    name: quote.name,
    market: quote.market,
    currency: quote.currency,
    currentPrice: quote.currentPrice,
    changePercent: quote.changePercent,
    tag,
    tagLabel: TAG_LABEL_KO[tag],
    reason,
    reasonKey,
    reasonParams,
  };
}

function pickForMarket(
  quotes: Array<QuoteInsightInput & { changePercent: number; currentPrice: number }>,
  market: Market,
  sentiment: RegionSentiment,
): StockRecommendation[] {
  const region = market === Market.KR ? 'domestic' : 'us';
  const pool = quotes.filter((q) => q.market === market);
  if (pool.length === 0) return [];

  const sortedDesc = [...pool].sort(byChangeDesc);
  const sortedAsc = [...pool].sort(byChangeAsc);
  const picks: StockRecommendation[] = [];

  const isBullish = sentiment.label === 'strong_bull' || sentiment.label === 'bull';
  const isBearish = sentiment.label === 'bear' || sentiment.label === 'strong_bear';

  if (isBullish) {
    const top = sortedDesc[0];
    picks.push(
      toRecommendation(
        top,
        'momentum',
        `${region} 대표주 중 오늘 가장 강한 흐름. 추세 지속 여부 확인.`,
        'shared.market.recommendation.momentumStrong',
        { market: region, name: top.name },
      ),
    );
    if (sortedDesc[1] && sortedDesc[1].symbol !== top.symbol) {
      picks.push(
        toRecommendation(
          sortedDesc[1],
          'watchlist',
          `강세장 속 ${sortedDesc[1].name} — 동반 상승·상대 강도 관찰.`,
          'shared.market.recommendation.bullWatchlist',
          { name: sortedDesc[1].name },
        ),
      );
    }
  } else if (isBearish) {
    const laggard = sortedAsc[0];
    picks.push(
      toRecommendation(
        laggard,
        'pullback',
        `${region} 대표주 조정폭 큼. 과매도·반등 신호 여부 관찰.`,
        'shared.market.recommendation.bearPullback',
        { market: region },
      ),
    );
    const resilient = [...pool].sort(byChangeDesc).find((q) => q.changePercent >= -0.3);
    if (resilient && resilient.symbol !== laggard.symbol) {
      picks.push(
        toRecommendation(
          resilient,
          'defensive',
          `약세장에서 상대적으로 견조한 ${resilient.name} — 방어적 관심.`,
          'shared.market.recommendation.bearDefensive',
          { name: resilient.name },
        ),
      );
    }
  } else {
    const leader = sortedDesc[0];
    const laggard = sortedAsc[0];
    picks.push(
      toRecommendation(
        leader,
        'momentum',
        `혼조장 속 ${leader.name} 상대 강세 — 방향성 확인.`,
        'shared.market.recommendation.neutralMomentum',
        { name: leader.name },
      ),
    );
    if (laggard.symbol !== leader.symbol) {
      picks.push(
        toRecommendation(
          laggard,
          'watchlist',
          `혼조장에서 조정 받는 ${laggard.name} — 지지선·반등 관찰.`,
          'shared.market.recommendation.neutralWatchlist',
          { name: laggard.name },
        ),
      );
    }
  }

  return picks;
}

export function buildMarketInsights(
  krQuotes: QuoteInsightInput[],
  usQuotes: QuoteInsightInput[],
  maxRecommendations = 4,
): MarketInsightsResult {
  const kr = computeRegionSentiment(Market.KR, krQuotes);
  const us = computeRegionSentiment(Market.US, usQuotes);
  const allValid = [...validQuotes(krQuotes), ...validQuotes(usQuotes)];

  const krPicks = pickForMarket(allValid, Market.KR, kr);
  const usPicks = pickForMarket(allValid, Market.US, us);

  const seen = new Set<string>();
  const recommendations: StockRecommendation[] = [];

  for (const pick of [...krPicks, ...usPicks]) {
    const key = `${pick.market}-${pick.symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    recommendations.push(pick);
    if (recommendations.length >= maxRecommendations) break;
  }

  return { kr, us, recommendations };
}

export function sentimentBadgeClass(label: SentimentLabel): string {
  switch (label) {
    case 'strong_bull':
      return 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40';
    case 'bull':
      return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30';
    case 'neutral':
      return 'bg-slate-500/10 text-slate-300 ring-slate-500/30';
    case 'bear':
      return 'bg-rose-500/10 text-rose-300 ring-rose-500/30';
    case 'strong_bear':
      return 'bg-rose-500/20 text-rose-200 ring-rose-500/40';
  }
}

export { SENTIMENT_LABEL_KO, TAG_LABEL_KO };
