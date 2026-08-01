import { AppErrorCode, createDefaultStoredProfile, type StoredInvestorProfile } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

function parseInvestorProfile(value: unknown): StoredInvestorProfile | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'object' || value === null || !('ledger' in value)) {
    throw new ValidationError(AppErrorCode.VALIDATION);
  }
  const raw = value as StoredInvestorProfile;
  return {
    ledger: raw.ledger,
    adjustmentPercent: raw.adjustmentPercent ?? 100,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { getPortfolioPreferencesUseCase } = getServerServices();
    const prefs = await getPortfolioPreferencesUseCase.execute(user.userId);
    return jsonData(prefs);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = (await req.json()) as {
      targetKrPercent?: number;
      targetUsPercent?: number;
      maxSingleWeightPercent?: number;
      investorProfile?: unknown;
    };

    const { getPortfolioPreferencesUseCase, updatePortfolioPreferencesUseCase } = getServerServices();
    const existing = await getPortfolioPreferencesUseCase.execute(user.userId);
    const parsedProfile = parseInvestorProfile(body.investorProfile);

    const targetKrPercent = body.targetKrPercent ?? existing.targetKrPercent;
    const targetUsPercent = body.targetUsPercent ?? existing.targetUsPercent;
    const maxSingleWeightPercent = body.maxSingleWeightPercent ?? existing.maxSingleWeightPercent;

    if (
      targetKrPercent === undefined ||
      targetUsPercent === undefined ||
      maxSingleWeightPercent === undefined
    ) {
      throw new ValidationError(AppErrorCode.VALIDATION);
    }

    const mergedProfile =
      parsedProfile === undefined
        ? existing.investorProfile ?? null
        : parsedProfile ?? createDefaultStoredProfile();

    const prefs = await updatePortfolioPreferencesUseCase.execute({
      userId: user.userId,
      targetKrPercent,
      targetUsPercent,
      maxSingleWeightPercent,
      investorProfile: mergedProfile,
    });

    return jsonData(prefs);
  } catch (error) {
    return handleRouteError(error);
  }
}
