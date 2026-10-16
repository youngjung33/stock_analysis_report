import { AppErrorCode, resolveAppErrorMessage } from '@sar/shared';
import { HttpError } from './errors';
import { readOutboundFetchTimeoutMs } from './request-timeouts';

export type OutboundFetchInit = RequestInit & { timeoutMs?: number };

function isAbortLike(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'TimeoutError')
  );
}

function timeoutHttpError(): HttpError {
  return new HttpError(
    resolveAppErrorMessage(AppErrorCode.REQUEST_TIMEOUT),
    504,
    AppErrorCode.REQUEST_TIMEOUT,
  );
}

/** Server outbound HTTP — unified timeout via `AbortSignal.timeout` */
export async function outboundFetch(
  input: RequestInfo | URL,
  init?: OutboundFetchInit,
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? readOutboundFetchTimeoutMs();
  const { timeoutMs: _timeoutMs, ...rest } = init ?? {};
  void _timeoutMs;

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal =
    rest.signal != null ? AbortSignal.any([rest.signal, timeoutSignal]) : timeoutSignal;

  try {
    return await fetch(input, { ...rest, signal });
  } catch (error) {
    if (isAbortLike(error)) {
      throw timeoutHttpError();
    }
    throw error;
  }
}
