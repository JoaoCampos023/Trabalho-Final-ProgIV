import pool from '../config/database';
import { ProducaoLeite, IProducaoLeite, PeriodoProducao } from '../models/ProducaoLeite';
import { Animal } from '../models/Animal';

function parseProducao(row: any): ProducaoLeite {
    const producao = new ProducaoLeite({
        id: parseInt(row.id),
        animal_brinco: parseInt(row.animal_brinco),
        data_coleta: new Date(row.data_coleta),
        litros: parseFloat(row.litros) || 0,
        periodo: row.periodo,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at)
    });

if (row.animal_nome) {
    producao.animal = new Animal({
        brinco: parseInt(row.animal_brinco),
        nome: row.animal_nome,
        sexo: 'F',
        peso: 0,
        data_nascimento: new Date(),
        ativo: true,
        brinco_pai: null,
        brinco_mae: null,
        created_at: new Date(),
        updated_at: new Date()
    });
}

    return producao;
}

export class ProducaoRepository {
    async findAll(): Promise<ProducaoLeite[]> {
        const result = await pool.query(
            `SELECT p.*, a.nome as animal_nome 
             FROM producoes_leite p
             LEFT JOIN animais a ON p.animal_brinco = a.brinco
             ORDER BY p.data_coleta DESC, p.periodo ASC`
        );
        return result.rows.map(row => parseProducao(row));
    }

    async findWithFilters(
        dataInicio?: Date,
        dataFim?: Date,
        animalBrinco?: number,
        periodo?: PeriodoProducao
    ): Promise<ProducaoLeite[]> {
        let query = `
            SELECT p.*, a.nome as animal_nome 
            FROM producoes_leite p
            LEFT JOIN animais a ON p.animal_brinco = a.brinco
            WHERE 1=1
        `;
        const values: any[] = [];
        let paramCount = 1;

        if (dataInicio) {
            query += ` AND p.data_coleta >= $${paramCount++}`;
            values.push(dataInicio);
        }
        if (dataFim) {
            query += ` AND p.data_coleta <= $${paramCount++}`;
            values.push(dataFim);
        }
        if (animalBrinco) {
            query += ` AND p.animal_brinco = $${paramCount++}`;
            values.push(animalBrinco);
        }
        if (periodo) {
            query += ` AND p.periodo = $${paramCount++}`;
            values.push(periodo);
        }

        query += ' ORDER BY p.data_coleta DESC, p.periodo ASC';

        const result = await pool.query(query, values);
        return result.rows.map(row => parseProducao(row));
    }

    async findById(id: number): Promise<ProducaoLeite | null> {
        const result = await pool.query(
            `SELECT p.*, a.nome as animal_nome 
             FROM producoes_leite p
             LEFT JOIN animais a ON p.animal_brinco = a.brinco
             WHERE p.id = $1`,
            [id]
        );
        if (result.rows.length === 0) return null;
        return parseProducao(result.rows[0]);
    }

    async findByAnimal(animalBrinco: number): Promise<ProducaoLeite[]> {
        const result = await pool.query(
            `SELECT p.*, a.nome as animal_nome 
             FROM producoes_leite p
             LEFT JOIN animais a ON p.animal_brinco = a.brinco
             WHERE p.animal_brinco = $1
             ORDER BY p.data_coleta DESC`,
            [animalBrinco]
        );
        return result.rows.map(row => parseProducao(row));
    }

    async findUltimas(quantidade: number = 10): Promise<ProducaoLeite[]> {
        const result = await pool.query(
            `SELECT p.*, a.nome as animal_nome 
             FROM producoes_leite p
             LEFT JOIN animais a ON p.animal_brinco = a.brinco
             ORDER BY p.data_coleta DESC
             LIMIT $1`,
            [quantidade]
        );
        return result.rows.map(row => parseProducao(row));
    }

    async getTotalPorAnimal(animalBrinco: number): Promise<number> {
        const result = await pool.query(
            'SELECT COALESCE(SUM(litros), 0) as total FROM producoes_leite WHERE animal_brinco = $1',
            [animalBrinco]
        );
        return parseFloat(result.rows[0].total);
    }

    async getTotalPorPeriodo(
        dataInicio: Date,
        dataFim: Date,
        periodo?: PeriodoProducao
    ): Promise<number> {
        let query = 'SELECT COALESCE(SUM(litros), 0) as total FROM producoes_leite WHERE data_coleta >= $1 AND data_coleta <= $2';
        const values: any[] = [dataInicio, dataFim];
        if (periodo) {
            query += ' AND periodo = $3';
            values.push(periodo);
        }
        const result = await pool.query(query, values);
        return parseFloat(result.rows[0].total);
    }

