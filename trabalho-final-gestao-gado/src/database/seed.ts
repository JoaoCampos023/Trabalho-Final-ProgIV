/**
 * Seed do banco de dados — popula um banco vazio com dados de exemplo
 * (usuários, animais e produções de leite) diversos o suficiente para
 * testar filtros, árvore genealógica, gráficos e casos de borda.
 *
 * Como rodar manualmente:
 *   npx prisma db seed
 *
 * Também roda automaticamente ao subir o servidor (`npm run dev` /
 * `npm start`) quando o banco está vazio — ver src/config/autoSeed.ts.
 * Para desativar esse comportamento automático, defina no .env:
 *   AUTO_SEED=false
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ============================================
// HELPERS
// ============================================

/** Calcula os dois dígitos verificadores e devolve um CPF válido (11 dígitos, sem máscara). */
function gerarCpfValido(base9: string): string {
  const digitos = base9.split('').map(Number);

  const calcularDigito = (nums: number[]): number => {
    let soma = 0;
    let peso = nums.length + 1;
    for (const n of nums) {
      soma += n * peso;
      peso--;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcularDigito(digitos);
  const d2 = calcularDigito([...digitos, d1]);
  return `${base9}${d1}${d2}`;
}

async function gerarHash(senha: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(senha, salt);
}

function diasAtras(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(0, 0, 0, 0);
  return d;
}

function anosAtras(anos: number, mesesExtra = 0): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anos);
  d.setMonth(d.getMonth() - mesesExtra);
  return d;
}

