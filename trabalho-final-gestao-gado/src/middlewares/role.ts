import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem uma das roles permitidas
 * 
 * @param allowedRoles - Array de roles permitidas (ex: ['Admin', 'Cliente'])
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Verificar se o usuário está autenticado (authMiddleware deve ser executado antes)
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      // Verificar se o usuário tem uma das roles permitidas
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: `Acesso negado. Permissões necessárias: ${allowedRoles.join(', ')}`
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };
};