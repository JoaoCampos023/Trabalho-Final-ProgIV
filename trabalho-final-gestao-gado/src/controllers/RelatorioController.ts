import { Request, Response } from 'express';
import prisma from '../config/database';

export class RelatorioController {
  async getRelatorioProducao(req: Request, res: Response): Promise<Response> {
    try {
      const { dataInicio, dataFim, animalBrinco, periodo } = req.query;

      const where: any = {};
      if (dataInicio) where.data_coleta = { gte: new Date(dataInicio as string) };
      if (dataFim) where.data_coleta = { ...where.data_coleta, lte: new Date(dataFim as string) };
      if (animalBrinco) where.animal_brinco = parseInt(animalBrinco as string);
      if (periodo) where.periodo = periodo;

      const producoes = await prisma.producaoLeite.findMany({
        where,
        include: { animal: true },
        orderBy: { data_coleta: 'desc' }
      });

      const totalLitros = producoes.reduce((sum, p) => sum + Number(p.litros), 0);
      const totalRegistros = producoes.length;

      return res.json({
        success: true,
        data: {
          producoes,
          stats: {
            totalLitros,
            totalRegistros,
            mediaPorOrdenha: totalRegistros > 0 ? totalLitros / totalRegistros : 0,
            vacasEmProducao: new Set(producoes.map(p => p.animal_brinco)).size
          }
        }
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async exportarPDF(_req: Request, res: Response): Promise<Response> {
    return res.json({ success: true, message: 'PDF em desenvolvimento' });
  }

  async exportarExcel(_req: Request, res: Response): Promise<Response> {
    return res.json({ success: true, message: 'Excel em desenvolvimento' });
  }

  async getRelatorioRebanho(req: Request, res: Response): Promise<Response> {
    try {
      const { sexo, raca } = req.query;
      const where: any = { ativo: true };
      if (sexo) where.sexo = sexo;
      if (raca) where.raca = { contains: raca as string, mode: 'insensitive' };

      const animais = await prisma.animal.findMany({ where, orderBy: { brinco: 'asc' } });

      return res.json({
        success: true,
        data: {
          animais,
          stats: {
            total: animais.length,
            totalMacho: animais.filter(a => a.sexo === 'M').length,
            totalFemea: animais.filter(a => a.sexo === 'F').length
          }
        }
      });
    } catch (error) {
      console.error('Erro ao gerar relatório do rebanho:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório do rebanho',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async exportarPDFRebanho(_req: Request, res: Response): Promise<Response> {
    return res.json({ success: true, message: 'PDF do rebanho em desenvolvimento' });
  }

  async getDadosGraficoProducao(req: Request, res: Response): Promise<Response> {
    try {
      const dias = parseInt(req.query.dias as string) || 7;
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

      const resultMap = new Map(results.map(r => [r.data, Number(r.total)]));
      const finalResults = [];

      for (let i = dias - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        finalResults.push({ data: dateStr, total: resultMap.get(dateStr) || 0 });
      }

      return res.json({ success: true, data: finalResults });
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados do gráfico',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getDadosGraficoRebanho(_req: Request, res: Response): Promise<Response> {
    try {
      const [totalMacho, totalFemea] = await Promise.all([
        prisma.animal.count({ where: { ativo: true, sexo: 'M' } }),
        prisma.animal.count({ where: { ativo: true, sexo: 'F' } })
      ]);

      return res.json({
        success: true,
        data: { sexo: { macho: totalMacho, femea: totalFemea } }
      });
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados do gráfico',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async getDashboardData(_req: Request, res: Response): Promise<Response> {
    try {
      const [totalAnimais, producaoTotal] = await Promise.all([
        prisma.animal.count({ where: { ativo: true } }),
        prisma.producaoLeite.aggregate({ _sum: { litros: true } })
      ]);

      return res.json({
        success: true,
        data: {
          totalAnimais,
          producaoTotal: Number(producaoTotal._sum.litros) || 0,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados do dashboard',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}