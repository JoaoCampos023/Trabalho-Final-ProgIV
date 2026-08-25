import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';

const router = Router();
const userService = new UserService();

/**
 * POST /api/auth/login
 * Login do usuário
 */
router.post('/login', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    const result = await userService.login(email, password);

    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: result.user.toPublicJSON(),
        token: result.token
      }
    });
  } catch (error) {
    const status = error instanceof Error &&
      (error.message.includes('inválidos') ||
       error.message.includes('desativada'))
      ? 401
      : 500;

    return res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao fazer login'
    });
  }
});

/**
 * POST /api/auth/register
 * Registrar novo usuário
 */
router.post('/register', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { nome, email, password, cpf } = req.body;

    // Validações básicas
    if (!nome || !email || !password || !cpf) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email, senha e CPF são obrigatórios'
      });
    }

    // Validação de senha mínima
    if (password.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 3 caracteres'
      });
    }

    const user = await userService.criarUsuario({
      nome,
      email,
      password,
      cpf,
      role: 'Cliente' // Por padrão, novos registros são Cliente
    });

    // Gerar token automaticamente após registro
    const token = (await userService.login(email, password)).token;

    return res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: user.toPublicJSON(),
        token
      }
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
      message: error instanceof Error ? error.message : 'Erro ao registrar usuário'
    });
  }
});

export default router;