// Config compartilhada de lint para todo o projeto (backend + frontend).
// ESLint 9+ só aceita "flat config" (este arquivo) — o antigo .eslintrc.* foi
// descontinuado. Ver https://eslint.org/docs/latest/use/configure/configuration-files
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier');

// Padrão do projeto: parâmetros/erros de catch não usados começam com "_" —
// ou simplesmente não são referenciados no corpo do catch (padrão muito comum
// aqui: `catch (error) { this.toast('Erro ao salvar', 'error') }`, sem usar
// o objeto do erro). Cobrar isso à força custaria ~40 renomeações mecânicas
// sem ganho real de qualidade, então caughtErrors fica em "none".
const semUnusedVarsBarulhento = ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }];

module.exports = tseslint.config(
  {
    // Nada aqui é código-fonte nosso: saída de build, dependências e artefatos.
    ignores: ['**/node_modules/**', 'dist/**', 'public/js/**', 'prisma/migrations/**', 'uploads/**']
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------- Este próprio arquivo de config ----------
  // eslint.config.js é CommonJS (require/module.exports), não um módulo TS —
  // as regras de "prefira import/export" do typescript-eslint não fazem
  // sentido para um arquivo de configuração de ferramenta.
  {
    files: ['eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  // ---------- BACKEND (src/, prisma/seed.ts) ----------
  // Código Node "normal": módulos CommonJS, globals de Node (process, __dirname, etc.).
  {
    files: ['src/**/*.ts', 'prisma/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': semUnusedVarsBarulhento,
      // O projeto usa `any` deliberadamente em pontos de integração com o
      // Prisma/Express (ex.: corpo de erro de middlewares) — proibir geraria
      // mais ruído do que benefício neste estágio do projeto.
      '@typescript-eslint/no-explicit-any': 'off',
      // `declare global { namespace Express { ... } }` é a forma padrão do
      // próprio TypeScript de estender tipos de uma lib de terceiros
      // (ver src/middlewares/auth.ts) — não há alternativa sem namespace aqui.
      '@typescript-eslint/no-namespace': 'off'
    }
  },

  // ---------- FRONTEND (public/ts/) ----------
  // Scripts soltos (sem import/export — ver tsconfig.frontend.json,
  // "module": "none"), cada um empacotado numa IIFE e rodando direto no
  // navegador, referenciando os outros arquivos via /// <reference path>
  // (não há bundler). Por isso:
  // - `no-undef` fica off: os globals compartilhados entre arquivos (Api,
  //   Components, Chart, etc.) são declarados como `declare const`/`interface`
  //   global, e o TypeScript já valida isso mais meticulosamente que o
  //   "no-undef" do ESLint base conseguiria (recomendação oficial do
  //   typescript-eslint para código TS).
  // - `triple-slash-reference` fica off: é exatamente o mecanismo que este
  //   projeto usa no lugar de import/export, de propósito (sem bundler).
  {
    files: ['public/ts/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser }
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unused-vars': semUnusedVarsBarulhento,
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // Desliga qualquer regra de estilo que brigue com o Prettier — o Prettier
  // cuida de formatação, o ESLint cuida só de qualidade/correção do código.
  eslintConfigPrettier
);
