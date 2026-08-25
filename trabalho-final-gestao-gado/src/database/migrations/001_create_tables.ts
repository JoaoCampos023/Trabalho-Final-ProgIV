import pool from '../../config/database';

const createTables = async () => {
  console.log('🔄 Iniciando criação das tabelas...');
  
  const client = await pool.connect();
  
  try {
    console.log('📝 Conectado ao banco. Criando tabelas...');

    // 1. Criar tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        ativo BOOLEAN DEFAULT TRUE,
        role VARCHAR(20) DEFAULT 'Cliente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela "users" criada');

    // 2. Criar tabela de animais
    await client.query(`
      CREATE TABLE IF NOT EXISTS animais (
        brinco INTEGER PRIMARY KEY,
        nome VARCHAR(50) NOT NULL,
        sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
        raca VARCHAR(50),
        peso DECIMAL(10,2),
        data_nascimento DATE NOT NULL,
        ativo BOOLEAN DEFAULT TRUE,
        brinco_pai INTEGER,
        brinco_mae INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brinco_pai) REFERENCES animais(brinco) ON DELETE SET NULL,
        FOREIGN KEY (brinco_mae) REFERENCES animais(brinco) ON DELETE SET NULL
      );
    `);
    console.log('✅ Tabela "animais" criada');

    // 3. Criar tabela de produção de leite
    await client.query(`
      CREATE TABLE IF NOT EXISTS producoes_leite (
        id SERIAL PRIMARY KEY,
        animal_brinco INTEGER NOT NULL,
        data_coleta DATE NOT NULL,
        litros DECIMAL(10,2) NOT NULL CHECK (litros > 0),
        periodo VARCHAR(10) NOT NULL CHECK (periodo IN ('Manha', 'Tarde', 'Noite')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (animal_brinco) REFERENCES animais(brinco) ON DELETE CASCADE
      );
    `);
    console.log('✅ Tabela "producoes_leite" criada');

    // 4. Criar índices para melhor performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_animais_nome ON animais(nome);
      CREATE INDEX IF NOT EXISTS idx_animais_sexo ON animais(sexo);
      CREATE INDEX IF NOT EXISTS idx_animais_raca ON animais(raca);
      CREATE INDEX IF NOT EXISTS idx_animais_ativo ON animais(ativo);
      CREATE INDEX IF NOT EXISTS idx_producoes_animal ON producoes_leite(animal_brinco);
      CREATE INDEX IF NOT EXISTS idx_producoes_data ON producoes_leite(data_coleta);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
    `);
    console.log('✅ Índices criados');

    console.log('🎉 Migração concluída com sucesso! Todas as tabelas foram criadas.');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    client.release();
    console.log('🔌 Conexão liberada');
  }
};

// Executar a migração
createTables()
  .then(() => {
    console.log('✅ Migração finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  });