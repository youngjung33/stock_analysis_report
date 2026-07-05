import { AppErrorCode, type AppErrorCode as AppErrorCodeType } from '@sar/shared';

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: AppErrorCodeType = AppErrorCode.INTERNAL,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message?: string) {
    super(message ?? 'Unauthorized', 401, AppErrorCode.AUTH_UNAUTHORIZED);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, code: AppErrorCodeType = AppErrorCode.VALIDATION) {
    super(message, 400, code);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(message, 404, AppErrorCode.NOT_FOUND);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(message, 403, AppErrorCode.AUTH_UNAUTHORIZED);
  }
}
