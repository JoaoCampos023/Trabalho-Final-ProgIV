/**
 * Validador de CPF.
 *
 * A validação segue o algoritmo oficial dos dígitos verificadores: os 9
 * primeiros dígitos são o "corpo" do CPF; os 2 últimos são calculados a
 * partir deles. Se os dígitos informados baterem com os calculados, o CPF
 * é válido.
 *
 * Também rejeita CPFs com todos os dígitos iguais (111.111.111-11 etc.),
 * que passariam no cálculo dos verificadores mas são inválidos na prática.
 */
export class CpfValidator {
  static validar(cpf: string): boolean {
    if (!cpf) return false;

    // Remove pontos, traços e espaços — o cálculo só usa os dígitos.
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) return false;

    // CPFs como 111.111.111-11 ou 000.000.000-00 passariam no cálculo dos
    // verificadores, mas são inválidos por convenção da Receita.
    if (/^(\d)\1+$/.test(cpfLimpo)) return false;

    // Primeiro dígito: soma dos 9 primeiros dígitos multiplicados por pesos
    // decrescentes de 10 a 2, módulo 11.
    let soma = 0;
    const multiplicador1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * multiplicador1[i];
    }
    let resto = soma % 11;
    // Se o resto é < 2, o dígito é 0; senão é 11 - resto.
    const digito1 = resto < 2 ? 0 : 11 - resto;

    if (parseInt(cpfLimpo.charAt(9)) !== digito1) return false;

    // Segundo dígito: mesma lógica, mas com 10 dígitos e pesos de 11 a 2.
    soma = 0;
    const multiplicador2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * multiplicador2[i];
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;

    return parseInt(cpfLimpo.charAt(10)) === digito2;
  }

  /** Formata para exibição: 11144477735 → 111.444.777-35. */
  static formatar(cpf: string): string {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return cpf;

    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /** Remove qualquer caractere não numérico. */
  static limpar(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  /**
   * Gera um CPF válido aleatório. Usado pelo seed para popular o banco com
   * usuários de exemplo que passam na validação real.
   */
  static gerarParaTeste(): string {
    let cpf = '';
    for (let i = 0; i < 9; i++) {
      cpf += Math.floor(Math.random() * 10);
    }

    // Mesmo cálculo do validar(), mas gerando os dígitos em vez de conferir.
    let soma = 0;
    const multiplicador1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * multiplicador1[i];
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    cpf += digito1;

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