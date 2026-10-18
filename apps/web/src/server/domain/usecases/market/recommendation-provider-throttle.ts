/** US Finnhub / Yahoo 무료 tier — 성공한 외부 호출 직후에만 대기 (실패·캐시 히트는 대기 없음) */

const US_PROVIDER_GAP_MS = 1100;
const KR_PROVIDER_GAP_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** enrichment 루프에서 US 외부 호출 성공 직후 호출 */
export async function throttleAfterUsProviderSuccess(): Promise<void> {
  await sleep(US_PROVIDER_GAP_MS);
}

/** KR Yahoo/DART 등 성공 직후 짧은 페이싱 */
export async function throttleAfterKrProviderSuccess(): Promise<void> {
  await sleep(KR_PROVIDER_GAP_MS);
}
