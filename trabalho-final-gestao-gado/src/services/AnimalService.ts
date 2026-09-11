import { AnimalRepository } from '../repositories/AnimalRepository';
import { ProducaoRepository } from '../repositories/ProducaoRepository';
import { Animal, IAnimal } from '../models/Animal';

const IDADE_MAXIMA_ANOS = 50;
// Coluna "peso" é Decimal(10,2) no banco — até 8 dígitos antes da vírgula.
// Na prática nenhum bovino pesa isso; usamos um teto bem generoso (5 toneladas)
// só pra rejeitar valores digitados errado antes de virarem erro cru do Postgres.
const PESO_MAXIMO_KG = 5000;

export class AnimalService {
  private animalRepository: AnimalRepository;
  private producaoRepository: ProducaoRepository;

  constructor() {
    this.animalRepository = new AnimalRepository();
    this.producaoRepository = new ProducaoRepository();
  }

  /**
   * Validar data de nascimento
   * - Não pode ser no futuro.
   * - Não pode ser absurdamente antiga (idade resultante maior que IDADE_MAXIMA_ANOS).
   */
  private validarDataNascimento(dataNascimento: Date): void {
    const hoje = new Date();
    if (dataNascimento > hoje) {
      throw new Error('A data de nascimento não pode ser no futuro.');
    }

    const dataLimite = new Date(hoje);
    dataLimite.setFullYear(dataLimite.getFullYear() - IDADE_MAXIMA_ANOS);
    if (dataNascimento < dataLimite) {
      throw new Error(`A data de nascimento não pode resultar em uma idade maior que ${IDADE_MAXIMA_ANOS} anos.`);
    }
  }

  /**
   * Validar linhagem (igual ao projeto original em C#)
   */
  private async validarLinhagem(animal: Partial<IAnimal>): Promise<void> {
    // 1. Evitar auto-relacionamentos diretos
    if (animal.brinco_pai === animal.brinco) {
      throw new Error('Um animal não pode ser pai de si mesmo.');
    }
    if (animal.brinco_mae === animal.brinco) {
      throw new Error('Um animal não pode ser mãe de si mesmo.');
    }

    // 2. Impedir consanguinidade direta
    if (animal.brinco_pai && animal.brinco_mae && animal.brinco_pai === animal.brinco_mae) {
      throw new Error('Inconsistência genética: O pai e a mãe não podem ser o mesmo animal.');
    }

    // 3. Validações para o Pai
    if (animal.brinco_pai) {
      const pai = await this.animalRepository.findByBrinco(animal.brinco_pai);
      if (!pai) {
        throw new Error(`O brinco do pai informado (${animal.brinco_pai}) não existe.`);
      }
      if (pai.sexo !== 'M') {
        throw new Error('O pai deve ser um animal do sexo MACHO.');
      }
      if (animal.data_nascimento && pai.data_nascimento >= animal.data_nascimento) {
        throw new Error(
          `Inconsistência cronológica: O pai (Nascimento: ${pai.data_nascimento.toLocaleDateString()}) não pode ser mais novo ou ter nascido no mesmo dia que o filho (${animal.data_nascimento.toLocaleDateString()}).`
        );
      }
    }

    // 4. Validações para a Mãe
    if (animal.brinco_mae) {
      const mae = await this.animalRepository.findByBrinco(animal.brinco_mae);
      if (!mae) {
        throw new Error(`O brinco da mãe informado (${animal.brinco_mae}) não existe.`);
      }
      if (mae.sexo !== 'F') {
        throw new Error('A mãe deve ser um animal do sexo FÊMEA.');
      }
      if (animal.data_nascimento && mae.data_nascimento >= animal.data_nascimento) {
        throw new Error(
          `Inconsistência cronológica: A mãe (Nascimento: ${mae.data_nascimento.toLocaleDateString()}) não pode ser mais nova ou ter nascido no mesmo dia que o filho (${animal.data_nascimento.toLocaleDateString()}).`
        );
      }
    }

    // 5. Impedir cruzamento incestuoso de Primeiro Grau invertido
    if (animal.brinco_pai) {
      const paiDoAnimal = await this.animalRepository.findByBrinco(animal.brinco_pai);
      if (paiDoAnimal && (paiDoAnimal.brinco_pai === animal.brinco || paiDoAnimal.brinco_mae === animal.brinco)) {
        throw new Error(
          'Bloqueio de consanguinidade: Este animal não pode ser filho de um animal do qual ele já consta como ancestral (pai/mãe).'
        );
      }
    }
  }

