/**
 * 심층 시장/종목 분석 로딩 UX·문서용 타이밍 상수.
 * 서버(Vercel maxDuration)와 클라이언트(heavy axios timeout)는 다를 수 있음.
 */

/** `export const maxDuration` on market/stock-analysis routes (seconds) */
export const HEAVY_API_PLATFORM_MAX_DURATION_SEC = 25;

export const HEAVY_API_CLIENT_TIMEOUT_MS_DEFAULT = 90_000;

const US_FINNHUB_GAP_SEC_DEFAULT = 1.1;

function readUsQueueGapSec(): number {
  const raw = Number(process.env.US_FINNHUB_QUEUE_GAP_MS ?? 1100);
  if (!Number.isFinite(raw) || raw < 0) return US_FINNHUB_GAP_SEC_DEFAULT;
  return raw / 1000;
}

export type HeavyAnalysisKind = 'marketDeep' | 'stockFocus';

/**
 * Finnhub US 직렬 큐·enrichment 규모를 반영한 **대략** 대기 시간(초).
 * 실제는 캐시·실패·종목 수에 따라 달라짐.
 */
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
