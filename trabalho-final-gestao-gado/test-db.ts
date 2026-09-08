import prisma from './src/config/database';

async function testDatabase() {
  console.log('🔄 Testando conexão com o banco de dados...');
  
  try {
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com o banco estabelecida!');
    
    // Contar usuários
    const userCount = await prisma.user.count();
    console.log(`📊 Total de usuários: ${userCount}`);
    
    // Contar animais
    const animalCount = await prisma.animal.count();
    console.log(`🐄 Total de animais: ${animalCount}`);
    
    // Contar produções
    const producaoCount = await prisma.producaoLeite.count();
    console.log(`🥛 Total de produções: ${producaoCount}`);
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão fechada.');
  }
}

testDatabase();