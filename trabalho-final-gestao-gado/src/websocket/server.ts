import { WebSocketServer, WebSocket } from 'ws';
import prisma from '../config/database';

const wss = new WebSocketServer({ port: 8080 });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('📡 Cliente conectado ao WebSocket');
  clients.add(ws);

  // Enviar dados iniciais
  sendDashboardData(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('📡 Cliente desconectado');
  });
});

async function sendDashboardData(ws: WebSocket) {
  try {
    const stats = await prisma.animal.aggregate({
      _count: { brinco: true }
    });

    const producoes = await prisma.producaoLeite.aggregate({
      _sum: { litros: true }
    });

    ws.send(JSON.stringify({
      type: 'dashboard',
      data: {
        totalAnimais: stats._count.brinco || 0,
        totalLitros: producoes._sum.litros || 0,
        timestamp: new Date().toISOString()
      }
    }));
  } catch (error) {
    console.error('Erro ao enviar dados:', error);
  }
}

// Atualizar todos os clientes a cada 30 segundos
setInterval(() => {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      sendDashboardData(client);
    }
  });
}, 30000);

export default wss;