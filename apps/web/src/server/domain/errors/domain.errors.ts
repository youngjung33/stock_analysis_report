/** 도메인 공통 에러 — HTTP layer에서 status code로 매핑 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** 인증 실패 (401) */
export class AuthenticationError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, 'AUTHENTICATION');
    this.name = 'AuthenticationError';
  }
}

/** 입력·비즈니스 규칙 위반 (400) */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION');
    this.name = 'ValidationError';
  }
}

/** 리소스 없음 (404) */
export class EntityNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
    this.name = 'EntityNotFoundError';
  }
}

/** 포지션 계산 오류 */
export class InvalidPositionError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_POSITION');
    this.name = 'InvalidPositionError';
  }
}
