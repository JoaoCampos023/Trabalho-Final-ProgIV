import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    // Testar conexão
    const users = await prisma.user.findMany();
    console.log('✅ Conectado ao PostgreSQL via Prisma!');
    console.log(`📊 Usuários encontrados: ${users.length}`);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();