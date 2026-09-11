import request from 'supertest';
import app from '../../app';

/**
 * Testa as rotas de auth de ponta a ponta.
 *
 * Estas rotas são públicas e a lógica central é validação de entrada — dá
 * para testar sem banco dedicado (os caminhos testados retornam antes de
 * bater no Prisma).
 */
describe('Rotas /api/auth', () => {
  describe('POST /api/auth/login', () => {
    it('devolve 400 se faltar email ou senha', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('devolve 400 se só email for enviado', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('devolve 400 se faltar campos obrigatórios', async () => {
      const res = await request(app).post('/api/auth/register').send({ nome: 'X' });
      expect(res.status).toBe(400);
    });

    it('devolve 400 se a senha tiver menos de 3 caracteres', async () => {
      const res = await request(app).post('/api/auth/register').send({
        nome: 'Teste',
        email: 'teste@example.com',
        password: 'ab',
        cpf: '11144477735'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/senha/i);
    });
  });
});