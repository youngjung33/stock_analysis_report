import { Market } from './enums';
import { newsToneFromTitle } from './news-tone';
import type { MacroIndicatorSnapshot } from './market-macro';
import type {
  AnalysisCategory,
  AnalysisInsight,
  AnalysisTone,
  AnalysisLink,
  EvidenceItem,
  IndexTechnicalSnapshot,
  NewsAnalysisInput,
} from './market-analysis';
import type { RegionSentiment } from './market-sentiment';
import type { SectorEtfSnapshot } from './market-sector';
import { groupSectorsByMarket } from './market-sector';

const CATEGORY_LABEL = '전일 움직임';

const PRIORITY_INDEX: Record<Market, string[]> = {
  [Market.KR]: ['^KS11'],
  [Market.US]: ['^GSPC', '^IXIC'],
};

const MAX_NEWS_AGE_MS = 48 * 60 * 60 * 1000;

type MoveDirection = 'up' | 'down' | 'flat';

interface MoveFactor {
  evidenceKey: string;
  evidenceParams: Record<string, string | number>;
  fallback: string;
  weight: number;
}

function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function moveDirection(change: number | null): MoveDirection {
  if (change === null) return 'flat';
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'flat';
}

function ev(key: string, params?: Record<string, string | number>): EvidenceItem {
  return { key, params };
}

function insight(
  partial: Omit<AnalysisInsight, 'categoryLabel'> & { category: AnalysisCategory },
): AnalysisInsight {
  return { ...partial, categoryLabel: CATEGORY_LABEL };
}

function findPrimaryIndex(indices: IndexTechnicalSnapshot[], market: Market): IndexTechnicalSnapshot | null {
  for (const symbol of PRIORITY_INDEX[market]) {
    const hit = indices.find((i) => i.yahooSymbol === symbol && i.market === market);
    if (hit) return hit;
  }
  return indices.find((i) => i.market === market) ?? null;
}

