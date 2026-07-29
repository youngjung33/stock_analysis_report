/** pathname → SEO page key (matches seo.pages.* in locale files) */
export type SeoPageKey =
  | 'home'
  | 'login'
  | 'forgotPassword'
  | 'resetPassword'
  | 'settings'
  | 'myInfo'
  | 'transactions'
  | 'market'
  | 'tax'
  | 'guide'
  | 'stock';

export interface SeoRouteMatch {
  pageKey: SeoPageKey;
  params?: Record<string, string>;
}

/** Canonical pathname for a SEO page key (used in metadata + sitemap) */
export function seoPathForPageKey(pageKey: SeoPageKey, params?: Record<string, string>): string {
  switch (pageKey) {
    case 'home':
      return '/';
    case 'login':
      return '/login';
    case 'forgotPassword':
      return '/forgot-password';
    case 'resetPassword':
      return '/reset-password';
    case 'settings':
      return '/settings';
    case 'myInfo':
      return '/my-info';
    case 'transactions':
      return '/transactions';
    case 'market':
      return '/market/analysis';
    case 'tax':
      return '/tax';
    case 'guide':
      return '/guide';
    case 'stock':
      return `/stocks/${encodeURIComponent(params?.symbol ?? '')}`;
    default:
      return '/';
  }
}

export function pathnameToSeoRoute(pathname: string): SeoRouteMatch {
  const path = pathname.split('?')[0] ?? '/';

  if (path === '/') return { pageKey: 'home' };
  if (path === '/login') return { pageKey: 'login' };
  if (path === '/forgot-password') return { pageKey: 'forgotPassword' };
  if (path === '/reset-password') return { pageKey: 'resetPassword' };
  if (path === '/settings') return { pageKey: 'settings' };
  if (path === '/my-info') return { pageKey: 'myInfo' };
  if (path === '/transactions') return { pageKey: 'transactions' };
  if (path === '/market/analysis') return { pageKey: 'market' };
  if (path === '/tax') return { pageKey: 'tax' };
  if (path === '/guide') return { pageKey: 'guide' };

  const stockMatch = path.match(/^\/stocks\/([^/]+)$/);
  if (stockMatch?.[1]) {
    return { pageKey: 'stock', params: { symbol: decodeURIComponent(stockMatch[1]) } };
  }

  return { pageKey: 'home' };
}

/** Static routes included in sitemap.xml */
export const SITEMAP_PATHS = [
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/my-info',
  '/transactions',
  '/market/analysis',
  '/tax',
  '/guide',
] as const;
