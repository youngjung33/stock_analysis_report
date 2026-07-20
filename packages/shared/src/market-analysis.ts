import { Market } from './enums';
import { MacroIndicatorSnapshot, MacroSeriesInput, buildMacroSnapshot } from './market-macro';
import {
  SectorEtfSnapshot,
  SectorSeriesInput,
  buildSectorSnapshot,
  groupSectorsByMarket,
  rankSectorSnapshots,
} from './market-sector';
import {
  bollingerBands,
  macdLine,
  rangePosition,
  rsi,
  sma,
  stdDev,
  stochastic,
  volumeRatio,
} from './technical-analysis';
import {
  MarketInsightsResult,
  QuoteInsightInput,
  RegionSentiment,
  StockRecommendation,
  buildMarketInsights,
  computeRegionSentiment,
} from './market-insights';

export type AnalysisCategory =
  | 'breadth'
  | 'index'
  | 'technical'
  | 'news'
  | 'macro'
  | 'sector'
  | 'recommendation';

export type AnalysisTone = 'bullish' | 'bearish' | 'neutral';

export interface AnalysisLink {
  label: string;
  url: string;
}

export interface AnalysisInsight {
  id: string;
  category: AnalysisCategory;
  categoryLabel: string;
  title: string;
  summary: string;
  reasoning: string;
  evidence: string[];
  links: AnalysisLink[];
  tone: AnalysisTone;
  market: Market | 'global';
}

export interface IndexTechnicalInput {
  yahooSymbol: string;
  name: string;
  market: Market;
  closes: number[];
  volumes: number[];
  highs: number[];
  lows: number[];
  changePercent1d: number | null;
  chartUrl: string;
  tradingViewUrl: string;
}

export interface BollingerSnapshot {
  upper: number;
  middle: number;
  lower: number;
  percentB: number;
  bandwidthPct: number;
  label: string;
}

export interface StochasticSnapshot {
  k: number;
  d: number;
  label: string;
}

export interface IndexTechnicalSnapshot {
  yahooSymbol: string;
  name: string;
  market: Market;
  currentPrice: number;
  changePercent1d: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  macd: number | null;
  bollinger: BollingerSnapshot | null;
  stochastic: StochasticSnapshot | null;
  rangePositionPct: number | null;
  volumeRatio: number | null;
  trendLabel: string;
  chartUrl: string;
  tradingViewUrl: string;
}

export interface NewsAnalysisInput {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  market: Market | 'global';
}

export interface MarketAnalysisReport extends MarketInsightsResult {
  fetchedAt: string;
  krQuotes: QuoteInsightInput[];
  usQuotes: QuoteInsightInput[];
  macro: MacroIndicatorSnapshot[];
  indices: IndexTechnicalSnapshot[];
  sectors: SectorEtfSnapshot[];
  insights: AnalysisInsight[];
  news: NewsAnalysisInput[];
}

const CATEGORY_LABEL: Record<AnalysisCategory, string> = {
  breadth: '시장 폭',
  index: '지수·차트',
  technical: '기술적 지표',
  news: '뉴스·이슈',
  macro: '경기·심리',
  sector: '업종 상대강도',
  recommendation: '종목 관찰',
};

function bollingerLabel(percentB: number): string {
  if (percentB >= 1) return '상단 이탈(과열)';
  if (percentB >= 0.8) return '상단 밴드 근접';
  if (percentB <= 0) return '하단 이탈(과매도)';
  if (percentB <= 0.2) return '하단 밴드 근접';
  return '밴드 중앙';
}

function stochasticLabel(k: number, d: number): string {
  if (k >= 80 && d >= 80) return '과매수';
  if (k <= 20 && d <= 20) return '과매도';
  if (k > d) return 'K>D 상승';
  if (k < d) return 'K<D 하락';
  return '중립';
}

