import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 15;

export async function GET() {
  try {
    const { getFeaturedQuotesUseCase } = getServerServices();
    const result = await getFeaturedQuotesUseCase.execute();
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
