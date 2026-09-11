/**
 * Converte um erro capturado em uma mensagem segura para mostrar ao usuário.
 *
 * Erros "de negócio" (lançados propositalmente pelos services, ex.:
 * "CPF inválido", "Animal não encontrado") são mensagens curtas em
 * português e podem ir direto pro usuário. Já erros técnicos "crus"
 * (stack trace do Prisma, string de conexão, `DATABASE_URL` ausente,
 * violação de constraint do Postgres, etc.) não devem vazar pro
 * frontend — em vez disso, logamos o erro completo no servidor e
 * devolvemos uma mensagem genérica.
 */
export function friendlyMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (isTechnicalError(error)) {
    console.error('❌ Erro técnico (mensagem genérica enviada ao cliente):', error);
    return fallback;
  }

  return error.message;
}

function isTechnicalError(error: Error): boolean {
  const msg = error.message;

  // Erros de inicialização/validação do Prisma (schema, env vars, etc.)
  if (error.name.startsWith('Prisma') || msg.includes('prisma.') || msg.includes('schema.prisma')) {
    return true;
  }

  // Mensagens de conexão/config que não fazem sentido pro usuário final.
  if (
    msg.includes('DATABASE_URL') ||
    msg.includes('Environment variable') ||
    msg.includes('ConnectorError') ||
    msg.includes('PostgresError') ||
    msg.includes('Invalid `prisma')
  ) {
    return true;
  }

  // Mensagens em outro idioma/formato técnico que vazam do driver do banco
  // (ex.: "estouro de campo numeric", em português mas ainda assim cru).
  if (msg.includes('estouro de campo') || msg.includes('syntax error at or near')) {
    return true;
  }

  return false;
}
