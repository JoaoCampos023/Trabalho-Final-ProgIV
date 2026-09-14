/**
 * Validação de e-mail.
 *
 * A regex é propositalmente simples (não tenta cobrir 100% da RFC 5322,
 * que é notoriamente complexa e cheia de casos exóticos). Para o escopo do
 * projeto, o que importa é rejeitar erros comuns de digitação e aceitar
 * endereços normais — a validação definitiva é o servidor de e-mail de
 * destino.
 */
export class EmailValidator {
  static validar(email: string): boolean {
    if (!email) return false;

    // Regex simples: 1+ caracteres antes do @, 1+ depois, ponto, TLD com
    // 2+ letras. Rejeita "userexample.com" (sem @) e "user@" (sem domínio).
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  static validarComDominio(email: string, dominiosPermitidos?: string[]): boolean {
    if (!this.validar(email)) return false;

    if (dominiosPermitidos && dominiosPermitidos.length > 0) {
      const dominio = email.split('@')[1];
      return dominiosPermitidos.includes(dominio);
    }

    return true;
  }

  static extrairDominio(email: string): string | null {
    if (!this.validar(email)) return null;
    return email.split('@')[1];
  }

  static extrairUsuario(email: string): string | null {
    if (!this.validar(email)) return null;
    return email.split('@')[0];
  }

  /** Lista de domínios "populares" — usado para UX (ex.: sugerir cadastro). */
  static isDominioComum(email: string): boolean {
    const dominio = this.extrairDominio(email);
    if (!dominio) return false;

    const dominiosComuns = [
      'gmail.com',
      'outlook.com',
      'hotmail.com',
      'yahoo.com',
      'icloud.com',
      'protonmail.com',
      'uol.com.br',
      'bol.com.br',
      'terra.com.br'
    ];

    return dominiosComuns.includes(dominio.toLowerCase());
  }

  /**
   * Mascara parte do e-mail para exibição em logs/notificações.
   * Ex.: joao@email.com → j**o@email.com
   */
  static mascarar(email: string): string {
    if (!this.validar(email)) return email;

    const [usuario, dominio] = email.split('@');
    // Se o usuário tem 1 ou 2 caracteres, não dá para mascarar nada sem
    // apagar tudo — devolve como está.
    const usuarioMascarado =
      usuario.length <= 2 ? usuario : usuario[0] + '*'.repeat(usuario.length - 2) + usuario[usuario.length - 1];

    return `${usuarioMascarado}@${dominio}`;
  }
}