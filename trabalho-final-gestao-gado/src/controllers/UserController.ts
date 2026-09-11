import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { friendlyMessage } from '../utils/errorMessage';

const userService = new UserService();

function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

/**
 * Mapeia erros de negócio do UserService para HTTP status. Ficou mais
 * específico do que o original (que só olhava "não encontrado" e
 * "Administrador") para que mensagens como "CPF inválido" e "Email já
 * cadastrado" cheguem ao front com o status correto em vez de virar 500.
 */
function statusFromError(error: unknown, fallback: number): number {
  if (!(error instanceof Error)) return fallback;
  const msg = error.message;
  if (msg.includes('não encontrado')) return 404;
  if (msg.includes('já cadastrado')) return 409;
  if (msg.includes('inválido') || msg.includes('obrigatório')) return 400;
  if (msg.includes('permitido') || msg.includes('pode')) return 403;
  return fallback;
}

export class UserController {
  async listarTodos(_req: Request, res: Response): Promise<Response> {
    try {
      const users = await userService.listarTodos();
      return res.json({ success: true, data: users.map(user => user.toPublicJSON()) });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar usuários',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async listarComFiltros(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const nome = req.query.nome as string;
      const email = req.query.email as string;
      const role = req.query.role as string;
      const ativo = req.query.ativo === 'true' ? true : req.query.ativo === 'false' ? false : undefined;

      const result = await userService.listarComFiltros(page, limit, { nome, email, role, ativo });

      return res.json({
        success: true,
        data: {
          users: result.users.map(user => user.toPublicJSON()),
          pagination: { page: result.page, limit, total: result.total, totalPages: result.totalPages }
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar usuários',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async buscarPorId(req: Request, res: Response): Promise<Response> {
    try {
      const user = await userService.buscarPorId(getParam(req.params.id));
      if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      return res.json({ success: true, data: user.toPublicJSON() });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuário',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async criar(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, email, password, cpf, role } = req.body;
      if (!nome || !email || !password || !cpf) {
        return res.status(400).json({ success: false, message: 'Nome, email, senha e CPF são obrigatórios' });
      }

      const user = await userService.criarUsuario({ nome, email, password, cpf, role });
      return res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: user.toPublicJSON()
      });
    } catch (error) {
      return res.status(statusFromError(error, 500)).json({
        success: false,
        message: friendlyMessage(error, 'Erro ao criar usuário')
      });
    }
  }

  async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, cpf, role, ativo } = req.body;
      // solicitanteId vem do authMiddleware — quem está pedindo a alteração.
      const solicitanteId = req.user?.id;

      const user = await userService.atualizarUsuario(getParam(req.params.id), { nome, cpf, role, ativo }, solicitanteId);

      return res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: user.toPublicJSON()
      });
    } catch (error) {
      return res.status(statusFromError(error, 500)).json({
        success: false,
        message: friendlyMessage(error, 'Erro ao atualizar usuário')
      });
    }
  }

  async toggleStatus(req: Request, res: Response): Promise<Response> {
    try {
      const solicitanteId = req.user?.id;
      const user = await userService.toggleStatus(getParam(req.params.id), solicitanteId);
      return res.json({
        success: true,
        message: `Usuário ${user.ativo ? 'ativado' : 'desativado'} com sucesso`,
        data: user.toPublicJSON()
      });
    } catch (error) {
      return res.status(statusFromError(error, 500)).json({
        success: false,
        message: friendlyMessage(error, 'Erro ao alterar status')
      });
    }
  }

  async resetarSenha(req: Request, res: Response): Promise<Response> {
    try {
      const result = await userService.resetarSenha(getParam(req.params.id));
      return res.json({
        success: true,
        message: 'Senha resetada com sucesso',
        data: { novaSenha: result.novaSenha, usuario: result.user.toPublicJSON() }
      });
    } catch (error) {
      return res.status(statusFromError(error, 500)).json({
        success: false,
        message: friendlyMessage(error, 'Erro ao resetar senha')
      });
    }
  }

  async excluir(req: Request, res: Response): Promise<Response> {
    try {
      const solicitanteId = req.user?.id;
      await userService.excluirUsuario(getParam(req.params.id), solicitanteId);
      return res.json({ success: true, message: 'Usuário excluído com sucesso' });
    } catch (error) {
      return res.status(statusFromError(error, 500)).json({
        success: false,
        message: friendlyMessage(error, 'Erro ao excluir usuário')
      });
    }
  }

  async getStats(_req: Request, res: Response): Promise<Response> {
    try {
      const stats = await userService.getStats();
      return res.json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }
}