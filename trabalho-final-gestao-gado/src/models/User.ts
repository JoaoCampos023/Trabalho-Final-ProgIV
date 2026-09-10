export type Role = 'Admin' | 'Cliente';

export interface IUser {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  cpf: string;
  ativo: boolean;
  role: Role;
  criado_em: Date;
  atualizado_em: Date;
}

export class User {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  cpf: string;
  ativo: boolean;
  role: Role;
  criado_em: Date;
  atualizado_em: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.nome = data.nome;
    this.email = data.email;
    this.senha_hash = data.senha_hash;
    this.cpf = data.cpf;
    this.ativo = data.ativo ?? true;
    this.role = data.role ?? 'Cliente';
    this.criado_em = data.criado_em || new Date();
    this.atualizado_em = data.atualizado_em || new Date();
  }

  // Propriedades calculadas (como no projeto original)
  get isAdmin(): boolean {
    return this.role === 'Admin';
  }

  get isActive(): boolean {
    return this.ativo;
  }

  // Método para retornar dados públicos (sem senha)
  toPublicJSON() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      cpf: this.cpf,
      role: this.role,
      ativo: this.ativo,
      criado_em: this.criado_em
    };
  }
}
