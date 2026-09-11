import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

// Importação das rotas
import routes from './routes';
import relatorioRoutes from './routes/relatorioRoutes';
import notificacaoRoutes from './routes/notificacaoRoutes';
import importacaoRoutes from './routes/importacaoRoutes';
import externaRoutes from './routes/externaRoutes';

// Importação do WebSocket
import { WebSocketServer } from 'ws';

// Seed automático em banco vazio (ver src/config/autoSeed.ts)
import { runAutoSeedIfNeeded } from './config/autoSeed';

dotenv.config();

// Garante horário de Brasília mesmo se ninguém tiver definido TZ em lugar
// nenhum (Dockerfile/docker-compose/.env já definem, mas isso é um último
// fallback para rodar `npm run dev` sem nenhum deles configurado).
process.env.TZ = process.env.TZ || 'America/Sao_Paulo';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES
// ============================================

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// SERVER ARQUIVOS ESTÁTICOS
// ============================================
// Em MPA, cada aba é um .html próprio em public/app/. O express.static já
// serve todos eles. Desabilitamos cache em desenvolvimento para evitar que
// o navegador sirva versões antigas de JS/CSS após rebuild do frontend.

app.use(
  express.static('public', {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  })
);

app.use('/app', express.static(path.join(__dirname, '../public/app')));

// ============================================
// ROTAS DA API (DEVEM VIR ANTES DO FALLBACK)
// ============================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'API Gestão de Gado funcionando!',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      api: 'online',
      websocket: 'online',
      database: 'online'
    }
  });
});

app.use('/api', routes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/importacao', importacaoRoutes);
app.use('/api/externa', externaRoutes);

// ============================================
// FALLBACK (MPA)
// ============================================
// Em MPA cada aba é um .html próprio dentro de public/app/. O express.static
// acima já serve esses arquivos quando existem. Este fallback só cobre dois
// casos:
// 1. "/" → landing page.
// 2. "/app/<algo>" SEM extensão (ex.: "/app/relatorios") → manda o
//    relatorios.html. Isso é conveniência para URLs "bonitas"; o caminho
//    normal é /app/relatorios.html.
// Qualquer outra rota que não seja da API cai na landing.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) return next();

  if (req.path === '/' || req.path === '') {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }

  // /app/<pagina> (sem .html) → /app/<pagina>.html, se o arquivo existir.
  const match = /^\/app\/([a-z0-9_-]+)\/?$/i.exec(req.path);
  if (match) {
    const arquivo = path.join(__dirname, `../public/app/${match[1]}.html`);
    return res.sendFile(arquivo, (err) => {
      if (err) res.sendFile(path.join(__dirname, '../public/app/dashboard.html'));
    });
  }

  // Qualquer outra coisa cai na landing.
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================
// MIDDLEWARE DE ERRO (GLOBAL)
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Erro:', err.stack);

  const status = err.message.includes('não encontrado')
    ? 404
    : err.message.includes('inválido')
      ? 400
      : err.message.includes('não permitido')
        ? 403
        : err.message.includes('já cadastrado')
          ? 409
          : 500;

  res.status(status).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// CRIAR SERVIDOR HTTP
// ============================================

const server = http.createServer(app);

// ============================================
// WEBSOCKET
// ============================================

const wss = new WebSocketServer({
  server,
  path: '/ws'
});

const clients = new Set<any>();

wss.on('connection', (ws, req) => {
  console.log('📡 Cliente conectado ao WebSocket');

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Token não fornecido'
      })
    );
    ws.close();
    return;
  }

  clients.add(ws);

  sendDashboardData(ws);

  ws.on('message', message => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📩 Mensagem recebida:', data);

      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('📡 Cliente desconectado');
  });
});

async function sendDashboardData(ws: any) {
  try {
    const prisma = (await import('./config/database')).default;

    const [totalAnimais, totalFemeas, totalMachos, producaoTotal, producoesDia] = await Promise.all([
      prisma.animal.count({ where: { ativo: true } }),
      prisma.animal.count({ where: { ativo: true, sexo: 'F' } }),
      prisma.animal.count({ where: { ativo: true, sexo: 'M' } }),
      prisma.producaoLeite.aggregate({ _sum: { litros: true } }),
      prisma.producaoLeite.count({
        where: {
          data_coleta: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    ws.send(
      JSON.stringify({
        type: 'dashboard',
        data: {
          totalAnimais,
          totalFemeas,
          totalMachos,
          producaoTotal: Number(producaoTotal._sum.litros) || 0,
          producoesHoje: producoesDia,
          timestamp: new Date().toISOString()
        }
      })
    );
  } catch (error) {
    console.error('Erro ao enviar dados do dashboard:', error);
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Erro ao buscar dados do dashboard'
      })
    );
  }
}

setInterval(() => {
  clients.forEach(client => {
    if (client.readyState === 1) {
      sendDashboardData(client);
    }
  });
}, 30000);

function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

export { broadcast, wss };

// ============================================
// INICIAR SERVIDOR
// ============================================

async function iniciarServidor(): Promise<void> {
  // Roda o seed automaticamente se o banco estiver vazio (desativável via AUTO_SEED=false).
  await runAutoSeedIfNeeded();

  server.listen(PORT, () => {
    console.log('========================================');
    console.log('🐄 GESTÃO DE GADO - SERVIDOR INICIADO');
    console.log('========================================');
    console.log(`🚀 API: http://localhost:${PORT}/api`);
    console.log(`📡 WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`🏠 Landing Page: http://localhost:${PORT}/`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/app/dashboard.html`);
    console.log(`🐮 Rebanho: http://localhost:${PORT}/app/animais.html`);
    console.log(`🥛 Produções: http://localhost:${PORT}/app/producoes.html`);
    console.log(`📋 Relatórios: http://localhost:${PORT}/app/relatorios.html`);
    console.log(`👤 Usuários: http://localhost:${PORT}/app/usuarios.html`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log('========================================');
  });
}

iniciarServidor();

process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  wss.close();
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando servidor (SIGTERM)...');
  wss.close();
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

export default app;