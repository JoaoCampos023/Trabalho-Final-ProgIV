/**
 * Utilitários para manipulação de datas
 */
export class DateUtils {
  /**
   * Formata uma data para o formato brasileiro (dd/mm/yyyy)
   */
  static formatarDataBr(data: Date): string {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  /**
   * Formata uma data para o formato ISO (yyyy-mm-dd)
   */
  static formatarDataIso(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  /**
   * Calcula a idade com base na data de nascimento
   */
  static calcularIdade(dataNascimento: Date): number {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mes = hoje.getMonth() - dataNascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  /**
   * Verifica se uma data é válida
   */
  static isDataValida(data: Date): boolean {
    return data instanceof Date && !isNaN(data.getTime());
  }

  /**
   * Retorna o primeiro dia do mês
   */
  static primeiroDiaMes(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth(), 1);
  }

  /**
   * Retorna o último dia do mês
   */
  static ultimoDiaMes(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth() + 1, 0);
  }

  /**
   * Adiciona dias a uma data
   */
  static adicionarDias(data: Date, dias: number): Date {
    const resultado = new Date(data);
    resultado.setDate(resultado.getDate() + dias);
    return resultado;
  }

  /**
   * Adiciona meses a uma data
   */
  static adicionarMeses(data: Date, meses: number): Date {
    const resultado = new Date(data);
    resultado.setMonth(resultado.getMonth() + meses);
    return resultado;
  }

  /**
   * Calcula a diferença em dias entre duas datas
   */
  static diferencaEmDias(data1: Date, data2: Date): number {
    const diff = Math.abs(data2.getTime() - data1.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se a data está no passado
   */
  static isDataPassada(data: Date): boolean {
    return data < new Date();
  }

  /**
   * Verifica se a data está no futuro
   */
  static isDataFutura(data: Date): boolean {
    return data > new Date();
  }

  /**
   * Retorna a data de hoje no formato ISO (yyyy-mm-dd)
   */
  static hojeIso(): string {
    return this.formatarDataIso(new Date());
  }

  /**
   * Retorna a data de hoje no formato brasileiro (dd/mm/yyyy)
   */
  static hojeBr(): string {
    return this.formatarDataBr(new Date());
  }
}