function filterRecentNews(news: NewsAnalysisInput[], market: Market): NewsAnalysisInput[] {
  const now = Date.now();
  return news
    .filter((n) => {
      if (n.market !== market && !(market === Market.US && n.market === 'global')) return false;
      const age = now - new Date(n.publishedAt).getTime();
      return age >= 0 && age <= MAX_NEWS_AGE_MS;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function adRatio(sentiment: RegionSentiment): number {
  return sentiment.downCount > 0 ? sentiment.upCount / sentiment.downCount : sentiment.upCount;
}

function collectNewsFactors(
  news: NewsAnalysisInput[],
  market: Market,
  direction: MoveDirection,
): MoveFactor[] {
  const recent = filterRecentNews(news, market);
  if (recent.length === 0) return [];

  const factors: MoveFactor[] = [];
  const tones = recent.map((n) => newsToneFromTitle(n.title));
  const bull = tones.filter((t) => t === 'bullish').length;
  const bear = tones.filter((t) => t === 'bearish').length;

  factors.push({
    evidenceKey: 'shared.market.insights.evidence.moveReasonNewsTone',
    evidenceParams: { count: recent.length, bull, bear },
    fallback: `최근 48시간 뉴스 ${recent.length}건 · 긍정 ${bull} · 부정 ${bear}`,
    weight: 3,
  });

  const aligned = recent.filter((n) => {
    const tone = newsToneFromTitle(n.title);
    return direction === 'up' ? tone === 'bullish' : direction === 'down' ? tone === 'bearish' : tone === 'neutral';
  });

  const headlines = (aligned.length > 0 ? aligned : recent).slice(0, 2);
  for (const n of headlines) {
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonNewsHeadline',
      evidenceParams: { headline: n.title, source: n.source },
      fallback: `「${n.title}」 (${n.source})`,
      weight: 4,
    });
  }

  return factors;
}

function collectKrFactors(input: {
  primary: IndexTechnicalSnapshot;
  sentiment: RegionSentiment;
  sectors: SectorEtfSnapshot[];
  macro: MacroIndicatorSnapshot[];
  usPrimary: IndexTechnicalSnapshot | null;
  news: NewsAnalysisInput[];
  direction: MoveDirection;
}): MoveFactor[] {
  const factors: MoveFactor[] = [];
  const { primary, sentiment, sectors, macro, usPrimary, news, direction } = input;

  factors.push({
    evidenceKey: 'shared.market.insights.evidence.moveReasonIndex',
    evidenceParams: { name: primary.name, change: formatPct(primary.changePercent1d) },
    fallback: `${primary.name} 전 거래일 ${formatPct(primary.changePercent1d)}`,
    weight: 10,
  });

  const ratio = adRatio(sentiment);
  if (direction === 'up' && ratio >= 1.1) {
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonBreadthUp',
      evidenceParams: { up: sentiment.upCount, down: sentiment.downCount, ratio: ratio.toFixed(2) },
      fallback: `대표주 상승 우위 (${sentiment.upCount}↑ ${sentiment.downCount}↓, 비율 ${ratio.toFixed(2)})`,
      weight: 7,
    });
  } else if (direction === 'down' && ratio <= 0.9) {
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonBreadthDown',
      evidenceParams: { up: sentiment.upCount, down: sentiment.downCount, ratio: ratio.toFixed(2) },
      fallback: `대표주 하락 우위 (${sentiment.upCount}↑ ${sentiment.downCount}↓, 비율 ${ratio.toFixed(2)})`,
      weight: 7,
    });
  } else if (direction === 'flat') {
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonBreadthMixed',
      evidenceParams: { up: sentiment.upCount, down: sentiment.downCount },
      fallback: `대표주 혼조 (${sentiment.upCount}↑ ${sentiment.downCount}↓)`,
      weight: 5,
    });
  }

  const { kr } = groupSectorsByMarket(sectors);
  if (kr.length > 0) {
    const leader = kr[0];
    const laggard = kr[kr.length - 1];
    if (direction === 'up' && (leader.changePercent1d ?? 0) > 0) {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonSectorLead',
        evidenceParams: {
          sector: leader.sectorLabel,
          change: formatPct(leader.changePercent1d),
          rs: formatPct(leader.rsBenchmark1w),
        },
        fallback: `주도 업종 ${leader.sectorLabel} ${formatPct(leader.changePercent1d)} (RS1w ${formatPct(leader.rsBenchmark1w)})`,
        weight: 6,
      });
    } else if (direction === 'down' && (laggard.changePercent1d ?? 0) < 0) {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonSectorLag',
        evidenceParams: {
          sector: laggard.sectorLabel,
          change: formatPct(laggard.changePercent1d),
          rs: formatPct(laggard.rsBenchmark1w),
        },
        fallback: `부진 업종 ${laggard.sectorLabel} ${formatPct(laggard.changePercent1d)} (RS1w ${formatPct(laggard.rsBenchmark1w)})`,
        weight: 6,
      });
    }
  }

  const fx = macro.find((m) => m.kind === 'fx');
  if (fx?.changePercent1d != null) {
    const fxUp = fx.changePercent1d > 0.2;
    const fxDown = fx.changePercent1d < -0.2;
    if (direction === 'up' && fxUp) {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonFxWeak',
        evidenceParams: { change: formatPct(fx.changePercent1d), value: fx.value.toFixed(1) },
        fallback: `원화 약세(USD/KRW ${formatPct(fx.changePercent1d)}) — 수출·반도체 우호`,
        weight: 5,
      });
    } else if (direction === 'down' && fxDown) {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonFxStrong',
        evidenceParams: { change: formatPct(fx.changePercent1d), value: fx.value.toFixed(1) },
        fallback: `원화 강세(USD/KRW ${formatPct(fx.changePercent1d)}) — 외국인·수출주 부담`,
        weight: 5,
      });
    }
  }

  if (usPrimary?.changePercent1d != null) {
    const usDir = moveDirection(usPrimary.changePercent1d);
    if (usDir === direction && direction !== 'flat') {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonUsSync',
        evidenceParams: { name: usPrimary.name, change: formatPct(usPrimary.changePercent1d) },
        fallback: `미국 ${usPrimary.name} ${formatPct(usPrimary.changePercent1d)} — 전일 글로벌 동조`,
        weight: 6,
      });
    } else if (usDir !== direction && usDir !== 'flat' && direction !== 'flat') {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonUsDiverge',
        evidenceParams: { name: usPrimary.name, change: formatPct(usPrimary.changePercent1d) },
        fallback: `미국 ${usPrimary.name} ${formatPct(usPrimary.changePercent1d)} — 전일 한·미 온도차`,
        weight: 6,
      });
    }
  }

  factors.push(...collectNewsFactors(news, Market.KR, direction));
  return factors.sort((a, b) => b.weight - a.weight);
}

