import { Market } from './enums';
import { computeRegionSentiment } from './market-sentiment';
import type { AnalysisInsight, AnalysisTone, EvidenceItem } from './market-analysis';
import { changePercentOverBars } from './technical-analysis';
import { buildMarketContext, detectMarketRegimes } from './market-recommendation/regime';
import { computeNarrativeDivergence } from './market-recommendation/narrative-enrichment';
import { scoreKrCandidate, scoreUsCandidate } from './market-recommendation/scoring';
import { technicalSymbolKey } from './market-recommendation/technical-enrichment';
import type { QuoteInsightInput } from './market-sentiment';
import type { StockEventSnapshot } from './market-recommendation/event-enrichment';
import type { StockNewsSnapshot } from './market-recommendation/news-enrichment';
import type { StockTechnicalSnapshot } from './market-recommendation/technical-enrichment';
import type { EnrichedStockRecommendation, MarketContextInput } from './market-recommendation/types';
import type { MacroIndicatorSnapshot } from './market-macro';
import type { SectorEtfSnapshot } from './market-sector';

export interface StockPriceExplanationReport {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  currentPrice: number;
  changePercent1d: number;
  changePercent1w: number | null;
  changePercent1mo: number | null;
  fetchedAt: string;
  insights: AnalysisInsight[];
  scoreBreakdown: EnrichedStockRecommendation['scoreBreakdown'];
  tag: EnrichedStockRecommendation['tag'];
  tagLabel: string;
  score: number | null;
}

const CATEGORY_LABEL: Record<'stockPast' | 'stockPresent' | 'stockOutlook', string> = {
  stockPast: '과거·최근',
  stockPresent: '현재 가격',
  stockOutlook: '전망·관찰',
};

