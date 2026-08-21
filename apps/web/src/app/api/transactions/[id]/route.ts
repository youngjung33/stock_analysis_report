import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await enforceRateLimit(req, 'api:transactions-update', 'apiWrite');
    const user = requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    const { updateTransactionUseCase } = getServerServices();
    const updated = await updateTransactionUseCase.execute(user.userId, id, {
      quantity: Number(body.quantity),
      price: Number(body.price),
      tradedAt: new Date(body.tradedAt),
      memo: body.memo ?? null,
    });
    return jsonData(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await enforceRateLimit(req, 'api:transactions-delete', 'apiWrite');
    const user = requireAuth(req);
    const { id } = await params;
    const { deleteTransactionUseCase } = getServerServices();
    await deleteTransactionUseCase.execute(user.userId, id);
    return jsonData({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