export function buildIndexSnapshot(input: IndexTechnicalInput): IndexTechnicalSnapshot | null {
  const { closes } = input;
  if (closes.length < 2) return null;

  const currentPrice = closes[closes.length - 1];
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const rsi14 = rsi(closes);
  const macd = macdLine(closes);
  const rangePos = rangePosition(currentPrice, input.highs, input.lows);
  const volRatio = volumeRatio(input.volumes);
  const bb = bollingerBands(closes);
  const stoch = stochastic(input.highs, input.lows, closes);

  let trendLabel = '혼조';
  if (sma20 !== null && sma50 !== null && currentPrice > sma20 && sma20 > sma50) {
    trendLabel = '단기 상승 추세';
  } else if (sma50 !== null && sma200 !== null && currentPrice > sma50 && sma50 > sma200) {
    trendLabel = '중기 상승 추세';
  } else if (sma20 !== null && currentPrice < sma20) {
    trendLabel = '단기 조정';
  } else if (sma200 !== null && currentPrice < sma200) {
    trendLabel = '장기 하락 채널';
  }

  return {
    yahooSymbol: input.yahooSymbol,
    name: input.name,
    market: input.market,
    currentPrice,
    changePercent1d: input.changePercent1d,
    sma20,
    sma50,
    sma200,
    rsi14,
    macd,
    bollinger: bb
      ? {
          upper: bb.upper,
          middle: bb.middle,
          lower: bb.lower,
          percentB: bb.percentB,
          bandwidthPct: bb.bandwidthPct,
          label: bollingerLabel(bb.percentB),
        }
      : null,
    stochastic: stoch
      ? { k: stoch.k, d: stoch.d, label: stochasticLabel(stoch.k, stoch.d) }
      : null,
    rangePositionPct: rangePos,
    volumeRatio: volRatio,
    trendLabel,
    chartUrl: input.chartUrl,
    tradingViewUrl: input.tradingViewUrl,
  };
}

function insight(
  partial: Omit<AnalysisInsight, 'categoryLabel'> & { category: AnalysisCategory },
): AnalysisInsight {
  return { ...partial, categoryLabel: CATEGORY_LABEL[partial.category] };
}

function breadthInsights(
  kr: RegionSentiment,
  us: RegionSentiment,
  krQuotes: QuoteInsightInput[],
  usQuotes: QuoteInsightInput[],
): AnalysisInsight[] {
  const items: AnalysisInsight[] = [];
  const regions: Array<{ sentiment: RegionSentiment; quotes: QuoteInsightInput[]; market: Market }> = [
    { sentiment: kr, quotes: krQuotes, market: Market.KR },
    { sentiment: us, quotes: usQuotes, market: Market.US },
  ];

  for (const { sentiment, quotes, market } of regions) {
    const valid = quotes.filter((q) => q.changePercent !== null);
    if (valid.length === 0) continue;

    const changes = valid.map((q) => q.changePercent as number);
    const dispersion = stdDev(changes);
    const adRatio = sentiment.downCount > 0 ? sentiment.upCount / sentiment.downCount : sentiment.upCount;
    const leader = [...valid].sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))[0];
    const laggard = [...valid].sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0))[0];
    const region = market === Market.KR ? '한국' : '미국';

    const tone: AnalysisTone =
      sentiment.label === 'strong_bull' || sentiment.label === 'bull'
        ? 'bullish'
        : sentiment.label === 'bear' || sentiment.label === 'strong_bear'
          ? 'bearish'
          : 'neutral';

    items.push(
      insight({
        id: `breadth-${market}`,
        category: 'breadth',
        title: `${region} 대표주 ${sentiment.upCount}↑ ${sentiment.downCount}↓ — ${adRatio >= 1 ? '상승 우위' : '하락 우위'}`,
        summary: `${region} 대표 ${valid.length}종 평균 ${formatPct(sentiment.avgChangePercent)}. 상승·하락 비율 ${adRatio.toFixed(2)}.`,
        reasoning:
          adRatio > 1.5
            ? '상승 종목 수가 하락 종목보다 확실히 많으면 위험 선호 심리가 강한 편입니다. 소수 대형주만 오르는 것보다 전반적으로 오르는 편이 건강합니다.'
            : adRatio < 0.7
              ? '하락 종목이 우세하면 단기적으로 매도 압력·위험 회피 심리가 강합니다. 지수만 버티는지, 대표주 전반이 약한지 함께 확인하는 것이 좋습니다.'
              : '상승·하락이 엇갈리면 방향성이 분명하지 않습니다. 추세 추종보다 개별 종목·업종 차별화가 큰 장세로 해석합니다.',
        evidence: [
          `평균 등락 ${formatPct(sentiment.avgChangePercent)}`,
          `상승 ${sentiment.upCount} · 하락 ${sentiment.downCount} · 보합 ${sentiment.flatCount}`,
          `등락률 표준편차 ${dispersion !== null ? dispersion.toFixed(2) : '-'}% (분산 ${dispersion !== null && dispersion > 1.5 ? '큼' : '보통'})`,
          `주도 ${leader.name} ${formatPct(leader.changePercent)} · 부진 ${laggard.name} ${formatPct(laggard.changePercent)}`,
        ],
        links: [
          {
            label: market === Market.KR ? '네이버 금융 코스피' : 'Yahoo S&P 500',
            url: market === Market.KR ? 'https://finance.naver.com/sise/' : 'https://finance.yahoo.com/quote/%5EGSPC/',
          },
          {
            label: 'TradingView',
            url: market === Market.KR ? 'https://www.tradingview.com/symbols/KRX-KOSPI/' : 'https://www.tradingview.com/symbols/SP-SPX/',
          },
        ],
        tone,
        market,
      }),
    );
  }

  return items;
}

