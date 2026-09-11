import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { friendlyMessage } from '../utils/errorMessage';

dotenv.config();

// Extensão do tipo Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        nome: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido e adiciona os dados do usuário à requisição
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Buscar token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token não fornecido. Faça login para obter um token.'
      });
      return;
    }

    // Verificar formato do token (Bearer <token>)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
      return;
    }

    const token = parts[1];

    // Verificar se o token é válido
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      nome: string;
      role: string;
    };

    // Adicionar dados do usuário à requisição
    req.user = {
      id: decoded.id,
      email: decoded.email,
      nome: decoded.nome,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expirado. Faça login novamente.'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido. Faça login novamente.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao validar autenticação',
      error: friendlyMessage(error, 'Erro desconhecido')
    });
  }
};
