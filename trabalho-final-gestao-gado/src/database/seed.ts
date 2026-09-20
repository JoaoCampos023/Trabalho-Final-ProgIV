/**
 * Seed do banco — popula um banco vazio com dados de exemplo (usuários,
 * animais e produções de leite) diversos o suficiente para testar filtros,
 * árvore genealógica, gráficos e casos de borda.
 *
 * Roda tanto via `npx prisma db seed` quanto automaticamente no boot do
 * servidor quando o banco está vazio (ver src/config/autoSeed.ts).
 *
 * IMPORTANTE: este seed é IDEMPOTENTE. Se já existirem dados no banco, ele
 * apaga tudo (producoes_leite, animais, users) antes de reinserir. Isso
 * evita o erro P2002 (unique constraint em email/cpf) quando alguém roda
 * `npm run seed` com o banco já populado — que era o comportamento antigo.
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Calcula os dois dígitos verificadores e devolve um CPF válido (11 dígitos).
 *
 * Por que não hardcodar CPFs de exemplo: se usássemos CPFs inventados, a
 * validação de CPF do backend rejeitaria os usuários do seed. Gerar a partir
 * de uma base fixa produz CPFs válidos e determinísticos (sempre os mesmos).
 */
function gerarCpfValido(base9: string): string {
  const digitos = base9.split('').map(Number);

  const calcularDigito = (nums: number[]): number => {
    let soma = 0;
    // peso começa em (tamanho + 1) e decresce: para 9 dígitos, começa em 10;
    // para 10, começa em 11. Essa é a regra oficial do cálculo de CPF.
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
  // Salt 10 é o padrão recomendado do bcrypt: forte o suficiente sem
  // deixar o hash lento demais para o seed rodar.
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(senha, salt);
}

/** Data de `dias` atrás, zerada para meia-noite (só a data importa aqui). */
function diasAtras(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Data de `anos` atrás, com `mesesExtra` opcional (para bebês de poucos meses). */
function anosAtras(anos: number, mesesExtra = 0): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anos);
  d.setMonth(d.getMonth() - mesesExtra);
  return d;
}

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  // -------------------------------------------------------------------------
  // Idempotência: se já existem dados, limpa antes de reinserir.
  //
  // Por que isso importa: o seed é rodado de duas formas — automaticamente
  // no boot (só quando o banco está vazio, ver autoSeed.ts) e manualmente
  // via `npm run seed`. No segundo caso, o usuário pode rodar com o banco
  // já populado (por engano ou para resetar os dados). Sem essa limpeza, o
  // createMany abaixo estoura P2002 (unique constraint em email/cpf).
  //
  // Usamos TRUNCATE ... RESTART IDENTITY CASCADE em vez de deleteMany()
  // por três motivos:
  //   1. TRUNCATE é mais rápido que DELETE (não gera WAL por linha).
  //   2. RESTART IDENTITY reinicia os IDs auto-incrementais (producoes_leite),
  //      então os dados de exemplo sempre começam do id 1.
  //   3. CASCADE limpa as tabelas dependentes na ordem certa, sem o
  //      problema de FK circular em `animais` (que referencia a si mesma
  //      via brinco_pai/brinco_mae).
  // -------------------------------------------------------------------------
  const totalUsuarios = await prisma.user.count();
  if (totalUsuarios > 0) {
    console.log('🌱 Banco já populado — limpando dados anteriores antes de reinserir...');
    await prisma.$executeRaw`TRUNCATE TABLE producoes_leite, animais, users RESTART IDENTITY CASCADE`;
  }

  // -------------------- USUÁRIOS --------------------
  // Todos os usuários de exemplo usam a mesma senha (123456) por conveniência
  // de demo — em produção, cada usuário teria sua própria senha.
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
        // Usuário inativo no seed serve para testar o filtro "Inativos" na
        // tela de Usuários e o bloqueio de login para contas desativadas.
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
  // createMany não respeitaria essa ordem caso a FK fosse aplicada antes,
  // então inserimos um a um com prisma.animal.create.
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
    // Geração 1 (avós)
    { brinco: 1001, nome: 'Estrela', sexo: 'F', raca: 'Holandesa', peso: 480, data_nascimento: anosAtras(5) },
    { brinco: 1002, nome: 'Touro Rei', sexo: 'M', raca: 'Nelore', peso: 650, data_nascimento: anosAtras(6) },
    { brinco: 1003, nome: 'Mimosa', sexo: 'F', raca: 'Jersey', peso: 420, data_nascimento: anosAtras(4) },
    { brinco: 1004, nome: 'Valente', sexo: 'M', raca: 'Gir', peso: 600, data_nascimento: anosAtras(7) },
    // Geração 2 (filhos dos avós)
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
      // Sem pai cadastrado: exercita o caso "só a mãe é conhecida" na árvore.
      brinco_mae: 1008
    },
    // Sem pais cadastrados — testa a renderização de "Não informado" na árvore.
    { brinco: 1013, nome: 'Sol', sexo: 'F', raca: 'Holandesa', peso: 460, data_nascimento: anosAtras(4) },
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

  // Padrão de litros por período/dia — determinístico (sem Math.random)
  // para o seed ser reprodutível: rodar duas vezes produz os mesmos dados.
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
        // Sem isso, o gráfico fica perfeitamente uniforme e não parece real.
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
  console.log('   Login de teste → admin@gmail.com / 123456 (Admin)');
  console.log('   Login de teste → maria.souza@fazenda.com.br / 123456 (Cliente)');
}