  /**
   * Listar todos os animais ativos
   */
  async listarTodos(): Promise<Animal[]> {
    return await this.animalRepository.findAll();
  }

  /**
   * Listar animais com filtros
   */
  async listarComFiltros(
    searchNome?: string,
    sexo?: 'M' | 'F',
    raca?: string,
    faixaPeso?: string,
    ordenarPor: string = 'brinco',
    ordem: 'asc' | 'desc' = 'asc',
    status: 'ativos' | 'inativos' | 'todos' = 'ativos'
  ): Promise<Animal[]> {
    let animais = await this.animalRepository.findAllIncludingInactive();

    // Filtrar por status (ativo/inativo)
    if (status === 'ativos') {
      animais = animais.filter(a => a.ativo);
    } else if (status === 'inativos') {
      animais = animais.filter(a => !a.ativo);
    }

    // Filtrar por nome
    if (searchNome) {
      animais = animais.filter(a => a.nome.toLowerCase().includes(searchNome.toLowerCase()));
    }

    // Filtrar por sexo
    if (sexo) {
      animais = animais.filter(a => a.sexo === sexo);
    }

    // Filtrar por raça
    if (raca) {
      animais = animais.filter(a => a.raca && a.raca.toLowerCase().includes(raca.toLowerCase()));
    }

    // Filtrar por faixa de peso
    if (faixaPeso) {
      switch (faixaPeso) {
        case 'leve':
          animais = animais.filter(a => a.peso < 200);
          break;
        case 'medio':
          animais = animais.filter(a => a.peso >= 200 && a.peso < 400);
          break;
        case 'pesado':
          animais = animais.filter(a => a.peso >= 400);
          break;
      }
    }

    // Ordenar
    switch (ordenarPor) {
      case 'nome':
        animais.sort((a, b) => (ordem === 'asc' ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome)));
        break;
      case 'peso':
        animais.sort((a, b) => (ordem === 'asc' ? a.peso - b.peso : b.peso - a.peso));
        break;
      case 'data_nascimento':
        animais.sort((a, b) =>
          ordem === 'asc'
            ? a.data_nascimento.getTime() - b.data_nascimento.getTime()
            : b.data_nascimento.getTime() - a.data_nascimento.getTime()
        );
        break;
      default: // brinco
        animais.sort((a, b) => (ordem === 'asc' ? a.brinco - b.brinco : b.brinco - a.brinco));
        break;
    }