function collectUsFactors(input: {
  primary: IndexTechnicalSnapshot;
  nasdaq: IndexTechnicalSnapshot | null;
  sentiment: RegionSentiment;
  sectors: SectorEtfSnapshot[];
  macro: MacroIndicatorSnapshot[];
  news: NewsAnalysisInput[];
  direction: MoveDirection;
}): MoveFactor[] {
  const factors: MoveFactor[] = [];
  const { primary, nasdaq, sentiment, sectors, macro, news, direction } = input;

  factors.push({
    evidenceKey: 'shared.market.insights.evidence.moveReasonIndex',
    evidenceParams: { name: primary.name, change: formatPct(primary.changePercent1d) },
    fallback: `${primary.name} 전 거래일 ${formatPct(primary.changePercent1d)}`,
    weight: 10,
  });

  if (nasdaq && nasdaq.yahooSymbol !== primary.yahooSymbol && nasdaq.changePercent1d != null) {
    const nasDir = moveDirection(nasdaq.changePercent1d);
    if (nasDir === direction && direction !== 'flat') {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonNasdaqSync',
        evidenceParams: { change: formatPct(nasdaq.changePercent1d) },
        fallback: `NASDAQ 동반 ${formatPct(nasdaq.changePercent1d)} — 성장주 동조`,
        weight: 5,
      });
    } else if (nasDir !== direction && nasDir !== 'flat') {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonNasdaqDiverge',
        evidenceParams: { change: formatPct(nasdaq.changePercent1d) },
        fallback: `NASDAQ ${formatPct(nasdaq.changePercent1d)} — 대형주·성장주 온도차`,
        weight: 5,
      });
    }
  }

  const ratio = adRatio(sentiment);
  if (direction === 'up' && ratio >= 1.1) {
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonBreadthUp',
      evidenceParams: { up: sentiment.upCount, down: sentiment.downCount, ratio: ratio.toFixed(2) },
      fallback: `대표주 상승 우위 (${sentiment.upCount}↑ ${sentiment.downCount}↓)`,
      weight: 7,
    });
  } else if (direction === 'down' && ratio <= 0.9) {
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonBreadthDown',
      evidenceParams: { up: sentiment.upCount, down: sentiment.downCount, ratio: ratio.toFixed(2) },
      fallback: `대표주 하락 우위 (${sentiment.upCount}↑ ${sentiment.downCount}↓)`,
      weight: 7,
    });
  }

  const { us } = groupSectorsByMarket(sectors);
  if (us.length > 0) {
    const leader = us[0];
    if (direction === 'up' && (leader.changePercent1d ?? 0) > 0) {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonSectorLead',
        evidenceParams: {
          sector: leader.sectorLabel,
          change: formatPct(leader.changePercent1d),
          rs: formatPct(leader.rsBenchmark1w),
        },
        fallback: `주도 섹터 ${leader.sectorLabel} ${formatPct(leader.changePercent1d)} (RS1w ${formatPct(leader.rsBenchmark1w)})`,
        weight: 6,
      });
    } else if (direction === 'down') {
      const laggard = us[us.length - 1];
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonSectorLag',
        evidenceParams: {
          sector: laggard.sectorLabel,
          change: formatPct(laggard.changePercent1d),
          rs: formatPct(laggard.rsBenchmark1w),
        },
        fallback: `부진 섹터 ${laggard.sectorLabel} ${formatPct(laggard.changePercent1d)}`,
        weight: 6,
      });
    }
  }

  const vix = macro.find((m) => m.kind === 'vix');
  if (vix?.changePercent1d != null) {
    if (direction === 'up' && vix.changePercent1d < -2) {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonVixDown',
        evidenceParams: { value: vix.value.toFixed(1), change: formatPct(vix.changePercent1d) },
        fallback: `VIX 하락 ${formatPct(vix.changePercent1d)} (${vix.value.toFixed(1)}) — 리스크온`,
        weight: 6,
      });
    } else if (direction === 'down' && vix.changePercent1d > 2) {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonVixUp',
        evidenceParams: { value: vix.value.toFixed(1), change: formatPct(vix.changePercent1d) },
        fallback: `VIX 급등 ${formatPct(vix.changePercent1d)} (${vix.value.toFixed(1)}) — 공포·헤지 수요`,
        weight: 6,
      });
    }
  }

  const yield10 = macro.find((m) => m.yahooSymbol === '^TNX');
  if (yield10?.changePercent1d != null) {
    if (direction === 'up' && yield10.changePercent1d < -0.5) {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonYieldDown',
        evidenceParams: { value: yield10.value.toFixed(2), change: formatPct(yield10.changePercent1d) },
        fallback: `10Y 금리 하락 ${formatPct(yield10.changePercent1d)} — 할인율·성장주 우호`,
        weight: 5,
      });
    } else if (direction === 'down' && yield10.changePercent1d > 0.5) {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonYieldUp',
        evidenceParams: { value: yield10.value.toFixed(2), change: formatPct(yield10.changePercent1d) },
        fallback: `10Y 금리 상승 ${formatPct(yield10.changePercent1d)} — 밸류에이션·금융주 부담`,
        weight: 5,
      });
    }
  }

  factors.push(...collectNewsFactors(news, Market.US, direction));
  return factors.sort((a, b) => b.weight - a.weight);
}

