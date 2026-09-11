import { Animal } from './Animal';

export enum PeriodoProducao {
  Manha = 'Manha',
  Tarde = 'Tarde',
  Noite = 'Noite'
}

export interface IProducaoLeite {
  id: number;
  animal_brinco: number;
  data_coleta: Date;
  litros: number;
  periodo: PeriodoProducao;
  criado_em: Date;
  atualizado_em: Date;
}

export class ProducaoLeite {
  id: number;
  animal_brinco: number;
  data_coleta: Date;
  litros: number;
  periodo: PeriodoProducao;
  criado_em: Date;
  atualizado_em: Date;

  animal?: Animal;

  constructor(data: IProducaoLeite) {
    this.id = data.id;
    this.animal_brinco = data.animal_brinco;
    this.data_coleta = data.data_coleta;
    this.litros = data.litros;
    this.periodo = data.periodo;
    this.criado_em = data.criado_em || new Date();
    this.atualizado_em = data.atualizado_em || new Date();
  }

  get isManha(): boolean {
    return this.periodo === PeriodoProducao.Manha;
  }

  get isTarde(): boolean {
    return this.periodo === PeriodoProducao.Tarde;
  }

  get isNoite(): boolean {
    return this.periodo === PeriodoProducao.Noite;
  }

  get nomePeriodo(): string {
    const map = {
      [PeriodoProducao.Manha]: '🌅 Manhã',
      [PeriodoProducao.Tarde]: '☀️ Tarde',
      [PeriodoProducao.Noite]: '🌙 Noite'
    };
    return map[this.periodo];
  }

  get nomeAnimal(): string {
    return this.animal?.nome || `Animal ${this.animal_brinco}`;
  }
}