    return animais;
  }

  /**
   * Buscar animal por brinco
   */
  async buscarPorBrinco(brinco: number): Promise<Animal | null> {
    return await this.animalRepository.findByBrinco(brinco);
  }

  /**
   * Buscar com pais (para árvore genealógica)
   */
  async buscarComPais(brinco: number): Promise<Animal | null> {
    return await this.animalRepository.findWithParents(brinco);
  }

  /**
   * Buscar árvore genealógica completa
   */
  async buscarArvoreGenealogica(brinco: number): Promise<Animal | null> {
    return await this.animalRepository.findFamilyTree(brinco);
  }

  /**
   * Buscar machos para seleção
   */
  async buscarMachosParaSelecao(excluirBrinco?: number): Promise<Animal[]> {
    return await this.animalRepository.findMachosParaSelecao(excluirBrinco);
  }

  /**
   * Buscar fêmeas para seleção
   */
  async buscarFemeasParaSelecao(excluirBrinco?: number): Promise<Animal[]> {
    return await this.animalRepository.findFemeasParaSelecao(excluirBrinco);
  }

  /**
   * Cadastrar um novo animal
   */
  async cadastrarAnimal(data: Omit<IAnimal, 'criado_em' | 'atualizado_em'>): Promise<Animal> {
    // Validar dados básicos
    if (!data.nome || data.nome.trim().length === 0) {
      throw new Error('O nome do animal é obrigatório.');
    }
    if (data.peso <= 0) {
      throw new Error('O peso deve ser maior que zero.');
    }
    if (data.peso > PESO_MAXIMO_KG) {
      throw new Error(`O peso não pode ser maior que ${PESO_MAXIMO_KG} kg.`);
    }
    this.validarDataNascimento(data.data_nascimento);
    if (data.sexo !== 'M' && data.sexo !== 'F') {
      throw new Error("O sexo deve ser 'M' (Macho) ou 'F' (Fêmea).");
    }

    // Verificar se brinco já existe
    const existe = await this.animalRepository.brincoExiste(data.brinco);
    if (existe) {
      throw new Error(`Já existe um animal com o brinco ${data.brinco}.`);
    }

    // Validar linhagem
    await this.validarLinhagem(data);

    // Cadastrar animal
    return await this.animalRepository.create(data);
  }

  /**
   * Atualizar um animal
   */
  async atualizarAnimal(brinco: number, data: Partial<IAnimal>): Promise<Animal> {
    const animalExistente = await this.animalRepository.findByBrinco(brinco);
    if (!animalExistente) {
      throw new Error(`Animal com brinco ${brinco} não encontrado.`);
    }

    // Validar dados básicos se foram alterados
    if (data.nome !== undefined && data.nome.trim().length === 0) {
      throw new Error('O nome do animal é obrigatório.');
    }
    if (data.peso !== undefined && data.peso <= 0) {
      throw new Error('O peso deve ser maior que zero.');
    }
    if (data.peso !== undefined && data.peso > PESO_MAXIMO_KG) {
      throw new Error(`O peso não pode ser maior que ${PESO_MAXIMO_KG} kg.`);
    }
    if (data.data_nascimento !== undefined) {
      this.validarDataNascimento(data.data_nascimento);
    }

    // Um animal com produções de leite registradas só pode ter sido fêmea
    // (só fêmeas produzem leite) — não faz sentido trocar o sexo dele depois.
    if (data.sexo !== undefined && data.sexo !== animalExistente.sexo) {
      const producoes = await this.producaoRepository.findByAnimal(brinco);
      if (producoes.length > 0) {
        throw new Error('Não é possível alterar o sexo deste animal: ele já possui produções de leite registradas.');
      }
    }

    // Validar linhagem
    const animalParaValidar = {
      ...animalExistente,
      ...data
    };
    await this.validarLinhagem(animalParaValidar);

    const updated = await this.animalRepository.update(brinco, data);
    if (!updated) {
      throw new Error('Erro ao atualizar animal.');
    }

    return updated;
  }

  /**
   * Remover animal (soft delete)
   */
  async removerAnimal(brinco: number): Promise<void> {
    const animal = await this.animalRepository.findByBrinco(brinco);
    if (!animal) {
      throw new Error(`Animal com brinco ${brinco} não encontrado.`);
    }

    const deleted = await this.animalRepository.deactivate(brinco);
    if (!deleted) {
      throw new Error('Erro ao remover animal.');
    }
  }

  /**
   * Excluir animal (físico)
   */
  async excluirAnimal(brinco: number): Promise<void> {
    const animal = await this.animalRepository.findByBrinco(brinco);
    if (!animal) {
      throw new Error(`Animal com brinco ${brinco} não encontrado.`);
    }

    const deleted = await this.animalRepository.delete(brinco);
    if (!deleted) {
      throw new Error('Erro ao excluir animal.');
    }
  }

  /**
   * Obter estatísticas do rebanho
   */
  async getStats(): Promise<{
    total: number;
    totalMacho: number;
    totalFemea: number;
    pesoMedio: number;
    racas: { raca: string; quantidade: number }[];
  }> {
    return await this.animalRepository.getStats();
  }
}
