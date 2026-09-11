/**
 * Utilitário para validação de emails
 */
export class EmailValidator {
  /**
   * Valida um endereço de email
   * @param email - Email a ser validado
   * @returns true se o email for válido, false caso contrário
   */
  static validar(email: string): boolean {
    if (!email) return false;

    // Regex mais completo para validação de email
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  /**
   * Valida email com verificação adicional de domínio
   */
  static validarComDominio(email: string, dominiosPermitidos?: string[]): boolean {
    if (!this.validar(email)) return false;

    if (dominiosPermitidos && dominiosPermitidos.length > 0) {
      const dominio = email.split('@')[1];
      return dominiosPermitidos.includes(dominio);
    }

    return true;
  }

  /**
   * Extrai o domínio do email
   */
  static extrairDominio(email: string): string | null {
    if (!this.validar(email)) return null;
    return email.split('@')[1];
  }

  /**
   * Extrai o nome de usuário do email (parte antes do @)
   */
  static extrairUsuario(email: string): string | null {
    if (!this.validar(email)) return null;
    return email.split('@')[0];
  }

  /**
   * Verifica se o email é de um domínio comum (gmail, outlook, etc)
   */
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
   * Mascara parte do email para privacidade
   * Ex: j*****o@email.com
   */
  static mascarar(email: string): string {
    if (!this.validar(email)) return email;

    const [usuario, dominio] = email.split('@');
    const usuarioMascarado =
      usuario.length <= 2 ? usuario : usuario[0] + '*'.repeat(usuario.length - 2) + usuario[usuario.length - 1];

    return `${usuarioMascarado}@${dominio}`;
  }
}
