import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export async function GET() {
  try {
    const { getMarketStatusUseCase } = getServerServices();
    return jsonData(getMarketStatusUseCase.execute());
  } catch (error) {
    return handleRouteError(error);
  }
}
