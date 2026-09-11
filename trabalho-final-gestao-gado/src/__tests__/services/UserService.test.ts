import { UserService } from '../../services/UserService';
import { UserRepository } from '../../repositories/UserRepository';
import { User } from '../../models/User';

// Mocka o repositório inteiro — assim o teste não toca no banco.
jest.mock('../../repositories/UserRepository');

/**
 * Testa as regras de negócio do UserService que NÃO podem regredir:
 * proteção do admin principal e bloqueio de auto-exclusão/auto-desativação.
 */
describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<UserRepository>;

  const adminPrincipal = new User({
    id: 'admin-id',
    nome: 'admin',
    email: 'admin@gmail.com',
    senha_hash: 'hash',
    cpf: '11144477735',
    ativo: true,
    role: 'Admin',
    criado_em: new Date(),
    atualizado_em: new Date()
  });

  const clienteComum = new User({
    id: 'cliente-id',
    nome: 'Maria',
    email: 'maria@fazenda.com',
    senha_hash: 'hash',
    cpf: '22255588800',
    ativo: true,
    role: 'Cliente',
    criado_em: new Date(),
    atualizado_em: new Date()
  });

  beforeEach(() => {
    service = new UserService();
    repo = new UserRepository() as jest.Mocked<UserRepository>;
    (service as any).userRepository = repo;
  });

  describe('excluirUsuario', () => {
    it('bloqueia exclusão do admin principal', async () => {
      repo.findById.mockResolvedValue(adminPrincipal);
      await expect(service.excluirUsuario('admin-id', 'outro-admin')).rejects.toThrow(
        /Administrador Principal/
      );
    });

    it('bloqueia auto-exclusão', async () => {
      repo.findById.mockResolvedValue(clienteComum);
      await expect(service.excluirUsuario('cliente-id', 'cliente-id')).rejects.toThrow(
        /sua própria conta/
      );
    });

    it('exclui usuário comum normalmente', async () => {
      repo.findById.mockResolvedValue(clienteComum);
      repo.delete.mockResolvedValue(true);
      await expect(service.excluirUsuario('cliente-id', 'admin-id')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('cliente-id');
    });

    it('erro se usuário não existe', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.excluirUsuario('x', 'admin-id')).rejects.toThrow(/não encontrado/);
    });
  });

  describe('atualizarUsuario', () => {
    it('bloqueia rebaixar o admin principal a Cliente', async () => {
      repo.findById.mockResolvedValue(adminPrincipal);
      await expect(
        service.atualizarUsuario('admin-id', { role: 'Cliente' }, 'admin-id')
      ).rejects.toThrow(/Administrador Principal/);
    });

    it('bloqueia o admin logado de se rebaixar', async () => {
      const outroAdmin = new User({
        ...clienteComum,
        id: 'outro-admin',
        email: 'outro@fazenda.com',
        role: 'Admin'
      });
      repo.findById.mockResolvedValue(outroAdmin);
      await expect(
        service.atualizarUsuario('outro-admin', { role: 'Cliente' }, 'outro-admin')
      ).rejects.toThrow(/seu próprio nível/);
    });
  });

  describe('toggleStatus', () => {
    it('bloqueia desativar o admin principal', async () => {
      repo.findById.mockResolvedValue(adminPrincipal);
      await expect(service.toggleStatus('admin-id', 'outro-admin')).rejects.toThrow(
        /Administrador Principal/
      );
    });

    it('bloqueia desativar a si mesmo', async () => {
      repo.findById.mockResolvedValue(clienteComum);
      await expect(service.toggleStatus('cliente-id', 'cliente-id')).rejects.toThrow(
        /sua própria conta/
      );
    });
  });
});