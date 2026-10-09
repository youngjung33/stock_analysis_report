import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, requireAuth, runApiRoute } from '@/server/http/route-utils';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'api:corporate-actions-delete', 'apiWrite');
    const user = requireAuth(req);
    const { id } = await params;
    const { deleteCorporateActionUseCase } = getServerServices();
    await deleteCorporateActionUseCase.execute(id, user.userId);
    return jsonData({ ok: true });
  });
}
