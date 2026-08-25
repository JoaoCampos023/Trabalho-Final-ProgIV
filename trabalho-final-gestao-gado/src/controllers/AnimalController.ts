import { Request, Response } from 'express';
import { AnimalService } from '../services/AnimalService';

const animalService = new AnimalService();

// Função auxiliar para normalizar parâmetros do Express
function getParam(param: unknown): string {
  if (typeof param === 'string') return param;
  if (Array.isArray(param)) return getParam(param[0]);
  return '';
}

export class AnimalController {
  /**
   * GET /api/animais
   * Listar todos os animais com filtros
   */
  async listarTodos(req: Request, res: Response): Promise<Response> {
    try {
      const searchNome = getParam(req.query.searchNome);
      const sexoParam = getParam(req.query.sexo);
      const sexo = sexoParam === 'M' || sexoParam === 'F' ? sexoParam : undefined;
      const raca = getParam(req.query.raca);
      const faixaPeso = getParam(req.query.faixaPeso);
      const ordenarPor = getParam(req.query.ordenarPor) || 'brinco';
      const ordemParam = getParam(req.query.ordem);
      const ordem = ordemParam === 'desc' ? 'desc' : 'asc';

      const animais = await animalService.listarComFiltros(
        searchNome,
        sexo,
        raca,
        faixaPeso,
        ordenarPor,
        ordem
      );

      const total = animais.length;
      const totalMacho = animais.filter(a => a.sexo === 'M').length;
      const totalFemea = animais.filter(a => a.sexo === 'F').length;
      const pesoMedio = total > 0 ? animais.reduce((sum, a) => sum + a.peso, 0) / total : 0;

      // Raças mais comuns
      const racasMap: Record<string, number> = {};
      animais.forEach(a => {
        if (a.raca) {
          racasMap[a.raca] = (racasMap[a.raca] || 0) + 1;
        }
      });
      const racasMaisComuns = Object.entries(racasMap)
        .map(([raca, quantidade]) => ({ raca, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      return res.json({
        success: true,
        data: {
          animais,
          total,
          totalMacho,
          totalFemea,
          pesoMedio,
          racasMaisComuns
        }
      });
    } catch (error) {
      console.error('Erro ao listar animais:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar animais',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/animais/:brinco
   * Buscar animal por brinco
   */
  async buscarPorBrinco(req: Request, res: Response): Promise<Response> {
    try {
      const brinco = parseInt(getParam(req.params.brinco));
      
      if (isNaN(brinco)) {
        return res.status(400).json({
          success: false,
          message: 'Brinco inválido'
        });
      }

      const animal = await animalService.buscarPorBrinco(brinco);

      if (!animal) {
        return res.status(404).json({
          success: false,
          message: `Animal com brinco ${brinco} não encontrado`
        });
      }

      return res.json({
        success: true,
        data: animal
      });
    } catch (error) {
      console.error('Erro ao buscar animal:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar animal',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/animais/:brinco/tree
   * Buscar árvore genealógica
   */
  async buscarArvoreGenealogica(req: Request, res: Response): Promise<Response> {
    try {
      const brinco = parseInt(getParam(req.params.brinco));
      
      if (isNaN(brinco)) {
        return res.status(400).json({
          success: false,
          message: 'Brinco inválido'
        });
      }

      const animal = await animalService.buscarArvoreGenealogica(brinco);

      if (!animal) {
        return res.status(404).json({
          success: false,
          message: `Animal com brinco ${brinco} não encontrado`
        });
      }

      const treeData = {
        animal: {
          brinco: animal.brinco,
          nome: animal.nome,
          sexo: animal.sexo,
          data_nascimento: animal.data_nascimento
        },
        pai: animal.pai ? {
          brinco: animal.pai.brinco,
          nome: animal.pai.nome,
          sexo: animal.pai.sexo,
          pai: animal.pai.pai || null,
          mae: animal.pai.mae || null
        } : null,
        mae: animal.mae ? {
          brinco: animal.mae.brinco,
          nome: animal.mae.nome,
          sexo: animal.mae.sexo,
          pai: animal.mae.pai || null,
          mae: animal.mae.mae || null
        } : null,
        filhos: [
          ...(animal.filhos_por_pai || []),
          ...(animal.filhos_por_mae || [])
        ].map(f => ({
          brinco: f.brinco,
          nome: f.nome,
          sexo: f.sexo
        }))
      };

      return res.json({
        success: true,
        data: treeData
      });
    } catch (error) {
      console.error('Erro ao buscar árvore genealógica:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar árvore genealógica',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/animais/machos/selecao
   * Buscar machos para seleção
   */
  async buscarMachosParaSelecao(req: Request, res: Response): Promise<Response> {
    try {
      const excluirParam = getParam(req.query.excluir);
      const excluir = excluirParam ? parseInt(excluirParam, 10) : undefined;
      const machos = await animalService.buscarMachosParaSelecao(excluir);

      return res.json({
        success: true,
        data: machos.map(m => ({
          brinco: m.brinco,
          nome: m.nome,
          sexo: m.sexo
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar machos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar machos para seleção',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/animais/femeas/selecao
   * Buscar fêmeas para seleção
   */
  async buscarFemeasParaSelecao(req: Request, res: Response): Promise<Response> {
    try {
      const excluirParam = getParam(req.query.excluir);
      const excluir = excluirParam ? parseInt(excluirParam, 10) : undefined;
      const femeas = await animalService.buscarFemeasParaSelecao(excluir);

      return res.json({
        success: true,
        data: femeas.map(f => ({
          brinco: f.brinco,
          nome: f.nome,
          sexo: f.sexo
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar fêmeas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar fêmeas para seleção',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * POST /api/animais
   * Cadastrar um novo animal
   */
  async criar(req: Request, res: Response): Promise<Response> {
    try {
      const { brinco, nome, sexo, raca, peso, data_nascimento, brinco_pai, brinco_mae } = req.body;

      if (!brinco || !nome || !sexo || peso === undefined || !data_nascimento) {
        return res.status(400).json({
          success: false,
          message: 'Brinco, nome, sexo, peso e data de nascimento são obrigatórios'
        });
      }

      const animal = await animalService.cadastrarAnimal({
        brinco: parseInt(brinco),
        nome,
        sexo,
        raca: raca || undefined,
        peso: parseFloat(peso),
        data_nascimento: new Date(data_nascimento),
        ativo: true,
        brinco_pai: brinco_pai ? parseInt(brinco_pai) : undefined,
        brinco_mae: brinco_mae ? parseInt(brinco_mae) : undefined
      });

      return res.status(201).json({
        success: true,
        message: 'Animal cadastrado com sucesso',
        data: animal
      });
    } catch (error) {
      console.error('Erro ao cadastrar animal:', error);
      const status = error instanceof Error &&
        (error.message.includes('obrigatório') ||
         error.message.includes('existe') ||
         error.message.includes('inconsistência') ||
         error.message.includes('consanguinidade'))
        ? 400
        : 500;

      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao cadastrar animal'
      });
    }
  }

  /**
   * PUT /api/animais/:brinco
   * Atualizar um animal
   */
  async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const brinco = parseInt(getParam(req.params.brinco));
      
      if (isNaN(brinco)) {
        return res.status(400).json({
          success: false,
          message: 'Brinco inválido'
        });
      }

      const { nome, sexo, raca, peso, data_nascimento, ativo, brinco_pai, brinco_mae } = req.body;

      const animal = await animalService.atualizarAnimal(brinco, {
        nome,
        sexo,
        raca,
        peso: peso !== undefined ? parseFloat(peso) : undefined,
        data_nascimento: data_nascimento ? new Date(data_nascimento) : undefined,
        ativo: ativo !== undefined ? ativo : undefined,
        brinco_pai: brinco_pai !== undefined ? (brinco_pai ? parseInt(brinco_pai) : null) : undefined,
        brinco_mae: brinco_mae !== undefined ? (brinco_mae ? parseInt(brinco_mae) : null) : undefined
      });

      return res.json({
        success: true,
        message: 'Animal atualizado com sucesso',
        data: animal
      });
    } catch (error) {
      console.error('Erro ao atualizar animal:', error);
      const status = error instanceof Error &&
        (error.message.includes('não encontrado') ||
         error.message.includes('obrigatório') ||
         error.message.includes('inconsistência'))
        ? 400
        : 500;

      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao atualizar animal'
      });
    }
  }

  /**
   * DELETE /api/animais/:brinco
   * Remover animal (soft delete)
   */
  async remover(req: Request, res: Response): Promise<Response> {
    try {
      const brinco = parseInt(getParam(req.params.brinco));
      
      if (isNaN(brinco)) {
        return res.status(400).json({
          success: false,
          message: 'Brinco inválido'
        });
      }

      await animalService.removerAnimal(brinco);

      return res.json({
        success: true,
        message: 'Animal removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover animal:', error);
      const status = error instanceof Error && error.message.includes('não encontrado') ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao remover animal'
      });
    }
  }

  /**
   * DELETE /api/animais/:brinco/permanent
   * Excluir animal permanentemente
   */
  async excluirPermanentemente(req: Request, res: Response): Promise<Response> {
    try {
      const brinco = parseInt(getParam(req.params.brinco));
      
      if (isNaN(brinco)) {
        return res.status(400).json({
          success: false,
          message: 'Brinco inválido'
        });
      }

      await animalService.excluirAnimal(brinco);

      return res.json({
        success: true,
        message: 'Animal excluído permanentemente com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir animal:', error);
      const status = error instanceof Error && error.message.includes('não encontrado') ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao excluir animal'
      });
    }
  }

  /**
   * GET /api/animais/stats
   * Obter estatísticas do rebanho
   */
  async getStats(_req: Request, res: Response): Promise<Response> {
    try {
      const stats = await animalService.getStats();

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}