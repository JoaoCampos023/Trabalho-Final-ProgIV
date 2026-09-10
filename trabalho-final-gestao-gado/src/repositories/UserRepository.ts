import prisma from '../config/database';
import { User, IUser } from '../models/User';

export class UserRepository {
  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { nome: 'asc' }
    });
    return users.map(u => new User({
      id: u.id,
      nome: u.nome,
      email: u.email,
      senha_hash: u.senha_hash,
      cpf: u.cpf,
      ativo: u.ativo,
      role: u.role,
      criado_em: u.criado_em,
      atualizado_em: u.atualizado_em
    }));
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    if (!user) return null;
    return new User({
      id: user.id,
      nome: user.nome,
      email: user.email,
      senha_hash: user.senha_hash,
      cpf: user.cpf,
      ativo: user.ativo,
      role: user.role,
      criado_em: user.criado_em,
      atualizado_em: user.atualizado_em
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) return null;
    return new User({
      id: user.id,
      nome: user.nome,
      email: user.email,
      senha_hash: user.senha_hash,
      cpf: user.cpf,
      ativo: user.ativo,
      role: user.role,
      criado_em: user.criado_em,
      atualizado_em: user.atualizado_em
    });
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { cpf }
    });
    if (!user) return null;
    return new User({
      id: user.id,
      nome: user.nome,
      email: user.email,
      senha_hash: user.senha_hash,
      cpf: user.cpf,
      ativo: user.ativo,
      role: user.role,
      criado_em: user.criado_em,
      atualizado_em: user.atualizado_em
    });
  }

  async findByStatus(ativo: boolean): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { ativo },
      orderBy: { nome: 'asc' }
    });
    return users.map(u => new User({
      id: u.id,
      nome: u.nome,
      email: u.email,
      senha_hash: u.senha_hash,
      cpf: u.cpf,
      ativo: u.ativo,
      role: u.role,
      criado_em: u.criado_em,
      atualizado_em: u.atualizado_em
    }));
  }

  async findByRole(role: 'Admin' | 'Cliente'): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { role },
      orderBy: { nome: 'asc' }
    });
    return users.map(u => new User({
      id: u.id,
      nome: u.nome,
      email: u.email,
      senha_hash: u.senha_hash,
      cpf: u.cpf,
      ativo: u.ativo,
      role: u.role,
      criado_em: u.criado_em,
      atualizado_em: u.atualizado_em
    }));
  }

  async create(userData: Omit<IUser, 'id' | 'criado_em' | 'atualizado_em'>): Promise<User> {
    const user = await prisma.user.create({
      data: {
        nome: userData.nome,
        email: userData.email,
        senha_hash: userData.senha_hash,
        cpf: userData.cpf,
        ativo: userData.ativo ?? true,
        role: userData.role ?? 'Cliente'
      }
    });
    return new User({
      id: user.id,
      nome: user.nome,
      email: user.email,
      senha_hash: user.senha_hash,
      cpf: user.cpf,
      ativo: user.ativo,
      role: user.role,
      criado_em: user.criado_em,
      atualizado_em: user.atualizado_em
    });
  }

  async update(id: string, data: Partial<IUser>): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          nome: data.nome,
          email: data.email,
          senha_hash: data.senha_hash,
          cpf: data.cpf,
          ativo: data.ativo,
          role: data.role
        }
      });
      if (!user) return null;
      return new User({
        id: user.id,
        nome: user.nome,
        email: user.email,
        senha_hash: user.senha_hash,
        cpf: user.cpf,
        ativo: user.ativo,
        role: user.role,
        criado_em: user.criado_em,
        atualizado_em: user.atualizado_em
      });
    } catch (error) {
      return null;
    }
  }

  async deactivate(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { ativo: false }
      });
      if (!user) return null;
      return new User({
        id: user.id,
        nome: user.nome,
        email: user.email,
        senha_hash: user.senha_hash,
        cpf: user.cpf,
        ativo: user.ativo,
        role: user.role,
        criado_em: user.criado_em,
        atualizado_em: user.atualizado_em
      });
    } catch (error) {
      return null;
    }
  }

  async activate(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { ativo: true }
      });
      if (!user) return null;
      return new User({
        id: user.id,
        nome: user.nome,
        email: user.email,
        senha_hash: user.senha_hash,
        cpf: user.cpf,
        ativo: user.ativo,
        role: user.role,
        criado_em: user.criado_em,
        atualizado_em: user.atualizado_em
      });
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    return await prisma.user.count();
  }

  async countByStatus(ativo: boolean): Promise<number> {
    return await prisma.user.count({
      where: { ativo }
    });
  }

  async countByRole(role: 'Admin' | 'Cliente'): Promise<number> {
    return await prisma.user.count({
      where: { role }
    });
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: {
      nome?: string;
      email?: string;
      role?: string;
      ativo?: boolean;
    }
  ): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.nome) {
      where.nome = { contains: filters.nome, mode: 'insensitive' };
    }
    if (filters?.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }
    if (filters?.role) {
      where.role = filters.role;
    }
    if (filters?.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map(u => new User({
        id: u.id,
        nome: u.nome,
        email: u.email,
        senha_hash: u.senha_hash,
        cpf: u.cpf,
        ativo: u.ativo,
        role: u.role,
        criado_em: u.criado_em,
        atualizado_em: u.atualizado_em
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}
