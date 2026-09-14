/**
 * Utilitários para manipulação de datas.
 *
 * Todo o projeto assume fuso `America/Sao_Paulo` (definido no `.env` e no
 * `process.env.TZ` do app). Por isso estes helpers usam getters locais
 * (`getFullYear`, `getMonth`, `getDate`) em vez de `toISOString()` — que
 * sempre converte para UTC e "vira o dia" 3h antes da meia-noite local.
 */
export class DateUtils {
  /** Formata uma data no padrão brasileiro (dd/mm/aaaa). */
  static formatarDataBr(data: Date): string {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  /**
   * Formata uma data no padrão ISO (aaaa-mm-dd) usando o horário LOCAL do
   * processo (horário de Brasília, ver TZ em .env/Dockerfile).
   *
   * Importante: `data.toISOString()` sempre converte para UTC, não para o
   * fuso local — usar isso para representar "o dia de hoje" quebra perto
   * da meia-noite: como Brasília é UTC-3, entre ~21h e 23h59 o UTC já virou
   * o dia seguinte, e `toISOString()` devolveria a data de amanhã em vez
   * de hoje. Este método usa os getters locais, que respeitam o fuso do
   * processo.
   */
  static formatarDataIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Calcula a idade em anos completos. Se o aniversário deste ano ainda
   * não chegou, subtrai 1 — senão uma pessoa nascida em dezembro de 2000
   * apareceria com 25 anos em janeiro de 2025, o que estaria errado.
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

  static isDataValida(data: Date): boolean {
    return data instanceof Date && !isNaN(data.getTime());
  }

  static primeiroDiaMes(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth(), 1);
  }

  static ultimoDiaMes(data: Date): Date {
    // Dia 0 do mês seguinte = último dia do mês atual. Truque clássico do
    // Date do JS para não precisar calcular quantos dias cada mês tem.
    return new Date(data.getFullYear(), data.getMonth() + 1, 0);
  }

  static adicionarDias(data: Date, dias: number): Date {
    const resultado = new Date(data);
    resultado.setDate(resultado.getDate() + dias);
    return resultado;
  }

  static adicionarMeses(data: Date, meses: number): Date {
    const resultado = new Date(data);
    resultado.setMonth(resultado.getMonth() + meses);
    return resultado;
  }

  static diferencaEmDias(data1: Date, data2: Date): number {
    const diff = Math.abs(data2.getTime() - data1.getTime());
    // ceil em vez de floor/round: contamos dias "no calendário". Se a
    // diferença for 1,5 dia (ex.: 12h de um dia + 12h do outro), o usuário
    // espera "2 dias", não "1".
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  static isDataPassada(data: Date): boolean {
    return data < new Date();
  }

  static isDataFutura(data: Date): boolean {
    return data > new Date();
  }

  static hojeIso(): string {
    return this.formatarDataIso(new Date());
  }

  static hojeBr(): string {
    return this.formatarDataBr(new Date());
  }
}