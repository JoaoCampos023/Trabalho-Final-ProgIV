/**
 * Validador de CPF
 * Mesma lógica do projeto original em C#
 */
export class CpfValidator {
  /**
   * Valida um CPF
   * @param cpf - CPF com ou sem formatação (pontos e traços)
   * @returns true se o CPF for válido, false caso contrário
   */
  static validar(cpf: string): boolean {
    if (!cpf) return false;

    // Remove caracteres não numéricos (pontos, traços, espaços)
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Verificar se tem 11 dígitos
    if (cpfLimpo.length !== 11) return false;

    // Elimina CPFs com todos os dígitos iguais (ex: 111.111.111-11)
    if (/^(\d)\1+$/.test(cpfLimpo)) return false;

    // Cálculo do primeiro dígito verificador
    let soma = 0;
    const multiplicador1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];

    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * multiplicador1[i];
    }

    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;

    if (parseInt(cpfLimpo.charAt(9)) !== digito1) return false;

    // Cálculo do segundo dígito verificador
    soma = 0;
    const multiplicador2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * multiplicador2[i];
    }

    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;

    return parseInt(cpfLimpo.charAt(10)) === digito2;
  }

  /**
   * Formata um CPF para exibição
   * @param cpf - CPF sem formatação (apenas números)
   * @returns CPF formatado (XXX.XXX.XXX-XX)
   */
  static formatar(cpf: string): string {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return cpf;

    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Remove formatação do CPF
   * @param cpf - CPF com formatação
   * @returns CPF apenas com números
   */
  static limpar(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  /**
   * Gera um CPF aleatório para testes
   * @returns CPF válido sem formatação
   */
  static gerarParaTeste(): string {
    // Gera os 9 primeiros dígitos aleatórios
    let cpf = '';
    for (let i = 0; i < 9; i++) {
      cpf += Math.floor(Math.random() * 10);
    }

    // Calcula o primeiro dígito verificador
    let soma = 0;
    const multiplicador1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * multiplicador1[i];
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    cpf += digito1;

    // Calcula o segundo dígito verificador
    soma = 0;
    const multiplicador2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * multiplicador2[i];
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;
    cpf += digito2;

    return cpf;
  }
}
