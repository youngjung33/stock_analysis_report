import {
  INDEX_BENCHMARKS,
  KR_SECTOR_BENCHMARK,
  MACRO_INDICATORS,
  SECTOR_ETFS,
  US_SECTOR_BENCHMARK,
  IndexTechnicalInput,
  MacroSeriesInput,
  Market,
  SectorSeriesInput,
  buildIndexSnapshot,
  buildMacroSnapshot,
  buildSectorSnapshot,
  rankSectorSnapshots,
  type IndexContextSnapshot,
  type MacroIndicatorSnapshot,
  type SectorEtfSnapshot,
} from '@sar/shared';
import { ChartSeriesData, IMarketDataProvider } from '../../ports/market-data.port';

export interface BuiltMarketContextData {
  macro: MacroIndicatorSnapshot[];
  sectors: SectorEtfSnapshot[];
  indices: IndexContextSnapshot[];
  usdKrwRate: number | null;
  usdKrwChange1d: number | null;
  indexInputs: IndexTechnicalInput[];
  macroInputs: MacroSeriesInput[];
  sectorInputs: SectorSeriesInput[];
}

/** 매크로·섹터·지수 시계열 fetch → 추천 엔진용 MarketContext 입력 */
export class BuildMarketContextUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(): Promise<BuiltMarketContextData> {
    const sectorBenchmarks = [US_SECTOR_BENCHMARK.yahooSymbol, KR_SECTOR_BENCHMARK.yahooSymbol];
    const allSymbols = [
      ...new Set([
        ...INDEX_BENCHMARKS.map((b) => b.yahooSymbol),
        ...MACRO_INDICATORS.map((m) => m.yahooSymbol),
        ...SECTOR_ETFS.map((s) => s.yahooSymbol),
        ...sectorBenchmarks,
      ]),
    ];

    const seriesResults = await Promise.allSettled(
      allSymbols.map((sym) => this.marketData.fetchChartSeries(sym)),
    );

    const seriesMap = new Map<string, ChartSeriesData>();
    allSymbols.forEach((sym, i) => {
      const result = seriesResults[i];
      if (result.status === 'fulfilled') {
        seriesMap.set(sym, result.value);
      }
    });

    const indexInputs: IndexTechnicalInput[] = INDEX_BENCHMARKS.flatMap((bench) => {
      const series = seriesMap.get(bench.yahooSymbol);
      if (!series) return [];
      return [
        {
          yahooSymbol: bench.yahooSymbol,
          name: bench.name,
          market: bench.market,
          closes: series.closes,
          volumes: series.volumes,
          highs: series.highs,
          lows: series.lows,
          changePercent1d: series.changePercent1d,
          chartUrl: bench.chartUrl,
          tradingViewUrl: bench.tradingViewUrl ?? bench.chartUrl,
        },
      ];
    });

    const macroInputs: MacroSeriesInput[] = MACRO_INDICATORS.flatMap((m) => {
      const series = seriesMap.get(m.yahooSymbol);
      if (!series) return [];
      return [
        {
          yahooSymbol: m.yahooSymbol,
          name: m.name,
          kind: m.kind,
          unit: m.unit,
          closes: series.closes,
          changePercent1d: series.changePercent1d,
          chartUrl: m.chartUrl,
          tradingViewUrl: m.tradingViewUrl,
        },
      ];
    });

    const spyCloses = seriesMap.get(US_SECTOR_BENCHMARK.yahooSymbol)?.closes ?? [];
    const krBenchCloses = seriesMap.get(KR_SECTOR_BENCHMARK.yahooSymbol)?.closes ?? [];

    const sectorInputs: SectorSeriesInput[] = SECTOR_ETFS.flatMap((etf) => {
      const series = seriesMap.get(etf.yahooSymbol);
      if (!series) return [];
      const benchmarkCloses =
        etf.market === Market.US
          ? spyCloses.length > 0
            ? spyCloses
            : series.closes
          : krBenchCloses.length > 0
            ? krBenchCloses
            : series.closes;
      return [
        {
          yahooSymbol: etf.yahooSymbol,
          name: etf.name,
          sectorLabel: etf.sectorLabel,
          market: etf.market,
          closes: series.closes,
          changePercent1d: series.changePercent1d,
          chartUrl: etf.chartUrl,
          benchmarkCloses,
        },
      ];
    });

    const indices = indexInputs
      .map(buildIndexSnapshot)
      .filter((s): s is NonNullable<ReturnType<typeof buildIndexSnapshot>> => s !== null);

    const macro = macroInputs
      .map(buildMacroSnapshot)
      .filter((s): s is NonNullable<ReturnType<typeof buildMacroSnapshot>> => s !== null);

    const sectors = rankSectorSnapshots(
      sectorInputs
        .map(buildSectorSnapshot)
        .filter((s): s is NonNullable<ReturnType<typeof buildSectorSnapshot>> => s !== null),
    );

    const fxMacro = macro.find((m) => m.kind === 'fx');

    return {
      macro,
      sectors,
      indices: indices.map((i) => ({
        yahooSymbol: i.yahooSymbol,
        name: i.name,
        market: i.market,
        changePercent1d: i.changePercent1d,
      })),
      usdKrwRate: fxMacro?.value ?? null,
      usdKrwChange1d: fxMacro?.changePercent1d ?? null,
      indexInputs,
      macroInputs,
      sectorInputs,
    };
  }
}