function indexInsights(indices: IndexTechnicalSnapshot[]): AnalysisInsight[] {
  return indices.flatMap((idx) => {
    const items: AnalysisInsight[] = [];
    const region = idx.market === Market.KR ? '국내' : '미국';

    items.push(
      insight({
        id: `index-trend-${idx.yahooSymbol}`,
        category: 'index',
        title: `${idx.name} — ${idx.trendLabel}`,
        summary: `현재 ${formatNum(idx.currentPrice)} · 1일 ${formatPct(idx.changePercent1d)} · ${idx.trendLabel}`,
        reasoning:
          '지수 이동평균 배열은 기관·개인 트레이더가 많이 보는 추세 필터입니다. 종가가 단기·중기 이평 위에 있고 이평이 정배열이면 상승 추세, 그 반대면 조정·약세로 해석합니다.',
        evidence: [
          idx.sma20 !== null ? `SMA20 ${formatNum(idx.sma20)} (${idx.currentPrice >= idx.sma20 ? '위' : '아래'})` : 'SMA20 —',
          idx.sma50 !== null ? `SMA50 ${formatNum(idx.sma50)}` : 'SMA50 —',
          idx.sma200 !== null ? `SMA200 ${formatNum(idx.sma200)} (${idx.currentPrice >= idx.sma200 ? '위' : '아래'})` : 'SMA200 —',
          idx.rangePositionPct !== null
            ? `52주(구간) 범위 내 위치 ${idx.rangePositionPct.toFixed(0)}% ${idx.rangePositionPct > 80 ? '(고점 근접)' : idx.rangePositionPct < 20 ? '(저점 근접)' : ''}`
            : '구간 위치 —',
        ],
        links: [
          { label: 'Yahoo Finance 차트', url: idx.chartUrl },
          { label: 'TradingView', url: idx.tradingViewUrl },
        ],
        tone:
          idx.trendLabel.includes('상승') ? 'bullish' : idx.trendLabel.includes('조정') || idx.trendLabel.includes('하락') ? 'bearish' : 'neutral',
        market: idx.market,
      }),
    );

    if (idx.rsi14 !== null) {
      const overbought = idx.rsi14 >= 70;
      const oversold = idx.rsi14 <= 30;
      items.push(
        insight({
          id: `index-rsi-${idx.yahooSymbol}`,
          category: 'technical',
          title: `${idx.name} RSI(14) ${idx.rsi14.toFixed(1)} — ${overbought ? '과매수 구간' : oversold ? '과매도 구간' : '중립'}`,
          summary: `RSI ${idx.rsi14.toFixed(1)}. ${overbought ? '단기 과열 신호' : oversold ? '반등 관찰 구간' : '극단 구간 아님'}.`,
          reasoning:
            'RSI(14)는 최근 14일 상대적 강도를 0~100으로 나타냅니다. 70 이상은 단기 과매수, 30 이하는 과매도로 많이 해석하지만, 강한 추세장에서는 오래 머물 수 있어 지표 단독 매매 신호로 쓰지 않습니다.',
          evidence: [
            `RSI(14) = ${idx.rsi14.toFixed(1)}`,
            idx.macd !== null ? `MACD(12,26) ${idx.macd >= 0 ? '양수' : '음수'} (${idx.macd.toFixed(2)})` : 'MACD —',
            idx.volumeRatio !== null
              ? `거래량 / 20일 평균 ${idx.volumeRatio.toFixed(2)}배 ${idx.volumeRatio > 1.3 ? '(활발)' : ''}`
              : '거래량 —',
          ],
          links: [
            { label: 'Investopedia RSI', url: 'https://www.investopedia.com/terms/r/rsi.asp' },
            { label: 'Yahoo Finance 차트', url: idx.chartUrl },
          ],
          tone: overbought ? 'bearish' : oversold ? 'bullish' : 'neutral',
          market: idx.market,
        }),
      );
    }

    if (idx.macd !== null && idx.sma20 !== null) {
      const macdBull = idx.macd > 0 && idx.currentPrice > idx.sma20;
      items.push(
        insight({
          id: `index-macd-${idx.yahooSymbol}`,
          category: 'technical',
          title: `${idx.name} MACD ${idx.macd >= 0 ? '양전환' : '음전환'} ${macdBull ? '+ 단기 이평 상회' : ''}`,
          summary: `MACD ${idx.macd.toFixed(2)}. ${macdBull ? '모멘텀·추세 정합' : '모멘텀 약화 가능'}.`,
          reasoning:
            'MACD는 12·26일 EMA 차이로 모멘텀 변화를 봅니다. 0선 위 전환 + 종가가 SMA20 위면 단기 매수세 우위, 0선 아래면 조정·약세 압력으로 해석하는 트레이더가 많습니다.',
          evidence: [`MACD ${idx.macd.toFixed(2)}`, `SMA20 ${formatNum(idx.sma20)}`],
          links: [
            { label: 'Investopedia MACD', url: 'https://www.investopedia.com/terms/m/macd.asp' },
            { label: 'TradingView', url: idx.tradingViewUrl },
          ],
          tone: macdBull ? 'bullish' : 'bearish',
          market: idx.market,
        }),
      );
    }

    if (idx.bollinger) {
      const bb = idx.bollinger;
      const tone: AnalysisTone =
        bb.percentB >= 0.8 ? 'bearish' : bb.percentB <= 0.2 ? 'bullish' : 'neutral';
      items.push(
        insight({
          id: `index-bb-${idx.yahooSymbol}`,
          category: 'technical',
          title: `${idx.name} 볼린저(20,2) — ${bb.label}`,
          summary: `%B ${(bb.percentB * 100).toFixed(0)}% · 밴드폭 ${bb.bandwidthPct.toFixed(1)}%`,
          reasoning:
            '볼린저 밴드는 20일 SMA ± 2σ입니다. %B가 1에 가까우면 상단 밴드 돌파(과열), 0에 가까우면 하단(과매도). 밴드폭 축소 후 확대는 변동성 폭발(squeeze) 전조로 보는 경우가 많습니다.',
          evidence: [
            `상단 ${formatNum(bb.upper)} · 중심 ${formatNum(bb.middle)} · 하단 ${formatNum(bb.lower)}`,
            `현재가 ${formatNum(idx.currentPrice)} (%B ${bb.percentB.toFixed(2)})`,
          ],
          links: [
            { label: 'Investopedia Bollinger', url: 'https://www.investopedia.com/terms/b/bollingerbands.asp' },
            { label: 'Yahoo 차트', url: idx.chartUrl },
          ],
          tone,
          market: idx.market,
        }),
      );
    }

    if (idx.stochastic) {
      const st = idx.stochastic;
      const overbought = st.k >= 80;
      const oversold = st.k <= 20;
      items.push(
        insight({
          id: `index-stoch-${idx.yahooSymbol}`,
          category: 'technical',
          title: `${idx.name} 스토캐스틱 — ${st.label} (K ${st.k.toFixed(0)} / D ${st.d.toFixed(0)})`,
          summary: `%K·%D 교차와 80/20 구간으로 단기 모멘텀을 봅니다.`,
          reasoning:
            '스토캐스틱은 최근 N일 range 대비 종가 위치입니다. 80 이상 과매수·20 이하 과매도, K가 D를 상향 돌파하면 단기 매수 신호로 쓰는 트레이더가 많습니다(추세장에서는 실패 잦음).',
          evidence: [`%K ${st.k.toFixed(1)}`, `%D ${st.d.toFixed(1)}`, `상태: ${st.label}`],
          links: [
            { label: 'Investopedia Stochastic', url: 'https://www.investopedia.com/terms/s/stochasticoscillator.asp' },
            { label: 'TradingView', url: idx.tradingViewUrl },
          ],
          tone: overbought ? 'bearish' : oversold ? 'bullish' : 'neutral',
          market: idx.market,
        }),
      );
    }

    return items;
  });
}

