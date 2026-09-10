/**
 * Roda o seed automaticamente quando o banco está vazio (nenhum usuário
 * e nenhum animal cadastrado) — pensado para "primeira execução" em
 * desenvolvimento/demo, sem precisar lembrar de rodar `npx prisma db seed`.
 *
 * Para desativar, defina no .env:
 *   AUTO_SEED=false
 *
 * (qualquer outro valor, ou a variável ausente, mantém o auto-seed ativo)
 */
import prisma from './database';
import { seedDatabase } from '../database/seed';

export async function runAutoSeedIfNeeded(): Promise<void> {
  const autoSeedAtivo = (process.env.AUTO_SEED ?? 'true').toLowerCase() !== 'false';

  if (!autoSeedAtivo) {
    console.log('🌱 Auto-seed desativado (AUTO_SEED=false no .env).');
    return;
  }

  try {
    const [totalUsuarios, totalAnimais] = await Promise.all([prisma.user.count(), prisma.animal.count()]);

    if (totalUsuarios > 0 || totalAnimais > 0) {
      // Banco já tem dados (de um seed anterior ou uso real) — não mexe em nada.
      return;
    }

    console.log('🌱 Banco de dados vazio detectado — executando seed automático...');
    await seedDatabase(prisma);
    console.log('✅ Seed automático concluído.');
  } catch (error) {
    // Uma falha aqui (ex.: banco fora do ar, migration pendente) não deve
    // derrubar o servidor — só avisa e segue o boot normalmente.
    console.error('⚠️  Não foi possível checar/rodar o seed automático:', error);
  }
}
