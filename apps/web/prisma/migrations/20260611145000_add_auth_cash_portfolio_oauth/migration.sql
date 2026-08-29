-- Auth, cash ledger, portfolio preference, OAuth (idempotent for DBs that already have tables)

-- User: email / SSO-ready password
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserOAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OAuthState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CashLedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "memo" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PortfolioPreference" (
    "userId" TEXT NOT NULL,
    "targetKrPercent" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "targetUsPercent" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "maxSingleWeightPercent" DOUBLE PRECISION NOT NULL DEFAULT 40,

    CONSTRAINT "PortfolioPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "AuthToken_userId_type_idx" ON "AuthToken"("userId", "type");
CREATE INDEX IF NOT EXISTS "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS "UserOAuthAccount_provider_providerUserId_key" ON "UserOAuthAccount"("provider", "providerUserId");
CREATE INDEX IF NOT EXISTS "UserOAuthAccount_userId_idx" ON "UserOAuthAccount"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "OAuthState_state_key" ON "OAuthState"("state");
CREATE INDEX IF NOT EXISTS "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");

CREATE INDEX IF NOT EXISTS "CashLedgerEntry_userId_idx" ON "CashLedgerEntry"("userId");
CREATE INDEX IF NOT EXISTS "CashLedgerEntry_userId_occurredAt_idx" ON "CashLedgerEntry"("userId", "occurredAt");

-- AddForeignKey (skip if already present)
DO $$ BEGIN
    ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "UserOAuthAccount" ADD CONSTRAINT "UserOAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CashLedgerEntry" ADD CONSTRAINT "CashLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PortfolioPreference" ADD CONSTRAINT "PortfolioPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