function macroPanelInsights(macro: MacroIndicatorSnapshot[]): AnalysisInsight[] {
  return macro.map((m) =>
    insight({
      id: `macro-${m.yahooSymbol}`,
      category: 'macro',
      title: `${m.name} — ${m.interpretLabel}`,
      summary: m.interpretDetail,
      reasoning:
        m.kind === 'vix'
          ? 'VIX는 S&P 500 옵션 implied vol 기반 공포지수입니다. 주식 매수·헤지 비용·심리를 읽는 대표 지표로 CNBC·Bloomberg·트레이더 터미널에 상시 노출됩니다.'
          : m.kind === 'fx'
            ? 'USD/KRW는 한국 증시 외국인 수급·수출주 실적·수입물가에 직결되는 핵심 변수입니다. 급격한 원화 약세는 변동성 확대 신호로 해석되기도 합니다.'
            : '미국 국채 수익률 곡선은 할인율·경기 기대·Fed 정책을 반영합니다. 10Y·5Y·3M 스프레드(역전)는 리세션 watchlist에 포함됩니다.',
      evidence: [
        `현재 ${m.unit === 'krw' ? `${m.value.toFixed(1)}원` : m.unit === 'pct' ? `${m.value.toFixed(2)}%` : m.value.toFixed(2)}`,
        `1일 변화 ${formatPct(m.changePercent1d)}`,
        `해석: ${m.interpretLabel}`,
      ],
      links: [
        { label: 'Yahoo Finance', url: m.chartUrl },
        ...(m.tradingViewUrl ? [{ label: 'TradingView', url: m.tradingViewUrl }] : []),
        ...(m.kind === 'vix'
          ? [{ label: 'CBOE VIX', url: 'https://www.cboe.com/tradable_products/vix/' }]
          : m.kind === 'yield'
            ? [{ label: 'FRED 10Y', url: 'https://fred.stlouisfed.org/series/DGS10' }]
            : [{ label: 'Investing.com USD/KRW', url: 'https://www.investing.com/currencies/usd-krw' }]),
      ],
      tone: m.tone as AnalysisTone,
      market: 'global',
    }),
  );
}

