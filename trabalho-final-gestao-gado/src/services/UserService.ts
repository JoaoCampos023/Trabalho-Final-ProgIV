import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * E-mail do Administrador Principal — a conta criada pelo seed. Ela é
 * protegida contra auto-exclusão, auto-desativação e mudança de papel.
 *
 * Por que existe: sem essa proteção, o admin podia se rebaixar a Cliente
 * ou se desativar por acidente, e o sistema ficaria sem ninguém que
 * gerencia usuários — sem forma de recuperar a não ser mexer no banco.
 */
const EMAIL_ADMIN_PRINCIPAL = 'admin@gmail.com';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /** Valida CPF (dígitos verificadores + rejeita sequências iguais). */
  private validarCpf(cpf: string): boolean {
    if (!cpf) return false;
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpfLimpo)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    if (parseInt(cpfLimpo.charAt(9)) !== digito1) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;
    return parseInt(cpfLimpo.charAt(10)) === digito2;
  }

  /** Retorna true se o usuário é o Administrador Principal. */
  private isAdminPrincipal(user: User): boolean {
    return user.email.toLowerCase() === EMAIL_ADMIN_PRINCIPAL;
  }

  async listarTodos(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async buscarPorId(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  async buscarPorEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  async listarComFiltros(
    page: number = 1,
    limit: number = 10,
    filters?: { nome?: string; email?: string; role?: string; ativo?: boolean }
  ) {
    return await this.userRepository.findWithPagination(page, limit, filters);
  }

  async criarUsuario(data: {
    nome: string;
    email: string;
    password: string;
    cpf: string;
    role?: 'Admin' | 'Cliente';
  }): Promise<User> {
    if (!this.validarCpf(data.cpf)) {
      throw new Error('CPF inválido');
    }

    const emailExistente = await this.userRepository.findByEmail(data.email);
    if (emailExistente) throw new Error('Email já cadastrado');

    const cpfExistente = await this.userRepository.findByCpf(data.cpf);
    if (cpfExistente) throw new Error('CPF já cadastrado');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    return await this.userRepository.create({
      nome: data.nome,
      email: data.email,
      senha_hash: passwordHash,
      cpf: data.cpf,
      ativo: true,
      role: data.role || 'Cliente'
    });
  }

  /**
   * Atualiza um usuário.
   *
   * `solicitanteId` é o id de quem está fazendo a requisição (o admin logado).
   * Serve para bloquear auto-alterações perigosas: um admin não pode se
   * rebaixar a Cliente nem se desativar (senão perde o acesso à própria
   * gestão de usuários).
   */
  async atualizarUsuario(
    id: string,
    data: {
      nome?: string;
      cpf?: string;
      role?: 'Admin' | 'Cliente';
      ativo?: boolean;
    },
    solicitanteId?: string
  ): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('Usuário não encontrado');

    // Validar CPF se foi alterado
    if (data.cpf && data.cpf !== user.cpf) {
      if (!this.validarCpf(data.cpf)) throw new Error('CPF inválido');
      const cpfExistente = await this.userRepository.findByCpf(data.cpf);
      if (cpfExistente && cpfExistente.id !== id) {
        throw new Error('CPF já cadastrado por outro usuário');
      }
    }

    // Proteções do Administrador Principal
    if (this.isAdminPrincipal(user)) {
      if (data.role && data.role !== 'Admin') {
        throw new Error('Não é permitido alterar o nível de permissão do Administrador Principal');
      }
      if (data.ativo === false) {
        throw new Error('Não é permitido desativar o Administrador Principal');
      }
    }

    // Auto-proteção: o admin logado não pode se rebaixar nem se desativar,
    // mesmo que não seja o "principal". Sem isso, o último admin ativo
    // poderia se trancar para fora do sistema.
    if (solicitanteId && solicitanteId === id) {
      if (data.role && data.role !== user.role && data.role !== 'Admin') {
        throw new Error('Você não pode rebaixar o seu próprio nível de permissão');
      }
      if (data.ativo === false) {
        throw new Error('Você não pode desativar a sua própria conta');
      }
    }

    const updatedUser = await this.userRepository.update(id, data);
    if (!updatedUser) throw new Error('Erro ao atualizar usuário');
    return updatedUser;
  }

  async toggleStatus(id: string, solicitanteId?: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('Usuário não encontrado');

    if (this.isAdminPrincipal(user)) {
      throw new Error('Não é permitido alterar o status do Administrador Principal');
    }
    if (solicitanteId && solicitanteId === id) {
      throw new Error('Você não pode alterar o status da sua própria conta');
    }

    const updatedUser = user.ativo
      ? await this.userRepository.deactivate(id)
      : await this.userRepository.activate(id);
    if (!updatedUser) throw new Error('Erro ao alterar status do usuário');
    return updatedUser;
  }

  async resetarSenha(id: string): Promise<{ novaSenha: string; user: User }> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('Usuário não encontrado');

    if (this.isAdminPrincipal(user)) {
      throw new Error('Não é permitido resetar a senha do Administrador Principal');
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let novaSenha = '';
    for (let i = 0; i < 8; i++) novaSenha += chars.charAt(Math.floor(Math.random() * chars.length));

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(novaSenha, salt);

    const updatedUser = await this.userRepository.update(id, { senha_hash: passwordHash });
    if (!updatedUser) throw new Error('Erro ao resetar senha');
    return { novaSenha, user: updatedUser };
  }

  /**
   * Exclui um usuário.
   *
   * `solicitanteId` bloqueia auto-exclusão: o admin logado não pode apagar
   * a própria conta enquanto está usando o sistema (senão perde o acesso
   * imediatamente).
   */
  async excluirUsuario(id: string, solicitanteId?: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('Usuário não encontrado');

    if (this.isAdminPrincipal(user)) {
      throw new Error('Não é permitido excluir o Administrador Principal');
    }
    if (solicitanteId && solicitanteId === id) {
      throw new Error('Você não pode excluir a sua própria conta');
    }

    const deleted = await this.userRepository.delete(id);
    if (!deleted) throw new Error('Erro ao excluir usuário');
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('Email ou senha inválidos');
    if (!user.ativo) throw new Error('Esta conta está desativada. Entre em contato com o administrador.');

    const senhaValida = await bcrypt.compare(password, user.senha_hash);
    if (!senhaValida) throw new Error('Email ou senha inválidos');

    const token = jwt.sign(
      { id: user.id, email: user.email, nome: user.nome, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  async getStats(): Promise<{
    total: number;
    totalAtivos: number;
    totalInativos: number;
    totalAdmins: number;
    totalClientes: number;
  }> {
    const total = await this.userRepository.count();
    const totalAtivos = await this.userRepository.countByStatus(true);
    const totalInativos = await this.userRepository.countByStatus(false);
    const totalAdmins = await this.userRepository.countByRole('Admin');
    const totalClientes = await this.userRepository.countByRole('Cliente');
    return { total, totalAtivos, totalInativos, totalAdmins, totalClientes };
  }
}