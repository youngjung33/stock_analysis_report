/**
 * 포트폴리오 벤치마크 — 지수 대비 수익·혼합 벤치마크 비교.
 */
import { AllocationByMarket } from './portfolio-allocation';
import { INDEX_BENCHMARKS } from './market-benchmarks';
import { Market } from './enums';

export interface BenchmarkComparison {
  benchmarkName: string;
  benchmarkSymbol: string;
  benchmarkReturn: number | null;
  alpha: number | null;
}

/** 포트폴리오 수익과 벤치마크 수익 비교(알파 포함) */
export function compareToBenchmark(
  portfolioReturn: number | null,
  benchmarkReturn: number | null,
  benchmarkName: string,
  benchmarkSymbol: string,
): BenchmarkComparison {
  return {
    benchmarkName,
    benchmarkSymbol,
    benchmarkReturn,
    alpha:
      portfolioReturn !== null && benchmarkReturn !== null
        ? portfolioReturn - benchmarkReturn
        : null,
  };
}

/** KR/US 배분에 따른 혼합 벤치마크 가중·지수 선택 */
export function selectBlendedBenchmark(allocation: AllocationByMarket): {
  krWeight: number;
  usWeight: number;
  krBenchmark: (typeof INDEX_BENCHMARKS)[number];
  usBenchmark: (typeof INDEX_BENCHMARKS)[number];
} {
  const kr = allocation.krPercent / 100;
  const us = allocation.usPercent / 100;
  const total = kr + us;
  const krWeight = total > 0 ? kr / total : 0.5;
  const usWeight = total > 0 ? us / total : 0.5;
  const krBenchmark = INDEX_BENCHMARKS.find((b) => b.market === Market.KR)!;
  const usBenchmark = INDEX_BENCHMARKS.find((b) => b.yahooSymbol === '^GSPC')!;
  return { krWeight, usWeight, krBenchmark, usBenchmark };
}

/** KR·US 벤치마크 수익률 가중 평균 */
export function blendBenchmarkReturn(
  krReturn: number | null,
  usReturn: number | null,
  krWeight: number,
  usWeight: number,
): number | null {
  if (krReturn === null && usReturn === null) return null;
  if (krReturn === null) return usReturn;
  if (usReturn === null) return krReturn;
  return krReturn * krWeight + usReturn * usWeight;
}
