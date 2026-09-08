import prisma from './src/config/database';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  console.log('🔄 Criando usuário de teste...');
  
  try {
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);
    
    // Email e CPF únicos
    const timestamp = Date.now();
    const email = `teste${timestamp}@email.com`;
    const cpf = `123456789${String(timestamp).slice(-2)}`; // CPF único
    
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 CPF: ${cpf}`);
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        nome: 'Usuário Teste',
        email: email,
        password_hash: passwordHash,
        cpf: cpf,
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
    
    console.log('\n🔑 Credenciais para login:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: 123456`);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();