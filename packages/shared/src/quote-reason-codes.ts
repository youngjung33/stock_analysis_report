/** Quote fetch / provider status codes — UI translates via quotes.reason.* */
export type QuoteFailureReasonCode = 'not_configured' | 'fetch_error' | 'no_provider';

export type QuoteSetupHintCode = 'no_provider' | 'finnhub_api_key_required';

export type QuoteUnavailableReasonCode = QuoteFailureReasonCode | QuoteSetupHintCode;
