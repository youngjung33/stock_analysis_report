import { NextRequest } from 'next/server';
import { AppErrorCode, isGuestUsername } from '@sar/shared';
import { ValidationError } from '../domain/errors/domain.errors';
import { isAiGuestAllowed } from '../data/ai/ai-config';
import { requireAuth, type AuthUser } from './route-utils';

/** Member-only AI auth — set AI_ALLOW_GUEST=true to allow guest session (testing) */
export function requireAiMemberAuth(req: NextRequest): AuthUser {
  const user = requireAuth(req);
  if (!isAiGuestAllowed() && isGuestUsername(user.username)) {
    throw new ValidationError(AppErrorCode.AI_MEMBERS_ONLY);
  }
  return user;
}
