import { Market } from './enums';
import { computeRegionSentiment } from './market-sentiment';
import type { AnalysisInsight, AnalysisTone, EvidenceItem } from './market-analysis';
import { changePercentOverBars, rangePosition, rsi, sma } from './technical-analysis';
import { buildMarketContext, detectMarketRegimes } from './market-recommendation/regime';
import { computeNarrativeDivergence } from './market-recommendation/narrative-enrichment';
import type { NarrativeDivergenceKind } from './market-recommendation/narrative-enrichment';
import { scoreKrCandidate, scoreUsCandidate } from './market-recommendation/scoring';
import { technicalSymbolKey } from './market-recommendation/technical-enrichment';
import type { QuoteInsightInput } from './market-sentiment';
import type { StockEventSnapshot } from './market-recommendation/event-enrichment';
import type { StockNewsSnapshot } from './market-recommendation/news-enrichment';
import type { StockTechnicalSnapshot } from './market-recommendation/technical-enrichment';
import type {
  EnrichedStockRecommendation,
  MarketContextInput,
  ScoreBreakdownItem,
} from './market-recommendation/types';
import type { MacroIndicatorSnapshot } from './market-macro';
import type { SectorEtfSnapshot } from './market-sector';
import { groupSectorsByMarket } from './market-sector';
import { getStockSectorTags } from './market-recommendation/sector-tags';

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
  /** 차트·이벤트·시장 레짐 위주 (뉴스·서사 제외) */
  scoreBreakdown: ScoreBreakdownItem[];
  tag: EnrichedStockRecommendation['tag'];
  tagLabel: string;
  score: number | null;
}

type FocusCategory =
  | 'stockStory'
  | 'stockPast'
  | 'stockPresent'
  | 'stockMarket'
  | 'stockOutlook'
  | 'stockNewsNote'
  | 'stockAction';

const CATEGORY_LABEL: Record<FocusCategory, string> = {
  stockStory: '한 줄 요약',
  stockPast: '최근 흐름',
  stockPresent: '지금 이 가격',
  stockMarket: '시장과의 관계',
  stockOutlook: '앞으로 볼 곳',
  stockNewsNote: '뉴스 참고 (후행)',
  stockAction: '참고 의견 (매매 아님)',
};

export type StockActionStance = 'avoid' | 'watch' | 'dip_buy' | 'take_profit';

interface ChartContext {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  rangePct: number | null;
  rangeLow: number | null;
  rangeHigh: number | null;
  /** 최근 ~2개월(42거래일) 구간 — 참고 가격대용 */
  recentRangeLow: number | null;
  recentRangeHigh: number | null;
}

interface MarketLinkContext {
  indexName: string;
  indexChange1d: number | null;
  leadingSectors: string[];
  fxChange1d: number | null;
  regimeIds: string[];
}

