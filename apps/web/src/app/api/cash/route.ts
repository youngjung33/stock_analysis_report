import { NextRequest } from 'next/server';
import { CashLedgerType } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { getCashSummaryUseCase } = getServerServices();
    const summary = await getCashSummaryUseCase.execute(user.userId);
    return jsonData(summary);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = (await req.json()) as {
      currency?: string;
      type?: string;
      amount?: number;
      memo?: string;
    };

    if (!body.currency || !body.type || !body.amount) {
      throw new ValidationError('currency, type, amount are required');
    }

    const { recordCashEntryUseCase } = getServerServices();
    const entry = await recordCashEntryUseCase.execute({
      userId: user.userId,
      currency: body.currency as 'KRW' | 'USD',
      type: body.type as CashLedgerType,
      amount: body.amount,
      memo: body.memo,
    });

    return jsonData(entry);
  } catch (error) {
    return handleRouteError(error);
  }
}
