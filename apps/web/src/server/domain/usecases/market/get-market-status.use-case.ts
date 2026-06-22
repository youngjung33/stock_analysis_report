import { Market } from '@sar/shared';
import { MarketProviderStatus } from '../../entities';
import { IMarketDataProvider } from '../../repositories';

export class GetMarketStatusUseCase {
  constructor(private readonly marketProviders: IMarketDataProvider[]) {}

  execute(): MarketProviderStatus[] {
    const markets = [Market.KR, Market.US];

    return markets.map((market) => {
      const provider = this.marketProviders.find((p) => p.supports(market));
      if (!provider) {
        return {
          market,
          label: market === Market.KR ? '한국 주식' : '미국 주식',
          available: false,
          setupHint: '시세 제공자가 설정되지 않았습니다.',
        };
      }

      return {
        market,
        label: provider.label(),
        available: provider.isAvailable(),
        setupHint: provider.unavailableReason(),
      };
    });
  }
}