function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function formatNum(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function priceStep(price: number, currency: string): number {
  if (currency === 'KRW') {
    if (price >= 500_000) return 5_000;
    if (price >= 100_000) return 1_000;
    if (price >= 10_000) return 100;
    if (price >= 1_000) return 10;
    return 1;
  }
  if (price >= 500) return 5;
  if (price >= 100) return 1;
  if (price >= 10) return 0.5;
  return 0.01;
}

function roundPriceLevel(price: number, currency: string, direction: 'down' | 'up'): number {
  const step = priceStep(price, currency);
  return direction === 'down'
    ? Math.floor(price / step) * step
    : Math.ceil(price / step) * step;
}

function rangeBounds(highs: number[], lows: number[]): { low: number; high: number } | null {
  if (highs.length === 0 || lows.length === 0) return null;
  return { low: Math.min(...lows), high: Math.max(...highs) };
}

function recentRangeBounds(closes: number[], bars = 42): { low: number; high: number } | null {
  const slice = closes.slice(-Math.min(bars, closes.length));
  if (slice.length < 2) return null;
  return { low: Math.min(...slice), high: Math.max(...slice) };
}

/** 참고 매수 구간 — 현재가 아래 지지선 우선 */
function deriveActionSupport(price: number, chart: ChartContext): number {
  const below: number[] = [];
  if (chart.sma20 != null && chart.sma20 < price) below.push(chart.sma20);
  if (chart.sma50 != null && chart.sma50 < price) below.push(chart.sma50);
  if (chart.sma200 != null && chart.sma200 < price) below.push(chart.sma200);
  if (chart.recentRangeLow != null && chart.recentRangeLow < price) below.push(chart.recentRangeLow);
  if (below.length > 0) return Math.max(...below);
  if (chart.recentRangeLow != null) return Math.min(chart.recentRangeLow, price * 0.97);
  return price * 0.97;
}

/** 참고 매도 구간 — 현재가 근처 저항만 (6개월 전 고점 등 먼 과거는 제외) */
function deriveActionResistance(price: number, chart: ChartContext): number {
  const above: number[] = [];
  if (chart.recentRangeHigh != null && chart.recentRangeHigh > price) {
    above.push(chart.recentRangeHigh);
  }
  if (chart.sma20 != null && chart.sma20 > price) above.push(chart.sma20);
  if (chart.sma50 != null && chart.sma50 > price) above.push(chart.sma50);
  const near = above.filter((level) => level <= price * 1.2);
  if (near.length > 0) return Math.min(...near);
  return price * 1.08;
}

function clampBuyBelow(price: number, raw: number, currency: string): number {
  const clamped = Math.min(Math.max(raw, price * 0.9), price * 0.997);
  return roundPriceLevel(clamped, currency, 'down');
}

function clampSellAbove(price: number, raw: number, currency: string): number {
  const clamped = Math.min(Math.max(raw, price * 1.03), price * 1.15);
  return roundPriceLevel(clamped, currency, 'up');
}

function ev(key: string, params?: Record<string, string | number>): EvidenceItem {
  return { key, params };
}

function insight(
  partial: Omit<AnalysisInsight, 'categoryLabel'> & { category: FocusCategory },
): AnalysisInsight {
  return { ...partial, categoryLabel: CATEGORY_LABEL[partial.category] };
}

/** 종목 집중 분석 — 뉴스·서사 채널 제외 (PLAN: 가격·차트 우선) */
export function filterPriceFirstBreakdown(items: ScoreBreakdownItem[]): ScoreBreakdownItem[] {
  return items.filter((b) => {
    if (b.factor.startsWith('CH_NEWS:') || b.factor.startsWith('CH_NARRATIVE:')) return false;
    if (/newsBullish|newsBearish|narrative/i.test(b.evidenceKey)) return false;
    return true;
  });
}

function buildChartContext(closes: number[], highs: number[], lows: number[]): ChartContext {
  if (closes.length < 2) {
    return {
      sma20: null,
      sma50: null,
      sma200: null,
      rsi14: null,
      rangePct: null,
      rangeLow: null,
      rangeHigh: null,
      recentRangeLow: null,
      recentRangeHigh: null,
    };
  }
  const current = closes[closes.length - 1];
  const bounds = rangeBounds(highs, lows);
  const recent = recentRangeBounds(closes);
  return {
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    rsi14: rsi(closes),
    rangePct: rangePosition(current, highs, lows),
    rangeLow: bounds?.low ?? null,
    rangeHigh: bounds?.high ?? null,
    recentRangeLow: recent?.low ?? null,
    recentRangeHigh: recent?.high ?? null,
  };
}

function rsiPlainKey(rsi14: number | null): string {
  if (rsi14 == null) return 'unknown';
  if (rsi14 >= 70) return 'hot';
  if (rsi14 <= 30) return 'cold';
  if (rsi14 >= 55) return 'firm';
  if (rsi14 <= 45) return 'weak';
  return 'neutral';
}

function rsPlainKey(rs: number | null): string {
  if (rs == null) return 'unknown';
  if (rs > 2) return 'strong';
  if (rs > 0.5) return 'slightlyStrong';
  if (rs < -2) return 'weak';
  if (rs < -0.5) return 'slightlyWeak';
  return 'inline';
}

function trendPlainKey(trendKey: string): string {
  if (trendKey.includes('shortTermUp') || trendKey.includes('midTermUp')) return 'up';
  if (trendKey.includes('Pullback')) return 'pullback';
  if (trendKey.includes('longTermDown') || trendKey.includes('Down')) return 'down';
  return 'mixed';
}

function compareToIndex(stock1d: number, index1d: number | null): string {
  if (index1d == null) return 'unknown';
  const diff = stock1d - index1d;
  if (diff > 0.8) return 'muchStronger';
  if (diff > 0.2) return 'stronger';
  if (diff < -0.8) return 'muchWeaker';
  if (diff < -0.2) return 'weaker';
  return 'inline';
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

function buildMarketLinkContext(input: {
  market: Market;
  indices: MarketContextInput['indices'];
  sectors: SectorEtfSnapshot[];
  macro: MacroIndicatorSnapshot[];
  regimes: ReturnType<typeof detectMarketRegimes>;
}): MarketLinkContext {
  const benchSymbol = input.market === Market.KR ? '^KS11' : '^GSPC';
  const bench = input.indices?.find((i) => i.yahooSymbol === benchSymbol);
  const grouped = groupSectorsByMarket(input.sectors);
  const sectorList = input.market === Market.KR ? grouped.kr : grouped.us;
  const fx = input.macro.find((m) => m.kind === 'fx');

  return {
    indexName: bench?.name ?? (input.market === Market.KR ? 'KOSPI' : 'S&P 500'),
    indexChange1d: bench?.changePercent1d ?? null,
    leadingSectors: sectorList.slice(0, 2).map((s) => s.sectorLabel),
    fxChange1d: input.market === Market.KR ? (fx?.changePercent1d ?? null) : null,
    regimeIds: input.regimes.map((r) => r.id),
  };
}

function buildStoryInsight(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  change1w: number | null;
  technical: StockTechnicalSnapshot | null;
  chart: ChartContext;
  marketLink: MarketLinkContext;
}): AnalysisInsight {
  const { quote, change1w, technical, chart, marketLink } = input;
  const trendKey = trendPlainKey(technical?.trendKey ?? 'mixed');
  const vsIndex = compareToIndex(quote.changePercent, marketLink.indexChange1d);
  const rsKey = rsPlainKey(technical?.rsVsBenchmark1w ?? null);

  const tone: AnalysisTone =
    trendKey === 'up' || vsIndex === 'muchStronger' || vsIndex === 'stronger'
      ? 'bullish'
      : trendKey === 'down' || vsIndex === 'muchWeaker' || vsIndex === 'weak'
        ? 'bearish'
        : 'neutral';

  return insight({
    id: `stock-story-${quote.market}-${quote.symbol}`,
    category: 'stockStory',
    title: `${quote.name} — 쉬운 말로 정리`,
    summary: `오늘 ${formatPct(quote.changePercent)} · ${marketLink.indexName} 대비 ${vsIndex} · 추세 ${trendKey}`,
    reasoning:
      '주식 가격은 보통 뉴스보다 먼저 움직입니다. 그래서 이 해설은 **오늘·최근 시세**, **차트 추세**, **지수·업종과의 차이**를 먼저 보고 “왜 이 가격대인지”를 풀어 씁니다. 헤드라인은 이미 움직인 뒤에 붙는 경우가 많아, 본문 아래 ‘뉴스 참고’는 괴리가 있을 때만 짧게 넣습니다.',
    titleKey: 'shared.market.insights.stockFocus.story.title',
    titleParams: { name: quote.name },
    summaryKey: 'shared.market.insights.stockFocus.story.summary',
    summaryParams: {
      change1d: formatPct(quote.changePercent),
      change1w: formatPct(change1w),
      indexName: marketLink.indexName,
      vsIndexKey: vsIndex,
      trendKey,
      rsKey,
    },
    reasoningKey: 'shared.market.insights.stockFocus.story.reasoning',
    evidence: [
      `오늘 ${formatPct(quote.changePercent)} · 1주 ${formatPct(change1w)}`,
      `${marketLink.indexName} ${formatPct(marketLink.indexChange1d)} (종목과 비교)`,
      chart.sma20 != null ? `20일 평균선 ${formatNum(chart.sma20)} ${quote.currentPrice >= chart.sma20 ? '위' : '아래'}` : '',
      chart.rsi14 != null ? `RSI ${chart.rsi14.toFixed(0)} (${rsiPlainKey(chart.rsi14)})` : '',
    ].filter(Boolean),
    evidenceItems: [
      ev('shared.market.insights.evidence.stockStoryMove', {
        change1d: formatPct(quote.changePercent),
        change1w: formatPct(change1w),
      }),
      ev('shared.market.insights.evidence.stockStoryVsIndex', {
        indexName: marketLink.indexName,
        indexChange: formatPct(marketLink.indexChange1d),
        vsIndexKey: vsIndex,
      }),
      ...(chart.sma20 != null
        ? [
            ev('shared.market.insights.evidence.stockStorySma20', {
              sma20: formatNum(chart.sma20),
              positionKey: quote.currentPrice >= chart.sma20 ? 'above' : 'below',
            }),
          ]
        : []),
      ...(chart.rsi14 != null
        ? [
            ev('shared.market.insights.evidence.stockStoryRsi', {
              rsi: chart.rsi14.toFixed(0),
              zoneKey: rsiPlainKey(chart.rsi14),
            }),
          ]
        : []),
    ],
    links: [],
    tone,
    market: quote.market,
  });
}

function buildPastInsight(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  change1w: number | null;
  change1mo: number | null;
  technical: StockTechnicalSnapshot | null;
  event: StockEventSnapshot | null;
  marketLink: MarketLinkContext;
}): AnalysisInsight {
  const { quote, change1w, change1mo, technical, event, marketLink } = input;
  const evidence: string[] = [];
  const evidenceItems: EvidenceItem[] = [];

  evidence.push(`오늘(전일 대비) ${formatPct(quote.changePercent)}`);
  evidenceItems.push(
    ev('shared.market.insights.evidence.stockPast1d', { change: formatPct(quote.changePercent) }),
  );

  if (change1w != null) {
    evidence.push(`최근 5거래일(약 1주) ${formatPct(change1w)}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPast1w', { change: formatPct(change1w) }),
    );
  }
  if (change1mo != null) {
    evidence.push(`최근 21거래일(약 1개월) ${formatPct(change1mo)}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPast1mo', { change: formatPct(change1mo) }),
    );
  }

  const vsIndex = compareToIndex(change1w ?? quote.changePercent, marketLink.indexChange1d);
  evidence.push(`${marketLink.indexName} ${formatPct(marketLink.indexChange1d)} — 종목은 ${vsIndex}`);
  evidenceItems.push(
    ev('shared.market.insights.evidence.stockPastVsIndex', {
      indexName: marketLink.indexName,
      indexChange: formatPct(marketLink.indexChange1d),
      vsIndexKey: vsIndex,
    }),
  );

  if (technical?.rsVsBenchmark1w != null) {
    evidence.push(`1주 상대강도 ${formatPct(technical.rsVsBenchmark1w)} (${rsPlainKey(technical.rsVsBenchmark1w)})`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPastRs', {
        rs: formatPct(technical.rsVsBenchmark1w),
        rsKey: rsPlainKey(technical.rsVsBenchmark1w),
      }),
    );
  }

  if (event) {
    evidence.push(`일정·공시: ${eventKindLabel(event.kind)} (${event.eventDay})`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPastEvent', {
        kindKey: event.kind,
        day: event.eventDay,
      }),
    );
  }

  const tone: AnalysisTone =
    (change1w ?? quote.changePercent) > 0.5
      ? 'bullish'
      : (change1w ?? quote.changePercent) < -0.5
        ? 'bearish'
        : 'neutral';

  return insight({
    id: `stock-past-${quote.market}-${quote.symbol}`,
    category: 'stockPast',
    title: `${quote.name} — 최근에 어떻게 움직였나`,
    summary: `오늘 ${formatPct(quote.changePercent)} · 1주 ${formatPct(change1w)} · 지수 대비 ${vsIndex}`,
    reasoning:
      '“최근 흐름”은 **실제 체결된 가격**만 봅니다. 하루·일주일·한 달 수익률과 **코스피/에스피 대비 더 강한지·약한지**를 보면, 이 종목만 따로 움직였는지 시장 전체와 같이 갔는지 알 수 있습니다. 실적·배당 **일정**은 가격에 미리 반영되는 경우가 많아, 뉴스 헤드라인보다 먼저 확인하는 편이 낫습니다.',
    titleKey: 'shared.market.insights.stockFocus.past.title',
    titleParams: { name: quote.name },
    summaryKey: 'shared.market.insights.stockFocus.past.summary',
    summaryParams: {
      change1d: formatPct(quote.changePercent),
      change1w: formatPct(change1w),
      vsIndexKey: vsIndex,
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
  chart: ChartContext;
}): AnalysisInsight {
  const { quote, technical, chart } = input;
  const evidence: string[] = [];
  const evidenceItems: EvidenceItem[] = [];

  evidence.push(`현재가 ${formatNum(quote.currentPrice)} ${quote.currency} (오늘 ${formatPct(quote.changePercent)})`);
  evidenceItems.push(
    ev('shared.market.insights.evidence.stockPresentPrice', {
      price: formatNum(quote.currentPrice),
      currency: quote.currency,
      change: formatPct(quote.changePercent),
    }),
  );

  if (technical) {
    evidence.push(`추세: ${trendPlainKey(technical.trendKey)}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentTrend', {
        trendKey: trendPlainKey(technical.trendKey),
      }),
    );
  }

  if (chart.sma20 != null) {
    const above = quote.currentPrice >= chart.sma20;
    evidence.push(
      `20일 평균가 ${formatNum(chart.sma20)} — 지금 종가는 ${above ? '그 위' : '그 아래'} (${above ? '단기 매수세 우위' : '단기 조정·매도 압력'})`,
    );
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentSma20Detail', {
        sma20: formatNum(chart.sma20),
        positionKey: above ? 'above' : 'below',
      }),
    );
  }

  if (chart.sma200 != null) {
    const above = quote.currentPrice >= chart.sma200;
    evidence.push(
      `200일 평균가 ${formatNum(chart.sma200)} — ${above ? '장기 추세선 위' : '장기 추세선 아래'}`,
    );
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentSma200Detail', {
        sma200: formatNum(chart.sma200),
        positionKey: above ? 'above' : 'below',
      }),
    );
  }

  if (chart.rsi14 != null) {
    evidence.push(`RSI(14) ${chart.rsi14.toFixed(0)} — ${rsiPlainKey(chart.rsi14)}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentRsiPlain', {
        rsi: chart.rsi14.toFixed(0),
        zoneKey: rsiPlainKey(chart.rsi14),
      }),
    );
  }

  if (chart.rangePct != null) {
    evidence.push(`최근 구간(차트)에서 위치 ${chart.rangePct.toFixed(0)}%`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentRange', {
        pct: chart.rangePct.toFixed(0),
        zoneKey: chart.rangePct > 80 ? 'high' : chart.rangePct < 20 ? 'low' : 'mid',
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
          : technical?.trendKey.includes('Down') || technical?.trendKey.includes('Pullback')
            ? 'bearish'
            : 'neutral';

  return insight({
    id: `stock-present-${quote.market}-${quote.symbol}`,
    category: 'stockPresent',
    title: `${quote.name} — 지금 ${formatNum(quote.currentPrice)}원/달러인 이유`,
    summary: `20일·200일 선 대비 위치 + RSI로 “비싼지·싼지·추세”를 봅니다`,
    reasoning:
      '**평균선(이동평균)**은 많은 투자자가 보는 기준선입니다. 종가가 20일선 위면 단기적으로는 매수세가 상대적으로 강하고, 200일선 아래면 장기 하락 채널에 가깝다고 많이 봅니다. RSI는 “최근에 너무 많이 올랐/내렸는지”를 숫자로 보여 주며, **70 넘으면 과열**, **30 아래면 과매도** 쪽으로 해석합니다. 이건 매매 신호가 아니라 **지금 가격대가 차트상 어디쯤인지** 읽는 도구입니다.',
    titleKey: 'shared.market.insights.stockFocus.present.title',
    titleParams: { name: quote.name, price: formatNum(quote.currentPrice) },
    summaryKey: 'shared.market.insights.stockFocus.present.summary',
    summaryParams: {
      change: formatPct(quote.changePercent),
      trendKey: trendPlainKey(technical?.trendKey ?? 'mixed'),
    },
    reasoningKey: 'shared.market.insights.stockFocus.present.reasoning',
    evidence,
    evidenceItems,
    links: [],
    tone,
    market: quote.market,
  });
}

function buildMarketInsight(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  marketLink: MarketLinkContext;
  sectors: SectorEtfSnapshot[];
}): AnalysisInsight {
  const { quote, marketLink, sectors } = input;
  const sectorTags = getStockSectorTags(quote.symbol, quote.market);
  const grouped = groupSectorsByMarket(sectors);
  const sectorList = quote.market === Market.KR ? grouped.kr : grouped.us;
  const alignedSector = sectorList.find((s) =>
    sectorTags.some((t) => s.sectorLabel.includes(t) || t.includes(s.sectorLabel)),
  );

  const evidence: string[] = [];
  const evidenceItems: EvidenceItem[] = [];

  evidence.push(`${marketLink.indexName} 오늘 ${formatPct(marketLink.indexChange1d)}`);
  evidenceItems.push(
    ev('shared.market.insights.evidence.stockMarketIndex', {
      indexName: marketLink.indexName,
      change: formatPct(marketLink.indexChange1d),
    }),
  );

  if (marketLink.leadingSectors.length > 0) {
    evidence.push(`요즘 강한 업종: ${marketLink.leadingSectors.join(', ')}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockMarketSectors', {
        sectors: marketLink.leadingSectors.join(', '),
      }),
    );
  }

  if (alignedSector) {
    evidence.push(
      `이 종목 업종(${alignedSector.sectorLabel}) 오늘 ${formatPct(alignedSector.changePercent1d)} · RS1w ${formatPct(alignedSector.rsBenchmark1w)}`,
    );
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockMarketSectorAlign', {
        sector: alignedSector.sectorLabel,
        change: formatPct(alignedSector.changePercent1d),
        rs: formatPct(alignedSector.rsBenchmark1w),
      }),
    );
  }

  if (quote.market === Market.KR && marketLink.fxChange1d != null) {
    evidence.push(`USD/KRW ${formatPct(marketLink.fxChange1d)} (수출·반도체와 연동)`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockMarketFx', {
        change: formatPct(marketLink.fxChange1d),
      }),
    );
  }

  if (marketLink.regimeIds.length > 0) {
    evidence.push(`시장 분위기: ${marketLink.regimeIds.join(', ')}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentRegime', {
        regimes: marketLink.regimeIds.join(', '),
      }),
    );
  }

  return insight({
    id: `stock-market-${quote.market}-${quote.symbol}`,
    category: 'stockMarket',
    title: `${quote.name} — 시장·업종과 같이 움직이나`,
    summary: `${marketLink.indexName} · 업종 · ${quote.market === Market.KR ? '환율 · ' : ''}시장 분위기`,
    reasoning:
      '한 종목은 **혼자** 움직이지 않는 경우가 많습니다. 코스피/에스피가 오르는 날 대부분 같이 오르고, **반도체·금융**처럼 업종 전체가 강하면 개별 종목도 받침을 받습니다. 한국 종목은 **원·달러 환율**도 외국인·수출주에 영향을 줍니다. “지수는 올랐는데 내 종목만 떨어졌다”면 업종·개별 수급 이슈를 의심해 볼 수 있습니다.',
    titleKey: 'shared.market.insights.stockFocus.market.title',
    titleParams: { name: quote.name },
    summaryKey: 'shared.market.insights.stockFocus.market.summary',
    summaryParams: { indexName: marketLink.indexName },
    reasoningKey: 'shared.market.insights.stockFocus.market.reasoning',
    evidence,
    evidenceItems,
    links: [],
    tone: 'neutral',
    market: quote.market,
  });
}

