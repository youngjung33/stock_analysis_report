-- StockCatalog 시가총액 (대표 baseline·시총 순 조회)
ALTER TABLE "StockCatalog" ADD COLUMN IF NOT EXISTS "marketCap" BIGINT;

CREATE INDEX IF NOT EXISTS "StockCatalog_market_marketCap_idx"
  ON "StockCatalog" ("market", "marketCap" DESC NULLS LAST)
  WHERE "isActive" = true;
