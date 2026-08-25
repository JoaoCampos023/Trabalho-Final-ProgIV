import { ProducaoRepository } from '../repositories/ProducaoRepository';
import { AnimalRepository } from '../repositories/AnimalRepository';
import { ProducaoLeite, IProducaoLeite, PeriodoProducao } from '../models/ProducaoLeite';

export class ProducaoService {
  private producaoRepository: ProducaoRepository;
  private animalRepository: AnimalRepository;

  constructor() {
    this.producaoRepository = new ProducaoRepository();
    this.animalRepository = new AnimalRepository();
  }

  /**
   * Listar todas as produções
   */
  async listarTodas(): Promise<ProducaoLeite[]> {
    return await this.producaoRepository.findAll();
  }

  /**
   * Listar produções com filtros
   */
  async listarComFiltros(
    dataInicio?: Date,
    dataFim?: Date,
    animalBrinco?: number,
    periodo?: PeriodoProducao
  ): Promise<ProducaoLeite[]> {
    return await this.producaoRepository.findWithFilters(
      dataInicio,
      dataFim,
      animalBrinco,
      periodo
    );
  }

  /**
   * Buscar produção por ID
   */
  async buscarPorId(id: number): Promise<ProducaoLeite | null> {
    return await this.producaoRepository.findById(id);
  }

  /**
   * Buscar produções por animal
   */
  async listarPorAnimal(animalBrinco: number): Promise<ProducaoLeite[]> {
    // Verificar se o animal existe
    const animal = await this.animalRepository.findByBrinco(animalBrinco);
    if (!animal) {
      throw new Error(`Animal com brinco ${animalBrinco} não encontrado.`);
    }
    
    return await this.producaoRepository.findByAnimal(animalBrinco);
  }

  /**
   * Buscar últimas N produções
   */
  async listarUltimas(quantidade: number = 10): Promise<ProducaoLeite[]> {
    return await this.producaoRepository.findUltimas(quantidade);
  }

  /**
   * Registrar uma nova produção
   */
  async registrarProducao(
    data: Omit<IProducaoLeite, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ProducaoLeite> {
    // Validações (igual ao projeto original em C#)
    
    // 1. Data futura
    if (data.data_coleta > new Date()) {
      throw new Error('Não é possível registrar uma ordenha em uma data futura.');
    }

    // 2. Data muito antiga (mais de 5 anos)
    const dataLimite = new Date();
    dataLimite.setFullYear(dataLimite.getFullYear() - 5);
    if (data.data_coleta < dataLimite) {
      throw new Error('Não é possível registrar uma ordenha com mais de 5 anos.');
    }

    // 3. Verificar se animal existe
    const animal = await this.animalRepository.findByBrinco(data.animal_brinco);
    if (!animal) {
      throw new Error('Animal não encontrado.');
    }

    // 4. Apenas fêmeas produzem
    if (animal.sexo === 'M') {
      throw new Error('Não é possível registrar produção de leite para machos.');
    }

    // 5. Animal ativo
    if (!animal.ativo) {
      throw new Error('Não é possível registrar produção para um animal inativo.');
    }

    // Registrar produção
    return await this.producaoRepository.create(data);
  }

  /**
   * Atualizar uma produção
   */
  async atualizarProducao(
    id: number,
    data: Partial<IProducaoLeite>
  ): Promise<ProducaoLeite> {
    const producaoExistente = await this.producaoRepository.findById(id);
    if (!producaoExistente) {
      throw new Error(`Produção com ID ${id} não encontrada.`);
    }

    // Se o animal foi alterado, validar
    if (data.animal_brinco && data.animal_brinco !== producaoExistente.animal_brinco) {
      const animal = await this.animalRepository.findByBrinco(data.animal_brinco);
      if (!animal) {
        throw new Error('Animal não encontrado.');
      }
      if (animal.sexo === 'M') {
        throw new Error('Não é possível registrar produção de leite para machos.');
      }
      if (!animal.ativo) {
        throw new Error('Não é possível registrar produção para um animal inativo.');
      }
    }

    // Se a data foi alterada, validar
    if (data.data_coleta) {
      if (data.data_coleta > new Date()) {
        throw new Error('Não é possível registrar uma ordenha em uma data futura.');
      }
      const dataLimite = new Date();
      dataLimite.setFullYear(dataLimite.getFullYear() - 5);
      if (data.data_coleta < dataLimite) {
        throw new Error('Não é possível registrar uma ordenha com mais de 5 anos.');
      }
    }

    const updated = await this.producaoRepository.update(id, data);
    if (!updated) {
      throw new Error('Erro ao atualizar produção.');
    }

    return updated;
  }

  /**
   * Excluir uma produção
   */
  async excluirProducao(id: number): Promise<void> {
    const producao = await this.producaoRepository.findById(id);
    if (!producao) {
      throw new Error(`Produção com ID ${id} não encontrada.`);
    }

    const deleted = await this.producaoRepository.delete(id);
    if (!deleted) {
      throw new Error('Erro ao excluir produção.');
    }
  }

  /**
   * Obter total de litros por animal
   */
  async getTotalPorAnimal(animalBrinco: number): Promise<number> {
    return await this.producaoRepository.getTotalPorAnimal(animalBrinco);
  }

  /**
   * Obter produção por período
   */
  async getProducaoPorPeriodo(
    dataInicio: Date,
    dataFim: Date,
    periodo?: PeriodoProducao
  ): Promise<number> {
    return await this.producaoRepository.getTotalPorPeriodo(dataInicio, dataFim, periodo);
  }

  /**
   * Obter produção dos últimos N dias
   */
  async getProducaoPorDia(dias: number = 7): Promise<{ data: string; total: number }[]> {
    return await this.producaoRepository.getProducaoPorDia(dias);
  }

  /**
   * Obter top N vacas produtoras
   */
  async getTopVacas(limit: number = 5): Promise<{ nome: string; producao: number }[]> {
    return await this.producaoRepository.getTopVacas(limit);
  }

  /**
   * Obter estatísticas de produção
   */
  async getStats(dataInicio?: Date, dataFim?: Date): Promise<{
    totalLitros: number;
    mediaPorOrdenha: number;
    totalRegistros: number;
    vacasEmProducao: number;
    producaoManha: number;
    producaoTarde: number;
    producaoNoite: number;
  }> {
    return await this.producaoRepository.getStats(dataInicio, dataFim);
  }

  /**
   * Gerar relatório completo de produção
   */
  async gerarRelatorio(
    dataInicio?: Date,
    dataFim?: Date,
    animalBrinco?: number,
    periodo?: PeriodoProducao
  ): Promise<{
    producoes: ProducaoLeite[];
    stats: Awaited<ReturnType<typeof this.getStats>>;
    totalPorAnimal: { brinco: number; nome: string; total: number }[];
  }> {
    // Buscar produções com filtros
    const producoes = await this.producaoRepository.findWithFilters(
      dataInicio,
      dataFim,
      animalBrinco,
      periodo
    );

    // Estatísticas
    const stats = await this.producaoRepository.getStats(dataInicio, dataFim);

    // Total por animal
    const animais = await this.animalRepository.findAll();
    const totalPorAnimal = await Promise.all(
      animais.map(async (animal) => ({
        brinco: animal.brinco,
        nome: animal.nome,
        total: await this.producaoRepository.getTotalPorAnimal(animal.brinco)
      }))
    );

    return {
      producoes,
      stats,
      totalPorAnimal: totalPorAnimal.filter(item => item.total > 0)
    };
  }
}