function buildOutlookInsight(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  priceFirstBreakdown: ScoreBreakdownItem[];
  technical: StockTechnicalSnapshot | null;
  event: StockEventSnapshot | null;
}): AnalysisInsight {
  const { quote, priceFirstBreakdown, technical, event } = input;
  const evidence: string[] = [];
  const evidenceItems: EvidenceItem[] = [];

  if (technical) {
    evidence.push(`차트 추세: ${trendPlainKey(technical.trendKey)}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockPresentTrend', {
        trendKey: trendPlainKey(technical.trendKey),
      }),
    );
  }

  if (event?.kind === 'earnings_upcoming') {
    evidence.push(`실적 발표 임박 (${event.eventDay}) — 변동성 주의`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockOutlookEarnings', { day: event.eventDay }),
    );
  }

  for (const item of priceFirstBreakdown.slice(0, 6)) {
    const delta = `${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(2)}`;
    evidence.push(`${item.factor} (${delta})`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockOutlookFactor', {
        factor: item.factor.replace(/^CH_[A-Z]+:/, ''),
        delta,
        detailKey: item.evidenceKey,
        ...(item.evidenceParams ?? {}),
      }),
    );
  }

  if (evidence.length === 0) {
    evidence.push('차트·시장 데이터가 부족합니다 — 20일·200일선과 거래량을 직접 확인해 주세요');
    evidenceItems.push(ev('shared.market.insights.evidence.stockOutlookEmpty'));
  }

  const tone: AnalysisTone =
    trendPlainKey(technical?.trendKey ?? '') === 'up'
      ? 'bullish'
      : trendPlainKey(technical?.trendKey ?? '') === 'down'
        ? 'bearish'
        : 'neutral';

  return insight({
    id: `stock-outlook-${quote.market}-${quote.symbol}`,
    category: 'stockOutlook',
    title: `${quote.name} — 앞으로 차트·일정에서 볼 것`,
    summary: '가격·추세·실적 일정 중심 (뉴스 헤드라인은 참고용)',
    reasoning:
      '여기서 말하는 “앞으로”는 **예측이 아니라 관찰 체크리스트**입니다. 20일·200일선 지지/이탈, 거래량, 실적 발표일, 지수·업종과의 상대강도를 보라는 뜻입니다. **뉴스는 이미 오른 뒤에 “이유”를 붙이는 경우가 많아** 이 섹션에서는 점수에 넣지 않습니다.',
    titleKey: 'shared.market.insights.stockFocus.outlook.title',
    titleParams: { name: quote.name },
    summaryKey: 'shared.market.insights.stockFocus.outlook.summary',
    reasoningKey: 'shared.market.insights.stockFocus.outlook.reasoning',
    evidence,
    evidenceItems,
    links: [],
    tone,
    market: quote.market,
  });
}

function shouldShowNewsNote(divergence: NarrativeDivergenceKind): boolean {
  return (
    divergence !== 'none' &&
    divergence !== 'aligned' &&
    divergence !== 'crowded_bullish' &&
    divergence !== 'crowded_bearish'
  );
}

function buildActionPlan(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  chart: ChartContext;
  technical: StockTechnicalSnapshot | null;
  event: StockEventSnapshot | null;
  tag: EnrichedStockRecommendation['tag'];
  divergence: NarrativeDivergenceKind | null;
}): { stance: StockActionStance; buyBelow: number | null; sellAbove: number | null } {
  const { quote, chart, technical, event, tag, divergence } = input;
  const price = quote.currentPrice;
  const currency = quote.currency;
  const trend = trendPlainKey(technical?.trendKey ?? 'mixed');
  const rsi = chart.rsi14 ?? 50;
  const rangePct = chart.rangePct ?? 50;

  const support = deriveActionSupport(price, chart);
  const resistance = deriveActionResistance(price, chart);

  let stance: StockActionStance = 'watch';
  let buyBelow: number | null = null;
  let sellAbove: number | null = null;

  if (event?.kind === 'earnings_upcoming') {
    stance = 'watch';
    buyBelow = support;
    sellAbove = resistance;
  } else if (
    divergence === 'bullish_news_price_down' ||
    divergence === 'crowded_bullish_chase' ||
    rsi >= 72 ||
    rangePct >= 82
  ) {
    stance = 'avoid';
    buyBelow = Math.min(support, price * 0.95);
    sellAbove = resistance;
  } else if (chart.sma200 != null && price < chart.sma200 && (trend === 'down' || tag === 'defensive')) {
    stance = 'watch';
    buyBelow = chart.recentRangeLow ?? chart.sma200 * 0.97;
    sellAbove = chart.sma20 != null && chart.sma20 > price ? chart.sma20 : resistance;
  } else if (
    trend === 'pullback' ||
    tag === 'pullback' ||
    (chart.sma200 != null && price > chart.sma200 && chart.sma20 != null && price < chart.sma20) ||
    rsi <= 35
  ) {
    stance = 'dip_buy';
    buyBelow = support;
    sellAbove = resistance;
  } else if (trend === 'up' && rangePct >= 68 && rsi >= 58) {
    stance = 'take_profit';
    buyBelow = support;
    sellAbove = resistance;
  } else if (trend === 'up' && chart.sma20 != null && price >= chart.sma20) {
    stance = 'dip_buy';
    buyBelow = chart.sma20 < price ? chart.sma20 : support;
    sellAbove = resistance;
  } else {
    stance = 'watch';
    buyBelow = support;
    sellAbove = resistance;
  }

  if (buyBelow != null) {
    buyBelow = clampBuyBelow(price, buyBelow, currency);
  }
  if (sellAbove != null) {
    sellAbove = clampSellAbove(price, sellAbove, currency);
  }

  return { stance, buyBelow, sellAbove };
}

function buildActionInsight(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  chart: ChartContext;
  technical: StockTechnicalSnapshot | null;
  event: StockEventSnapshot | null;
  tag: EnrichedStockRecommendation['tag'];
  divergence: NarrativeDivergenceKind | null;
}): AnalysisInsight {
  const { quote, chart, technical, event, tag, divergence } = input;
  const plan = buildActionPlan({ quote, chart, technical, event, tag, divergence });
  const priceLabel = `${formatNum(quote.currentPrice)} ${quote.currency}`;
  const buyLabel =
    plan.buyBelow != null ? `${formatNum(plan.buyBelow)} ${quote.currency}` : '—';
  const sellLabel =
    plan.sellAbove != null ? `${formatNum(plan.sellAbove)} ${quote.currency}` : '—';

  const evidence: string[] = [`현재가 ${priceLabel}`];
  const evidenceItems: EvidenceItem[] = [
    ev('shared.market.insights.evidence.stockActionCurrent', {
      price: formatNum(quote.currentPrice),
      currency: quote.currency,
    }),
  ];

  if (plan.buyBelow != null) {
    evidence.push(`${buyLabel} 이하 — 분할·조건부 매수 관심 구간`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockActionBuyBelow', {
        price: formatNum(plan.buyBelow),
        currency: quote.currency,
      }),
    );
  }
  if (plan.sellAbove != null) {
    evidence.push(`${sellLabel} 이상 — 일부 차익·비중 축소 참고 구간`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockActionSellAbove', {
        price: formatNum(plan.sellAbove),
        currency: quote.currency,
      }),
    );
  }
  if (chart.sma20 != null) {
    evidence.push(`20일선 ${formatNum(chart.sma20)} · RSI ${chart.rsi14?.toFixed(0) ?? '—'}`);
    evidenceItems.push(
      ev('shared.market.insights.evidence.stockActionSma20', {
        sma20: formatNum(chart.sma20),
        rsi: chart.rsi14?.toFixed(0) ?? '—',
      }),
    );
  }

  const tone: AnalysisTone =
    plan.stance === 'dip_buy'
      ? 'bullish'
      : plan.stance === 'avoid'
        ? 'bearish'
        : 'neutral';

  return insight({
    id: `stock-action-${quote.market}-${quote.symbol}`,
    category: 'stockAction',
    title: `${quote.name} — 차트 기준 참고 의견`,
    summary: `현재 ${priceLabel}`,
    reasoning:
      '아래는 **차트·추세·과열 여부**만으로 정리한 참고 의견입니다. **투자 권유·매매 지시가 아니며**, 본인 판단과 리스크 감수 범위 안에서만 참고하세요. 실적·뉴스·포트폴리오 비중은 따로 보셔야 합니다.',
    titleKey: 'shared.market.insights.stockFocus.action.title',
    titleParams: { name: quote.name },
    summaryKey: `shared.market.insights.stockFocus.action.summary.${plan.stance}`,
    summaryParams: {
      price: formatNum(quote.currentPrice),
      currency: quote.currency,
      buyBelow: buyLabel,
      sellAbove: sellLabel,
    },
    reasoningKey: 'shared.market.insights.stockFocus.action.reasoning',
    evidence,
    evidenceItems,
    links: [],
    tone,
    market: quote.market,
  });
}

function buildNewsNoteInsight(input: {
  quote: QuoteInsightInput & { currentPrice: number; changePercent: number };
  news: StockNewsSnapshot;
  divergence: NarrativeDivergenceKind;
}): AnalysisInsight {
  const { quote, news, divergence } = input;

  return insight({
    id: `stock-news-note-${quote.market}-${quote.symbol}`,
    category: 'stockNewsNote',
    title: '뉴스 참고 — 가격과 엇갈릴 때만',
    summary: `헤드라인 톤 ${news.tone} · 가격 ${formatPct(quote.changePercent)} · 괴리 ${divergence}`,
    reasoning:
      '**뉴스는 보통 가격 뒤를 따라갑니다.** 오늘 긍정 기사가 많아도 이미 많이 오른 뒤일 수 있고, 악재 기사가 나와도 바닥에서 반등 중일 수 있습니다. 아래는 “기사 톤 vs 실제 등락”이 **반대**일 때만 붙입니다. 매수·매도 근거로 쓰지 말고, **이미 움직인 가격을 설명하려는 사후 해설** 정도로만 보세요.',
    titleKey: 'shared.market.insights.stockFocus.newsNote.title',
    summaryKey: 'shared.market.insights.stockFocus.newsNote.summary',
    summaryParams: {
      toneKey: news.tone,
      change: formatPct(quote.changePercent),
      divergence,
    },
    reasoningKey: 'shared.market.insights.stockFocus.newsNote.reasoning',
    evidence: [
      `「${news.headlineSample}」 (${news.articleCount}건)`,
      `괴리 유형: ${divergence}`,
    ],
    evidenceItems: [
      ev('shared.market.insights.evidence.stockNewsNoteHeadline', {
        headline: news.headlineSample,
        count: news.articleCount,
      }),
      ev('shared.market.insights.evidence.stockNewsNoteDivergence', { divergence }),
    ],
    links: [],
    tone: 'neutral',
    market: quote.market,
  });
}

export function buildStockPriceExplanationReport(input: {
  quote: QuoteInsightInput;
  chartCloses: number[];
  chartHighs?: number[];
  chartLows?: number[];
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

  const highs =
    input.chartHighs?.length === input.chartCloses.length
      ? input.chartHighs
      : input.chartCloses;
  const lows =
    input.chartLows?.length === input.chartCloses.length
      ? input.chartLows
      : input.chartCloses;

  const chart = buildChartContext(input.chartCloses, highs, lows);
  const change1w = changePercentOverBars(input.chartCloses, 5);
  const change1mo = changePercentOverBars(input.chartCloses, 21);

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

  const marketLink = buildMarketLinkContext({
    market: validQuote.market,
    indices: input.indices,
    sectors: input.sectors,
    macro: input.macro,
    regimes,
  });

  const scoreFn = validQuote.market === Market.KR ? scoreKrCandidate : scoreUsCandidate;
  const scored = scoreFn(validQuote, ctx, { allowHeld: true });
  const priceFirstBreakdown = filterPriceFirstBreakdown(scored?.scoreBreakdown ?? []);

  const narrative =
    input.news && input.technical
      ? computeNarrativeDivergence({
          news: input.news,
          technical: input.technical,
          changePercent1d: validQuote.changePercent,
        })
      : null;

  const insights: AnalysisInsight[] = [
    buildStoryInsight({
      quote: validQuote,
      change1w,
      technical: input.technical,
      chart,
      marketLink,
    }),
    buildPastInsight({
      quote: validQuote,
      change1w,
      change1mo,
      technical: input.technical,
      event: input.event,
      marketLink,
    }),
    buildPresentInsight({
      quote: validQuote,
      technical: input.technical,
      chart,
    }),
    buildMarketInsight({
      quote: validQuote,
      marketLink,
      sectors: input.sectors,
    }),
    buildOutlookInsight({
      quote: validQuote,
      priceFirstBreakdown,
      technical: input.technical,
      event: input.event,
    }),
  ];

  if (input.news && narrative && shouldShowNewsNote(narrative.divergence)) {
    insights.push(
      buildNewsNoteInsight({
        quote: validQuote,
        news: input.news,
        divergence: narrative.divergence,
      }),
    );
  }

  insights.push(
    buildActionInsight({
      quote: validQuote,
      chart,
      technical: input.technical,
      event: input.event,
      tag: scored?.tag ?? 'watchlist',
      divergence: narrative?.divergence ?? null,
    }),
  );

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
    scoreBreakdown: priceFirstBreakdown,
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
