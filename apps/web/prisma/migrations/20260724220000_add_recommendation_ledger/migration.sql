-- CreateTable
CREATE TABLE "RecommendationBatch" (
    "id" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tradingDate" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "profileKey" TEXT NOT NULL DEFAULT 'global',
    "regimes" JSONB NOT NULL,
    "macroSnapshot" JSONB,
    "candidatePool" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "priceAtRun" DOUBLE PRECISION NOT NULL,
    "changePercent1d" DOUBLE PRECISION,
    "evidence" JSONB NOT NULL,

    CONSTRAINT "RecommendationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationOutcome" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "horizon" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "priceAtHorizon" DOUBLE PRECISION NOT NULL,
    "returnPercent" DOUBLE PRECISION NOT NULL,
    "benchmarkReturn" DOUBLE PRECISION,
    "alphaVsBenchmark" DOUBLE PRECISION,

    CONSTRAINT "RecommendationOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecommendationBatch_runAt_idx" ON "RecommendationBatch"("runAt");

-- CreateIndex
CREATE INDEX "RecommendationBatch_tradingDate_idx" ON "RecommendationBatch"("tradingDate");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationBatch_tradingDate_engineVersion_profileKey_key" ON "RecommendationBatch"("tradingDate", "engineVersion", "profileKey");

-- CreateIndex
CREATE INDEX "RecommendationItem_batchId_idx" ON "RecommendationItem"("batchId");

-- CreateIndex
CREATE INDEX "RecommendationItem_symbol_market_idx" ON "RecommendationItem"("symbol", "market");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationOutcome_itemId_horizon_key" ON "RecommendationOutcome"("itemId", "horizon");

-- AddForeignKey
ALTER TABLE "RecommendationItem" ADD CONSTRAINT "RecommendationItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "RecommendationBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationOutcome" ADD CONSTRAINT "RecommendationOutcome_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RecommendationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
