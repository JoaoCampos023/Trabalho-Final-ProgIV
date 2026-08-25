export interface IUser {
  id: string;
  nome: string;
  email: string;
  password_hash: string;
  cpf: string;
  ativo: boolean;
  role: 'Admin' | 'Cliente';
  created_at: Date;
  updated_at: Date;
}

export class User {
  id: string;
  nome: string;
  email: string;
  password_hash: string;
  cpf: string;
  ativo: boolean;
  role: 'Admin' | 'Cliente';
  created_at: Date;
  updated_at: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.nome = data.nome;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.cpf = data.cpf;
    this.ativo = data.ativo ?? true;
    this.role = data.role ?? 'Cliente';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
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
      created_at: this.created_at
    };
  }
}