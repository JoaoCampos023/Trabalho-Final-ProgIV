import prisma from '../config/database';
import { Animal, IAnimal } from '../models/Animal';

// Função auxiliar para converter dados do Prisma para Animal
function toAnimal(row: any): Animal {
  return new Animal({
    brinco: row.brinco,
    nome: row.nome,
    sexo: row.sexo as 'M' | 'F',
    raca: row.raca || undefined,
    peso: Number(row.peso) || 0,
    data_nascimento: row.data_nascimento,
    ativo: row.ativo,
    brinco_pai: row.brinco_pai || undefined,
    brinco_mae: row.brinco_mae || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  });
}

export class AnimalRepository {
  /**
   * Buscar todos os animais ativos
   */
  async findAll(): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      where: { ativo: true },
      orderBy: { brinco: 'asc' }
    });
    return animals.map(toAnimal);
  }

  /**
   * Buscar todos os animais (incluindo inativos)
   */
  async findAllIncludingInactive(): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      orderBy: { brinco: 'asc' }
    });
    return animals.map(toAnimal);
  }

  /**
   * Buscar animal por brinco
   */
  async findByBrinco(brinco: number): Promise<Animal | null> {
    const animal = await prisma.animal.findUnique({
      where: { brinco }
    });
    if (!animal) return null;
    return toAnimal(animal);
  }

  /**
   * Buscar animal com pai e mãe (para árvore genealógica)
   */
  async findWithParents(brinco: number): Promise<Animal | null> {
    const animal = await prisma.animal.findUnique({
      where: { brinco },
      include: {
        pai: true,
        mae: true
      }
    });
    if (!animal) return null;
    
    const result = toAnimal(animal);
    
    if (animal.pai) {
      result.pai = toAnimal(animal.pai);
    }
    if (animal.mae) {
      result.mae = toAnimal(animal.mae);
    }
    
    return result;
  }

  /**
   * Buscar árvore genealógica completa
   */
  async findFamilyTree(brinco: number): Promise<Animal | null> {
    const animal = await prisma.animal.findUnique({
      where: { brinco },
      include: {
        pai: {
          include: { pai: true, mae: true }
        },
        mae: {
          include: { pai: true, mae: true }
        },
        filhos_pai: {
          where: { ativo: true }
        },
        filhos_mae: {
          where: { ativo: true }
        }
      }
    });
    
    if (!animal) return null;
    
    const result = toAnimal(animal);
    
    if (animal.pai) {
      result.pai = toAnimal(animal.pai);
      if (animal.pai.pai) {
        result.pai.pai = toAnimal(animal.pai.pai);
      }
      if (animal.pai.mae) {
        result.pai.mae = toAnimal(animal.pai.mae);
      }
    }
    
    if (animal.mae) {
      result.mae = toAnimal(animal.mae);
      if (animal.mae.pai) {
        result.mae.pai = toAnimal(animal.mae.pai);
      }
      if (animal.mae.mae) {
        result.mae.mae = toAnimal(animal.mae.mae);
      }
    }
    
    result.filhos_por_pai = animal.filhos_pai.map(toAnimal);
    result.filhos_por_mae = animal.filhos_mae.map(toAnimal);
    
    return result;
  }

  /**
   * Buscar animais por nome
   */
  async findByNome(nome: string): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      where: {
        ativo: true,
        nome: { contains: nome, mode: 'insensitive' }
      },
      orderBy: { nome: 'asc' }
    });
    return animals.map(toAnimal);
  }

  /**
   * Buscar animais por sexo
   */
  async findBySexo(sexo: 'M' | 'F'): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      where: { ativo: true, sexo },
      orderBy: { nome: 'asc' }
    });
    return animals.map(toAnimal);
  }

  /**
   * Buscar animais por raça
   */
  async findByRaca(raca: string): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      where: {
        ativo: true,
        raca: { contains: raca, mode: 'insensitive' }
      },
      orderBy: { nome: 'asc' }
    });
    return animals.map(toAnimal);
  }

  /**
   * Buscar animais por faixa de peso
   */
  async findByFaixaPeso(min: number, max: number): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      where: {
        ativo: true,
        peso: { gte: min, lte: max }
      },
      orderBy: { peso: 'asc' }
    });
    return animals.map(toAnimal);
  }

  /**
   * Buscar machos para seleção (lista de pais)
   */
  async findMachosParaSelecao(excluirBrinco?: number): Promise<Animal[]> {
    const where: any = { ativo: true, sexo: 'M' };
    if (excluirBrinco) {
      where.brinco = { not: excluirBrinco };
    }
    const animals = await prisma.animal.findMany({
      where,
      orderBy: { brinco: 'asc' }
    });
    return animals.map(toAnimal);
  }

  /**
   * Buscar fêmeas para seleção (lista de mães)
   */
  async findFemeasParaSelecao(excluirBrinco?: number): Promise<Animal[]> {
    const where: any = { ativo: true, sexo: 'F' };
    if (excluirBrinco) {
      where.brinco = { not: excluirBrinco };
    }
    const animals = await prisma.animal.findMany({
      where,
      orderBy: { brinco: 'asc' }
    });
    return animals.map(toAnimal);
  }

  /**
   * Criar um novo animal
   */
  async create(animalData: Omit<IAnimal, 'created_at' | 'updated_at'>): Promise<Animal> {
    // Validar se pai e mãe existem e têm o sexo correto
    if (animalData.brinco_pai) {
      const pai = await this.findByBrinco(animalData.brinco_pai);
      if (!pai) throw new Error(`Pai com brinco ${animalData.brinco_pai} não encontrado`);
      if (pai.sexo !== 'M') throw new Error('O pai deve ser um animal do sexo MACHO');
    }

    if (animalData.brinco_mae) {
      const mae = await this.findByBrinco(animalData.brinco_mae);
      if (!mae) throw new Error(`Mãe com brinco ${animalData.brinco_mae} não encontrada`);
      if (mae.sexo !== 'F') throw new Error('A mãe deve ser um animal do sexo FÊMEA');
    }

    // Validar auto-relacionamento
    if (animalData.brinco_pai === animalData.brinco) {
      throw new Error('Um animal não pode ser pai de si mesmo');
    }
    if (animalData.brinco_mae === animalData.brinco) {
      throw new Error('Um animal não pode ser mãe de si mesmo');
    }

    // Validar se pai e mãe não são o mesmo
    if (animalData.brinco_pai && animalData.brinco_mae && 
        animalData.brinco_pai === animalData.brinco_mae) {
      throw new Error('O pai e a mãe não podem ser o mesmo animal');
    }

    const animal = await prisma.animal.create({
      data: {
        brinco: animalData.brinco,
        nome: animalData.nome,
        sexo: animalData.sexo,
        raca: animalData.raca,
        peso: animalData.peso,
        data_nascimento: animalData.data_nascimento,
        ativo: animalData.ativo ?? true,
        brinco_pai: animalData.brinco_pai,
        brinco_mae: animalData.brinco_mae
      }
    });
    return toAnimal(animal);
  }

  /**
   * Atualizar um animal
   */
  async update(brinco: number, animalData: Partial<IAnimal>): Promise<Animal | null> {
    try {
      // Validar se pai e mãe existem e têm o sexo correto
      if (animalData.brinco_pai) {
        const pai = await this.findByBrinco(animalData.brinco_pai);
        if (!pai) throw new Error(`Pai com brinco ${animalData.brinco_pai} não encontrado`);
        if (pai.sexo !== 'M') throw new Error('O pai deve ser um animal do sexo MACHO');
      }

      if (animalData.brinco_mae) {
        const mae = await this.findByBrinco(animalData.brinco_mae);
        if (!mae) throw new Error(`Mãe com brinco ${animalData.brinco_mae} não encontrada`);
        if (mae.sexo !== 'F') throw new Error('A mãe deve ser um animal do sexo FÊMEA');
      }

      const animal = await prisma.animal.update({
        where: { brinco },
        data: {
          nome: animalData.nome,
          sexo: animalData.sexo,
          raca: animalData.raca,
          peso: animalData.peso,
          data_nascimento: animalData.data_nascimento,
          ativo: animalData.ativo,
          brinco_pai: animalData.brinco_pai,
          brinco_mae: animalData.brinco_mae
        }
      });
      if (!animal) return null;
      return toAnimal(animal);
    } catch (error) {
      return null;
    }
  }

  /**
   * Desativar um animal (soft delete)
   */
  async deactivate(brinco: number): Promise<Animal | null> {
    try {
      const animal = await prisma.animal.update({
        where: { brinco },
        data: { ativo: false }
      });
      if (!animal) return null;
      return toAnimal(animal);
    } catch (error) {
      return null;
    }
  }

  /**
   * Deletar um animal (físico)
   */
  async delete(brinco: number): Promise<boolean> {
    try {
      await prisma.animal.delete({
        where: { brinco }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verificar se um brinco existe
   */
  async brincoExiste(brinco: number): Promise<boolean> {
    const count = await prisma.animal.count({
      where: { brinco }
    });
    return count > 0;
  }

  /**
   * Contar total de animais ativos
   */
  async count(): Promise<number> {
    return await prisma.animal.count({
      where: { ativo: true }
    });
  }

  /**
   * Contar por sexo
   */
  async countBySexo(sexo: 'M' | 'F'): Promise<number> {
    return await prisma.animal.count({
      where: { ativo: true, sexo }
    });
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
    const [total, totalMacho, totalFemea, pesoMedioResult, racas] = await Promise.all([
      this.count(),
      this.countBySexo('M'),
      this.countBySexo('F'),
      prisma.animal.aggregate({
        where: { ativo: true },
        _avg: { peso: true }
      }),
      prisma.animal.groupBy({
        by: ['raca'],
        where: { ativo: true, raca: { not: null } },
        _count: true,
        orderBy: { _count: { raca: 'desc' } },
        take: 5
      })
    ]);

    return {
      total,
      totalMacho,
      totalFemea,
      pesoMedio: Number(pesoMedioResult._avg.peso) || 0,
      racas: racas
        .filter(r => r.raca !== null)
        .map(r => ({ raca: r.raca as string, quantidade: r._count }))
    };
  }
}