<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=for-the-badge&logo=git" alt="Status">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
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
  <a href="#-endpoints-da-api">Endpoints API</a> •
  <a href="#-contribuição">Contribuição</a>
</p>

---

## 📋 Sobre o Projeto

O **Gestão de Gado** é uma plataforma web desenvolvida para otimizar o manejo pecuário, facilitando o acompanhamento detalhado da saúde do rebanho, genealogia e produtividade leiteira diária.

Desenvolvido com foco em **simplicidade**, **eficiência** e **segurança**, o sistema oferece uma interface intuitiva para produtores rurais e uma arquitetura backend escalável.

### ✨ Principais Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| 🐮 **Controle de Rebanho** | Cadastro centralizado, histórico individual e ficha técnica completa de cada animal |
| 🥛 **Gestão de Produção** | Monitoramento e histórico diário da ordenha com registro por período (manhã/tarde/noite) |
| 🧬 **Árvore Genealógica** | Rastreamento estruturado de ascendência com visualização de pais, avós e filhos |
| 📊 **Dashboards & Relatórios** | Visualização analítica de métricas vitais, rankings de produtividade e gráficos interativos |
| 🔐 **Controle de Acesso (RBAC)** | Autenticação segura via JWT com níveis de permissão (Admin e Usuário) |
| 📱 **Responsivo** | Interface adaptada para desktop, tablet e dispositivos móveis |

---

## 🚀 Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | v18+ | Runtime JavaScript |
| **TypeScript** | 5.0+ | Linguagem com tipagem estática |
| **Express.js** | 4.x | Framework web |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **Prisma ORM** | 5.x | ORM para acesso ao banco de dados |
| **JWT** | - | Autenticação e autorização |
| **bcryptjs** | - | Hash de senhas |

### Frontend
| Tecnologia | Descrição |
|------------|-----------|
| **HTML5 Semântico** | Estruturação das páginas |
| **CSS3 Moderno** | Estilização com Flexbox e Grid |
| **JavaScript Vanilla (ES6+)** | Interatividade e consumo de API |
| **Chart.js** | Gráficos interativos no dashboard |
| **Bootstrap Icons** | Biblioteca de ícones |

### Ferramentas de Desenvolvimento
| Ferramenta | Descrição |
|------------|-----------|
| **tsx** | Execução rápida de TypeScript sem compilação prévia |
| **Nodemon** | Live reload durante desenvolvimento |
| **Dotenv** | Gerenciamento seguro de variáveis de ambiente |
| **Multer** | Upload de arquivos (importação CSV) |

---

## 📂 Estrutura do Projeto

