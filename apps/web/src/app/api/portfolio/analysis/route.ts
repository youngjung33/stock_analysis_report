import { NextRequest } from 'next/server';
import { type PortfolioPeriod } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth, tryGetAuth } from '@/server/http/route-utils';
import type { AnalysisHoldingInput } from '@/server/domain/usecases/portfolio/get-portfolio-analysis.use-case';

export const maxDuration = 25;

interface AnalysisBody {
  holdings?: AnalysisHoldingInput[];
  hasAllQuotes?: boolean;
  periods?: PortfolioPeriod[];
  includeInsights?: boolean;
}

function parsePeriods(req: NextRequest, body?: AnalysisBody): PortfolioPeriod[] {
  const fromQuery = req.nextUrl.searchParams.get('periods');
  const raw = body?.periods?.length
    ? body.periods.join(',')
    : fromQuery ?? '1mo,3mo,ytd,max';
  return raw.split(',').filter(Boolean) as PortfolioPeriod[];
}

function parseIncludeInsights(req: NextRequest, body?: AnalysisBody): boolean {
  if (body?.includeInsights !== undefined) return body.includeInsights;
  return req.nextUrl.searchParams.get('insights') !== '0';
}

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:portfolio-analysis', 'apiHeavy');
    const user = requireAuth(req);
    const periods = parsePeriods(req);
    const includeInsights = parseIncludeInsights(req);

    const { getPortfolioAnalysisUseCase } = getServerServices();
    const result = await getPortfolioAnalysisUseCase.execute(user.userId, periods, includeInsights);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Guest/client — dashboard holdings in body */
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:portfolio-analysis', 'apiHeavy');
    const body = (await req.json().catch(() => ({}))) as AnalysisBody;
    const user = tryGetAuth(req);
    const periods = parsePeriods(req, body);
    const includeInsights = parseIncludeInsights(req, body);

    if (user) {
      const { getPortfolioAnalysisUseCase } = getServerServices();
      const result = await getPortfolioAnalysisUseCase.execute(user.userId, periods, includeInsights);
      return jsonData(result);
    }

    const holdings = body.holdings ?? [];
    const hasAllQuotes =
      body.hasAllQuotes ??
      (holdings.length === 0 || holdings.every((h) => h.currentPrice !== null));

    const { getPortfolioAnalysisUseCase } = getServerServices();
    const result = await getPortfolioAnalysisUseCase.executeFromHoldings(
      holdings,
      hasAllQuotes,
      periods,
      includeInsights,
    );
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
