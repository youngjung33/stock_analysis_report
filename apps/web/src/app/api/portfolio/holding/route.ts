import { NextRequest } from 'next/server';
import { AppErrorCode, Market } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { ValidationError } from '@/server/domain/errors/domain.errors';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const symbol = req.nextUrl.searchParams.get('symbol');
    const marketParam = req.nextUrl.searchParams.get('market');

    if (!symbol || !marketParam) {
      throw new ValidationError(AppErrorCode.VALIDATION, 'symbol과 market이 필요합니다.');
    }
    if (marketParam !== Market.KR && marketParam !== Market.US) {
      throw new ValidationError(AppErrorCode.VALIDATION, 'market은 KR 또는 US여야 합니다.');
    }

    const { getHoldingBySymbolUseCase } = getServerServices();
    const holding = await getHoldingBySymbolUseCase.execute(user.userId, symbol, marketParam);
    return jsonData({ holding });
  } catch (error) {
    return handleRouteError(error);
  }
}