```
trabalho-final-gestao-gado/
│
├── 📁 public/                         
│   ├── 📁 app/                        
│   │   ├── dashboard.html             
│   │   ├── relatorios.html            
│   │   ├── animais.html               
│   │   ├── producoes.html            
│   │   └── usuarios.html              
│   │
│   ├── 📁 css/
│   │   ├── style.css            
│   │   └── landing.css     
│   │
│   ├── 📁 js/
│   │   ├── api.js                     
│   │   ├── app.js
│   │   ├── components.js                    
│   │   └── landing.js                 
│   │
│   └── index.html                     
│
├── 📁 src/                            
│   ├── 📁 config/                    
│   │   ├── database.ts                
│   │   └── prisma.ts                  
│   │
│   ├── 📁 controllers/                
│   │   ├── AnimalController.ts
│   │   ├── ProducaoController.ts
│   │   ├── UserController.ts
│   │   ├── RelatorioController.ts
│   │   ├── NotificacaoController.ts
│   │   ├── ImportacaoController.ts
│   │   ├── ExternaController.ts
│   │   └── index.ts
│   │
│   ├── 📁 middlewares/                
│   │   ├── auth.ts
│   │   ├── role.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   └── index.ts
│   │
│   ├── 📁 models/                     
│   │   ├── Animal.ts
│   │   ├── ProducaoLeite.ts
│   │   ├── User.ts
│   │   └── index.ts
│   │
│   ├── 📁 repositories/               
│   │   ├── AnimalRepository.ts
│   │   ├── ProducaoRepository.ts
│   │   ├── UserRepository.ts
│   │   └── index.ts
│   │
│   ├── 📁 routes/                     
│   │   ├── index.ts
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── animalRoutes.ts
│   │   ├── producaoRoutes.ts
│   │   ├── relatorioRoutes.ts
│   │   ├── notificacaoRoutes.ts
│   │   ├── importacaoRoutes.ts
│   │   └── externaRoutes.ts
│   │
│   ├── 📁 services/                   
│   │   ├── AnimalService.ts
│   │   ├── ProducaoService.ts
│   │   ├── UserService.ts
│   │   ├── RelatorioService.ts
│   │   ├── NotificacaoService.ts
│   │   └── index.ts
│   │
│   ├── 📁 utils/                      
│   │   ├── cpfValidator.ts
│   │   ├── dateUtils.ts
│   │   ├── passwordGenerator.ts
│   │   └── index.ts
│   │
│   ├── 📁 websocket/                  
│   │   └── server.ts
│   │
│   └── app.ts                         
│
├── 📁 prisma/                         
│   └── schema.prisma                  
│
│
├── 📄 .env                    
├── 📄 .gitignore
├── 📄 nodemon.json
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 tsconfig.json
└── 📄 README.md
```

---

