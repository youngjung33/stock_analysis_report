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
import { logError } from '../observability/logger';

export function jsonApiError(body: ApiErrorBody, status: number) {
  return NextResponse.json(body, { status });
}

/** API route 공통 — 서버 로그 전용 (사용자 응답과 분리) */
export function logApiError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logError('api Prisma error', error, {
      ...context,
      prismaCode: error.code,
      prismaMeta: error.meta,
    });
    return;
  }

  if (error instanceof DomainError) {
    logError('api domain error', error, { ...context, code: error.code });
    return;
  }

  if (error instanceof HttpError) {
    logError('api http error', error, {
      ...context,
      status: error.statusCode,
      code: error.code,
    });
    return;
  }

  logError('api unhandled error', error, context);
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

  return apiErrorBody(AppErrorCode.DB_UNAVAILABLE);
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
    logApiError(error);
    const body = mapPrismaError(error);
    return jsonApiError(body, prismaErrorStatus(error.code));
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    logApiError(error);
    return jsonApiError(apiErrorBody(AppErrorCode.DB_UNAVAILABLE), 503);
  }

  logApiError(error);
  return jsonApiError(apiErrorBody(AppErrorCode.INTERNAL), 500);
}
