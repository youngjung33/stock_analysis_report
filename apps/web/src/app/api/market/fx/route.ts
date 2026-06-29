import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function GET() {
  try {
    const { getFxRateUseCase } = getServerServices();
    const result = await getFxRateUseCase.execute();
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