function sectorInsights(sectors: SectorEtfSnapshot[]): AnalysisInsight[] {
  const { us, kr } = groupSectorsByMarket(sectors);
  const items: AnalysisInsight[] = [];

  for (const [label, list, market] of [
    ['미국', us, Market.US],
    ['한국', kr, Market.KR],
  ] as const) {
    if (list.length === 0) continue;
    const leader = list[0];
    const laggard = list[list.length - 1];
    items.push(
      insight({
        id: `sector-overview-${market}`,
        category: 'sector',
        title: `${label} 업종 — 1주 상대강도 1위 ${leader.sectorLabel}`,
        summary: `${leader.name} 1주 상대강도 ${formatPct(leader.rsBenchmark1w)} (기준 ${market === Market.US ? 'SPY' : 'KODEX200'} 대비)`,
        reasoning:
          '업종 ETF 상대강도는 기준지수 대비 초과 수익입니다. 상대강도가 높은 업종으로 자금이 이동하는지, 낮은 업종이 추격 매수인지 함정인지 함께 판단합니다.',
        evidence: [
          `주도 ${leader.sectorLabel} RS(1주) ${formatPct(leader.rsBenchmark1w)} · 1달 ${formatPct(leader.rsBenchmark1mo)}`,
          `부진 ${laggard.sectorLabel} RS(1주) ${formatPct(laggard.rsBenchmark1w)}`,
          ...list.map(
            (s) =>
              `#${s.strengthRank} ${s.sectorLabel} ${formatPct(s.changePercent1d)} (RS1w ${formatPct(s.rsBenchmark1w)})`,
          ),
        ],
        links: list.slice(0, 4).map((s) => ({ label: s.sectorLabel, url: s.chartUrl })),
        tone: (leader.rsBenchmark1w ?? 0) > 1 ? 'bullish' : (laggard.rsBenchmark1w ?? 0) < -1 ? 'bearish' : 'neutral',
        market,
      }),
    );
  }

  return items;
}

