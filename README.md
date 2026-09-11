<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=for-the-badge&logo=git" alt="Status">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

<p align="center">
  <h1 align="center">🐄 Gestão de Gado</h1>
  <p align="center">
    <strong>Sistema inteligente e completo para controle de rebanho e gestão da produção leiteira.</strong>
  </p>
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-tecnologias-utilizadas">Tecnologias</a> •
  <a href="#-estrutura-do-projeto">Estrutura</a> •
  <a href="#-instalação-e-configuração">Instalação</a> •
  <a href="#-rodando-com-docker">Docker</a> •
  <a href="#-endpoints-da-api">Endpoints API</a> •
  <a href="#-contribuição">Contribuição</a>
</p>


---

## 📋 Sobre o Projeto

O **Gestão de Gado** é uma plataforma web desenvolvida para otimizar o manejo pecuário, facilitando o acompanhamento detalhado da saúde do rebanho, genealogia e produtividade leiteira diária.

Desenvolvido com foco em **simplicidade**, **eficiência** e **segurança**, o sistema oferece uma interface intuitiva para produtores rurais e uma arquitetura backend em camadas (Controller → Service → Repository), com todo o frontend também escrito em TypeScript.

### ✨ Principais Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| 🐮 **Controle de Rebanho** | Cadastro centralizado, histórico individual e ficha técnica completa de cada animal |
| 🥛 **Gestão de Produção** | Monitoramento e histórico diário da ordenha com registro por período (manhã/tarde/noite) |
| 🧬 **Árvore Genealógica** | Rastreamento estruturado de ascendência com visualização de pais, avós e filhos |
| 📊 **Dashboards & Relatórios** | Visualização analítica de métricas vitais, rankings de produtividade e gráficos interativos |
| 🔐 **Controle de Acesso (RBAC)** | Autenticação via JWT com dois níveis de permissão (`Admin` e `Cliente`), papel armazenado como enum no banco |
| 📱 **Responsivo** | Interface adaptada para desktop, tablet e dispositivos móveis |

---

