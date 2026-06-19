import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_USERNAME ?? 'admin';
  const password = process.env.SEED_PASSWORD ?? 'admin1234';

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Seed user "${username}" already exists`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, passwordHash },
  });

  console.log(`Seed user "${username}" created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
