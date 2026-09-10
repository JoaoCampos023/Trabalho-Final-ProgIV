import prisma from '../config/database';
import { ProducaoLeite, IProducaoLeite, PeriodoProducao } from '../models/ProducaoLeite';
import { Animal } from '../models/Animal';

// Função auxiliar para converter dados do Prisma para ProducaoLeite
function toProducao(row: any): ProducaoLeite {
  const producao = new ProducaoLeite({
    id: row.id,
    animal_brinco: row.animal_brinco,
    data_coleta: row.data_coleta,
    litros: Number(row.litros) || 0,
    periodo: row.periodo as PeriodoProducao,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em
  });

  if (row.animal) {
    producao.animal = new Animal({
      brinco: row.animal.brinco,
      nome: row.animal.nome,
      sexo: row.animal.sexo as 'M' | 'F',
      raca: row.animal.raca || undefined,
      peso: Number(row.animal.peso) || 0,
      data_nascimento: row.animal.data_nascimento,
      ativo: row.animal.ativo,
      brinco_pai: row.animal.brinco_pai || undefined,
      brinco_mae: row.animal.brinco_mae || undefined,
      criado_em: row.animal.criado_em,
      atualizado_em: row.animal.atualizado_em
    });
  }

  return producao;
}

export class ProducaoRepository {
  /**
   * Buscar todas as produções
   */
  async findAll(): Promise<ProducaoLeite[]> {
    const producoes = await prisma.producaoLeite.findMany({
      include: { animal: true },
      orderBy: { data_coleta: 'desc' }
    });
    return producoes.map(toProducao);
  }

  /**
   * Buscar produções com filtros
   */
  async findWithFilters(
    dataInicio?: Date,
    dataFim?: Date,
    animalBrinco?: number,
    periodo?: PeriodoProducao
  ): Promise<ProducaoLeite[]> {
    const where: any = {};

    if (dataInicio) {
      where.data_coleta = { gte: dataInicio };
    }
    if (dataFim) {
      where.data_coleta = { ...where.data_coleta, lte: dataFim };
    }
    if (animalBrinco) {
      where.animal_brinco = animalBrinco;
    }
    if (periodo) {
      where.periodo = periodo;
    }

    const producoes = await prisma.producaoLeite.findMany({
      where,
      include: { animal: true },
      orderBy: { data_coleta: 'desc' }
    });
    return producoes.map(toProducao);
  }

  /**
   * Buscar produção por ID
   */
  async findById(id: number): Promise<ProducaoLeite | null> {
    const producao = await prisma.producaoLeite.findUnique({
      where: { id },
      include: { animal: true }
    });
    if (!producao) return null;
    return toProducao(producao);
  }

  /**
   * Buscar produções por animal
   */
  async findByAnimal(animalBrinco: number): Promise<ProducaoLeite[]> {
    const producoes = await prisma.producaoLeite.findMany({
      where: { animal_brinco: animalBrinco },
      include: { animal: true },
      orderBy: { data_coleta: 'desc' }
    });
    return producoes.map(toProducao);
  }

  /**
   * Buscar últimas N produções
   */
  async findUltimas(quantidade: number = 10): Promise<ProducaoLeite[]> {
    const producoes = await prisma.producaoLeite.findMany({
      include: { animal: true },
      orderBy: { data_coleta: 'desc' },
      take: quantidade
    });
    return producoes.map(toProducao);
  }

  /**
   * Calcular total de litros por animal
   */
  async getTotalPorAnimal(animalBrinco: number): Promise<number> {
    const result = await prisma.producaoLeite.aggregate({
      where: { animal_brinco: animalBrinco },
      _sum: { litros: true }
    });
    return Number(result._sum.litros) || 0;
  }

  /**
   * Calcular total de litros por período
   */
  async getTotalPorPeriodo(
    dataInicio: Date,
    dataFim: Date,
    periodo?: PeriodoProducao
  ): Promise<number> {
    const where: any = {
      data_coleta: { gte: dataInicio, lte: dataFim }
    };
    if (periodo) {
      where.periodo = periodo;
    }
    const result = await prisma.producaoLeite.aggregate({
      where,
      _sum: { litros: true }
    });
    return Number(result._sum.litros) || 0;
  }

  /**
   * Obter produção por dia (últimos N dias)
   */
  async getProducaoPorDia(dias: number = 7): Promise<{ data: string; total: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dias);

    const results = await prisma.$queryRaw<{ data: string; total: number }[]>`
      SELECT 
        DATE(data_coleta) as data,
        COALESCE(SUM(litros), 0) as total
      FROM producoes_leite
      WHERE data_coleta >= ${startDate}
      GROUP BY DATE(data_coleta)
      ORDER BY data ASC
    `;

    // Preencher dias sem produção
    const resultMap = new Map(results.map(r => [r.data, Number(r.total)]));
    const finalResults: { data: string; total: number }[] = [];

    for (let i = dias - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      finalResults.push({
        data: dateStr,
        total: resultMap.get(dateStr) || 0
      });
    }

