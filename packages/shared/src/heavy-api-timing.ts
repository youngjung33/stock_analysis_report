/** 심층 분석 로딩 UX·타이밍 상수 (서버 maxDuration ≠ 클라 heavy timeout) */

export const HEAVY_API_PLATFORM_MAX_DURATION_SEC = 25;

export const HEAVY_API_CLIENT_TIMEOUT_MS_DEFAULT = 90_000;

const US_FINNHUB_GAP_SEC_DEFAULT = 1.1;

function readUsQueueGapSec(): number {
  const raw = Number(process.env.US_FINNHUB_QUEUE_GAP_MS ?? 1100);
  if (!Number.isFinite(raw) || raw < 0) return US_FINNHUB_GAP_SEC_DEFAULT;
  return raw / 1000;
}

export type HeavyAnalysisKind = 'marketDeep' | 'stockFocus';

/** US 큐·enrichment 규모 기반 대략 대기(초) */
export function estimateHeavyAnalysisWaitSec(
  kind: HeavyAnalysisKind,
  options?: { usSymbolCount?: number },
): { typicalMinSec: number; typicalMaxSec: number } {
  const gap = readUsQueueGapSec();
  const usCount = Math.max(0, options?.usSymbolCount ?? (kind === 'marketDeep' ? 18 : 2));
  const queueSec = Math.ceil(usCount * gap);
  const baseMin = kind === 'marketDeep' ? 18 : 12;
  const baseMax = kind === 'marketDeep' ? 32 : 22;
  return {
    typicalMinSec: baseMin + Math.floor(queueSec * 0.35),
    typicalMaxSec: baseMax + queueSec,
  };
}
