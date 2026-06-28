import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export const maxDuration = 25;

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const periodsParam = req.nextUrl.searchParams.get('periods') ?? '1mo,3mo,ytd,max';
    const includeInsights = req.nextUrl.searchParams.get('insights') !== '0';
    const periods = periodsParam.split(',').filter(Boolean) as import('@sar/shared').PortfolioPeriod[];

    const { getPortfolioAnalysisUseCase } = getServerServices();
    const result = await getPortfolioAnalysisUseCase.execute(user.userId, periods, includeInsights);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
