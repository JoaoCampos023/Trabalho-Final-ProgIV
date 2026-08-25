import pool from '../config/database';
import { Animal, IAnimal } from '../models/Animal';

export class AnimalRepository {
  /**
   * Buscar todos os animais ativos
   */
  async findAll(): Promise<Animal[]> {
    const result = await pool.query(
      'SELECT * FROM animais WHERE ativo = true ORDER BY brinco ASC'
    );
    return result.rows.map(row => new Animal(row));
  }

  /**
   * Buscar todos os animais (incluindo inativos)
   */
  async findAllIncludingInactive(): Promise<Animal[]> {
    const result = await pool.query(
      'SELECT * FROM animais ORDER BY brinco ASC'
    );
    return result.rows.map(row => new Animal(row));
  }

  /**
   * Buscar animal por brinco
   */
  async findByBrinco(brinco: number): Promise<Animal | null> {
    const result = await pool.query(
      'SELECT * FROM animais WHERE brinco = $1',
      [brinco]
    );
    if (result.rows.length === 0) return null;
    return new Animal(result.rows[0]);
  }

 /**
 * Buscar animal com pai e mãe (para árvore genealógica)
 */
async findWithParents(brinco: number): Promise<Animal | null> {
  const result = await pool.query(
    `SELECT 
      a.*,
      pai.nome as pai_nome,
      pai.brinco as pai_brinco,
      pai.sexo as pai_sexo,
      mae.nome as mae_nome,
      mae.brinco as mae_brinco,
      mae.sexo as mae_sexo
     FROM animais a
     LEFT JOIN animais pai ON a.brinco_pai = pai.brinco
     LEFT JOIN animais mae ON a.brinco_mae = mae.brinco
     WHERE a.brinco = $1`,
    [brinco]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const animal = new Animal(row);

  // ✅ CORREÇÃO: Adicionar pai e mãe se existirem
  if (row.pai_brinco) {
    animal.pai = new Animal({
      brinco: row.pai_brinco,
      nome: row.pai_nome,
      sexo: row.pai_sexo,
      peso: 0,
      data_nascimento: new Date(),
      ativo: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  if (row.mae_brinco) {
    animal.mae = new Animal({
      brinco: row.mae_brinco,
      nome: row.mae_nome,
      sexo: row.mae_sexo,
      peso: 0,
      data_nascimento: new Date(),
      ativo: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  return animal;
}

  /**
   * Buscar árvore genealógica completa
   */
  async findFamilyTree(brinco: number): Promise<Animal | null> {
    // Primeiro busca o animal com pais
    const animal = await this.findWithParents(brinco);
    if (!animal) return null;

    // Buscar avós (pai do pai, mãe do pai, pai da mãe, mãe da mãe)
    if (animal.pai) {
      const avosPai = await this.findWithParents(animal.pai.brinco);
      if (avosPai) {
        animal.pai.pai = avosPai.pai;
        animal.pai.mae = avosPai.mae;
      }
    }

    if (animal.mae) {
      const avosMae = await this.findWithParents(animal.mae.brinco);
      if (avosMae) {
        animal.mae.pai = avosMae.pai;
        animal.mae.mae = avosMae.mae;
      }
    }

    // Buscar filhos
    const filhosResult = await pool.query(
      `SELECT * FROM animais 
       WHERE (brinco_pai = $1 OR brinco_mae = $1) AND ativo = true
       ORDER BY brinco ASC`,
      [brinco]
    );

    animal.filhos_por_pai = [];
    animal.filhos_por_mae = [];

    for (const row of filhosResult.rows) {
      const filho = new Animal(row);
      if (row.brinco_pai === brinco) {
        animal.filhos_por_pai.push(filho);
      }
      if (row.brinco_mae === brinco) {
        animal.filhos_por_mae.push(filho);
      }
    }

    return animal;
  }

  /**
   * Buscar animais por nome
   */
  async findByNome(nome: string): Promise<Animal[]> {
    const result = await pool.query(
      'SELECT * FROM animais WHERE ativo = true AND nome ILIKE $1 ORDER BY nome ASC',
      [`%${nome}%`]
    );
    return result.rows.map(row => new Animal(row));
  }

  /**
   * Buscar animais por sexo
   */
  async findBySexo(sexo: 'M' | 'F'): Promise<Animal[]> {
    const result = await pool.query(
      'SELECT * FROM animais WHERE ativo = true AND sexo = $1 ORDER BY nome ASC',
      [sexo]
    );
    return result.rows.map(row => new Animal(row));
  }

  /**
   * Buscar animais por raça
   */
  async findByRaca(raca: string): Promise<Animal[]> {
    const result = await pool.query(
      'SELECT * FROM animais WHERE ativo = true AND raca ILIKE $1 ORDER BY nome ASC',
      [`%${raca}%`]
    );
    return result.rows.map(row => new Animal(row));
  }

  /**
   * Buscar animais por faixa de peso
   */
  async findByFaixaPeso(min: number, max: number): Promise<Animal[]> {
    const result = await pool.query(
      'SELECT * FROM animais WHERE ativo = true AND peso >= $1 AND peso <= $2 ORDER BY peso ASC',
      [min, max]
    );
    return result.rows.map(row => new Animal(row));
  }

  /**
   * Buscar machos para seleção (lista de pais)
   */
  async findMachosParaSelecao(excluirBrinco?: number): Promise<Animal[]> {
    let query = 'SELECT * FROM animais WHERE ativo = true AND sexo = \'M\'';
    const values: any[] = [];
    
    if (excluirBrinco) {
      query += ' AND brinco != $1';
      values.push(excluirBrinco);
    }
    
    query += ' ORDER BY brinco ASC';
    
    const result = await pool.query(query, values);
    return result.rows.map(row => new Animal(row));
  }

  /**
   * Buscar fêmeas para seleção (lista de mães)
   */
  async findFemeasParaSelecao(excluirBrinco?: number): Promise<Animal[]> {
    let query = 'SELECT * FROM animais WHERE ativo = true AND sexo = \'F\'';
    const values: any[] = [];
    
    if (excluirBrinco) {
      query += ' AND brinco != $1';
      values.push(excluirBrinco);
    }
    
    query += ' ORDER BY brinco ASC';
    
    const result = await pool.query(query, values);
    return result.rows.map(row => new Animal(row));
  }

  /**
   * Criar um novo animal
   */
  async create(animalData: Omit<IAnimal, 'created_at' | 'updated_at'>): Promise<Animal> {
    // Validar se pai e mãe existem
    if (animalData.brinco_pai) {
      const pai = await this.findByBrinco(animalData.brinco_pai);
      if (!pai) {
        throw new Error(`Pai com brinco ${animalData.brinco_pai} não encontrado`);
      }
      if (pai.sexo !== 'M') {
        throw new Error('O pai deve ser um animal do sexo MACHO');
      }
    }

    if (animalData.brinco_mae) {
      const mae = await this.findByBrinco(animalData.brinco_mae);
      if (!mae) {
        throw new Error(`Mãe com brinco ${animalData.brinco_mae} não encontrada`);
      }
      if (mae.sexo !== 'F') {
        throw new Error('A mãe deve ser um animal do sexo FÊMEA');
      }
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

    const result = await pool.query(
      `INSERT INTO animais 
       (brinco, nome, sexo, raca, peso, data_nascimento, ativo, brinco_pai, brinco_mae)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        animalData.brinco,
        animalData.nome,
        animalData.sexo,
        animalData.raca || null,
        animalData.peso,
        animalData.data_nascimento,
        animalData.ativo ?? true,
        animalData.brinco_pai || null,
        animalData.brinco_mae || null
      ]
    );
    return new Animal(result.rows[0]);
  }

  /**
   * Atualizar um animal
   */
  async update(brinco: number, animalData: Partial<IAnimal>): Promise<Animal | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (animalData.nome !== undefined) {
      fields.push(`nome = $${paramCount++}`);
      values.push(animalData.nome);
    }
    if (animalData.sexo !== undefined) {
      fields.push(`sexo = $${paramCount++}`);
      values.push(animalData.sexo);
    }
    if (animalData.raca !== undefined) {
      fields.push(`raca = $${paramCount++}`);
      values.push(animalData.raca);
    }
    if (animalData.peso !== undefined) {
      fields.push(`peso = $${paramCount++}`);
      values.push(animalData.peso);
    }
    if (animalData.data_nascimento !== undefined) {
      fields.push(`data_nascimento = $${paramCount++}`);
      values.push(animalData.data_nascimento);
    }
    if (animalData.ativo !== undefined) {
      fields.push(`ativo = $${paramCount++}`);
      values.push(animalData.ativo);
    }
    if (animalData.brinco_pai !== undefined) {
      fields.push(`brinco_pai = $${paramCount++}`);
      values.push(animalData.brinco_pai);
    }
    if (animalData.brinco_mae !== undefined) {
      fields.push(`brinco_mae = $${paramCount++}`);
      values.push(animalData.brinco_mae);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    values.push(brinco);

    const result = await pool.query(
      `UPDATE animais SET ${fields.join(', ')} WHERE brinco = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return new Animal(result.rows[0]);
  }

  /**
   * Desativar um animal (soft delete)
   */
  async deactivate(brinco: number): Promise<Animal | null> {
    const result = await pool.query(
      'UPDATE animais SET ativo = false, updated_at = CURRENT_TIMESTAMP WHERE brinco = $1 RETURNING *',
      [brinco]
    );
    if (result.rows.length === 0) return null;
    return new Animal(result.rows[0]);
  }

  /**
   * Deletar um animal (físico)
   */
  async delete(brinco: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM animais WHERE brinco = $1 RETURNING brinco',
      [brinco]
    );
    return result.rows.length > 0;
  }

  /**
   * Verificar se um brinco existe
   */
  async brincoExiste(brinco: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT brinco FROM animais WHERE brinco = $1',
      [brinco]
    );
    return result.rows.length > 0;
  }

  /**
   * Contar total de animais ativos
   */
  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as total FROM animais WHERE ativo = true');
    return parseInt(result.rows[0].total);
  }

  /**
   * Contar por sexo
   */
  async countBySexo(sexo: 'M' | 'F'): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as total FROM animais WHERE ativo = true AND sexo = $1',
      [sexo]
    );
    return parseInt(result.rows[0].total);
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
    // Total
    const total = await this.count();
    
    // Total por sexo
    const totalMacho = await this.countBySexo('M');
    const totalFemea = await this.countBySexo('F');

    // Peso médio
    const pesoResult = await pool.query(
      'SELECT AVG(peso) as media FROM animais WHERE ativo = true'
    );
    const pesoMedio = parseFloat(pesoResult.rows[0].media) || 0;

    // Raças mais comuns
    const racaResult = await pool.query(
      `SELECT raca, COUNT(*) as quantidade 
       FROM animais 
       WHERE ativo = true AND raca IS NOT NULL 
       GROUP BY raca 
       ORDER BY quantidade DESC 
       LIMIT 5`
    );

    return {
      total,
      totalMacho,
      totalFemea,
      pesoMedio,
      racas: racaResult.rows
    };
  }
}