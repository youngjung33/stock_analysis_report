import { NextRequest } from 'next/server';
import { Market, TransactionType } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();

    const { createTransactionUseCase } = getServerServices();
    const result = await createTransactionUseCase.execute({
      userId: user.userId,
      stockSymbol: body.stockSymbol,
      market: body.market as Market,
      name: body.name,
      type: body.type as TransactionType,
      quantity: Number(body.quantity),
      price: Number(body.price),
      tradedAt: new Date(body.tradedAt),
      memo: body.memo,
    });

    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const stockId = req.nextUrl.searchParams.get('stockId') ?? undefined;
    const type = (req.nextUrl.searchParams.get('type') as TransactionType | null) ?? undefined;

    const { listTransactionsUseCase } = getServerServices();
    const result = await listTransactionsUseCase.execute(user.userId, { stockId, type });
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
