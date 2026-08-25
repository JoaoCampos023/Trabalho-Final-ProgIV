import { UserRepository } from '../repositories/UserRepository';
import { User, IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Validar CPF (simplificado - igual ao do projeto original)
   */
  private validarCpf(cpf: string): boolean {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) return false;
    
    // Elimina CPFs com todos os dígitos iguais
    if (/^(\d)\1+$/.test(cpfLimpo)) return false;
    
    // Cálculo do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cpfLimpo.charAt(9)) !== digito1) return false;
    
    // Cálculo do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    return parseInt(cpfLimpo.charAt(10)) === digito2;
  }

  /**
   * Buscar todos os usuários
   */
  async listarTodos(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  /**
   * Buscar usuário por ID
   */
  async buscarPorId(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  /**
   * Buscar usuário por email
   */
  async buscarPorEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Buscar usuários com paginação e filtros
   */
  async listarComFiltros(
    page: number = 1,
    limit: number = 10,
    filters?: {
      nome?: string;
      email?: string;
      role?: string;
      ativo?: boolean;
    }
  ) {
    return await this.userRepository.findWithPagination(page, limit, filters);
  }

  /**
   * Criar um novo usuário
   */
  async criarUsuario(
    data: {
      nome: string;
      email: string;
      password: string;
      cpf: string;
      role?: 'Admin' | 'Cliente';
    }
  ): Promise<User> {
    // Validar CPF
    if (!this.validarCpf(data.cpf)) {
      throw new Error('CPF inválido');
    }

    // Verificar se email já existe
    const emailExistente = await this.userRepository.findByEmail(data.email);
    if (emailExistente) {
      throw new Error('Email já cadastrado');
    }

    // Verificar se CPF já existe
    const cpfExistente = await this.userRepository.findByCpf(data.cpf);
    if (cpfExistente) {
      throw new Error('CPF já cadastrado');
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Criar usuário
    const user = await this.userRepository.create({
      nome: data.nome,
      email: data.email,
      password_hash: passwordHash,
      cpf: data.cpf,
      ativo: true,
      role: data.role || 'Cliente'
    });

    return user;
  }

  /**
   * Atualizar um usuário
   */
  async atualizarUsuario(
    id: string,
    data: {
      nome?: string;
      cpf?: string;
      role?: 'Admin' | 'Cliente';
      ativo?: boolean;
    }
  ): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Validar CPF se foi alterado
    if (data.cpf && data.cpf !== user.cpf) {
      if (!this.validarCpf(data.cpf)) {
        throw new Error('CPF inválido');
      }
      
      const cpfExistente = await this.userRepository.findByCpf(data.cpf);
      if (cpfExistente && cpfExistente.id !== id) {
        throw new Error('CPF já cadastrado por outro usuário');
      }
    }

    // Proteger o admin principal
    if (user.email === 'admin@admin.com') {
      // Não permite alterar role do admin principal
      if (data.role && data.role !== 'Admin') {
        throw new Error('Não é permitido alterar o nível de permissão do Administrador Principal');
      }
      
      // Não permite desativar o admin principal
      if (data.ativo === false) {
        throw new Error('Não é permitido desativar o Administrador Principal');
      }
    }

    const updatedUser = await this.userRepository.update(id, data);
    if (!updatedUser) {
      throw new Error('Erro ao atualizar usuário');
    }

    return updatedUser;
  }

  /**
   * Alterar status do usuário (ativar/desativar)
   */
  async toggleStatus(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Proteger admin principal
    if (user.email === 'admin@admin.com') {
      throw new Error('Não é permitido alterar o status do Administrador Principal');
    }

    const updatedUser = user.ativo
      ? await this.userRepository.deactivate(id)
      : await this.userRepository.activate(id);

    if (!updatedUser) {
      throw new Error('Erro ao alterar status do usuário');
    }

    return updatedUser;
  }

  /**
   * Resetar senha do usuário
   */
  async resetarSenha(id: string): Promise<{ novaSenha: string; user: User }> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Proteger admin principal
    if (user.email === 'admin@admin.com') {
      throw new Error('Não é permitido resetar a senha do Administrador Principal');
    }

    // Gerar senha aleatória de 8 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let novaSenha = '';
    for (let i = 0; i < 8; i++) {
      novaSenha += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(novaSenha, salt);

    const updatedUser = await this.userRepository.update(id, {
      password_hash: passwordHash
    });

    if (!updatedUser) {
      throw new Error('Erro ao resetar senha');
    }

    return { novaSenha, user: updatedUser };
  }

  /**
   * Excluir usuário
   */
  async excluirUsuario(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Proteger admin principal
    if (user.email === 'admin@admin.com') {
      throw new Error('Não é permitido excluir o Administrador Principal');
    }

    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new Error('Erro ao excluir usuário');
    }
  }

  /**
   * Login do usuário
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Buscar usuário por email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar se usuário está ativo
    if (!user.ativo) {
      throw new Error('Esta conta está desativada. Entre em contato com o administrador.');
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(password, user.password_hash);
    if (!senhaValida) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  /**
   * Obter estatísticas de usuários
   */
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

    return {
      total,
      totalAtivos,
      totalInativos,
      totalAdmins,
      totalClientes
    };
  }
}