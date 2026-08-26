import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// SERVER ARQUIVOS ESTÁTICOS
// ============================================
app.use(express.static('public'));

// Rota para a landing page
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota para o dashboard (protegida pelo frontend)
app.get('/dashboard.html', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// ============================================
// API ROUTES
// ============================================
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        message: 'API Gestão de Gado funcionando!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.use('/api', routes);

// ============================================
// MIDDLEWARE DE ERRO
// ============================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Erro:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`🏠 Landing Page: http://localhost:${PORT}/`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;