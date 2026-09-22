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
import type { SectorEtfSnapshot } from './market-sector';
import { findRegionSentimentIndex } from './market-benchmarks';
import { groupSectorsByMarket } from './market-sector';

const CATEGORY_LABEL = '전일 움직임';

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

function formatSectorList(sectors: SectorEtfSnapshot[]): string {
  return sectors
    .map((s) => `${s.sectorLabel} ${formatPct(s.changePercent1d)}`)
    .join(', ');
}

function collectSectorThemeFactors(
  market: Market,
  sectors: SectorEtfSnapshot[],
  direction: MoveDirection,
): MoveFactor[] {
  const factors: MoveFactor[] = [];
  const grouped = groupSectorsByMarket(sectors);
  const marketSectors = market === Market.KR ? grouped.kr : grouped.us;
  if (marketSectors.length === 0) return factors;

  const sorted = [...marketSectors].sort(
    (a, b) => (b.changePercent1d ?? 0) - (a.changePercent1d ?? 0),
  );
  const risers = sorted.filter((s) => (s.changePercent1d ?? 0) > 0.05);
  const fallers = sorted.filter((s) => (s.changePercent1d ?? 0) < -0.05);

  if (risers.length > 0) {
    const top = risers.slice(0, 3);
    const list = formatSectorList(top);
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonSectorRise',
      evidenceParams: { list, count: risers.length },
      fallback:
        risers.length > top.length
          ? `상승 업종 ${list} 외 ${risers.length - top.length}개`
          : `상승 업종 ${list}`,
      weight: direction === 'up' ? 8 : 5,
    });
  }

  if (fallers.length > 0) {
    const bottom = fallers.slice(-3).reverse();
    const list = formatSectorList(bottom);
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonSectorFall',
      evidenceParams: { list, count: fallers.length },
      fallback:
        fallers.length > bottom.length
          ? `하락 업종 ${list} 외 ${fallers.length - bottom.length}개`
          : `하락 업종 ${list}`,
      weight: direction === 'down' ? 8 : 5,
    });
  }

  const leader = sorted[0];
  const laggard = sorted[sorted.length - 1];
  if (leader && (leader.changePercent1d ?? 0) > 0 && direction !== 'down') {
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonSectorLead',
      evidenceParams: {
        sector: leader.sectorLabel,
        change: formatPct(leader.changePercent1d),
        rs: formatPct(leader.rsBenchmark1w),
      },
      fallback: `주도 테마 ${leader.sectorLabel} ${formatPct(leader.changePercent1d)} (RS1w ${formatPct(leader.rsBenchmark1w)})`,
      weight: 7,
    });
  }
  if (laggard && laggard !== leader && (laggard.changePercent1d ?? 0) < 0 && direction !== 'up') {
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonSectorLag',
      evidenceParams: {
        sector: laggard.sectorLabel,
        change: formatPct(laggard.changePercent1d),
        rs: formatPct(laggard.rsBenchmark1w),
      },
      fallback: `부진 테마 ${laggard.sectorLabel} ${formatPct(laggard.changePercent1d)} (RS1w ${formatPct(laggard.rsBenchmark1w)})`,
      weight: 7,
    });
  }

  if (direction === 'flat' && risers.length === 0 && fallers.length === 0) {
    factors.push({
      evidenceKey: 'shared.market.insights.evidence.moveReasonSectorMixed',
      evidenceParams: { list: formatSectorList(sorted.slice(0, 3)) },
      fallback: `업종 혼조 ${formatSectorList(sorted.slice(0, 3))}`,
      weight: 6,
    });
  }

  return factors;
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
  sectors: SectorEtfSnapshot[];
  macro: MacroIndicatorSnapshot[];
  usPrimary: IndexTechnicalSnapshot | null;
  news: NewsAnalysisInput[];
  direction: MoveDirection;
}): MoveFactor[] {
  const factors: MoveFactor[] = [];
  const { primary, sectors, macro, usPrimary, news, direction } = input;

  factors.push({
    evidenceKey: 'shared.market.insights.evidence.moveReasonIndex',
    evidenceParams: { name: primary.name, change: formatPct(primary.changePercent1d) },
    fallback: `${primary.name} 전 거래일 ${formatPct(primary.changePercent1d)}`,
    weight: 10,
  });

  factors.push(...collectSectorThemeFactors(Market.KR, sectors, direction));

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
  secondaryIndex: IndexTechnicalSnapshot | null;
  sectors: SectorEtfSnapshot[];
  macro: MacroIndicatorSnapshot[];
  news: NewsAnalysisInput[];
  direction: MoveDirection;
}): MoveFactor[] {
  const factors: MoveFactor[] = [];
  const { primary, secondaryIndex, sectors, macro, news, direction } = input;

  factors.push({
    evidenceKey: 'shared.market.insights.evidence.moveReasonIndex',
    evidenceParams: { name: primary.name, change: formatPct(primary.changePercent1d) },
    fallback: `${primary.name} 전 거래일 ${formatPct(primary.changePercent1d)}`,
    weight: 10,
  });

  if (
    secondaryIndex &&
    secondaryIndex.yahooSymbol !== primary.yahooSymbol &&
    secondaryIndex.changePercent1d != null
  ) {
    const secondaryDir = moveDirection(secondaryIndex.changePercent1d);
    if (secondaryDir === direction && direction !== 'flat') {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonSecondaryIndexSync',
        evidenceParams: {
          name: secondaryIndex.name,
          change: formatPct(secondaryIndex.changePercent1d),
        },
        fallback: `${secondaryIndex.name} 동반 ${formatPct(secondaryIndex.changePercent1d)} — 지수 동조`,
        weight: 5,
      });
    } else if (secondaryDir !== direction && secondaryDir !== 'flat') {
      factors.push({
        evidenceKey: 'shared.market.insights.evidence.moveReasonSecondaryIndexDiverge',
        evidenceParams: {
          name: secondaryIndex.name,
          change: formatPct(secondaryIndex.changePercent1d),
        },
        fallback: `${secondaryIndex.name} ${formatPct(secondaryIndex.changePercent1d)} — 지수 간 온도차`,
        weight: 5,
      });
    }
  }

  factors.push(...collectSectorThemeFactors(Market.US, sectors, direction));

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
      label: market === Market.KR ? '네이버 금융 코스피' : 'Yahoo NASDAQ',
      labelKey:
        market === Market.KR
          ? 'shared.market.insights.links.naverFinanceKospi'
          : 'shared.market.insights.links.yahooNasdaq',
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
        ? '전 거래일 종가 기준 지수·업종 테마·매크로·뉴스를 교차해 상승 요인을 정리했습니다. 어떤 업종이 지수를 끌었는지 함께 보는 것이 핵심입니다.'
        : direction === 'down'
          ? '전 거래일 종가 기준 지수·업종 테마·매크로·뉴스를 교차해 하락 요인을 정리했습니다. 지수 하락 시 어떤 업종이 끌었는지 확인하는 것이 중요합니다.'
          : '전 거래일 등락이 크지 않아 방향성이 약합니다. 업종별 등락이 엇갈리거나 매크로·뉴스 신호가 혼재된 구간으로 해석할 수 있습니다.',
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
  indices: IndexTechnicalSnapshot[];
  sectors: SectorEtfSnapshot[];
  macro: MacroIndicatorSnapshot[];
  news: NewsAnalysisInput[];
}): AnalysisInsight[] {
  const items: AnalysisInsight[] = [];
  const krPrimary = findRegionSentimentIndex(input.indices, Market.KR);
  const usPrimary = findRegionSentimentIndex(input.indices, Market.US);
  const usSecondary =
    input.indices.find(
      (i) => i.market === Market.US && i.yahooSymbol === '^GSPC' && i.yahooSymbol !== usPrimary?.yahooSymbol,
    ) ?? null;

  if (krPrimary) {
    const direction = moveDirection(krPrimary.changePercent1d);
    const factors = collectKrFactors({
      primary: krPrimary,
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
      secondaryIndex: usSecondary,
      sectors: input.sectors,
      macro: input.macro,
      news: input.news,
      direction,
    });
    items.push(attachNewsLinks(buildMoveReasonInsight(Market.US, usPrimary, factors, direction), input.news, Market.US));
  }

  return items;
}