function buildMoveReasonInsight(
  market: Market,
  primary: IndexTechnicalSnapshot,
  factors: MoveFactor[],
  direction: MoveDirection,
): AnalysisInsight {
  const regionKey = market === Market.KR ? 'kr' : 'us';
  const regionLabel = market === Market.KR ? '한국' : '미국';
  const change = formatPct(primary.changePercent1d);
  const topFactors = factors.slice(0, 4).map((f) => f.fallback);
  const summaryText = topFactors.slice(0, 2).join(' · ') || `${primary.name} ${change}`;

  const tone: AnalysisTone =
    direction === 'up' ? 'bullish' : direction === 'down' ? 'bearish' : 'neutral';

  const directionLabel =
    direction === 'up' ? '상승' : direction === 'down' ? '하락' : '보합';

  const links: AnalysisLink[] = [
    {
      label: market === Market.KR ? '네이버 금융 코스피' : 'Yahoo S&P 500',
      labelKey:
        market === Market.KR
          ? 'shared.market.insights.links.naverFinanceKospi'
          : 'shared.market.insights.links.yahooSp500',
      url: primary.chartUrl,
    },
    {
      label: 'TradingView',
      labelKey: 'shared.market.insights.links.tradingView',
      url: primary.tradingViewUrl,
    },
  ];

  return insight({
    id: `move-reason-${market}`,
    category: 'moveReason',
    title: `${regionLabel} 시장 전 거래일 ${directionLabel} (${change}) — 주요 요인`,
    summary: summaryText,
    reasoning:
      direction === 'up'
        ? '전 거래일 종가 기준 지수·대표주·업종·매크로·뉴스를 교차해 상승 요인을 정리했습니다. 단일 변수보다 여러 신호가 같은 방향일 때 설명력이 높습니다. 이미 가격에 반영된 뉴스일 수 있습니다.'
        : direction === 'down'
          ? '전 거래일 종가 기준 지수·대표주·업종·매크로·뉴스를 교차해 하락 요인을 정리했습니다. 지수만 빠지고 폭은 좁은지, 대표주 전반이 약한지 함께 보는 것이 좋습니다.'
          : '전 거래일 등락이 크지 않아 방향성이 약합니다. 상승·하락 종목이 엇갈리거나 매크로·뉴스 신호가 혼재된 구간으로 해석할 수 있습니다.',
    titleKey: 'shared.market.insights.moveReason.title',
    titleParams: { regionKey, directionKey: direction, change },
    summaryKey: 'shared.market.insights.moveReason.summary',
    summaryParams: { factors: summaryText },
    reasoningKey: `shared.market.insights.moveReason.reasoning.${direction}`,
    evidence: factors.map((f) => f.fallback),
    evidenceItems: factors.map((f) => ev(f.evidenceKey, f.evidenceParams)),
    links,
    tone,
    market,
  });
}

function attachNewsLinks(insight: AnalysisInsight, news: NewsAnalysisInput[], market: Market): AnalysisInsight {
  const recent = filterRecentNews(news, market).slice(0, 3);
  if (recent.length === 0) return insight;
  return {
    ...insight,
    links: [
      ...insight.links,
      ...recent.map((n) => ({ label: n.source, url: n.url })),
    ],
  };
}

export function buildMarketMoveReasonInsights(input: {
  kr: RegionSentiment;
  us: RegionSentiment;
  indices: IndexTechnicalSnapshot[];
  sectors: SectorEtfSnapshot[];
  macro: MacroIndicatorSnapshot[];
  news: NewsAnalysisInput[];
}): AnalysisInsight[] {
  const items: AnalysisInsight[] = [];
  const krPrimary = findPrimaryIndex(input.indices, Market.KR);
  const usPrimary = findPrimaryIndex(input.indices, Market.US);
  const nasdaq = input.indices.find((i) => i.yahooSymbol === '^IXIC') ?? null;

  if (krPrimary) {
    const direction = moveDirection(krPrimary.changePercent1d);
    const factors = collectKrFactors({
      primary: krPrimary,
      sentiment: input.kr,
      sectors: input.sectors,
      macro: input.macro,
      usPrimary,
      news: input.news,
      direction,
    });
    items.push(attachNewsLinks(buildMoveReasonInsight(Market.KR, krPrimary, factors, direction), input.news, Market.KR));
  }

  if (usPrimary) {
    const direction = moveDirection(usPrimary.changePercent1d);
    const factors = collectUsFactors({
      primary: usPrimary,
      nasdaq,
      sentiment: input.us,
      sectors: input.sectors,
      macro: input.macro,
      news: input.news,
      direction,
    });
    items.push(attachNewsLinks(buildMoveReasonInsight(Market.US, usPrimary, factors, direction), input.news, Market.US));
  }

  return items;
}
