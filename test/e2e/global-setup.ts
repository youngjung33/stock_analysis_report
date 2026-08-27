import { execSync } from 'node:child_process';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { hasMemberE2E, isE2EDatabaseConfigured, setMemberE2EDbReady } from './member-e2e-env';
import { seedE2ECatalogFixture } from './seed-catalog-fixture';

const webRoot = path.resolve(__dirname, '../../apps/web');

export default async function globalSetup(): Promise<void> {
  loadEnv({ path: path.join(webRoot, '.env') });

  if (!isE2EDatabaseConfigured()) {
    setMemberE2EDbReady(false);
    console.log('[e2e] skipping member DB setup — DATABASE_URL not configured for member E2E');
    return;
  }

  try {
    console.log('[e2e] applying migrations and seeding member test user…');
    execSync('npx prisma migrate deploy', { cwd: webRoot, stdio: 'inherit', env: process.env });
    execSync('npx tsx prisma/seed.ts', { cwd: webRoot, stdio: 'inherit', env: process.env });
    await seedE2ECatalogFixture(webRoot);
    setMemberE2EDbReady(true);
    if (!hasMemberE2E()) {
      setMemberE2EDbReady(false);
    }
  } catch (error) {
    setMemberE2EDbReady(false);
    console.warn('[e2e] member DB setup failed — member tests will skip:', error);
  }
}
