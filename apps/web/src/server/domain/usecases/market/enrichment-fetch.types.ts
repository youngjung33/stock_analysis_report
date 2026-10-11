import type { EnrichmentSliceQuality } from '@sar/shared';

export interface EnrichmentFetchOptions {
  /** 단일 종목 리포트·AI — 15분 프로세스 캐시 미사용 */
  bypassCache?: boolean;
  quality?: EnrichmentSliceQuality;
}
