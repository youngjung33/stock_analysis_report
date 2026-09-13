import { NextRequest } from 'next/server';
import { AppErrorCode, type AiProviderId } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:ai-credential-read', 'apiRead');
    const user = requireAuth(req);
    const { getAiCredentialStatusUseCase } = getServerServices();
    const status = await getAiCredentialStatusUseCase.execute(user.userId);
    return jsonData(status);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:ai-credential-write', 'apiWrite');
    const user = requireAuth(req);
    const body = (await req.json()) as { provider?: string; apiKey?: string };
    if (!body.provider || !body.apiKey) {
      throw new ValidationError(AppErrorCode.VALIDATION);
    }
    const { upsertAiCredentialUseCase } = getServerServices();
    await upsertAiCredentialUseCase.execute(
      user.userId,
      body.provider as AiProviderId,
      body.apiKey,
    );
    return jsonData({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:ai-credential-delete', 'apiWrite');
    const user = requireAuth(req);
    const { deleteAiCredentialUseCase } = getServerServices();
    await deleteAiCredentialUseCase.execute(user.userId);
    return jsonData({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
