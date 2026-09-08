import prisma from './src/config/database';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  console.log('🔄 Criando usuário de teste...');
  
  try {
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        nome: 'Usuário Teste',
        email: 'teste@email.com',
        password_hash: 'testeteste',
        cpf: '12345678909',
        ativo: true,
        role: 'Cliente'
      }
    });
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📊 Dados do usuário:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.nome}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   CPF: ${user.cpf}`);
    console.log(`   Role: ${user.role}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();