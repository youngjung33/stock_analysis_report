import { DEFAULT_LOCALE, normalizeLocale, type SupportedLocale } from '@sar/shared';
import en from './locales/en.json';
import ko from './locales/ko.json';

type LocaleBundle = typeof en;

const BUNDLES: Record<SupportedLocale, LocaleBundle> = { en, ko };

export function buildPasswordResetEmail(
  locale: SupportedLocale,
  link: string,
): { subject: string; text: string } {
  const bundle = BUNDLES[normalizeLocale(locale)] ?? BUNDLES[DEFAULT_LOCALE];
  const subject = bundle.email.passwordReset.subject;
  const text = bundle.email.passwordReset.body.replace('{{link}}', link);
  return { subject, text };
}

export function buildEmailVerificationEmail(
  locale: SupportedLocale,
  code: string,
  link: string,
): { subject: string; text: string } {
  const bundle = BUNDLES[normalizeLocale(locale)] ?? BUNDLES[DEFAULT_LOCALE];
  const subject = bundle.email.emailVerification.subject;
  const text = bundle.email.emailVerification.body
    .replace('{{code}}', code)
    .replace('{{link}}', link);
  return { subject, text };
}
