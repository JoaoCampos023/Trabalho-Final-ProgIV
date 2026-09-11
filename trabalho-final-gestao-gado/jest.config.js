/**
 * Configuração do Jest para o backend (src/).
 *
 * - ts-jest: compila TypeScript on-the-fly, sem Babel. Usa o tsconfig.json
 *   da raiz automaticamente.
 * - testEnvironment: 'node' — não é browser, é Node.
 * - roots: só testa src/. public/ts tem tsconfig próprio e não é alvo.
 * - setupFiles: roda src/__tests__/setup.ts antes de cada arquivo de teste
 *   (define NODE_ENV, JWT_SECRET, TZ, etc).
 * - clearMocks: limpa mocks entre testes automaticamente — evita que um
 *   mock definido num teste vaze para o próximo.
 * - collectCoverageFrom: exclui app.ts (só monta middleware), arquivos de
 *   teste e a pasta websocket do cálculo de cobertura.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/__tests__/**',
    '!src/app.ts',
    '!src/websocket/**'
  ],
  coverageDirectory: 'coverage',
  testTimeout: 10000
};