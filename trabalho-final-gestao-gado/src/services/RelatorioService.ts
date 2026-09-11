import prisma from '../config/database';
import { DateUtils } from '../utils/dateUtils';

/**
 * Filtros aceitos pelo relatório de produção. Todos opcionais —
 * sem filtro nenhum, o relatório cobre todo o histórico.
 */
export interface FiltrosProducao {
  dataInicio?: Date;
  dataFim?: Date;
  animalBrinco?: number;
  periodo?: 'Manha' | 'Tarde' | 'Noite';
}

export interface FiltrosRebanho {
  sexo?: 'M' | 'F';
  raca?: string;
}

/**
 * RelatorioService — reúne toda a lógica de agregação do relatório.
 *
 * Por que existe: antes o Controller montava tudo inline (queries + cálculos).
 * Ao adicionar PDF e Excel, essa lógica seria repetida em 4 endpoints. Extrair
 * agora mantém uma fonte única de verdade entre tela e exportação.
 */
export class RelatorioService {
  /** Monta o WHERE do Prisma para o relatório de produção a partir dos filtros. */
  private buildWhereProducao(f: FiltrosProducao): any {
    const where: any = {};
    if (f.dataInicio || f.dataFim) {
      where.data_coleta = {};
      if (f.dataInicio) where.data_coleta.gte = f.dataInicio;
      if (f.dataFim) where.data_coleta.lte = f.dataFim;
    }
    if (f.animalBrinco) where.animal_brinco = f.animalBrinco;
    if (f.periodo) where.periodo = f.periodo;
    return where;
  }

  /**
   * Relatório de produção — devolve tudo que a tela e a exportação precisam:
   * lista crua, KPIs analíticos, totais por período do dia e ranking de vacas.
   */
  async getRelatorioProducao(f: FiltrosProducao) {
    const where = this.buildWhereProducao(f);

    const producoes = await prisma.producaoLeite.findMany({
      where,
      include: { animal: true },
      orderBy: { data_coleta: 'desc' }
    });

    const totalLitros = producoes.reduce((s, p) => s + Number(p.litros), 0);
    const totalRegistros = producoes.length;
    const mediaPorOrdenha = totalRegistros > 0 ? totalLitros / totalRegistros : 0;

    // Pico: maior volume registrado num único dia (soma das ordenhas do dia).
    const porDia = new Map<string, number>();
    producoes.forEach(p => {
      const dia = DateUtils.formatarDataIso(p.data_coleta);
      porDia.set(dia, (porDia.get(dia) || 0) + Number(p.litros));
    });
    const dias = Array.from(porDia.entries());
    const pico = dias.reduce(
      (acc, [dia, total]) => (total > acc.total ? { dia, total } : acc),
      { dia: '', total: 0 }
    );

    // Média por vaca em produção no período.
    const vacas = new Set(producoes.map(p => p.animal_brinco));
    const mediaPorVaca = vacas.size > 0 ? totalLitros / vacas.size : 0;

    // Totais por período do dia — alimenta o gráfico de barras.
    const porPeriodo = { Manha: 0, Tarde: 0, Noite: 0 };
    producoes.forEach(p => {
      porPeriodo[p.periodo as keyof typeof porPeriodo] += Number(p.litros);
    });

    // Top animais no período filtrado (não no histórico inteiro).
    const rankingMap = new Map<string, number>();
    producoes.forEach(p => {
      const nome = p.animal?.nome || `Animal ${p.animal_brinco}`;
      rankingMap.set(nome, (rankingMap.get(nome) || 0) + Number(p.litros));
    });
    const topAnimais = Array.from(rankingMap.entries())
      .map(([nome, total]) => ({ nome, total: Number(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      producoes,
      stats: {
        totalLitros,
        totalRegistros,
        mediaPorOrdenha,
        mediaPorVaca,
        picoDia: pico.dia,
        picoLitros: pico.total,
        diasComProducao: dias.length,
        vacasEmProducao: vacas.size
      },
      porPeriodo,
      topAnimais
    };
  }

  /** Relatório do rebanho — lista + agregados por sexo e distribuição por raça. */
  async getRelatorioRebanho(f: FiltrosRebanho) {
    const where: any = { ativo: true };
    if (f.sexo) where.sexo = f.sexo;
    if (f.raca) where.raca = { contains: f.raca, mode: 'insensitive' };

    const animais = await prisma.animal.findMany({ where, orderBy: { brinco: 'asc' } });

    const porRaca = new Map<string, number>();
    animais.forEach(a => {
      const raca = a.raca || 'Sem raça';
      porRaca.set(raca, (porRaca.get(raca) || 0) + 1);
    });

    return {
      animais,
      stats: {
        total: animais.length,
        totalMacho: animais.filter(a => a.sexo === 'M').length,
        totalFemea: animais.filter(a => a.sexo === 'F').length,
        pesoMedio:
          animais.length > 0
            ? animais.reduce((s, a) => s + Number(a.peso), 0) / animais.length
            : 0
      },
      porRaca: Array.from(porRaca.entries())
        .map(([raca, quantidade]) => ({ raca, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
    };
  }

  /**
   * Série diária de litros para o gráfico. Se o usuário filtrou um range,
   * usa ele; senão, cai no default de `diasDefault` dias para trás.
   */
  async getSerieDiaria(f: FiltrosProducao, diasDefault = 7) {
    const where = this.buildWhereProducao(f);

    const producoes = await prisma.producaoLeite.findMany({
      where,
      select: { data_coleta: true, litros: true }
    });

    const porDia = new Map<string, number>();
    producoes.forEach(p => {
      const dia = DateUtils.formatarDataIso(p.data_coleta);
      porDia.set(dia, (porDia.get(dia) || 0) + Number(p.litros));
    });

    let inicio: Date;
    let fim: Date;
    if (f.dataInicio && f.dataFim) {
      inicio = f.dataInicio;
      fim = f.dataFim;
    } else {
      fim = new Date();
      inicio = new Date();
      inicio.setDate(inicio.getDate() - (diasDefault - 1));
    }

    const serie: { data: string; total: number }[] = [];
    const cursor = new Date(inicio);
    while (cursor <= fim) {
      const key = DateUtils.formatarDataIso(cursor);
      serie.push({ data: key, total: porDia.get(key) || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return serie;
  }
}