## 🚀 Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | 18+ (imagem Docker usa 20) | Runtime JavaScript |
| **TypeScript** | 5.x | Linguagem com tipagem estática |
| **Express.js** | 5.x | Framework web |
| **PostgreSQL** | 15+ (imagem Docker usa 16) | Banco de dados relacional |
| **Prisma ORM** | 5.x | ORM, migrations e client tipado para acesso ao banco |
| **JWT** (`jsonwebtoken`) | - | Autenticação e autorização |
| **bcryptjs** | - | Hash de senhas |
| **ws** | - | Servidor WebSocket (notificações/dashboard em tempo real) |
| **multer** + **csv-parse**/**csv-stringify** | - | Importação/exportação de dados em CSV |

### Frontend
Todo o frontend é escrito em **TypeScript** (`public/ts/`) e compilado para JavaScript puro (`public/js/`, saída de build — não é código-fonte editado manualmente). São páginas HTML servidas de forma estática pelo próprio Express, sem framework de UI (React/Vue) nem bundler — só `tsc` compilando script por script.

| Tecnologia | Descrição |
|------------|-----------|
| **HTML5 Semântico** | Estruturação das páginas |
| **CSS3 Moderno** | Estilização com Flexbox e Grid (`public/css/`) |
| **TypeScript (compilado para JS vanilla)** | Interatividade e consumo de API — ver `public/ts/` |
| **Chart.js** (via CDN) | Gráficos interativos no dashboard e relatórios |
| **Font Awesome Free** (via CDN) | Ícones da interface |

### Ferramentas de Desenvolvimento e Infraestrutura
| Ferramenta | Descrição |
|------------|-----------|
| **tsx** | Execução rápida de TypeScript sem compilação prévia (usado em dev e pelo seed) |
| **Nodemon** | Live reload durante desenvolvimento |
| **Dotenv** | Gerenciamento de variáveis de ambiente a partir do `.env` |
| **Prisma Migrate** | Versionamento e aplicação de migrations do banco |
| **Docker** / **Docker Compose** | Build e orquestração de `backend` + `db` (ver [seção Docker](#-rodando-com-docker)) |

---

## 📂 Estrutura do Projeto

```
trabalho-final-gestao-gado/
│
├── 📁 public/                          # Servido estaticamente pelo Express (app.use(express.static('public')))
│   ├── 📁 app/                         # Páginas autenticadas (SPA/MPA)
│   │   ├── dashboard.html              # SPA com todas as seções (Dashboard, Rebanho, Produções, Relatórios, Usuários)
│   │   ├── animais.html                # Página standalone do Rebanho
│   │   ├── producoes.html              # Página standalone de Produções
│   │   ├── relatorios.html             # Página standalone de Relatórios
│   │   └── usuarios.html               # Página standalone de Usuários (Admin)
│   │
│   ├── 📁 css/
│   │   ├── style.css                   # Estilos compartilhados das páginas /app
│   │   └── landing.css                 # Estilos da landing page
│   │
│   ├── 📁 ts/                          # ⚠️ Código-fonte do frontend (edite aqui)
│   │   ├── api.ts                      # Camada HTTP única (classe Api), usada por todas as páginas
│   │   ├── components.ts               # Navbar compartilhada
│   │   ├── types.ts                    # Tipos compartilhados (Animal, ProducaoLeite, Usuario, ...)
│   │   ├── landing.ts                  # Lógica da landing page (login/registro)
│   │   └── 📁 pages/                   # Um arquivo por página de public/app/
│   │       ├── dashboard.ts
│   │       ├── animais.ts
│   │       ├── producoes.ts
│   │       ├── relatorios.ts
│   │       └── usuarios.ts
│   │
│   ├── 📁 js/                          # ⚠️ Saída de build (gerado por `npm run build:frontend` a partir de public/ts/) — não edite direto
│   │
│   └── index.html                      # Landing page
│
├── 📁 src/                             # Backend (Controller → Service → Repository)
│   ├── 📁 config/
│   │   ├── database.ts / prisma.ts     # Singleton do Prisma Client
│   │   └── autoSeed.ts                 # Roda o seed sozinho se o banco estiver vazio (ver seção Seed)
│   │
│   ├── 📁 controllers/                 # AnimalController, ProducaoController, UserController,
│   │                                   # RelatorioController, NotificacaoController, ImportacaoController, ExternaController
│   │
│   ├── 📁 middlewares/                 # auth (JWT), role (RBAC), validation, errorHandler
│   │
│   ├── 📁 models/                      # Animal, ProducaoLeite, User (tipos/entidades de domínio)
│   │
│   ├── 📁 repositories/                # AnimalRepository, ProducaoRepository, UserRepository (acesso ao Prisma)
│   │
│   ├── 📁 routes/                      # Um arquivo por recurso, todos sob /api (ver Endpoints da API)
│   │
│   ├── 📁 services/                    # AnimalService, ProducaoService, UserService, NotificacaoService (regras de negócio)
│   │
│   ├── 📁 database/
│   │   └── seed.ts                     # Lógica do seed de dados de exemplo (usuários, animais, produções)
│   │
│   ├── 📁 utils/                       # cpfValidator, emailValidator, dateUtils, passwordGenerator
│   │
│   ├── 📁 websocket/
│   │   └── server.ts
│   │
│   └── app.ts                          # Entrypoint: middlewares, rotas, WebSocket, auto-seed, listen
│
├── 📁 prisma/
│   ├── schema.prisma                   # Models User/Animal/ProducaoLeite + enum Role
│   ├── seed.ts                         # Entrypoint fino de `npx prisma db seed` (chama src/database/seed.ts)
│   └── 📁 migrations/                  # Migrations versionadas e commitadas no Git
│
├── 🐳 Dockerfile                       # Build multi-stage do backend (compila TS de src/ e public/ts/)
├── 🐳 docker-compose.yml               # Orquestra backend + db (PostgreSQL), volume nomeado
├── 🐳 docker-entrypoint.sh             # `prisma migrate deploy` + start, a cada boot do container
├── 🐳 .dockerignore
│
├── 📄 .env                             # Local, nunca commitado (git-ignorado)
├── 📄 .env.example                     # Modelo com todas as variáveis — copie para .env
├── 📄 .gitignore
├── 📄 nodemon.json
├── 📄 package.json
├── 📄 tsconfig.json                    # Config do backend (src/ → dist/)
└── 📄 tsconfig.frontend.json           # Config do frontend (public/ts/ → public/js/)
```

---

## 🛠️ Instalação e Configuração

Duas formas de rodar o projeto: **local** (Node + Postgres na sua máquina) ou **via Docker** (recomendado — sobe tudo com um comando). Para Docker, pule direto para a [seção Docker](#-rodando-com-docker).

### Pré-requisitos (modo local)

- [Node.js](https://nodejs.org/) 18 ou superior
- [PostgreSQL](https://www.postgresql.org/) 15 ou superior
- [pgAdmin](https://www.pgadmin.org/) (opcional, para gerenciar o banco)

### Passo a Passo (local)

#### 1. Clone o repositório

```bash
git clone https://github.com/JoaoCampos023/Trabalho-Final-ProgIV.git
cd Trabalho-Final-ProgIV/trabalho-final-gestao-gado
```

#### 2. Instale as dependências

```bash
npm install
```

#### 3. Configure o banco de dados

Crie um banco de dados vazio no PostgreSQL (o nome deve bater com o que você colocar no `.env`, por padrão `gestao_gado`):

```sql
CREATE DATABASE gestao_gado;
```

#### 4. Configure as variáveis de ambiente

Copie o `.env.example` para `.env` e preencha com valores reais (nunca use os placeholders em produção):

```bash
cp .env.example .env
```

Variáveis esperadas (ver `.env.example` para a lista completa e comentada):

| Variável | Para que serve |
|---|---|
| `PORT` | Porta em que o servidor Express escuta |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Dados de conexão do Postgres (usados pelo `docker-compose.yml`; fora do Docker servem só de referência) |
| `DATABASE_URL` | String de conexão que o Prisma de fato usa — monte a partir das variáveis acima |
| `JWT_SECRET` | Segredo para assinar os tokens JWT — gere um valor forte, ex.: `openssl rand -base64 48` |
| `AUTO_SEED` | `true`/`false` — se `true` (padrão), popula o banco com dados de exemplo automaticamente na primeira vez que o servidor sobe com o banco vazio |
| `TZ` | Fuso horário do processo Node — `America/Sao_Paulo` (horário de Brasília). Sem isso, "hoje"/"agora" seriam calculados no fuso do sistema operacional (UTC dentro do Docker), adiantando datas em relatórios/validações à noite |

#### 5. Rode as migrations do Prisma

```bash
npx prisma migrate deploy
```

(em desenvolvimento, `npx prisma migrate dev` também funciona e cria novas migrations quando você mexe no `schema.prisma`)

#### 6. Popule o banco com dados de exemplo (opcional, mas recomendado)

Isso já acontece **sozinho** na primeira vez que você sobe o servidor com o banco vazio (ver `AUTO_SEED` acima). Se quiser rodar manualmente a qualquer momento:

```bash
npm run seed
```

Isso cria 4 usuários, 14 animais (com genealogia de 3 gerações) e ~130 registros de produção de leite. Veja os logins de teste no final da execução do comando, ou em `src/database/seed.ts`.

#### 7. Inicie o servidor

```bash
npm run dev
```

Para rodar a versão compilada (produção, sem hot-reload):

```bash
npm run build
npm start
```

#### 8. Acesse a aplicação

| Página | URL |
|--------|-----|
| **Landing Page** | `http://localhost:3000/` |
| **Dashboard** | `http://localhost:3000/app/dashboard.html` |
| **Rebanho** | `http://localhost:3000/app/animais.html` |
| **Produções** | `http://localhost:3000/app/producoes.html` |
| **Relatórios** | `http://localhost:3000/app/relatorios.html` |
| **Usuários (Admin)** | `http://localhost:3000/app/usuarios.html` |
| **Health Check** | `http://localhost:3000/api/health` |

---

## 🐳 Rodando com Docker

Forma mais simples de subir o projeto inteiro (backend + PostgreSQL) sem instalar Node/Postgres na máquina.

O frontend **não** tem um serviço/container próprio: os arquivos estáticos de `public/` (landing page, dashboard, CSS, JS compilado de `public/ts/`) são servidos pelo próprio processo Express do backend (`express.static('public')`), então um único container já expõe a aplicação inteira.

### Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose (`docker compose version`)

### Passo a passo

```bash
# 1. Configure o .env (mesmo passo do modo local)
cp .env.example .env
# edite DB_PASSWORD e JWT_SECRET com valores reais

# 2. Suba tudo e já veja os links de acesso
npm run docker:up
# equivalente a: docker compose up -d --build && sleep 3 && docker compose logs backend --tail 20
```

Isso já basta — **sem nenhum passo manual além do `.env`**:
- o container `db` sobe um PostgreSQL com um volume nomeado (`gestao_gado_db_data`), então os dados persistem entre reinícios;
- o container `backend` espera o banco ficar saudável, roda `npx prisma migrate deploy` automaticamente a cada boot (`docker-entrypoint.sh`) e só então inicia o servidor;
- se o banco estiver vazio, o próprio app popula os dados de exemplo sozinho (mesmo mecanismo de `AUTO_SEED` do modo local).

`docker compose up -d` sozinho sobe em background e não mostra o log de boot — por isso `npm run docker:up` já encadeia um `docker compose logs backend --tail 20` no final, que imprime o bloco com todos os links assim que o container inicia. Se já subiu com `docker compose up -d` puro e quer ver esse bloco depois, é só `npm run docker:logs` (ou `docker compose logs backend | tail -20`) a qualquer momento.

A aplicação fica disponível em `http://localhost:${PORT}/` (porta definida no seu `.env`, `3000` por padrão) — mesmas URLs da tabela da seção anterior.

### Comandos úteis

```bash
npm run docker:logs   # acompanhar logs do backend em tempo real
npm run docker:down   # parar os containers (mantém o volume/dados)
docker compose down -v                          # parar e apagar os dados do banco também
docker compose exec backend npx prisma studio    # abrir o Prisma Studio de dentro do container
```

> Se a porta `3000` (ou `5432`) já estiver em uso na sua máquina por outro processo/container, mude `PORT`/`DB_PORT` no `.env` antes de subir.

---

## 🔐 Autenticação & Permissões

Não existe usuário admin fixo criado automaticamente fora do seed. Para obter acesso:

- **Registro público**: `POST /api/auth/register` cria uma conta com papel `Cliente`.
- **Dados de exemplo (seed)**: rodando o seed (automático ou via `npm run seed`), você ganha um usuário `Admin` e outros `Cliente` de teste — ver credenciais impressas no console ao rodar o seed, ou em `src/database/seed.ts`. São dados de exemplo para desenvolvimento/demo, não credenciais de produção.
- Para promover alguém a `Admin` manualmente, um usuário Admin existente pode editar o papel pela tela de Usuários ou via `PUT /api/users/:id`.

### Níveis de Acesso

| Perfil | Descrição |
|--------|-----------|
| **Admin** | Acesso total ao sistema, incluindo gerenciamento de usuários |
| **Cliente** | Acesso às funcionalidades principais (animais, produções, relatórios) |

---

## 📡 Endpoints da API

Todas as rotas abaixo são prefixadas com `/api`. 🔒 = requer `Authorization: Bearer <token>` (JWT). 👑 = requer token de um usuário `Admin`. ❌ = pública.

<details>
<summary><strong>📑 Expandir Tabela de Rotas</strong></summary>

### 🔑 Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `POST` | `/register` | Registrar novo usuário (papel `Cliente`) | ❌ |
| `POST` | `/login` | Autenticar e gerar token JWT | ❌ |

---

### 🐮 Gestão do Rebanho (`/api/animais`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/` | Listar animais (com filtros de nome/sexo/raça) | 🔒 |
| `GET` | `/:brinco` | Buscar animal pelo brinco | 🔒 |
| `GET` | `/:brinco/tree` | Árvore genealógica completa (pais, avós, filhos) | 🔒 |
| `GET` | `/machos/selecao` | Machos ativos, para seleção de pai | 🔒 |
| `GET` | `/femeas/selecao` | Fêmeas ativas, para seleção de mãe | 🔒 |
| `GET` | `/stats` | Estatísticas consolidadas do rebanho | 🔒 |
| `POST` | `/` | Cadastrar novo animal | 🔒 |
| `PUT` | `/:brinco` | Atualizar cadastro do animal | 🔒 |
| `DELETE` | `/:brinco` | Remover animal (soft delete) | 🔒 |
| `DELETE` | `/:brinco/permanent` | Excluir animal permanentemente | 🔒 |

---

### 🥛 Produção Leiteira (`/api/producoes`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/` | Listar registros de produção | 🔒 |
| `GET` | `/:id` | Obter registro específico | 🔒 |
| `GET` | `/animal/:brinco` | Histórico de produções por animal | 🔒 |
| `GET` | `/ultimas/:quantidade` | Últimos N registros de produção | 🔒 |
| `GET` | `/top-vacas` | Ranking das vacas mais produtoras | 🔒 |
| `GET` | `/producao-dia` | Produção agregada por dia | 🔒 |
| `GET` | `/stats` | Estatísticas globais de produção | 🔒 |
| `GET` | `/relatorio` | Relatório consolidado para exportação | 🔒 |
| `POST` | `/` | Registrar ordenha/produção diária | 🔒 |
| `PUT` | `/:id` | Editar registro de produção | 🔒 |
| `DELETE` | `/:id` | Excluir registro de produção | 🔒 |

---

### 👤 Gerenciamento de Usuários (`/api/users`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/` | Listar usuários do sistema | 👑 |
| `GET` | `/paginated` | Listar usuários com paginação e filtros | 👑 |
| `GET` | `/stats` | Estatísticas de usuários | 👑 |
| `GET` | `/:id` | Buscar usuário por ID | 👑 |
| `POST` | `/` | Criar usuário via painel | 👑 |
| `PUT` | `/:id` | Atualizar perfil do usuário | 👑 |
| `PATCH` | `/:id/toggle-status` | Ativar/Desativar usuário | 👑 |
| `POST` | `/:id/reset-password` | Resetar senha do usuário | 👑 |
| `DELETE` | `/:id` | Excluir usuário | 👑 |

---

### 📊 Relatórios (`/api/relatorios`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/producao` | Relatório detalhado de produção | 🔒 |
| `GET` | `/producao/pdf` | Exportar relatório de produção em PDF | 🔒 |
| `GET` | `/producao/excel` | Exportar relatório de produção em Excel | 🔒 |
| `GET` | `/rebanho` | Relatório do rebanho | 🔒 |
| `GET` | `/rebanho/pdf` | Exportar relatório do rebanho em PDF | 🔒 |
| `GET` | `/graficos/producao` | Dados para gráfico de produção | 🔒 |
| `GET` | `/graficos/rebanho` | Dados para gráfico do rebanho | 🔒 |
| `GET` | `/dashboard` | Dados agregados para o dashboard | 🔒 |

---

### 🔔 Notificações (`/api/notificacoes`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/alertas` | Listar alertas ativos | 🔒 |
| `PUT` | `/alertas/:id` | Marcar alerta como lido | 🔒 |
| `POST` | `/email` | Enviar notificação por email | 🔒 |
| `POST` | `/whatsapp` | Enviar notificação por WhatsApp | 🔒 |
| `GET` | `/config` | Obter configurações de notificação | 🔒 |
| `PUT` | `/config` | Atualizar configurações de notificação | 🔒 |

---

### 📥 Importação/Exportação (`/api/importacao`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/exportar/animais` | Exportar animais em CSV | 🔒 |
| `GET` | `/exportar/producoes` | Exportar produções em CSV | 🔒 |
| `GET` | `/exportar/rebanho` | Exportar rebanho completo em CSV | 🔒 |
| `POST` | `/importar/animais` | Importar animais via CSV | 🔒 |
| `POST` | `/importar/producoes` | Importar produções via CSV | 🔒 |
| `GET` | `/modelos/animais` | Baixar modelo CSV de animais | 🔒 |
| `GET` | `/modelos/producoes` | Baixar modelo CSV de produções | 🔒 |

---

### 🌐 Serviços Externos (`/api/externa`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/cep/:cep` | Buscar endereço por CEP (ViaCEP) | ❌ |
| `POST` | `/validar/cpf` | Validar CPF | ❌ |
| `GET` | `/endereco/:cep` | Buscar endereço (autenticado) | 🔒 |

---

### ❤️ Health Check

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/api/health` | Status da API/WebSocket/banco | ❌ |

</details>

---

## 📦 Scripts do Projeto

| Script | Comando | Descrição |
| :--- | :--- | :--- |
| **Dev** | `npm run dev` | Inicia o backend com hot-reload (Nodemon + tsx) |
| **Build** | `npm run build` | Compila backend (`src/` → `dist/`) **e** frontend (`public/ts/` → `public/js/`) |
| **Build (só backend)** | `npm run build:backend` | Só `tsc` do backend |
| **Build (só frontend)** | `npm run build:frontend` | Só `tsc` do frontend (`tsconfig.frontend.json`) |
| **Watch frontend** | `npm run watch:frontend` | Recompila `public/ts/` a cada alteração |
| **Start** | `npm start` | Executa a versão compilada (`node dist/app.js`) — use depois de `npm run build` |
| **Seed** | `npm run seed` | Popula o banco com dados de exemplo (equivalente a `npx prisma db seed`) |
| **Prisma Studio** | `npx prisma studio` | Abre interface visual do banco de dados |
| **Prisma Generate** | `npx prisma generate` | (Re)gera o Prisma Client depois de mudar o `schema.prisma` |
| **Migrations (dev)** | `npm run migrate` | Cria e aplica novas migrations a partir do `schema.prisma` (equivalente a `npx prisma migrate dev`) |
| **Migrations (deploy)** | `npm run migrate:deploy` | Só aplica as migrations existentes, sem criar novas — uso em produção/CI (equivalente a `npx prisma migrate deploy`) |
| **Docker up** | `npm run docker:up` | Builda e sobe backend + banco via Docker Compose, já mostrando o log com os links de acesso |
| **Docker logs** | `npm run docker:logs` | Acompanha os logs do container `backend` em tempo real |
| **Docker down** | `npm run docker:down` | Para os containers (mantém os dados do banco) |
| **Lint** | `npm run lint` | ESLint sobre backend (`src/`, `prisma/`) e frontend (`public/ts/`), config compartilhada em `eslint.config.js` |
| **Lint (fix)** | `npm run lint:fix` | Aplica as correções automáticas possíveis |
| **Format** | `npm run format` | Formata o projeto inteiro com Prettier |
| **Format (check)** | `npm run format:check` | Só verifica se está formatado, sem alterar nada (uso em CI) |

---

## 🔄 Roadmap & Próximas Melhorias

- [x] ✅ CRUD completo de animais, produções e usuários
- [x] ✅ Árvore genealógica
- [x] ✅ Dashboard com gráficos
- [x] ✅ Relatórios e estatísticas
- [x] ✅ Importação/Exportação CSV
- [x] ✅ APIs externas (ViaCEP, validação CPF)
- [x] ✅ Frontend migrado para TypeScript
- [x] ✅ Ícones (Font Awesome) no lugar de emoji na interface
- [x] ✅ Suporte a contêineres com **Docker** e **Docker Compose**
- [x] ✅ Seed de dados de exemplo, automático em banco vazio
- [x] ✅ Padronização de lint (ESLint compartilhado backend/frontend, `npm run lint` sem erros) e config de formatação (Prettier) — reformatação do código existente ainda pendente (`npm run format` não foi aplicado em massa)
- [ ] 🔄 Cobertura de testes unitários e de integração com **Jest**
- [ ] 🔄 Módulo de exportação automática (agendada) de relatórios em **PDF**
- [ ] 🔄 Validar se o WebSocket (`src/websocket/server.ts`) está de fato integrado ao fluxo de notificações ou é só esqueleto
- [ ] 🔄 Microsserviço em .NET para relatórios

---

## 📝 Licença

Este projeto foi desenvolvido como trabalho acadêmico. Todos os direitos reservados.

---

## 👨‍💻 Autores

<p align="center">
  <strong>João Vitor Tibes de Campos</strong><br>
  <strong>Kalil Massignani da Rosa</strong><br>
  <strong>Silvio Bolzani</strong><br>
  <strong>Matheus Henrique Friebel</strong><br>
  Ciencias da Computação / Programação IV
</p>

---

<div align="center">
  <sub>🐄 <strong>Gestão de Gado</strong> — Simplificando e modernizando o manejo do seu rebanho.</sub>
</div>
