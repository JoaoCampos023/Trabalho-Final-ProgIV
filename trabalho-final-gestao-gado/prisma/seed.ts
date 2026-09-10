/**
 * Entrypoint do `npx prisma db seed` (configurado em package.json → "prisma.seed").
 * A lógica de fato mora em src/database/seed.ts, reaproveitada também pelo
 * auto-seed do servidor (src/config/autoSeed.ts).
 */
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/database/seed';

const prisma = new PrismaClient();

seedDatabase(prisma)
  .catch(e => {
    console.error('❌ Erro ao rodar o seed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
