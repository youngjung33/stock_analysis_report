import fs from 'node:fs';
import path from 'node:path';

/** Playwright E2E placeholder — member tests need a real DATABASE_URL */
export const E2E_PLACEHOLDER_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const MEMBER_E2E_READY_FILE = path.join(__dirname, '.member-e2e-ready');

export function isE2EDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url && url !== E2E_PLACEHOLDER_DATABASE_URL);
}

export function resolveMemberE2ECredentials(): { username: string; password: string } {
  const username =
    process.env.E2E_USERNAME?.trim() || process.env.SEED_USERNAME?.trim() || 'admin';
  const password =
    process.env.E2E_PASSWORD?.trim() || process.env.SEED_PASSWORD?.trim() || 'admin1234';
  return { username, password };
}

export function setMemberE2EDbReady(ready: boolean): void {
  fs.writeFileSync(MEMBER_E2E_READY_FILE, ready ? '1' : '0', 'utf8');
}

function isMemberE2EDbReady(): boolean {
  try {
    return fs.readFileSync(MEMBER_E2E_READY_FILE, 'utf8').trim() === '1';
  } catch {
    return false;
  }
}

/** Member E2E runs when DATABASE_URL is real, DB seed succeeded, and credentials exist. */
export function hasMemberE2E(): boolean {
  if (!isE2EDatabaseConfigured() || !isMemberE2EDbReady()) return false;
  const { username, password } = resolveMemberE2ECredentials();
  return Boolean(username && password);
}

export const MEMBER_E2E_SKIP_REASON =
  'Member E2E requires DATABASE_URL (not the Playwright placeholder), successful db:seed, and SEED_USERNAME/SEED_PASSWORD or E2E_USERNAME/E2E_PASSWORD';
