import { fetchUsdKrwRate } from '@/server/data/market/usd-krw.client';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function GET() {
  try {
    const usdKrwRate = await fetchUsdKrwRate();
    return jsonData({ usdKrwRate, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return handleRouteError(error);
  }
}
