/**
 * Tipos compartilhados do frontend.
 * Espelham os dados retornados pela API (ver src/models/* no backend).
 */

type Role = 'Admin' | 'Cliente';

type Sexo = 'M' | 'F';

type Periodo = 'Manha' | 'Tarde' | 'Noite';

interface Animal {
  brinco: number;
  nome: string;
  sexo: Sexo;
  raca?: string | null;
  peso: number;
  data_nascimento: string;
  idade?: number;
  ativo: boolean;
  brinco_pai?: number | null;
  brinco_mae?: number | null;
  criado_em?: string;
  atualizado_em?: string;
  pai?: Animal | null;
  mae?: Animal | null;
}

interface ProducaoLeite {
  id: number;
  animal_brinco: number;
  data_coleta: string;
  litros: number;
  periodo: Periodo;
  animal?: Animal;
  criado_em?: string;
  atualizado_em?: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  role: Role;
  ativo: boolean;
  criado_em?: string;
}

interface UsuarioLogado {
  nome: string;
  email: string;
  role: Role;
}

interface ArvoreGenealogica {
  animal: Animal;
  pai?: Animal | null;
  mae?: Animal | null;
  filhos?: Animal[];
}

/** Envelope padrão de resposta da API (ver middlewares/errorHandler no backend). */
interface ApiEnvelope<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/** Retorno de toda chamada feita pela classe Api: o corpo já parseado + o status HTTP. */
interface ApiResult<T = any> {
  data: ApiEnvelope<T>;
  status: number;
}

/** Chart.js é carregado via CDN (script global, sem tipos) nas páginas que exibem gráficos. */
declare const Chart: any;