    return finalResults;
  }

  /**
   * Obter top N vacas produtoras
   */
  async getTopVacas(limit: number = 5): Promise<{ nome: string; producao: number }[]> {
    const results = await prisma.$queryRaw<{ nome: string; producao: number }[]>`
      SELECT 
        a.nome,
        COALESCE(SUM(p.litros), 0) as producao
      FROM producoes_leite p
      INNER JOIN animais a ON p.animal_brinco = a.brinco
      WHERE a.sexo = 'F'
      GROUP BY a.nome, a.brinco
      ORDER BY producao DESC
      LIMIT ${limit}
    `;

    return results.map(r => ({
      nome: r.nome,
      producao: Number(r.producao) || 0
    }));
  }

  /**
   * Criar uma nova produção
   */
  async create(producaoData: Omit<IProducaoLeite, 'id' | 'criado_em' | 'atualizado_em'>): Promise<ProducaoLeite> {
    // Validar se animal existe e é fêmea ativa
    const animal = await prisma.animal.findUnique({
      where: { brinco: producaoData.animal_brinco }
    });

    if (!animal) {
      throw new Error('Animal não encontrado');
    }
    if (animal.sexo !== 'F') {
      throw new Error('Não é possível registrar produção de leite para machos');
    }
    if (!animal.ativo) {
      throw new Error('Não é possível registrar produção para um animal inativo');
    }

    // Validar data futura
    if (producaoData.data_coleta > new Date()) {
      throw new Error('Não é possível registrar uma produção em data futura');
    }

    // Validar data muito antiga (mais de 5 anos)
    const dataLimite = new Date();
    dataLimite.setFullYear(dataLimite.getFullYear() - 5);
    if (producaoData.data_coleta < dataLimite) {
      throw new Error('Não é possível registrar uma produção com mais de 5 anos');
    }

    const producao = await prisma.producaoLeite.create({
      data: {
        animal_brinco: producaoData.animal_brinco,
        data_coleta: producaoData.data_coleta,
        litros: producaoData.litros,
        periodo: producaoData.periodo
      },
      include: { animal: true }
    });
    return toProducao(producao);
  }

  /**
   * Atualizar uma produção
   */
  async update(id: number, producaoData: Partial<IProducaoLeite>): Promise<ProducaoLeite | null> {
    try {
      // Se o animal foi alterado, validar
      if (producaoData.animal_brinco) {
        const animal = await prisma.animal.findUnique({
          where: { brinco: producaoData.animal_brinco }
        });
        if (!animal) throw new Error('Animal não encontrado');
        if (animal.sexo !== 'F') throw new Error('Não é possível registrar produção de leite para machos');
        if (!animal.ativo) throw new Error('Não é possível registrar produção para um animal inativo');
      }

      const producao = await prisma.producaoLeite.update({
        where: { id },
        data: {
          animal_brinco: producaoData.animal_brinco,
          data_coleta: producaoData.data_coleta,
          litros: producaoData.litros,
          periodo: producaoData.periodo
        },
        include: { animal: true }
      });
      if (!producao) return null;
      return toProducao(producao);
    } catch (error) {
      return null;
    }
  }

  /**
   * Deletar uma produção
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.producaoLeite.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Contar produções
   */
  async count(): Promise<number> {
    return await prisma.producaoLeite.count();
  }

  /**
   * Obter estatísticas de produção
   */
  async getStats(
    dataInicio?: Date,
    dataFim?: Date
  ): Promise<{
    totalLitros: number;
    mediaPorOrdenha: number;
    totalRegistros: number;
    vacasEmProducao: number;
    producaoManha: number;
    producaoTarde: number;
    producaoNoite: number;
  }> {
    const where: any = {};
    if (dataInicio) {
      where.data_coleta = { gte: dataInicio };
    }
    if (dataFim) {
      where.data_coleta = { ...where.data_coleta, lte: dataFim };
    }

    const [aggregate, manha, tarde, noite, vacas] = await Promise.all([
      prisma.producaoLeite.aggregate({
        where,
        _sum: { litros: true },
        _count: { id: true }
      }),
      prisma.producaoLeite.aggregate({
        where: { ...where, periodo: 'Manha' },
        _sum: { litros: true }
      }),
      prisma.producaoLeite.aggregate({
        where: { ...where, periodo: 'Tarde' },
        _sum: { litros: true }
      }),
      prisma.producaoLeite.aggregate({
        where: { ...where, periodo: 'Noite' },
        _sum: { litros: true }
      }),
      prisma.producaoLeite.groupBy({
        by: ['animal_brinco'],
        where
      })
    ]);

    const totalLitros = Number(aggregate._sum.litros) || 0;
    const totalRegistros = aggregate._count.id || 0;

    return {
      totalLitros,
      mediaPorOrdenha: totalRegistros > 0 ? totalLitros / totalRegistros : 0,
      totalRegistros,
      vacasEmProducao: vacas.length,
      producaoManha: Number(manha._sum.litros) || 0,
      producaoTarde: Number(tarde._sum.litros) || 0,
      producaoNoite: Number(noite._sum.litros) || 0
    };
  }
}