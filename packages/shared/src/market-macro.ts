import { MacroKind } from './market-benchmarks';

export type MacroTone = 'bullish' | 'bearish' | 'neutral';

export interface MacroSeriesInput {
  yahooSymbol: string;
  name: string;
  kind: MacroKind;
  unit: 'index' | 'krw' | 'pct';
  closes: number[];
  changePercent1d: number | null;
  chartUrl: string;
  tradingViewUrl?: string;
}

export interface MacroIndicatorSnapshot {
  yahooSymbol: string;
  name: string;
  kind: MacroKind;
  unit: 'index' | 'krw' | 'pct';
  value: number;
  changePercent1d: number | null;
  /** @deprecated use interpretKey */
  interpretLabel: string;
  /** @deprecated use interpretDetailKey */
  interpretDetail: string;
  interpretKey: string;
  interpretDetailKey: string;
  interpretDetailParams?: Record<string, string | number>;
  tone: MacroTone;
  chartUrl: string;
  tradingViewUrl?: string;
}

function interpretVix(vix: number): Pick<
  MacroIndicatorSnapshot,
  'interpretLabel' | 'interpretDetail' | 'interpretKey' | 'interpretDetailKey' | 'tone'
> {
  if (vix >= 30) {
    return {
      interpretLabel: '극단적 공포',
      interpretDetail: 'VIX 30+는 패닉·급락장에서 흔합니다. 변동성 자체가 크므로 단기 반등(공포 매수) vs 추세 지속을 구분해야 합니다.',
      interpretKey: 'shared.market.macro.vix.extremeFear',
      interpretDetailKey: 'shared.market.macro.vix.extremeFearDetail',
      tone: 'bearish',
    };
  }
  if (vix >= 20) {
    return {
      interpretLabel: '불안 고조',
      interpretDetail: '투자자 헤지·매도 수요가 늘어난 상태. 리스크 자산 조정 압력이 커질 수 있습니다.',
      interpretKey: 'shared.market.macro.vix.elevatedFear',
      interpretDetailKey: 'shared.market.macro.vix.elevatedFearDetail',
      tone: 'bearish',
    };
  }
  if (vix >= 15) {
    return {
      interpretLabel: '보통',
      interpretDetail: '역사적 평균(약 15~20) 근처. 특별한 공포·탐욕 신호는 약합니다.',
      interpretKey: 'shared.market.macro.vix.normal',
      interpretDetailKey: 'shared.market.macro.vix.normalDetail',
      tone: 'neutral',
    };
  }
  return {
    interpretLabel: '낮은 변동성',
    interpretDetail: '시장이 안심·채무모드에 가깝습니다. 다만 VIX 극저는 역으로 조정(complacency) 경고로 보는 트레이더도 많습니다.',
    interpretKey: 'shared.market.macro.vix.lowVol',
    interpretDetailKey: 'shared.market.macro.vix.lowVolDetail',
    tone: 'bullish',
  };
}

function interpretFx(
  krwPerUsd: number,
  change1d: number | null,
): Pick<
  MacroIndicatorSnapshot,
  'interpretLabel' | 'interpretDetail' | 'interpretKey' | 'interpretDetailKey' | 'interpretDetailParams' | 'tone'
> {
  const weakening = (change1d ?? 0) > 0.2;
  const strengthening = (change1d ?? 0) < -0.2;
  if (weakening) {
    return {
      interpretLabel: '원화 약세',
      interpretDetail: `달러당 ${krwPerUsd.toFixed(0)}원대 — 원화 약세는 외국인 수급·수출주엔 순풍, 수입·외채·성장주엔 부담으로 해석되는 경우가 많습니다.`,
      interpretKey: 'shared.market.macro.fx.krwWeak',
      interpretDetailKey: 'shared.market.macro.fx.krwWeakDetail',
      interpretDetailParams: { rate: krwPerUsd.toFixed(0) },
      tone: 'bearish',
    };
  }
  if (strengthening) {
    return {
      interpretLabel: '원화 강세',
      interpretDetail: '원화 강세 구간 — 국내 유동성·수입물가에는 긍정적이나 수출·외국인 매수엔 제약 요인이 될 수 있습니다.',
      interpretKey: 'shared.market.macro.fx.krwStrong',
      interpretDetailKey: 'shared.market.macro.fx.krwStrongDetail',
      tone: 'bullish',
    };
  }
  return {
    interpretLabel: '보합',
    interpretDetail: '환율 변동이 크지 않아 매크로 변수로서 영향이 제한적입니다.',
    interpretKey: 'shared.market.macro.fx.stable',
    interpretDetailKey: 'shared.market.macro.fx.stableDetail',
    tone: 'neutral',
  };
}

function interpretYield(
  yieldPct: number,
  change1d: number | null,
  name: string,
): Pick<
  MacroIndicatorSnapshot,
  'interpretLabel' | 'interpretDetail' | 'interpretKey' | 'interpretDetailKey' | 'interpretDetailParams' | 'tone'
> {
  const rising = (change1d ?? 0) > 0.5;
  const falling = (change1d ?? 0) < -0.5;
  if (rising) {
    return {
      interpretLabel: '금리 상승 압력',
      interpretDetail: `${name} 수익률 상승은 금융여건 경화·성장주 밸류에이션 압박으로 연결됩니다. Fed 정책·물가 기대를 함께 보세요.`,
      interpretKey: 'shared.market.macro.yield.rising',
      interpretDetailKey: 'shared.market.macro.yield.risingDetail',
      interpretDetailParams: { name },
      tone: 'bearish',
    };
  }
  if (falling) {
    return {
      interpretLabel: '금리 하락',
      interpretDetail: '국채 수익률 하락은 risk-on·성장주에 우호적일 수 있으나 경기 둔화 우려와 겹칠 수 있습니다.',
      interpretKey: 'shared.market.macro.yield.falling',
      interpretDetailKey: 'shared.market.macro.yield.fallingDetail',
      tone: 'bullish',
    };
  }
  if (yieldPct >= 4.5) {
    return {
      interpretLabel: '고금리 구간',
      interpretDetail: `${yieldPct.toFixed(2)}% — 2020년대 고금리 regime. 할인율 상승으로 장기 성장주 멀티플에 부담.`,
      interpretKey: 'shared.market.macro.yield.highRegime',
      interpretDetailKey: 'shared.market.macro.yield.highRegimeDetail',
      interpretDetailParams: { yield: yieldPct.toFixed(2) },
      tone: 'bearish',
    };
  }
  return {
    interpretLabel: '안정',
    interpretDetail: `${yieldPct.toFixed(2)}% — 단기적으로 큰 re-pricing 압력은 제한적.`,
    interpretKey: 'shared.market.macro.yield.stable',
    interpretDetailKey: 'shared.market.macro.yield.stableDetail',
    interpretDetailParams: { yield: yieldPct.toFixed(2) },
    tone: 'neutral',
  };
}

export function buildMacroSnapshot(input: MacroSeriesInput): MacroIndicatorSnapshot | null {
  if (input.closes.length === 0) return null;
  const value = input.closes[input.closes.length - 1];
  const interp =
    input.kind === 'vix'
      ? interpretVix(value)
      : input.kind === 'fx'
        ? interpretFx(value, input.changePercent1d)
        : interpretYield(value, input.changePercent1d, input.name);

  return {
    yahooSymbol: input.yahooSymbol,
    name: input.name,
    kind: input.kind,
    unit: input.unit,
    value,
    changePercent1d: input.changePercent1d,
    chartUrl: input.chartUrl,
    tradingViewUrl: input.tradingViewUrl,
    ...interp,
  };
}