const BULLISH_NEWS = ['surge', 'rally', 'gain', 'record', 'beat', '상승', ' rally', '급등', '호재', '반등', '신고가'];
const BEARISH_NEWS = ['fall', 'drop', 'plunge', 'loss', 'miss', '하락', '급락', '우려', '침체', '매도', '조정', ' recession'];

function newsTone(title: string): AnalysisTone {
  const lower = title.toLowerCase();
  let score = 0;
  for (const w of BULLISH_NEWS) if (lower.includes(w.toLowerCase())) score += 1;
  for (const w of BEARISH_NEWS) if (lower.includes(w.toLowerCase())) score -= 1;
  if (score > 0) return 'bullish';
  if (score < 0) return 'bearish';
  return 'neutral';
}

function newsInsights(news: NewsAnalysisInput[]): AnalysisInsight[] {
  if (news.length === 0) {
    return [
      insight({
        id: 'news-empty',
        category: 'news',
        title: '뉴스 헤드라인 수집 제한',
        summary: '뉴스 피드를 가져오지 못했습니다. 아래 링크에서 직접 확인해 주세요.',
        reasoning: '뉴스 API·RSS는 일시적 차단 또는 키 미설정으로 실패할 수 있습니다. 정세 판단 시 뉴스는 시세·지표와 교차 확인하는 것이 좋습니다.',
        evidence: ['Finnhub 키 미설정 시 미국 Finnhub 뉴스 생략', 'Google News RSS는 네트워크 상태에 따라 지연될 수 있음'],
        links: [
          { label: 'Google 뉴스 — 코스피', url: 'https://news.google.com/search?q=코스피+증시&hl=ko' },
          { label: 'Google 뉴스 — US market', url: 'https://news.google.com/search?q=US+stock+market&hl=en-US' },
        ],
        tone: 'neutral',
        market: 'global',
      }),
    ];
  }

  const krNews = news.filter((n) => n.market === Market.KR);
  const usNews = news.filter((n) => n.market === Market.US || n.market === 'global');
  const items: AnalysisInsight[] = [];

  for (const [label, subset, market] of [
    ['한국', krNews, Market.KR],
    ['미국·글로벌', usNews, Market.US],
  ] as const) {
    if (subset.length === 0) continue;
    const tones = subset.map((n) => newsTone(n.title));
    const bull = tones.filter((t) => t === 'bullish').length;
    const bear = tones.filter((t) => t === 'bearish').length;
    const tone: AnalysisTone = bull > bear ? 'bullish' : bear > bull ? 'bearish' : 'neutral';
    const headlines = subset.slice(0, 3).map((n) => `「${n.title}」 (${n.source})`);

    items.push(
      insight({
        id: `news-${market}`,
        category: 'news',
        title: `${label} 최근 헤드라인 — ${tone === 'bullish' ? '긍정 키워드 우세' : tone === 'bearish' ? '부정 키워드 우세' : '혼재'}`,
        summary: subset[0]?.title ?? '',
        reasoning:
          '헤드라인 키워드(상승·하락·우려 등)로 대략적 뉴스 톤을 분류했습니다. 단일 기사보다 여러 출처의 흐름을 보는 것이 중요하며, 이미 가격에 반영됐을 수 있습니다.',
        evidence: [
          `분석 기사 ${subset.length}건 · 긍정 ${bull} · 부정 ${bear}`,
          ...headlines,
        ],
        links: subset.slice(0, 5).map((n) => ({ label: n.source, url: n.url })),
        tone,
        market,
      }),
    );
  }

  return items;
}

