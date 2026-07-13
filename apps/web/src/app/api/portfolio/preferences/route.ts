import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { getPortfolioPreferencesUseCase } = getServerServices();
    const prefs = await getPortfolioPreferencesUseCase.execute(user.userId);
    return jsonData(prefs);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = (await req.json()) as {
      targetKrPercent?: number;
      targetUsPercent?: number;
      maxSingleWeightPercent?: number;
    };

    if (
      body.targetKrPercent === undefined ||
      body.targetUsPercent === undefined ||
      body.maxSingleWeightPercent === undefined
    ) {
      throw new ValidationError('targetKrPercent, targetUsPercent, maxSingleWeightPercent required');
    }

    const { updatePortfolioPreferencesUseCase } = getServerServices();
    const prefs = await updatePortfolioPreferencesUseCase.execute({
      userId: user.userId,
      targetKrPercent: body.targetKrPercent,
      targetUsPercent: body.targetUsPercent,
      maxSingleWeightPercent: body.maxSingleWeightPercent,
    });

    return jsonData(prefs);
  } catch (error) {
    return handleRouteError(error);
  }
}
