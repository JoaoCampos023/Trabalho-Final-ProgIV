import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROTAS DA API
// ============================================

// Rotas públicas
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'API Gestão de Gado funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rotas da aplicação
app.use('/api', routes);

// ============================================
// MIDDLEWARE DE ERRO (global)
// ============================================
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Erro:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use(express.static('public'));

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`📝 Register: http://localhost:${PORT}/api/auth/register`);
  console.log(`🐮 Animais: http://localhost:${PORT}/api/animais`);
  console.log(`🥛 Produções: http://localhost:${PORT}/api/producoes`);
  console.log(`👤 Usuários: http://localhost:${PORT}/api/users`);
});

export default app;