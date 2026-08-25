import { Request, Response, NextFunction } from 'express';

/**
 * Middleware global de tratamento de erros
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Erro:', err.stack);

  // Erro de validação do banco de dados (duplicidade)
  if (err.message.includes('duplicate key')) {
    res.status(409).json({
      success: false,
      message: 'Já existe um registro com este identificador',
      error: err.message
    });
    return;
  }

  // Erro de chave estrangeira
  if (err.message.includes('foreign key')) {
    res.status(400).json({
      success: false,
      message: 'Este registro está sendo referenciado por outro registro',
      error: err.message
    });
    return;
  }

  // Erros customizados com status
  const status = 
    err.message.includes('não encontrado') ? 404 :
    err.message.includes('inválido') ? 400 :
    err.message.includes('obrigatório') ? 400 :
    err.message.includes('não permitido') ? 403 :
    err.message.includes('já cadastrado') ? 409 :
    500;

  res.status(status).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};