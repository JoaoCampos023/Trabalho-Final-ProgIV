/**
 * Setup executado uma vez por arquivo de teste, ANTES de qualquer import
 * do código de produção. Serve para fixar variáveis de ambiente que o
 * código lê (JWT_SECRET, TZ, NODE_ENV) em valores determinísticos.
 *
 * Sem isso, os testes que dependem de data/hora rodariam no fuso do CI
 * (normalmente UTC) e quebrariam por diferença de 3h em relação a
 * America/Sao_Paulo. Fixar TZ aqui garante reprodutibilidade.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_nao_usar_em_producao';
process.env.TZ = 'America/Sao_Paulo';

// O timeout padrão do Jest é 5s. Alguns testes de integração podem precisar
// de mais tempo (conexão com banco, por exemplo). 10s é folgado o suficiente
// sem mascarar testes que travam de verdade.
jest.setTimeout(10000);