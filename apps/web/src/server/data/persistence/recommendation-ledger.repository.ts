import { Prisma, PrismaClient } from '@prisma/client';
import { Market, type RecommendationOutcomeHorizon } from '@sar/shared';
import {
  CreateRecommendationBatchInput,
  RecommendationBatchEntity,
  RecommendationItemEntity,
  UpsertRecommendationOutcomeInput,
} from '../../domain/entities/recommendation-ledger.entities';
import { prisma as defaultPrisma } from './prisma.service';

function mapOutcome(o: {
  id: string;
  itemId: string;
  horizon: string;
  evaluatedAt: Date;
  priceAtHorizon: number;
  returnPercent: number;
  benchmarkReturn: number | null;
  alphaVsBenchmark: number | null;
}) {
  return {
    ...o,
    horizon: o.horizon as RecommendationOutcomeHorizon,
  };
}

function mapItem(item: {
  id: string;
  batchId: string;
  rank: number;
  symbol: string;
  market: string;
  tag: string;
  score: number;
  priceAtRun: number;
  changePercent1d: number | null;
  evidence: unknown;
  outcomes?: ReturnType<typeof mapOutcome>[];
}): RecommendationItemEntity {
  return {
    ...item,
    market: item.market as Market,
    evidence: item.evidence,
    outcomes: item.outcomes,
  };
}

function mapBatch(batch: {
  id: string;
  runAt: Date;
  tradingDate: string;
  engineVersion: string;
  profileKey: string;
  regimes: unknown;
  macroSnapshot: unknown | null;
  candidatePool: unknown | null;
  createdAt: Date;
  items?: ReturnType<typeof mapItem>[];
}): RecommendationBatchEntity {
  return {
    ...batch,
    regimes: batch.regimes,
    macroSnapshot: batch.macroSnapshot,
    candidatePool: batch.candidatePool,
    items: batch.items,
  };
}

export interface IRecommendationLedgerRepository {
  findByKey(
    tradingDate: string,
    engineVersion: string,
    profileKey: string,
  ): Promise<RecommendationBatchEntity | null>;
  createBatch(input: CreateRecommendationBatchInput): Promise<RecommendationBatchEntity>;
  listBatches(input: { profileKey?: string; limit?: number }): Promise<RecommendationBatchEntity[]>;
  findById(id: string): Promise<RecommendationBatchEntity | null>;
  listItemsForOutcomeEvaluation(limit?: number): Promise<
    (RecommendationItemEntity & {
      runAt: Date;
      macroSnapshot: unknown | null;
    })[]
  >;
  upsertOutcome(input: UpsertRecommendationOutcomeInput): Promise<void>;
}

export class PrismaRecommendationLedgerRepository implements IRecommendationLedgerRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async findByKey(tradingDate: string, engineVersion: string, profileKey: string) {
    const row = await this.prisma.recommendationBatch.findUnique({
      where: {
        tradingDate_engineVersion_profileKey: {
          tradingDate,
          engineVersion,
          profileKey,
        },
      },
      include: { items: { include: { outcomes: true }, orderBy: { rank: 'asc' } } },
    });
    if (!row) return null;
    return mapBatch({
      ...row,
      regimes: row.regimes,
      macroSnapshot: row.macroSnapshot,
      candidatePool: row.candidatePool,
      items: row.items.map((item) =>
        mapItem({
          ...item,
          evidence: item.evidence,
          outcomes: item.outcomes.map(mapOutcome),
        }),
      ),
    });
  }

  async createBatch(input: CreateRecommendationBatchInput) {
    const row = await this.prisma.recommendationBatch.create({
      data: {
        runAt: input.runAt,
        tradingDate: input.tradingDate,
        engineVersion: input.engineVersion,
        profileKey: input.profileKey,
        regimes: input.regimes as Prisma.InputJsonValue,
        macroSnapshot: input.macroSnapshot as Prisma.InputJsonValue | undefined,
        candidatePool: input.candidatePool as Prisma.InputJsonValue | undefined,
        items: {
          create: input.items.map((item) => ({
            rank: item.rank,
            symbol: item.symbol,
            market: item.market,
            tag: item.tag,
            score: item.score,
            priceAtRun: item.priceAtRun,
            changePercent1d: item.changePercent1d,
            evidence: item.evidence as Prisma.InputJsonValue,
          })),
        },
      },
      include: { items: { orderBy: { rank: 'asc' } } },
    });

    return mapBatch({
      ...row,
      regimes: row.regimes,
      macroSnapshot: row.macroSnapshot,
      candidatePool: row.candidatePool,
      items: row.items.map((item) => mapItem({ ...item, evidence: item.evidence })),
    });
  }

  async listBatches(input: { profileKey?: string; limit?: number }) {
    const rows = await this.prisma.recommendationBatch.findMany({
      where: input.profileKey ? { profileKey: input.profileKey } : undefined,
      orderBy: { runAt: 'desc' },
      take: input.limit ?? 30,
      include: {
        items: {
          orderBy: { rank: 'asc' },
          include: { outcomes: true },
        },
      },
    });

    return rows.map((row) =>
      mapBatch({
        ...row,
        regimes: row.regimes,
        macroSnapshot: row.macroSnapshot,
        candidatePool: row.candidatePool,
        items: row.items.map((item) =>
          mapItem({
            ...item,
            evidence: item.evidence,
            outcomes: item.outcomes.map(mapOutcome),
          }),
        ),
      }),
    );
  }

  async findById(id: string) {
    const row = await this.prisma.recommendationBatch.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { rank: 'asc' },
          include: { outcomes: true },
        },
      },
    });
    if (!row) return null;
    return mapBatch({
      ...row,
      regimes: row.regimes,
      macroSnapshot: row.macroSnapshot,
      candidatePool: row.candidatePool,
      items: row.items.map((item) =>
        mapItem({
          ...item,
          evidence: item.evidence,
          outcomes: item.outcomes.map(mapOutcome),
        }),
      ),
    });
  }

  async listItemsForOutcomeEvaluation(limit = 500) {
    const rows = await this.prisma.recommendationItem.findMany({
      take: limit,
      orderBy: { batch: { runAt: 'desc' } },
      include: {
        outcomes: true,
        batch: { select: { runAt: true, macroSnapshot: true } },
      },
    });

    return rows.map((row) => ({
      ...mapItem({
        ...row,
        evidence: row.evidence,
        outcomes: row.outcomes.map(mapOutcome),
      }),
      runAt: row.batch.runAt,
      macroSnapshot: row.batch.macroSnapshot,
    }));
  }

  async upsertOutcome(input: UpsertRecommendationOutcomeInput) {
    await this.prisma.recommendationOutcome.upsert({
      where: {
        itemId_horizon: {
          itemId: input.itemId,
          horizon: input.horizon,
        },
      },
      create: {
        itemId: input.itemId,
        horizon: input.horizon,
        evaluatedAt: input.evaluatedAt,
        priceAtHorizon: input.priceAtHorizon,
        returnPercent: input.returnPercent,
        benchmarkReturn: input.benchmarkReturn,
        alphaVsBenchmark: input.alphaVsBenchmark,
      },
      update: {
        evaluatedAt: input.evaluatedAt,
        priceAtHorizon: input.priceAtHorizon,
        returnPercent: input.returnPercent,
        benchmarkReturn: input.benchmarkReturn,
        alphaVsBenchmark: input.alphaVsBenchmark,
      },
    });
  }
}
