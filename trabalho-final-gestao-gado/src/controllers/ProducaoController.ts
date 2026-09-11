import { Request, Response } from 'express';
import { ProducaoService } from '../services/ProducaoService';
import { PeriodoProducao } from '../models/ProducaoLeite';
import { friendlyMessage } from '../utils/errorMessage';

const producaoService = new ProducaoService();

function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export class ProducaoController {
  /**
   * GET /api/producoes
   * Listar todas as produções com filtros
   */
  async listarTodos(req: Request, res: Response): Promise<Response> {
    try {
      const { dataInicio, dataFim, animalBrinco, periodo } = req.query;

      const producoes = await producaoService.listarComFiltros(
        dataInicio ? new Date(dataInicio as string) : undefined,
        dataFim ? new Date(dataFim as string) : undefined,
        animalBrinco ? parseInt(animalBrinco as string) : undefined,
        periodo as PeriodoProducao
      );

      // Calcular totais
      const totalLitros = producoes.reduce((sum, p) => sum + p.litros, 0);
      const totalRegistros = producoes.length;
      const mediaPorOrdenha = totalRegistros > 0 ? totalLitros / totalRegistros : 0;

      return res.json({
        success: true,
        data: {
          producoes,
          stats: {
            totalLitros,
            totalRegistros,
            mediaPorOrdenha
          }
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar produções',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  /**
   * GET /api/producoes/:id
   * Buscar produção por ID
   */
  async buscarPorId(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const producao = await producaoService.buscarPorId(parseInt(getParam(id), 10));

      if (!producao) {
        return res.status(404).json({
          success: false,
          message: `Produção com ID ${id} não encontrada`
        });
      }

      return res.json({
        success: true,
        data: producao
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar produção',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  /**
   * GET /api/producoes/animal/:brinco
   * Buscar produções por animal
   */
  async listarPorAnimal(req: Request, res: Response): Promise<Response> {
    try {
      const { brinco } = req.params;
      const producoes = await producaoService.listarPorAnimal(parseInt(getParam(brinco), 10));

      // Calcular totais
      const totalLitros = producoes.reduce((sum, p) => sum + p.litros, 0);
      const mediaPorOrdenha = producoes.length > 0 ? totalLitros / producoes.length : 0;

      return res.json({
        success: true,
        data: {
          producoes,
          stats: {
            totalLitros,
            totalRegistros: producoes.length,
            mediaPorOrdenha
          }
        }
      });
    } catch (error) {
      const status = error instanceof Error && error.message.includes('não encontrado') ? 404 : 500;

      return res.status(status).json({
        success: false,
        message: friendlyMessage(error, 'Erro ao listar produções do animal')
      });
    }
  }

  /**
   * GET /api/producoes/ultimas/:quantidade
   * Buscar últimas N produções
   */
  async listarUltimas(req: Request, res: Response): Promise<Response> {
    try {
      const { quantidade } = req.params;
      const qtd = quantidade ? parseInt(getParam(quantidade), 10) : 10;
      const producoes = await producaoService.listarUltimas(qtd);

      return res.json({
        success: true,
        data: producoes
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar últimas produções',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  /**
   * POST /api/producoes
   * Registrar uma nova produção
   */
  async criar(req: Request, res: Response): Promise<Response> {
    try {
      const { animal_brinco, data_coleta, litros, periodo } = req.body;

      // Validações básicas (litros pode ser 0 — só usa !litros derrubaria esse caso, já que 0 é falsy em JS)
      if (!animal_brinco || !data_coleta || litros === undefined || litros === null || litros === '' || !periodo) {
        return res.status(400).json({
          success: false,
          message: 'Animal, data, litros e período são obrigatórios'
        });
      }

      const producao = await producaoService.registrarProducao({
        animal_brinco: parseInt(animal_brinco),
        data_coleta: new Date(data_coleta),
        litros: parseFloat(litros),
        periodo
      });

      return res.status(201).json({
        success: true,
        message: 'Produção registrada com sucesso',
        data: producao
      });
    } catch (error) {
      const status =
        error instanceof Error &&
        (error.message.includes('não encontrado') ||
          error.message.includes('fêmea') ||
          error.message.includes('futura') ||
          error.message.includes('inativo') ||
          error.message.includes('machos'))
          ? 400
          : 500;

      return res.status(status).json({
        success: false,
        message: friendlyMessage(error, 'Erro ao registrar produção')
      });
    }
  }

  /**
   * PUT /api/producoes/:id
   * Atualizar uma produção
   */
  async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { animal_brinco, data_coleta, litros, periodo } = req.body;

      const producao = await producaoService.atualizarProducao(parseInt(getParam(id), 10), {
        animal_brinco: animal_brinco ? parseInt(animal_brinco) : undefined,
        data_coleta: data_coleta ? new Date(data_coleta) : undefined,
        litros: litros !== undefined ? parseFloat(litros) : undefined,
        periodo
      });

      return res.json({
        success: true,
        message: 'Produção atualizada com sucesso',
        data: producao
      });
    } catch (error) {
      const status =
        error instanceof Error &&
        (error.message.includes('não encontrada') ||
          error.message.includes('fêmea') ||
          error.message.includes('futura') ||
          error.message.includes('inativo'))
          ? 400
          : 500;

      return res.status(status).json({
        success: false,
        message: friendlyMessage(error, 'Erro ao atualizar produção')
      });
    }
  }

  /**
   * DELETE /api/producoes/:id
   * Excluir uma produção
   */
  async excluir(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await producaoService.excluirProducao(parseInt(getParam(id), 10));

      return res.json({
        success: true,
        message: 'Produção excluída com sucesso'
      });
    } catch (error) {
      const status = error instanceof Error && error.message.includes('não encontrada') ? 404 : 500;

      return res.status(status).json({
        success: false,
        message: friendlyMessage(error, 'Erro ao excluir produção')
      });
    }
  }

  /**
   * GET /api/producoes/top-vacas
   * Obter top vacas produtoras
   */
  async getTopVacas(req: Request, res: Response): Promise<Response> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const topVacas = await producaoService.getTopVacas(limit);

      return res.json({
        success: true,
        data: topVacas
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter top vacas',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  /**
   * GET /api/producoes/producao-dia
   * Obter produção dos últimos N dias
   */
  async getProducaoPorDia(req: Request, res: Response): Promise<Response> {
    try {
      const dias = req.query.dias ? parseInt(req.query.dias as string) : 7;
      const producao = await producaoService.getProducaoPorDia(dias);

      return res.json({
        success: true,
        data: producao
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter produção por dia',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  /**
   * GET /api/producoes/stats
   * Obter estatísticas de produção
   */
  async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const { dataInicio, dataFim } = req.query;
      const stats = await producaoService.getStats(
        dataInicio ? new Date(dataInicio as string) : undefined,
        dataFim ? new Date(dataFim as string) : undefined
      );

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  /**
   * GET /api/producoes/relatorio
   * Gerar relatório completo
   */
  async gerarRelatorio(req: Request, res: Response): Promise<Response> {
    try {
      const { dataInicio, dataFim, animalBrinco, periodo } = req.query;

      const relatorio = await producaoService.gerarRelatorio(
        dataInicio ? new Date(dataInicio as string) : undefined,
        dataFim ? new Date(dataFim as string) : undefined,
        animalBrinco ? parseInt(animalBrinco as string) : undefined,
        periodo as PeriodoProducao
      );

      return res.json({
        success: true,
        data: relatorio
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }
}
