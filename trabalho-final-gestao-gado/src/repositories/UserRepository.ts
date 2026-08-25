import pool from '../config/database';
import { User, IUser } from '../models/User';
import { PoolClient } from 'pg';

export class UserRepository {
  /**
   * Buscar todos os usuários
   */
  async findAll(): Promise<User[]> {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY nome ASC'
    );
    return result.rows.map(row => new User(row));
  }

  /**
   * Buscar usuário por ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  /**
   * Buscar usuário por email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  /**
   * Buscar usuário por CPF
   */
  async findByCpf(cpf: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE cpf = $1',
      [cpf]
    );
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  /**
   * Buscar usuários ativos/inativos
   */
  async findByStatus(ativo: boolean): Promise<User[]> {
    const result = await pool.query(
      'SELECT * FROM users WHERE ativo = $1 ORDER BY nome ASC',
      [ativo]
    );
    return result.rows.map(row => new User(row));
  }

  /**
   * Buscar usuários por role
   */
  async findByRole(role: string): Promise<User[]> {
    const result = await pool.query(
      'SELECT * FROM users WHERE role = $1 ORDER BY nome ASC',
      [role]
    );
    return result.rows.map(row => new User(row));
  }

  /**
   * Criar um novo usuário
   */
  async create(userData: Omit<IUser, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (nome, email, password_hash, cpf, ativo, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userData.nome,
        userData.email,
        userData.password_hash,
        userData.cpf,
        userData.ativo ?? true,
        userData.role ?? 'Cliente'
      ]
    );
    return new User(result.rows[0]);
  }

  /**
   * Atualizar um usuário
   */
  async update(id: string, userData: Partial<IUser>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (userData.nome !== undefined) {
      fields.push(`nome = $${paramCount++}`);
      values.push(userData.nome);
    }
    if (userData.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(userData.email);
    }
    if (userData.password_hash !== undefined) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(userData.password_hash);
    }
    if (userData.cpf !== undefined) {
      fields.push(`cpf = $${paramCount++}`);
      values.push(userData.cpf);
    }
    if (userData.ativo !== undefined) {
      fields.push(`ativo = $${paramCount++}`);
      values.push(userData.ativo);
    }
    if (userData.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(userData.role);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  /**
   * Desativar um usuário (soft delete)
   */
  async deactivate(id: string): Promise<User | null> {
    const result = await pool.query(
      'UPDATE users SET ativo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  /**
   * Ativar um usuário
   */
  async activate(id: string): Promise<User | null> {
    const result = await pool.query(
      'UPDATE users SET ativo = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  /**
   * Deletar um usuário (físico)
   */
  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  /**
   * Contar total de usuários
   */
  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as total FROM users');
    return parseInt(result.rows[0].total);
  }

  /**
   * Contar usuários por status
   */
  async countByStatus(ativo: boolean): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE ativo = $1',
      [ativo]
    );
    return parseInt(result.rows[0].total);
  }

  /**
   * Contar usuários por role
   */
  async countByRole(role: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role = $1',
      [role]
    );
    return parseInt(result.rows[0].total);
  }

  /**
   * Buscar com paginação
   */
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
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM users WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.nome) {
      query += ` AND nome ILIKE $${paramCount++}`;
      values.push(`%${filters.nome}%`);
    }
    if (filters?.email) {
      query += ` AND email ILIKE $${paramCount++}`;
      values.push(`%${filters.email}%`);
    }
    if (filters?.role) {
      query += ` AND role = $${paramCount++}`;
      values.push(filters.role);
    }
    if (filters?.ativo !== undefined) {
      query += ` AND ativo = $${paramCount++}`;
      values.push(filters.ativo);
    }

    // Contar total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Buscar dados com paginação
    query += ` ORDER BY nome ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      users: result.rows.map(row => new User(row)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}