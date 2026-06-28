import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { BadRequestError } from '@/server/http/errors';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { listCorporateActionsUseCase } = getServerServices();
    const items = await listCorporateActionsUseCase.execute(user.userId);
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
    if (!body.stockSymbol || !body.name || !body.type || !body.effectiveAt) {
      throw new BadRequestError('stockSymbol, name, type, effectiveAt are required');
    }
    if (market !== Market.KR && market !== Market.US) {
      throw new BadRequestError('invalid market');
    }

    const { createCorporateActionUseCase } = getServerServices();
    const item = await createCorporateActionUseCase.execute({
      userId: user.userId,
      stockSymbol: body.stockSymbol,
      market,
      name: body.name,
      type: body.type,
      effectiveAt: new Date(body.effectiveAt),
      cashAmount: body.cashAmount,
      splitRatio: body.splitRatio,
      targetSymbol: body.targetSymbol,
      targetMarket: body.targetMarket,
      targetName: body.targetName,
      targetQuantity: body.targetQuantity,
      targetPrice: body.targetPrice,
      memo: body.memo,
    });
    return jsonData({ item });
  } catch (error) {
    return handleRouteError(error);
  }
}
