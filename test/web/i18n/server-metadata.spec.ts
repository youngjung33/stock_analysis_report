import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  AppErrorCode,
  APP_ERROR_MESSAGES,
} from '@sar/shared';
import {
  buildPageMetadata,
  getOgImageCopy,
  getPageSeoCopy,
  getSiteUrl,
} from '@/i18n/server-metadata';

describe('server-metadata', () => {
  const originalAppUrl = process.env.APP_URL;

  beforeEach(() => {
    process.env.APP_URL = 'https://example.com';
  });

  afterEach(() => {
    process.env.APP_URL = originalAppUrl;
  });

  it('uses seo.pages.home copy for home title', () => {
    const en = getPageSeoCopy('en', 'home');
    expect(en.title).toBe('Portfolio');
    expect(en.description).toContain('holdings');

    const ko = getPageSeoCopy('ko', 'home');
    expect(ko.title).toBe('투자 현황');
  });

  it('builds page-specific canonical and openGraph url', () => {
    const meta = buildPageMetadata('en', 'login');
    expect(meta.alternates?.canonical).toBe('https://example.com/login');
    expect(meta.openGraph?.url).toBe('https://example.com/login');
  });

  it('marks settings as noindex', () => {
    const meta = buildPageMetadata('en', 'settings');
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it('interpolates stock symbol in metadata path', () => {
    const meta = buildPageMetadata('en', 'stock', { symbol: 'AAPL' });
    expect(meta.alternates?.canonical).toBe('https://example.com/stocks/AAPL');
  });

  it('returns locale-specific OG image copy', () => {
    const en = getOgImageCopy('en');
    const ko = getOgImageCopy('ko');

    expect(en.features).toContain('Portfolio');
    expect(ko.features).toContain('포트폴리오');
    expect(en.tagline).not.toBe(ko.tagline);
  });

  it('getSiteUrl prefers APP_URL', () => {
    expect(getSiteUrl()).toBe('https://example.com');
  });
});

describe('AppErrorCode locale parity smoke', () => {
  it('includes new validation codes in APP_ERROR_MESSAGES', () => {
    expect(APP_ERROR_MESSAGES[AppErrorCode.MARKET_INVALID]).toBeTruthy();
    expect(APP_ERROR_MESSAGES[AppErrorCode.HOLDING_PARAMS_REQUIRED]).toBeTruthy();
  });
});
