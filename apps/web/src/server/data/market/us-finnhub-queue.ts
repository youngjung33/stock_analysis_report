/** Finnhub US API — 프로세스 내 단일 순차 큐 (enrichment 병렬 루프 간 429·타임아웃 방지) */

const DEFAULT_GAP_MS = 1100;

function readGapMs(): number {
  const raw = Number(process.env.US_FINNHUB_QUEUE_GAP_MS ?? DEFAULT_GAP_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_GAP_MS;
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let tail: Promise<unknown> = Promise.resolve();

export function runOnUsFinnhubQueue<T>(operation: () => Promise<T>): Promise<T> {
  const gapMs = readGapMs();
  const run = async (): Promise<T> => {
    try {
      return await operation();
    } finally {
      await sleep(gapMs);
    }
  };

  const next = tail.then(run, run);
  tail = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

/** 테스트에서 큐 상태 초기화 */
export function resetUsFinnhubQueueForTests(): void {
  tail = Promise.resolve();
}
