import { AppErrorCode, resolveAppErrorMessage, type AppErrorCode as AppErrorCodeType } from '@sar/shared';

/** 도메인 공통 에러 — HTTP layer에서 code·status 매핑 */
export class DomainError extends Error {
  constructor(
    public readonly code: AppErrorCodeType,
    message?: string,
  ) {
    super(resolveAppErrorMessage(code, message));
    this.name = 'DomainError';
  }
}

function isErrorCode(value: string): value is AppErrorCodeType {
  return (Object.values(AppErrorCode) as string[]).includes(value);
}

/** 인증 실패 (401) */
export class AuthenticationError extends DomainError {
  constructor(codeOrMessage?: AppErrorCodeType | string, message?: string) {
    if (message !== undefined) {
      super(codeOrMessage as AppErrorCodeType, message);
    } else if (codeOrMessage && isErrorCode(codeOrMessage)) {
      super(codeOrMessage);
    } else if (typeof codeOrMessage === 'string') {
      super(AppErrorCode.AUTH_UNAUTHORIZED, codeOrMessage);
    } else {
      super(AppErrorCode.AUTH_UNAUTHORIZED);
    }
    this.name = 'AuthenticationError';
  }
}

/** 입력·비즈니스 규칙 위반 (400) */
export class ValidationError extends DomainError {
  constructor(codeOrMessage?: AppErrorCodeType | string, message?: string) {
    if (message !== undefined) {
      super(codeOrMessage as AppErrorCodeType, message);
    } else if (codeOrMessage && isErrorCode(codeOrMessage)) {
      super(codeOrMessage);
    } else if (typeof codeOrMessage === 'string') {
      super(AppErrorCode.VALIDATION, codeOrMessage);
    } else {
      super(AppErrorCode.VALIDATION);
    }
    this.name = 'ValidationError';
  }
}

/** 리소스 없음 (404) */
export class EntityNotFoundError extends DomainError {
  constructor(codeOrMessage?: AppErrorCodeType | string, message?: string) {
    if (message !== undefined) {
      super(codeOrMessage as AppErrorCodeType, message);
    } else if (codeOrMessage && isErrorCode(codeOrMessage)) {
      super(codeOrMessage);
    } else if (typeof codeOrMessage === 'string') {
      super(AppErrorCode.NOT_FOUND, codeOrMessage);
    } else {
      super(AppErrorCode.NOT_FOUND);
    }
    this.name = 'EntityNotFoundError';
  }
}

/** 중복 리소스 (409) */
export class ConflictError extends DomainError {
  constructor(codeOrMessage?: AppErrorCodeType | string, message?: string) {
    if (message !== undefined) {
      super(codeOrMessage as AppErrorCodeType, message);
    } else if (codeOrMessage && isErrorCode(codeOrMessage)) {
      super(codeOrMessage);
    } else if (typeof codeOrMessage === 'string') {
      super(AppErrorCode.CONFLICT, codeOrMessage);
    } else {
      super(AppErrorCode.CONFLICT);
    }
    this.name = 'ConflictError';
  }
}

/** 포지션 계산 오류 */
export class InvalidPositionError extends DomainError {
  constructor(message: string) {
    super(AppErrorCode.VALIDATION, message);
    this.name = 'InvalidPositionError';
  }
}
