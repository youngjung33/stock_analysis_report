import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { BadRequestError } from '@/server/http/errors';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { listWatchlistUseCase } = getServerServices();
    const items = await listWatchlistUseCase.execute(user.userId);
    return jsonData({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const market = body.market as Market;
    if (!body.symbol || !body.name || (market !== Market.KR && market !== Market.US)) {
      throw new BadRequestError('symbol, name, market are required');
    }

    const { addWatchlistUseCase } = getServerServices();
    const item = await addWatchlistUseCase.execute({
      userId: user.userId,
      symbol: body.symbol,
      name: body.name,
      market,
    });
    return jsonData({ item });
  } catch (error) {
    return handleRouteError(error);
  }
}
