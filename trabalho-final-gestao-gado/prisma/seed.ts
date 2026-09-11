/**
 * Entrypoint do `npx prisma db seed` (configurado em package.json → "prisma.seed").
 * A lógica de fato mora em src/database/seed.ts, reaproveitada também pelo
 * auto-seed do servidor (src/config/autoSeed.ts).
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/database/seed';

dotenv.config();
// Datas geradas pelo seed (nascimento, coletas) devem usar o horário de
// Brasília, não o fuso do sistema operacional onde o script rodar.
process.env.TZ = process.env.TZ || 'America/Sao_Paulo';

const prisma = new PrismaClient();

seedDatabase(prisma)
  .catch(e => {
    console.error('❌ Erro ao rodar o seed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