## 🛠️ Instalação e Configuração

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [PostgreSQL](https://www.postgresql.org/) (versão 15 ou superior)
- [pgAdmin](https://www.pgadmin.org/) (opcional, para gerenciar o banco)

### Passo a Passo

#### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/gestao-gado.git
cd gestao-gado
```

#### 2. Instale as dependências

```bash
npm install
```

#### 3. Configure o banco de dados

Crie um banco de dados no PostgreSQL:

```sql
CREATE DATABASE gestao_gado;
```

#### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```env
# Servidor
PORT=3000

# PostgreSQL (mantido)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=gestao_gado

# Prisma ORM
DATABASE_URL="postgresql://postgres:123456@localhost:5432/gestao_gado?schema=public"

# JWT
JWT_SECRET=123456
```

#### 5. Execute as migrações do Prisma

```bash
npx prisma migrate dev --name init
```

#### 6. Inicie o servidor

```bash
npm run dev
```

#### 7. Acesse a aplicação

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

## 🔐 Autenticação & Permissões

### 🔑 Credenciais Padrão (Seed Inicial)

| E-mail | Senha | Perfil de Acesso |
| :--- | :--- | :--- |
| `admin@admin.com` | `123456` | **Admin** |

### Níveis de Acesso

| Perfil | Descrição |
|--------|-----------|
| **Admin** | Acesso total ao sistema, incluindo gerenciamento de usuários |
| **Cliente** | Acesso às funcionalidades principais (animais, produções, relatórios) |

---

## 📡 Endpoints da API

<details>
<summary><strong>📑 Expandir Tabela de Rotas</strong></summary>

### 🔑 Autenticação (`/api/auth`)

| Método | Endpoint | Descrição |
| :---: | :--- | :--- |
| `POST` | `/api/auth/register` | Registrar novo usuário na plataforma |
| `POST` | `/api/auth/login` | Autenticar usuário e gerar token JWT |

---

### 🐮 Gestão do Rebanho (`/api/animais`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/` | Listar todos os animais (com filtros) | 🔒 |
| `GET` | `/:brinco` | Buscar dados do animal pelo brinco | 🔒 |
| `GET` | `/:brinco/tree` | Obter árvore genealógica completa | 🔒 |
| `GET` | `/stats` | Estatísticas consolidadas do rebanho | 🔒 |
| `POST` | `/` | Cadastrar novo animal | 🔒 |
| `PUT` | `/:brinco` | Atualizar cadastro do animal | 🔒 |
| `DELETE` | `/:brinco` | Remover animal do sistema (soft delete) | 🔒 |

---

### 🥛 Produção Leiteira (`/api/producoes`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/` | Listar registros de produção | 🔒 |
| `GET` | `/:id` | Obter registro específico | 🔒 |
| `GET` | `/animal/:brinco` | Histórico de produções por animal | 🔒 |
| `GET` | `/ultimas/:quantidade` | Últimos N registros de produção | 🔒 |
| `GET` | `/top-vacas` | Ranking das vacas mais produtoras | 🔒 |
| `GET` | `/stats` | Estatísticas globais de produção | 🔒 |
| `GET` | `/relatorio` | Relatório consolidado para exportação | 🔒 |
| `POST` | `/` | Registrar ordenha/produção diária | 🔒 |
| `PUT` | `/:id` | Editar registro de produção | 🔒 |
| `DELETE` | `/:id` | Excluir registro de produção | 🔒 |

---

### 👤 Gerenciamento de Usuários (`/api/users`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/` | Listar usuários do sistema | 👑 Admin |
| `GET` | `/:id` | Buscar usuário por ID | 👑 Admin |
| `POST` | `/` | Criar usuário via painel | 👑 Admin |
| `PUT` | `/:id` | Atualizar perfil do usuário | 👑 Admin |
| `PATCH` | `/:id/toggle-status` | Ativar/Desativar usuário | 👑 Admin |
| `DELETE` | `/:id` | Excluir usuário | 👑 Admin |

---

### 📊 Relatórios (`/api/relatorios`)

| Método | Endpoint | Descrição | Auth |
| :---: | :--- | :--- | :---: |
| `GET` | `/producao` | Relatório detalhado de produção | 🔒 |
| `GET` | `/producao/pdf` | Exportar relatório em PDF | 🔒 |
| `GET` | `/producao/excel` | Exportar relatório em Excel | 🔒 |
| `GET` | `/rebanho` | Relatório do rebanho | 🔒 |
| `GET` | `/graficos/producao` | Dados para gráfico de produção | 🔒 |
| `GET` | `/graficos/rebanho` | Dados para gráfico do rebanho | 🔒 |
| `GET` | `/dashboard` | Dados para dashboard em tempo real | 🔒 |

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

</details>

---

## 📦 Scripts do Projeto

| Script | Comando | Descrição |
| :--- | :--- | :--- |
| **Dev** | `npm run dev` | Inicia servidor com Hot-Reload (TSX/Nodemon) |
| **Build** | `npm run build` | Compila arquivos TypeScript para JavaScript (`/dist`) |
| **Start** | `npm start` | Executa a versão compilada em produção |
| **Migrate** | `npm run migrate` | Executa migrações do Prisma |
| **Prisma Generate** | `npm run prisma:generate` | Gera o cliente Prisma |
| **Prisma Studio** | `npx prisma studio` | Abre interface visual do banco de dados |

---

## 🔄 Roadmap & Próximas Melhorias

- [x] ✅ CRUD completo de animais, produções e usuários
- [x] ✅ Árvore genealógica
- [x] ✅ Dashboard com gráficos
- [x] ✅ Relatórios e estatísticas
- [x] ✅ Importação/Exportação CSV
- [x] ✅ APIs externas (ViaCEP, validação CPF)
- [ ] 🔄 Suporte a contêineres com **Docker** e **Docker Compose**
- [ ] 🔄 Cobertura de testes unitários e de integração com **Jest**
- [ ] 🔄 Módulo de exportação automática de relatórios em **PDF**
- [ ] 🔄 Notificações e alertas em tempo real via WebSockets
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
  Ciencias da Cmputação / Programação IV
</p>

<p align="center">
  <a href="https://github.com/JoaoCampos023">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
</p>

---

<div align="center">
  <sub>🐄 <strong>Gestão de Gado</strong> — Simplificando e modernizando o manejo do seu rebanho.</sub>
</div>