function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function formatNum(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function ev(key: string, params?: Record<string, string | number>): EvidenceItem {
  return { key, params };
}

function insight(
  partial: Omit<AnalysisInsight, 'categoryLabel'> & {
    category: 'stockPast' | 'stockPresent' | 'stockOutlook';
  },
): AnalysisInsight {
  return { ...partial, categoryLabel: CATEGORY_LABEL[partial.category] };
}

function eventKindLabel(kind: StockEventSnapshot['kind']): string {
  const map: Record<StockEventSnapshot['kind'], string> = {
    earnings_beat: '실적 서프라이즈',
    earnings_miss: '실적 부진',
    earnings_neutral: '실적 발표',
    earnings_upcoming: '실적 발표 임박',
    dividend: '배당·환원',
    buyback: '자사주·매입',
  };
  return map[kind];
}

function buildPastInsight(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  change1w: number | null;
  change1mo: number | null;
  technical: StockTechnicalSnapshot | null;
  news: StockNewsSnapshot | null;
  event: StockEventSnapshot | null;
}): AnalysisInsight {
  const { quote, change1w, change1mo, technical, news, event } = input;
  const evidence: string[] = [];
  const evidenceItems: EvidenceItem[] = [];

  evidence.push(`전일(1일) ${formatPct(quote.changePercent)}`);
  evidenceItems.push(
    ev('shared.market.insights.evidence.stockPast1d', { change: formatPct(quote.changePercent) }),
  );

  if (change1w !== null) {
    evidence.push(`최근 1주 ${formatPct(change1w)}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPast1w', { change: formatPct(change1w) }),
    );
  }
  if (change1mo !== null) {
    evidence.push(`최근 1개월 ${formatPct(change1mo)}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPast1mo', { change: formatPct(change1mo) }),
    );
  }
  if (technical?.rsVsBenchmark1w != null) {
    evidence.push(`1주 RS(벤치마크 대비) ${formatPct(technical.rsVsBenchmark1w)}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPastRs', { rs: formatPct(technical.rsVsBenchmark1w) }),
    );
  }
  if (event) {
    evidence.push(`${eventKindLabel(event.kind)} (${event.eventDay})`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPastEvent', {
        kindKey: event.kind,
        day: event.eventDay,
      }),
    );
  }
  if (news) {
    evidence.push(`뉴스 톤 ${news.tone} · ${news.articleCount}건 · 「${news.headlineSample}」`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPastNews', {
        toneKey: news.tone,
        count: news.articleCount,
        headline: news.headlineSample,
      }),
    );
  }

  const tone: AnalysisTone =
    (change1w ?? quote.changePercent) > 0.5
      ? 'bullish'
      : (change1w ?? quote.changePercent) < -0.5
        ? 'bearish'
        : 'neutral';

  const summaryParts = [
    `전일 ${formatPct(quote.changePercent)}`,
    change1w !== null ? `1주 ${formatPct(change1w)}` : null,
    event ? eventKindLabel(event.kind) : null,
  ].filter(Boolean);

  return insight({
    id: `stock-past-${quote.market}-${quote.symbol}`,
    category: 'stockPast',
    title: `${quote.name} — 최근 흐름`,
    summary: summaryParts.join(' · '),
    reasoning:
      '전일·1주·1개월 수익률, 벤치마크 대비 상대강도, 실적·뉴스 이벤트를 함께 보면 “왜 최근 이 가격대인지” 맥락을 잡을 수 있습니다. 단기 급등·급락은 이미 반영된 재료일 수 있습니다.',
    titleKey: 'shared.market.insights.stockFocus.past.title',
    titleParams: { name: quote.name },
    summaryKey: 'shared.market.insights.stockFocus.past.summary',
    summaryParams: {
      change1d: formatPct(quote.changePercent),
      change1w: formatPct(change1w),
      event: event ? eventKindLabel(event.kind) : '—',
    },
    reasoningKey: 'shared.market.insights.stockFocus.past.reasoning',
    evidence,
    evidenceItems,
    links: [],
    tone,
    market: quote.market,
  });
}

function buildPresentInsight(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  technical: StockTechnicalSnapshot | null;
  news: StockNewsSnapshot | null;
  regimes: ReturnType<typeof detectMarketRegimes>;
}): AnalysisInsight {
  const { quote, technical, news, regimes } = input;
  const evidence: string[] = [];
  const evidenceItems: EvidenceItem[] = [];

  evidence.push(`현재가 ${formatNum(quote.currentPrice)} ${quote.currency}`);
  evidenceItems.push(
    ev('shared.market.insights.evidence.stockPresentPrice', {
      price: formatNum(quote.currentPrice),
      currency: quote.currency,
      change: formatPct(quote.changePercent),
    }),
  );

  if (technical) {
    evidence.push(`추세 ${technical.trendKey.includes('Up') ? '상승' : technical.trendKey.includes('Down') || technical.trendKey.includes('Pullback') ? '조정/하락' : '혼조'}`);
    evidenceItems.push(ev(technical.trendKey));
    if (technical.rsi14 != null) {
      evidence.push(`RSI(14) ${technical.rsi14.toFixed(1)}`);
      evidenceItems.push(
        ev('shared.market.insights.evidence.rsiValue', { rsi: technical.rsi14.toFixed(1) }),
      );
    }
    evidence.push(
      `SMA20 ${technical.aboveSma20 ? '상회' : '하회'} · SMA200 ${technical.aboveSma200 ? '상회' : '하회'}`,
    );
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentSma', {
        sma20Key: technical.aboveSma20 ? 'above' : 'below',
        sma200Key: technical.aboveSma200 ? 'above' : 'below',
      }),
    );
  }

  if (regimes.length > 0) {
    evidence.push(`시장 레짐: ${regimes.map((r) => r.id).join(', ')}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentRegime', {
        regimes: regimes.map((r) => r.id).join(', '),
      }),
    );
  }

  const narrative = news
    ? computeNarrativeDivergence({
        news,
        technical: technical ?? undefined,
        changePercent1d: quote.changePercent,
      })
    : null;
  if (narrative) {
    evidence.push(`뉴스·가격 괴리: ${narrative.divergence}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentDivergence', {
        divergence: narrative.divergence,
      }),
    );
  }

  const tone: AnalysisTone =
    quote.changePercent > 0.3
      ? 'bullish'
      : quote.changePercent < -0.3
        ? 'bearish'
        : technical?.trendKey.includes('Up')
          ? 'bullish'
          : technical?.trendKey.includes('Down')
            ? 'bearish'
            : 'neutral';

  return insight({
    id: `stock-present-${quote.market}-${quote.symbol}`,
    category: 'stockPresent',
    title: `${quote.name} — 지금 이 가격 (${formatNum(quote.currentPrice)})`,
    summary: `당일 ${formatPct(quote.changePercent)} · ${technical?.trendKey.includes('Up') ? '상승 추세' : technical?.trendKey.includes('Pullback') ? '조정' : '혼조/횡보'}`,
    reasoning:
      '현재가는 당일 수급·차트 추세·시장 레짐(리스크온/오프, 환율 등)이 겹친 결과입니다. 뉴스 톤과 가격이 엇갈리면(서사 괴리) 이미 알려진 재료가 소화 중이거나 반대 해석이 가능한 구간일 수 있습니다.',
    titleKey: 'shared.market.insights.stockFocus.present.title',
    titleParams: { name: quote.name, price: formatNum(quote.currentPrice) },
    summaryKey: 'shared.market.insights.stockFocus.present.summary',
    summaryParams: {
      change: formatPct(quote.changePercent),
      trendKey: technical?.trendKey ?? 'shared.market.trends.mixed',
    },
    reasoningKey: 'shared.market.insights.stockFocus.present.reasoning',
    evidence,
    evidenceItems,
    links: [],
    tone,
    market: quote.market,
  });
}

function buildOutlookInsight(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  scored: EnrichedStockRecommendation | null;
}): AnalysisInsight {
  const { quote, scored } = input;
  const evidence: string[] = [];
  const evidenceItems: EvidenceItem[] = [];

  if (scored) {
    evidence.push(`엔진 태그: ${scored.tagLabel} (score ${scored.score.toFixed(2)})`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockOutlookTag', {
        tagKey: scored.tag,
        score: scored.score.toFixed(2),
      }),
    );
    for (const item of scored.scoreBreakdown.slice(0, 5)) {
      evidence.push(`${item.factor} (${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(2)})`);
      evidenceItems.push(ev(item.evidenceKey, item.evidenceParams));
    }
  } else {
    evidence.push('점수 산출 데이터 부족 — 차트·뉴스 확인 권장');
    evidenceItems.push(ev('shared.market.insights.evidence.stockOutlookEmpty'));
  }

  const tone: AnalysisTone =
    scored?.tag === 'momentum'
      ? 'bullish'
      : scored?.tag === 'pullback'
        ? 'bearish'
        : scored?.tag === 'defensive'
          ? 'neutral'
          : 'neutral';

  const topFactor = scored?.scoreBreakdown[0]?.factor ?? '—';

  return insight({
    id: `stock-outlook-${quote.market}-${quote.symbol}`,
    category: 'stockOutlook',
    title: `${quote.name} — 앞으로 관찰할 포인트`,
    summary: scored
      ? `${scored.tagLabel} 관점 · 핵심 변수 ${topFactor}`
      : '데이터 기반 시나리오를 만들기 어렵습니다.',
    reasoning:
      '아래 요인은 추천 엔진이 차트·뉴스·이벤트·시장 레짐을 합산한 관찰 포인트입니다. **미래 가격 예측이 아니며** 투자 권유가 아닙니다. 실적 일정·지지/저항·거래량·지수 연동을 함께 확인하세요.',
    titleKey: 'shared.market.insights.stockFocus.outlook.title',
    titleParams: { name: quote.name },
    summaryKey: scored
      ? 'shared.market.insights.stockFocus.outlook.summary'
      : 'shared.market.insights.stockFocus.outlook.summaryEmpty',
    summaryParams: {
      tagKey: scored?.tag ?? 'watchlist',
      factor: topFactor,
    },
    reasoningKey: 'shared.market.insights.stockFocus.outlook.reasoning',
    evidence,
    evidenceItems,
    links: [],
    tone,
    market: quote.market,
  });
}

export function buildStockPriceExplanationReport(input: {
  quote: QuoteInsightInput;
  chartCloses: number[];
  technical: StockTechnicalSnapshot | null;
  news: StockNewsSnapshot | null;
  event: StockEventSnapshot | null;
  krQuotes: QuoteInsightInput[];
  usQuotes: QuoteInsightInput[];
  macro: MacroIndicatorSnapshot[];
  sectors: SectorEtfSnapshot[];
  indices: MarketContextInput['indices'];
  usdKrwRate?: number | null;
  usdKrwChange1d?: number | null;
  userHoldings?: Array<{ symbol: string; market: Market }>;
  userWatchlist?: Array<{ symbol: string; market: Market }>;
  technicalSnapshots?: StockTechnicalSnapshot[];
  newsSnapshots?: StockNewsSnapshot[];
  eventSnapshots?: StockEventSnapshot[];
  figureStatements?: MarketContextInput['figureStatements'];
  fetchedAt?: string;
}): StockPriceExplanationReport | null {
  if (input.quote.currentPrice === null || input.quote.changePercent === null) {
    return null;
  }

  const validQuote = input.quote as QuoteInsightInput & {
    currentPrice: number;
    changePercent: number;
  };

  const krSentiment = computeRegionSentiment(Market.KR, input.krQuotes);
  const usSentiment = computeRegionSentiment(Market.US, input.usQuotes);

  const ctx = buildMarketContext({
    krSentiment,
    usSentiment,
    macro: input.macro,
    sectors: input.sectors,
    indices: input.indices,
    usdKrwRate: input.usdKrwRate,
    usdKrwChange1d: input.usdKrwChange1d,
    userHoldings: input.userHoldings,
    userWatchlist: input.userWatchlist,
    technicalSnapshots: input.technicalSnapshots,
    newsSnapshots: input.newsSnapshots,
    eventSnapshots: input.eventSnapshots,
    figureStatements: input.figureStatements,
  });

  const regimes = detectMarketRegimes({
    krSentiment,
    usSentiment,
    macro: input.macro,
    usdKrwChange1d: input.usdKrwChange1d ?? null,
  });

  const scoreFn = validQuote.market === Market.KR ? scoreKrCandidate : scoreUsCandidate;
  const scored = scoreFn(validQuote, ctx, { allowHeld: true });

  const change1w = changePercentOverBars(input.chartCloses, 5);
  const change1mo = changePercentOverBars(input.chartCloses, 21);

  const insights: AnalysisInsight[] = [
    buildPastInsight({
      quote: validQuote,
      change1w,
      change1mo,
      technical: input.technical,
      news: input.news,
      event: input.event,
    }),
    buildPresentInsight({
      quote: validQuote,
      technical: input.technical,
      news: input.news,
      regimes,
    }),
    buildOutlookInsight({ quote: validQuote, scored }),
  ];

  return {
    symbol: validQuote.symbol,
    name: validQuote.name,
    market: validQuote.market,
    currency: validQuote.currency,
    currentPrice: validQuote.currentPrice,
    changePercent1d: validQuote.changePercent,
    changePercent1w: change1w,
    changePercent1mo: change1mo,
    fetchedAt: input.fetchedAt ?? new Date().toISOString(),
    insights,
    scoreBreakdown: scored?.scoreBreakdown ?? [],
    tag: scored?.tag ?? 'watchlist',
    tagLabel: scored?.tagLabel ?? '관심',
    score: scored?.score ?? null,
  };
}

export function pickStockEnrichment<T extends { symbol: string; market: Market }>(
  items: T[],
  symbol: string,
  market: Market,
): T | null {
  const key = technicalSymbolKey(symbol, market);
  return items.find((i) => technicalSymbolKey(i.symbol, i.market) === key) ?? null;
}
