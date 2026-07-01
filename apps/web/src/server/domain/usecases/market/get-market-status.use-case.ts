import { Market } from '@sar/shared';
import { MarketProviderStatus } from '../../entities';
import { IMarketDataProvider } from '../../ports/market-data.port';

/** KR/US 시세 제공자(Finnhub·Yahoo) 설정 상태 조회 use case */
export class GetMarketStatusUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  /** 시장별 available · setupHint 목록 */
  execute(): MarketProviderStatus[] {
    const markets = [Market.KR, Market.US];

    return markets.map((market) => {
      if (!this.marketData.supports(market)) {
        return {
          market,
          label: market === Market.KR ? '한국 주식' : '미국 주식',
          available: false,
          setupHint: '시세 제공자가 설정되지 않았습니다.',
        };
      }

      return {
        market,
        label: this.marketData.label(market),
        available: this.marketData.isAvailable(market),
        setupHint: this.marketData.unavailableReason(market),
      };
    });
  }
}
