import { NextRequest } from 'next/server';
import { normalizeLocale } from '@sar/shared';
import { isAiEnabled } from '@/server/data/ai/ai-config';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';
import { requireAiMemberAuth } from '@/server/http/ai-auth';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!isAiEnabled()) {
      return jsonData({ enabled: false });
    }

    await enforceRateLimit(req, 'api:ai-portfolio', 'apiHeavy');
    const user = requireAiMemberAuth(req);

    const body = (await req.json().catch(() => ({}))) as { locale?: string };
    const locale = normalizeLocale(body.locale ?? req.headers.get('accept-language') ?? 'ko');

    const { buildPortfolioAiContextUseCase, runAiAnalysisUseCase } = getServerServices();

    const context = await buildPortfolioAiContextUseCase.execute(user.userId, locale);
    const insight = await runAiAnalysisUseCase.execute({
      userId: user.userId,
      kind: 'portfolio',
      context,
      locale,
    });

    return jsonData({ enabled: true, insight });
  } catch (error) {
    return handleRouteError(error);
  }
}
