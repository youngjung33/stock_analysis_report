import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const symbol = req.nextUrl.searchParams.get('symbol');
    const marketParam = req.nextUrl.searchParams.get('market');

    if (!symbol || !marketParam) {
      return handleRouteError(new Error('symbol and market are required'));
    }
    if (marketParam !== Market.KR && marketParam !== Market.US) {
      return handleRouteError(new Error('invalid market'));
    }

    const { getHoldingBySymbolUseCase } = getServerServices();
    const holding = await getHoldingBySymbolUseCase.execute(user.userId, symbol, marketParam);
    return jsonData({ holding });
  } catch (error) {
    return handleRouteError(error);
  }
}
