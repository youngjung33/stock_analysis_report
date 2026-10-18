/** 실 API 통합 테스트 — 네트워크·키 필요. 기본 CI/로컬 Vitest에서는 skip. */

export function isLiveMarketApiIntegrationEnabled(): boolean {
  const flag = process.env.LIVE_MARKET_API_INTEGRATION?.trim();
  return flag === '1' || flag?.toLowerCase() === 'true';
}

export function hasFinnhubApiKey(): boolean {
  const key = process.env.FINNHUB_API_KEY?.trim();
  return Boolean(key && key !== 'your_finnhub_api_key');
}

export const LIVE_MARKET_API_SKIP_REASON =
  'Set LIVE_MARKET_API_INTEGRATION=1 to run Yahoo/Finnhub live tests (optional FINNHUB_API_KEY for US).';
