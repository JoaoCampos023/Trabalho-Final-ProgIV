export interface IAnimal {
    brinco: number;
    nome: string;
    sexo: 'M' | 'F';
    raca?: string;
    peso: number;
    data_nascimento: Date;
    ativo: boolean;
    brinco_pai?: number | null;
    brinco_mae?: number | null;
    created_at: Date;
    updated_at: Date;
}

export class Animal {
    brinco: number;
    nome: string;
    sexo: 'M' | 'F';
    raca?: string;
    peso: number;
    data_nascimento: Date;
    ativo: boolean;
    brinco_pai?: number | null;
    brinco_mae?: number | null;
    created_at: Date;
    updated_at: Date;

    pai?: Animal;
    mae?: Animal;
    filhos_por_pai?: Animal[];
    filhos_por_mae?: Animal[];

    constructor(data: IAnimal) {
        this.brinco = data.brinco;
        this.nome = data.nome;
        this.sexo = data.sexo;
        this.raca = data.raca;
        this.peso = data.peso;
        this.data_nascimento = data.data_nascimento;
        this.ativo = data.ativo ?? true;
        this.brinco_pai = data.brinco_pai;
        this.brinco_mae = data.brinco_mae;
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }

    get idade(): number {
        const hoje = new Date();
        let idade = hoje.getFullYear() - this.data_nascimento.getFullYear();
        const mes = hoje.getMonth() - this.data_nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < this.data_nascimento.getDate())) {
            idade--;
        }
        return idade;
    }

    get nomePai(): string {
        if (this.pai) return this.pai.nome;
        if (this.brinco_pai) return `Brinco ${this.brinco_pai} (não cadastrado)`;
        return 'Não informado';
    }

    get nomeMae(): string {
        if (this.mae) return this.mae.nome;
        if (this.brinco_mae) return `Brinco ${this.brinco_mae} (não cadastrado)`;
        return 'Não informado';
    }

    get isMacho(): boolean {
        return this.sexo === 'M';
    }

    get isFemea(): boolean {
        return this.sexo === 'F';
    }

    get isAtivo(): boolean {
        return this.ativo;
    }
}