// ============================================
// SEED
// ============================================

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  // -------------------- USUÁRIOS --------------------
  const senhaPadrao = await gerarHash('123456');

  await prisma.user.createMany({
    data: [
      {
        nome: 'admin',
        email: 'admin@gmail.com',
        senha_hash: senhaPadrao,
        cpf: gerarCpfValido('111444777'),
        role: Role.Admin,
        ativo: true
      },
      {
        nome: 'Maria Souza',
        email: 'maria.souza@fazenda.com.br',
        senha_hash: senhaPadrao,
        cpf: gerarCpfValido('222555888'),
        role: Role.Cliente,
        ativo: true
      },
      {
        nome: 'João Pereira',
        email: 'joao.pereira@fazenda.com.br',
        senha_hash: senhaPadrao,
        cpf: gerarCpfValido('333666999'),
        role: Role.Cliente,
        ativo: true
      },
      {
        nome: 'Carlos Antigo (inativo)',
        email: 'carlos.antigo@fazenda.com.br',
        senha_hash: senhaPadrao,
        cpf: gerarCpfValido('444777000'),
        role: Role.Cliente,
        ativo: false
      }
    ]
  });

  // -------------------- ANIMAIS --------------------
  // Inseridos em ordem de dependência: pai/mãe sempre antes dos filhos.
  const animais: Array<{
    brinco: number;
    nome: string;
    sexo: 'M' | 'F';
    raca: string;
    peso: number;
    data_nascimento: Date;
    ativo?: boolean;
    brinco_pai?: number;
    brinco_mae?: number;
  }> = [
    { brinco: 1001, nome: 'Estrela', sexo: 'F', raca: 'Holandesa', peso: 480, data_nascimento: anosAtras(5) },
    { brinco: 1002, nome: 'Touro Rei', sexo: 'M', raca: 'Nelore', peso: 650, data_nascimento: anosAtras(6) },
    { brinco: 1003, nome: 'Mimosa', sexo: 'F', raca: 'Jersey', peso: 420, data_nascimento: anosAtras(4) },
    { brinco: 1004, nome: 'Valente', sexo: 'M', raca: 'Gir', peso: 600, data_nascimento: anosAtras(7) },
    {
      brinco: 1005,
      nome: 'Flor',
      sexo: 'F',
      raca: 'Holandesa',
      peso: 450,
      data_nascimento: anosAtras(3),
      brinco_pai: 1002,
      brinco_mae: 1001
    },
    {
      brinco: 1006,
      nome: 'Trovão',
      sexo: 'M',
      raca: 'Nelore',
      peso: 300,
      data_nascimento: anosAtras(1),
      brinco_pai: 1002,
      brinco_mae: 1003
    },
    {
      brinco: 1007,
      nome: 'Docinho',
      sexo: 'F',
      raca: 'Jersey',
      peso: 200,
      data_nascimento: anosAtras(0, 6),
      brinco_pai: 1004,
      brinco_mae: 1005
    },
    { brinco: 1008, nome: 'Rubi', sexo: 'F', raca: 'Gir', peso: 470, data_nascimento: anosAtras(12) },
    {
      brinco: 1009,
      nome: 'Zeus',
      sexo: 'M',
      raca: 'Angus',
      peso: 700,
      data_nascimento: anosAtras(9),
      ativo: false // vendido — exemplo de animal inativo
    },
    { brinco: 1010, nome: 'Bonita', sexo: 'F', raca: 'Angus', peso: 410, data_nascimento: anosAtras(2) },
    { brinco: 1011, nome: 'Poeira', sexo: 'M', raca: 'Jersey', peso: 350, data_nascimento: anosAtras(2) },
    {
      brinco: 1012,
      nome: 'Aurora',
      sexo: 'F',
      raca: 'Nelore',
      peso: 430,
      data_nascimento: anosAtras(1),
      brinco_mae: 1008
    },
    { brinco: 1013, nome: 'Sol', sexo: 'F', raca: 'Holandesa', peso: 460, data_nascimento: anosAtras(4) }, // sem pais cadastrados
    {
      brinco: 1014,
      nome: 'Luna',
      sexo: 'F',
      raca: 'Gir',
      peso: 250,
      data_nascimento: anosAtras(0, 3),
      brinco_pai: 1004,
      brinco_mae: 1013
    }
  ];

  for (const a of animais) {
    await prisma.animal.create({
      data: {
        brinco: a.brinco,
        nome: a.nome,
        sexo: a.sexo,
        raca: a.raca,
        peso: a.peso,
        data_nascimento: a.data_nascimento,
        ativo: a.ativo ?? true,
        brinco_pai: a.brinco_pai,
        brinco_mae: a.brinco_mae
      }
    });
  }

  // -------------------- PRODUÇÕES DE LEITE --------------------
  // Vacas em lactação (fêmeas adultas e ativas); gera ~10 dias de histórico
  // variado, incluindo um registro de 0 litros (caso de borda válido) e
  // dias com apenas parte dos períodos registrados (mais realista).
  const vacasEmLactacao = [1001, 1003, 1005, 1010, 1013];
  const periodos: Array<'Manha' | 'Tarde' | 'Noite'> = ['Manha', 'Tarde', 'Noite'];

  // Padrão de litros por período/dia — determinístico (sem Math.random) para
  // o seed ser reprodutível, mas com bastante variação entre vaca/dia/período.
  const padraoLitros = [14.5, 9.2, 11.8, 0, 16.3, 13.1, 8.7, 15.9, 10.4, 12.6, 7.5, 17.2];

  const producoes: Array<{
    animal_brinco: number;
    data_coleta: Date;
    litros: number;
    periodo: 'Manha' | 'Tarde' | 'Noite';
  }> = [];

  vacasEmLactacao.forEach((brinco, vacaIdx) => {
    for (let dia = 0; dia < 10; dia++) {
      periodos.forEach((periodo, periodoIdx) => {
        // Pula ~1 em cada 7 combinações para simular ordenhas não registradas.
        const chaveSalto = (vacaIdx + dia + periodoIdx) % 7;
        if (chaveSalto === 0) return;

        const litros = padraoLitros[(vacaIdx * 5 + dia * 3 + periodoIdx) % padraoLitros.length];
        producoes.push({
          animal_brinco: brinco,
          data_coleta: diasAtras(dia),
          litros,
          periodo
        });
      });
    }
  });

  await prisma.producaoLeite.createMany({ data: producoes });

  console.log(`🌱 Seed concluído: 4 usuários, ${animais.length} animais, ${producoes.length} produções de leite.`);
  console.log('   Login de teste → admin@admin.com / Senha@123 (Admin)');
  console.log('   Login de teste → maria.souza@fazenda.com.br / Senha@123 (Cliente)');
}