function macroInsight(kr: RegionSentiment, us: RegionSentiment): AnalysisInsight {
  const krAvg = kr.avgChangePercent ?? 0;
  const usAvg = us.avgChangePercent ?? 0;
  const diverge = Math.abs(krAvg - usAvg) > 1;
  const tone: AnalysisTone =
    krAvg > 0.3 && usAvg > 0.3 ? 'bullish' : krAvg < -0.3 && usAvg < -0.3 ? 'bearish' : 'neutral';

  return insight({
    id: 'macro-global',
    category: 'macro',
    title: diverge ? '한·미 시장 온도차' : '한·미 동조/혼조',
    summary: diverge
      ? `한국 ${formatPct(kr.avgChangePercent)} · 미국 ${formatPct(us.avgChangePercent)} — 지역별 온도차`
      : `한국 ${formatPct(kr.avgChangePercent)} · 미국 ${formatPct(us.avgChangePercent)}`,
    reasoning: diverge
      ? '한국과 미국 대표주 평균 등락이 크게 다르면 환율·금리·업종 이슈 등 지역 요인이 작용 중일 수 있습니다. 환율(KRW/USD)과 함께 보는 것이 일반적입니다.'
      : '양 시장이 비슷한 방향이면 글로벌 투자 심리가 공통 변수일 가능성이 큽니다. 연준·원화·유가 등 경제 헤드라인과 교차 확인하세요.',
    evidence: [
      `한국 정세 ${kr.label} (평균 ${formatPct(kr.avgChangePercent)})`,
      `미국 정세 ${us.label} (평균 ${formatPct(us.avgChangePercent)})`,
      `온도차 ${Math.abs(krAvg - usAvg).toFixed(2)}%p`,
    ],
    links: [
      { label: 'Investing.com 환율', url: 'https://www.investing.com/currencies/usd-krw' },
      { label: 'FRED 경제지표', url: 'https://fred.stlouisfed.org/' },
    ],
    tone,
    market: 'global',
  });
}

