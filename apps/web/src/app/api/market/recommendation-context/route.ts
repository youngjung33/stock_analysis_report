import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 25;

/** 추천 엔진용 매크로·섹터·환율 컨텍스트 (게스트 시뮬 등) */
export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'market:recommendation-context', 'heavy');
    const { buildMarketContextUseCase } = getServerServices();
    const ctx = await buildMarketContextUseCase.execute();
    return jsonData({
      macro: ctx.macro,
      sectors: ctx.sectors,
      indices: ctx.indices,
      usdKrwRate: ctx.usdKrwRate,
      usdKrwChange1d: ctx.usdKrwChange1d,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
