import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { SearchStocksUseCase } from '@/server/domain/usecases/market/search-stocks.use-case';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 10;

const searchStocksUseCase = new SearchStocksUseCase();

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') ?? '';
    const marketParam = req.nextUrl.searchParams.get('market');
    const market = marketParam === Market.US ? Market.US : Market.KR;

    const results = await searchStocksUseCase.execute(q, market);
    return jsonData(results);
  } catch (error) {
    return handleRouteError(error);
  }
}
