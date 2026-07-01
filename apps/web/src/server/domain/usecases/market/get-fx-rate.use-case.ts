import { IMarketDataProvider } from '../../ports/market-data.port';

/** USD/KRW 환율 조회 use case */
export class GetFxRateUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  /** USD/KRW 환율·fetchedAt 반환 */
  async execute(): Promise<{ usdKrwRate: number | null; fetchedAt: string }> {
    const usdKrwRate = await this.marketData.fetchUsdKrwRate();
    return { usdKrwRate, fetchedAt: new Date().toISOString() };
  }
}
