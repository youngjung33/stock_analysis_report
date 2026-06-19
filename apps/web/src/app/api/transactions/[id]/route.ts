import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const { deleteTransactionUseCase } = getServerServices();
    await deleteTransactionUseCase.execute(user.userId, id);
    return jsonData({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
