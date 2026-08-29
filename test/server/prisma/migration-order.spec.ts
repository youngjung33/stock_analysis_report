import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../apps/web/prisma/migrations');

function migrationFolders(): string[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function readMigration(name: string): string {
  return readFileSync(path.join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf8');
}

describe('Prisma migration order', () => {
  it('creates PortfolioPreference before investorProfile alter', () => {
    const folders = migrationFolders();
    const baselineIdx = folders.indexOf('20260611145000_add_auth_cash_portfolio_oauth');
    const investorIdx = folders.indexOf('20260724120000_add_investor_profile');

    expect(baselineIdx).toBeGreaterThanOrEqual(0);
    expect(investorIdx).toBeGreaterThan(baselineIdx);

    const baselineSql = readMigration('20260611145000_add_auth_cash_portfolio_oauth');
    expect(baselineSql).toMatch(/CREATE TABLE IF NOT EXISTS "PortfolioPreference"/);

    const investorSql = readMigration('20260724120000_add_investor_profile');
    expect(investorSql).toMatch(/ALTER TABLE "PortfolioPreference"/);
  });

  it('includes auth and cash ledger tables in baseline migration', () => {
    const sql = readMigration('20260611145000_add_auth_cash_portfolio_oauth');
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "AuthToken"/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "CashLedgerEntry"/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "UserOAuthAccount"/);
  });
});
