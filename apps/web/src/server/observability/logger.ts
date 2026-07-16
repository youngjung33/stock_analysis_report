type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

function write(payload: LogPayload) {
  const line = JSON.stringify(payload);
  if (payload.level === 'error') {
    console.error(line);
  } else if (payload.level === 'warn') {
    console.warn(line);
  } else {
    console.info(line);
  }

  captureSentry(payload);
}

function captureSentry(payload: LogPayload) {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || payload.level !== 'error') return;

  const message = payload.msg;
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key !== 'level' && key !== 'msg' && key !== 'ts') {
      extra[key] = value;
    }
  }

  void import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.captureMessage(message, { level: 'error', extra });
    })
    .catch(() => {
      // Sentry 미설치·비활성
    });
}

export function logInfo(msg: string, meta?: Record<string, unknown>) {
  write({ level: 'info', msg, ts: new Date().toISOString(), ...meta });
}

export function logWarn(msg: string, meta?: Record<string, unknown>) {
  write({ level: 'warn', msg, ts: new Date().toISOString(), ...meta });
}

export function logError(msg: string, error?: unknown, meta?: Record<string, unknown>) {
  const errMeta =
    error instanceof Error
      ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
      : error !== undefined
        ? { error }
        : {};

  write({
    level: 'error',
    msg,
    ts: new Date().toISOString(),
    ...errMeta,
    ...meta,
  });
}
