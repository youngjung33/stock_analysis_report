import { buildMarketStatusLines } from '@/client/domain/services/quote-notice';
import { MarketProviderStatus } from '@/client/domain/models';

interface Props {
  providers: MarketProviderStatus[];
}

export function MarketStatusBanner({ providers }: Props) {
  const unavailable = providers.filter((p) => !p.available);
  if (unavailable.length === 0) return null;

  const lines = buildMarketStatusLines(providers);

  return (
    <div className="rounded-lg border border-sky-900/50 bg-sky-950/40 px-4 py-3 text-sm text-sky-100/90">
      <p className="font-medium">시세 API 안내</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-sky-100/80">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-sky-200/70">
        설정된 API만 시세를 가져옵니다. 미국 주식은 Finnhub API 키(FINNHUB_API_KEY)가 필요합니다.
      </p>
    </div>
  );
}
