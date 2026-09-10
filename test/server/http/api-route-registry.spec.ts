import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const API_ROOT = path.resolve(__dirname, '../../../apps/web/src/app/api');

function collectRouteFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectRouteFiles(full));
    } else if (entry === 'route.ts') {
      files.push(path.relative(API_ROOT, full).replace(/\\/g, '/'));
    }
  }
  return files.sort();
}

/** Each route file must appear in at least one HTTP spec (direct import or documented group). */
const ROUTE_SPEC_COVERAGE: Record<string, string> = {
  'account/confirm-email/route.ts': 'remaining-api-routes.spec.ts',
  'account/email/route.ts': 'account-routes.spec.ts',
  'account/oauth/[provider]/route.ts': 'account-routes.spec.ts',
  'account/password/route.ts': 'remaining-api-routes.spec.ts',
  'account/route.ts': 'account-routes.spec.ts',
  'account/verify-email/route.ts': 'remaining-api-routes.spec.ts',
  'auth/check-username/route.ts': 'auth-routes.spec.ts',
  'auth/forgot-password/route.ts': 'remaining-api-routes.spec.ts',
  'auth/guest/session/route.ts': 'remaining-api-routes.spec.ts',
  'auth/login/route.ts': 'auth-routes.spec.ts',
  'auth/logout/route.ts': 'remaining-api-routes.spec.ts',
  'auth/oauth/[provider]/callback/route.ts': 'remaining-api-routes.spec.ts',
  'auth/oauth/[provider]/start/route.ts': 'remaining-api-routes.spec.ts',
  'auth/oauth/providers/route.ts': 'remaining-api-routes.spec.ts',
  'auth/refresh/route.ts': 'remaining-api-routes.spec.ts',
  'auth/register/route.ts': 'remaining-api-routes.spec.ts',
  'auth/reset-password/route.ts': 'remaining-api-routes.spec.ts',
  'auth/verify-email/route.ts': 'verify-email-route.spec.ts',
  'cash/route.ts': 'cash-routes.spec.ts',
  'corporate-actions/[id]/route.ts': 'remaining-api-routes.spec.ts',
  'corporate-actions/route.ts': 'portfolio-api-routes.spec.ts',
  'cron/recommendation-batch/route.ts': 'cron-routes.spec.ts',
  'cron/recommendation-outcomes/route.ts': 'cron-routes.spec.ts',
  'market/analysis/route.ts': 'market-routes.spec.ts',
  'market/featured/route.ts': 'market-routes.spec.ts',
  'market/fx/route.ts': 'remaining-api-routes.spec.ts',
  'market/quote/route.ts': 'remaining-api-routes.spec.ts',
  'market/quotes/route.ts': 'remaining-api-routes.spec.ts',
  'market/recommendation-context/route.ts': 'remaining-api-routes.spec.ts',
  'market/recommendation-history/[batchId]/route.ts': 'recommendation-routes.spec.ts',
  'market/recommendation-history/route.ts': 'recommendation-routes.spec.ts',
  'market/refresh/route.ts': 'portfolio-api-routes.spec.ts',
  'market/search/route.ts': 'remaining-api-routes.spec.ts',
  'market/status/route.ts': 'remaining-api-routes.spec.ts',
  'market/stock-analysis/route.ts': 'stock-analysis-route.spec.ts',
  'portfolio/analysis/route.ts': 'portfolio-api-routes.spec.ts',
  'portfolio/dashboard/route.ts': 'portfolio-api-routes.spec.ts',
  'portfolio/holding/route.ts': 'remaining-api-routes.spec.ts',
  'portfolio/preferences/route.ts': 'cash-routes.spec.ts',
  'portfolio/simulation/route.ts': 'cash-routes.spec.ts',
  'transactions/[id]/route.ts': 'portfolio-api-routes.spec.ts',
  'transactions/route.ts': 'portfolio-api-routes.spec.ts',
  'watchlist/[id]/route.ts': 'remaining-api-routes.spec.ts',
  'watchlist/route.ts': 'portfolio-api-routes.spec.ts',
};

describe('API route registry', () => {
  it('maps every route.ts file to an HTTP spec', () => {
    const routes = collectRouteFiles(API_ROOT);
    expect(routes).toHaveLength(44);

    const missing = routes.filter((route) => !ROUTE_SPEC_COVERAGE[route]);
    expect(missing, `uncovered routes: ${missing.join(', ')}`).toEqual([]);
  });
});
