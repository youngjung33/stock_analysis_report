-- Phase M: DART corp_code on StockCatalog (KR disclosure lookup)
ALTER TABLE "StockCatalog" ADD COLUMN IF NOT EXISTS "dartCorpCode" TEXT;

CREATE INDEX IF NOT EXISTS "StockCatalog_market_dartCorpCode_idx"
  ON "StockCatalog"("market", "dartCorpCode")
  WHERE "dartCorpCode" IS NOT NULL;
