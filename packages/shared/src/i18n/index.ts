/** Supported UI locales — extend this list when adding languages */
export const SUPPORTED_LOCALES = ['en', 'ko'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'ko';

export const LOCALE_STORAGE_KEY = 'sar_locale';

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  ko: '한국어',
};

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): SupportedLocale {
  if (value && isSupportedLocale(value)) return value;
  return DEFAULT_LOCALE;
}