function recommendationInsights(recommendations: StockRecommendation[]): AnalysisInsight[] {
  return recommendations.map((rec) =>
    insight({
      id: `rec-${rec.market}-${rec.symbol}`,
      category: 'recommendation',
      title: `[${rec.tagLabel}] ${rec.name}`,
      summary: rec.reason,
      reasoning:
        rec.tag === 'momentum'
          ? '강한 당일·단기 수익률은 추세 추종 투자자가 관심 갖는 구간입니다. 거래량·지수 대비 상대강도를 함께 확인하면 허수 돌파를 줄일 수 있습니다.'
          : rec.tag === 'pullback'
            ? '급락·조정 구간은 되돌림 매수와 추세 이탈 매도가 갈리는 지점입니다. 지지선·RSI 과매도·뉴스 악재 여부를 확인하세요.'
            : rec.tag === 'defensive'
              ? '약세장에서도 버티는 종목은 변동성이 낮거나 실적·현금흐름이 받쳐주는 경우가 많습니다. 반등 시 상대적으로 늦게 따라오는 업종일 수 있습니다.'
              : '혼조장에서는 상대강도·배당·실적 일정 등 개별 재료가 더 중요합니다.',
      evidence: [
        `현재가 ${rec.currentPrice.toLocaleString()} ${rec.currency}`,
        `당일 등락 ${formatPct(rec.changePercent)}`,
        `태그: ${rec.tagLabel}`,
      ],
      links: [
        {
          label: rec.market === Market.KR ? '네이버 금융' : 'Yahoo Finance',
          url:
            rec.market === Market.KR
              ? `https://finance.naver.com/item/main.naver?code=${rec.symbol}`
              : `https://finance.yahoo.com/quote/${rec.symbol}/`,
        },
        {
          label: 'TradingView',
          url: `https://www.tradingview.com/symbols/${rec.market === Market.KR ? 'KRX-' : ''}${rec.symbol}/`,
        },
      ],
      tone:
        rec.changePercent > 0.5 ? 'bullish' : rec.changePercent < -0.5 ? 'bearish' : 'neutral',
      market: rec.market,
    }),
  );
}

function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function formatNum(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function buildMarketAnalysisReport(input: {
  krQuotes: QuoteInsightInput[];
  usQuotes: QuoteInsightInput[];
  indexInputs: IndexTechnicalInput[];
  macroInputs: MacroSeriesInput[];
  sectorInputs: SectorSeriesInput[];
  news: NewsAnalysisInput[];
  fetchedAt?: string;
}): MarketAnalysisReport {
  const base = buildMarketInsights(input.krQuotes, input.usQuotes);
  const indices = input.indexInputs
    .map(buildIndexSnapshot)
    .filter((s): s is IndexTechnicalSnapshot => s !== null);
  const macro = input.macroInputs
    .map(buildMacroSnapshot)
    .filter((s): s is MacroIndicatorSnapshot => s !== null);
  const sectors = rankSectorSnapshots(
    input.sectorInputs
      .map(buildSectorSnapshot)
      .filter((s): s is SectorEtfSnapshot => s !== null),
  );

  const insights: AnalysisInsight[] = [
    ...macroPanelInsights(macro),
    macroInsight(base.kr, base.us),
    ...breadthInsights(base.kr, base.us, input.krQuotes, input.usQuotes),
    ...indexInsights(indices),
    ...sectorInsights(sectors),
    ...newsInsights(input.news),
    ...recommendationInsights(base.recommendations),
  ];

  return {
    ...base,
    fetchedAt: input.fetchedAt ?? new Date().toISOString(),
    krQuotes: input.krQuotes,
    usQuotes: input.usQuotes,
    macro,
    indices,
    sectors,
    insights,
    news: input.news,
  };
}

export type { MacroIndicatorSnapshot, MacroSeriesInput } from './market-macro';
export type { SectorEtfSnapshot, SectorSeriesInput } from './market-sector';

export { CATEGORY_LABEL as ANALYSIS_CATEGORY_LABEL };
