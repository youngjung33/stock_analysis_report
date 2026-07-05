import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { AppErrorCode, apiErrorBody, type ApiErrorBody } from '@sar/shared';
import {
  AuthenticationError,
  ConflictError,
  DomainError,
  EntityNotFoundError,
  ValidationError,
} from '../domain/errors/domain.errors';
import { HttpError } from './errors';

export function jsonApiError(body: ApiErrorBody, status: number) {
  return NextResponse.json(body, { status });
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): ApiErrorBody {
  if (error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target)
      ? (error.meta.target as string[])
      : String(error.meta?.target ?? '');
    const joined = Array.isArray(target) ? target.join(',') : target;
    if (joined.includes('email')) {
      return apiErrorBody(AppErrorCode.AUTH_EMAIL_TAKEN);
    }
    if (joined.includes('username')) {
      return apiErrorBody(AppErrorCode.AUTH_USERNAME_TAKEN);
    }
    return apiErrorBody(AppErrorCode.CONFLICT);
  }

  if (error.code === 'P2021' || error.code === 'P2022') {
    return apiErrorBody(
      AppErrorCode.DB_UNAVAILABLE,
      '데이터베이스 테이블이 준비되지 않았습니다. npm run db:push 후 다시 시도해 주세요.',
    );
  }

  return apiErrorBody(
    AppErrorCode.DB_UNAVAILABLE,
    '데이터베이스 요청 중 오류가 발생했습니다.',
  );
}

function prismaErrorStatus(code: string): number {
  if (code === 'P2002') return 409;
  return 503;
}

/** DomainError · Prisma · HttpError → { code, message } JSON */
export function handleRouteError(error: unknown) {
  if (error instanceof AuthenticationError) {
    return jsonApiError({ code: error.code, message: error.message }, 401);
  }
  if (error instanceof ValidationError) {
    return jsonApiError({ code: error.code, message: error.message }, 400);
  }
  if (error instanceof EntityNotFoundError) {
    return jsonApiError({ code: error.code, message: error.message }, 404);
  }
  if (error instanceof ConflictError) {
    return jsonApiError({ code: error.code, message: error.message }, 409);
  }
  if (error instanceof DomainError) {
    return jsonApiError({ code: error.code, message: error.message }, 400);
  }
  if (error instanceof HttpError) {
    const code = error.code ?? AppErrorCode.RATE_LIMIT;
    return jsonApiError({ code, message: error.message }, error.statusCode);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const body = mapPrismaError(error);
    return jsonApiError(body, prismaErrorStatus(error.code));
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return jsonApiError(apiErrorBody(AppErrorCode.DB_UNAVAILABLE), 503);
  }

  console.error(error);
  return jsonApiError(apiErrorBody(AppErrorCode.INTERNAL), 500);
}
