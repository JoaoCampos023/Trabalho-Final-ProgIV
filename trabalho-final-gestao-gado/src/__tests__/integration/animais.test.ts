import request from 'supertest';
import app from '../../app';

/**
 * Testa que as rotas de animais estão protegidas por auth — o teste mais
 * barato e mais importante de integração: garante que ninguém acessa
 * dados sem token.
 */
describe('Rotas /api/animais — proteção de auth', () => {
  it('GET /api/animais sem token devolve 401', async () => {
    const res = await request(app).get('/api/animais');
    expect(res.status).toBe(401);
  });

  it('GET /api/animais com token inválido devolve 401', async () => {
    const res = await request(app).get('/api/animais').set('Authorization', 'Bearer token_invalido');
    expect(res.status).toBe(401);
  });

  it('GET /api/animais com formato de header errado devolve 401', async () => {
    // Sem "Bearer " na frente.
    const res = await request(app).get('/api/animais').set('Authorization', 'token_sem_bearer');
    expect(res.status).toBe(401);
  });
});