import { Market, type QuoteSetupHintCode } from '@sar/shared';
import { MarketProviderStatus } from '../../entities';
import { IMarketDataProvider } from '../../ports/market-data.port';

/** KR/US 시세 제공자(Finnhub·Yahoo) 설정 상태 조회 use case */
export class GetMarketStatusUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  /** 시장별 available · setupHintCode 목록 */
  execute(): MarketProviderStatus[] {
    const markets = [Market.KR, Market.US];

    return markets.map((market) => {
      if (!this.marketData.supports(market)) {
        return {
          market,
          available: false,
          setupHintCode: 'no_provider' satisfies QuoteSetupHintCode,
        };
      }

      return {
        market,
        available: this.marketData.isAvailable(market),
        setupHintCode: this.marketData.unavailableReasonCode(market),
      };
    });
  }
}
