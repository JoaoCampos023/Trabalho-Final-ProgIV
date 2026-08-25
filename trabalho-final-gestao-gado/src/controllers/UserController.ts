import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

const userService = new UserService();

export class UserController {
  /**
   * GET /api/users
   * Listar todos os usuários
   */
  async listarTodos(req: Request, res: Response): Promise<Response> {
    try {
      const users = await userService.listarTodos();
      return res.json({
        success: true,
        data: users.map(user => user.toPublicJSON())
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar usuários',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/users/paginated
   * Listar usuários com paginação e filtros
   */
  async listarComFiltros(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const nome = req.query.nome as string;
      const email = req.query.email as string;
      const role = req.query.role as string;
      const ativo = req.query.ativo === 'true' ? true : 
                    req.query.ativo === 'false' ? false : undefined;

      const result = await userService.listarComFiltros(page, limit, {
        nome,
        email,
        role,
        ativo
      });

      return res.json({
        success: true,
        data: {
          users: result.users.map(user => user.toPublicJSON()),
          pagination: {
            page: result.page,
            limit: limit,
            total: result.total,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar usuários',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/users/:id
   * Buscar usuário por ID
   */
  async buscarPorId(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const user = await userService.buscarPorId(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      return res.json({
        success: true,
        data: user.toPublicJSON()
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuário',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * POST /api/users
   * Criar um novo usuário
   */
  async criar(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, email, password, cpf, role } = req.body;

      // Validações básicas
      if (!nome || !email || !password || !cpf) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email, senha e CPF são obrigatórios'
        });
      }

      const user = await userService.criarUsuario({
        nome,
        email,
        password,
        cpf,
        role
      });

      return res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: user.toPublicJSON()
      });
    } catch (error) {
      const status = error instanceof Error && 
        (error.message.includes('CPF') || 
         error.message.includes('Email') || 
         error.message.includes('cadastrado'))
        ? 400
        : 500;

      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao criar usuário'
      });
    }
  }

  /**
   * PUT /api/users/:id
   * Atualizar um usuário
   */
  async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { nome, cpf, role, ativo } = req.body;

      const user = await userService.atualizarUsuario(id, {
        nome,
        cpf,
        role,
        ativo
      });

      return res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: user.toPublicJSON()
      });
    } catch (error) {
      const status = error instanceof Error &&
        (error.message.includes('não encontrado') ||
         error.message.includes('CPF') ||
         error.message.includes('Administrador'))
        ? 400
        : 500;

      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao atualizar usuário'
      });
    }
  }

  /**
   * PATCH /api/users/:id/toggle-status
   * Ativar/Desativar um usuário
   */
  async toggleStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const user = await userService.toggleStatus(id);

      return res.json({
        success: true,
        message: `Usuário ${user.ativo ? 'ativado' : 'desativado'} com sucesso`,
        data: user.toPublicJSON()
      });
    } catch (error) {
      const status = error instanceof Error &&
        (error.message.includes('não encontrado') ||
         error.message.includes('Administrador'))
        ? 400
        : 500;

      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao alterar status'
      });
    }
  }

  /**
   * POST /api/users/:id/reset-password
   * Resetar senha do usuário
   */
  async resetarSenha(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await userService.resetarSenha(id);

      return res.json({
        success: true,
        message: 'Senha resetada com sucesso',
        data: {
          novaSenha: result.novaSenha,
          usuario: result.user.toPublicJSON()
        }
      });
    } catch (error) {
      const status = error instanceof Error &&
        (error.message.includes('não encontrado') ||
         error.message.includes('Administrador'))
        ? 400
        : 500;

      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao resetar senha'
      });
    }
  }

  /**
   * DELETE /api/users/:id
   * Excluir um usuário
   */
  async excluir(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await userService.excluirUsuario(id);

      return res.json({
        success: true,
        message: 'Usuário excluído com sucesso'
      });
    } catch (error) {
      const status = error instanceof Error &&
        (error.message.includes('não encontrado') ||
         error.message.includes('Administrador'))
        ? 400
        : 500;

      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao excluir usuário'
      });
    }
  }

  /**
   * GET /api/users/stats
   * Obter estatísticas de usuários
   */
  async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await userService.getStats();

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}