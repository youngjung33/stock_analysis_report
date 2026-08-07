import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(req, 'api:corporate-actions-delete', 'apiWrite');
    const user = requireAuth(req);
    const { id } = await params;
    const { deleteCorporateActionUseCase } = getServerServices();
    await deleteCorporateActionUseCase.execute(id, user.userId);
    return jsonData({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
