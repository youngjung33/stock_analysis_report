import { IFxRateProvider } from '../../ports/market-data.ports';

/** USD/KRW 환율 조회 use case */
export class GetFxRateUseCase {
  constructor(private readonly fxRateProvider: IFxRateProvider) {}

  async execute(): Promise<{ usdKrwRate: number | null; fetchedAt: string }> {
    const usdKrwRate = await this.fxRateProvider.fetchUsdKrwRate();
    return { usdKrwRate, fetchedAt: new Date().toISOString() };
  }
}