    async getProducaoPorDia(dias: number = 7): Promise<{ data: string; total: number }[]> {
        const result = await pool.query(
            `SELECT 
                DATE(data_coleta) as data,
                COALESCE(SUM(litros), 0) as total
             FROM producoes_leite
             WHERE data_coleta >= CURRENT_DATE - INTERVAL '${dias} days'
             GROUP BY DATE(data_coleta)
             ORDER BY data ASC`
        );
        return result.rows.map(row => ({
            data: row.data,
            total: parseFloat(row.total) || 0
        }));
    }

    async getTopVacas(limit: number = 5): Promise<{ nome: string; producao: number }[]> {
        const result = await pool.query(
            `SELECT 
                a.nome,
                COALESCE(SUM(p.litros), 0) as producao
             FROM producoes_leite p
             INNER JOIN animais a ON p.animal_brinco = a.brinco
             WHERE a.sexo = 'F'
             GROUP BY a.nome, a.brinco
             ORDER BY producao DESC
             LIMIT $1`,
            [limit]
        );
        return result.rows.map(row => ({
            nome: row.nome,
            producao: parseFloat(row.producao) || 0
        }));
    }

    async create(producaoData: Omit<IProducaoLeite, 'id' | 'created_at' | 'updated_at'>): Promise<ProducaoLeite> {
        const animalResult = await pool.query(
            'SELECT * FROM animais WHERE brinco = $1 AND sexo = \'F\' AND ativo = true',
            [producaoData.animal_brinco]
        );
        if (animalResult.rows.length === 0) {
            throw new Error('Animal não encontrado, inativo ou não é uma fêmea');
        }

        if (producaoData.data_coleta > new Date()) {
            throw new Error('Não é possível registrar uma produção em data futura');
        }

        const dataLimite = new Date();
        dataLimite.setFullYear(dataLimite.getFullYear() - 5);
        if (producaoData.data_coleta < dataLimite) {
            throw new Error('Não é possível registrar uma produção com mais de 5 anos');
        }

        const result = await pool.query(
            `INSERT INTO producoes_leite 
             (animal_brinco, data_coleta, litros, periodo)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                producaoData.animal_brinco,
                producaoData.data_coleta,
                producaoData.litros,
                producaoData.periodo
            ]
        );
        return parseProducao(result.rows[0]);
    }

    async update(id: number, producaoData: Partial<IProducaoLeite>): Promise<ProducaoLeite | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (producaoData.animal_brinco !== undefined) {
            fields.push(`animal_brinco = $${paramCount++}`);
            values.push(producaoData.animal_brinco);
        }
        if (producaoData.data_coleta !== undefined) {
            fields.push(`data_coleta = $${paramCount++}`);
            values.push(producaoData.data_coleta);
        }
        if (producaoData.litros !== undefined) {
            fields.push(`litros = $${paramCount++}`);
            values.push(producaoData.litros);
        }
        if (producaoData.periodo !== undefined) {
            fields.push(`periodo = $${paramCount++}`);
            values.push(producaoData.periodo);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (fields.length === 0) {
            throw new Error('Nenhum campo para atualizar');
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE producoes_leite SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        if (result.rows.length === 0) return null;
        return parseProducao(result.rows[0]);
    }

    async delete(id: number): Promise<boolean> {
        const result = await pool.query(
            'DELETE FROM producoes_leite WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows.length > 0;
    }

    async count(): Promise<number> {
        const result = await pool.query('SELECT COUNT(*) as total FROM producoes_leite');
        return parseInt(result.rows[0].total);
    }

    async getStats(
        dataInicio?: Date,
        dataFim?: Date
    ): Promise<{
        totalLitros: number;
        mediaPorOrdenha: number;
        totalRegistros: number;
        vacasEmProducao: number;
        producaoManha: number;
        producaoTarde: number;
        producaoNoite: number;
    }> {
        let query = 'SELECT * FROM producoes_leite WHERE 1=1';
        const values: any[] = [];
        let paramCount = 1;

        if (dataInicio) {
            query += ` AND data_coleta >= $${paramCount++}`;
            values.push(dataInicio);
        }
        if (dataFim) {
            query += ` AND data_coleta <= $${paramCount++}`;
            values.push(dataFim);
        }

        const result = await pool.query(query, values);
        const producoes = result.rows;

        const totalLitros = producoes.reduce((sum, p) => sum + parseFloat(p.litros), 0);
        const totalRegistros = producoes.length;
        const vacasEmProducao = new Set(producoes.map(p => p.animal_brinco)).size;

        return {
            totalLitros,
            mediaPorOrdenha: totalRegistros > 0 ? totalLitros / totalRegistros : 0,
            totalRegistros,
            vacasEmProducao,
            producaoManha: producoes.filter(p => p.periodo === 'Manha').reduce((sum, p) => sum + parseFloat(p.litros), 0),
            producaoTarde: producoes.filter(p => p.periodo === 'Tarde').reduce((sum, p) => sum + parseFloat(p.litros), 0),
            producaoNoite: producoes.filter(p => p.periodo === 'Noite').reduce((sum, p) => sum + parseFloat(p.litros), 0)
        };
    }
}