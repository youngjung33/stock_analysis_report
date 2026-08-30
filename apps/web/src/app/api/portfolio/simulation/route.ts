import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth, tryGetAuth } from '@/server/http/route-utils';
import type { PortfolioSimulationSnapshot } from '@/server/domain/usecases/portfolio/portfolio-capital.use-cases';

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:portfolio-simulation', 'apiRead');
    const user = requireAuth(req);
    const { getPortfolioSimulationUseCase } = getServerServices();
    const result = await getPortfolioSimulationUseCase.execute(user.userId);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Guest/client — portfolio snapshot in body (full enrichment on server) */
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:portfolio-simulation', 'apiRead');
    const body = (await req.json().catch(() => ({}))) as PortfolioSimulationSnapshot;
    const user = tryGetAuth(req);
    const { getPortfolioSimulationUseCase } = getServerServices();

    if (user) {
      const result = await getPortfolioSimulationUseCase.execute(user.userId);
      return jsonData(result);
    }

    const snapshot: PortfolioSimulationSnapshot = {
      cash: body.cash ?? { krw: 0, usd: 0 },
      holdings: body.holdings ?? [],
      preferences: body.preferences ?? {
        targetKrPercent: 70,
        targetUsPercent: 30,
        maxSingleWeightPercent: 40,
        investorProfile: null,
      },
      watchlist: body.watchlist ?? [],
      usdKrwRate: body.usdKrwRate ?? null,
      ledgerEntryCount: body.ledgerEntryCount ?? 0,
    };

    const result = await getPortfolioSimulationUseCase.executeFromSnapshot(snapshot);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
