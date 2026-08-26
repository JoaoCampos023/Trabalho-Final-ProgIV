<p align="center">🐄 Gestão de Gado</p>



<p align="center">

&#x20; <strong>Sistema inteligente e completo para controle de rebanho e gestão da produção leiteira.</strong>

</p>



<p align="center">

&#x20; <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=for-the-badge\&logo=git" alt="Status">

&#x20; <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white" alt="Node.js">

&#x20; <img src="https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white" alt="TypeScript">

&#x20; <img src="https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?style=for-the-badge\&logo=postgresql\&logoColor=white" alt="PostgreSQL">

&#x20; <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge\&logo=express\&logoColor=white" alt="Express.js">

</p>



<p align="center">

&#x20; <a href="#-sobre-o-projeto">Sobre</a> •

&#x20; <a href="#-tecnologias-utilizadas">Tecnologias</a> •

&#x20; <a href="#-estrutura-do-projeto">Estrutura</a> •

&#x20; <a href="#-instalação-e-configuração">Instalação</a> •

&#x20; <a href="#-endpoints-da-api">Endpoints API</a> •

&#x20; <a href="#-contribuição">Contribuição</a>

</p>



\---



\## 📋 Sobre o Projeto



O \*\*Gestão de Gado\*\* é uma plataforma web desenvolvida para otimizar o manejo pecuário, facilitando o acompanhamento detalhado da saúde do rebanho, genealogia e produtividade leiteira diária. 



Designed para prover uma interface intuitiva aos produtores rurais aliada a uma arquitetura backend escalável e segura.



\### ✨ Principais Funcionalidades



\- 🐮 \*\*Controle de Rebanho:\*\* Cadastro centralizado, histórico individual e ficha técnica do animal.

\- 🥛 \*\*Gestão de Produção:\*\* Monitoramento e histórico diário da ordenha e volume produzido.

\- 🧬 \*\*Árvore Genealógica:\*\* Rastreamento estruturado de ascendência e linhagem genético-reprodutiva.

\- 📊 \*\*Dashboards \& Relatórios:\*\* Visualização analítica de métricas vitais e rankings de produtividade.

\- 🔐 \*\*Controle de Acesso (RBAC):\*\* Autenticação segura via JWT com níveis de permissão (Admin e Usuário).



\---



\## 🚀 Tecnologias Utilizadas



<details>

<summary><strong>🔍 Clique para ver a stack completa</strong></summary>



\### Backend

\* \*\*Runtime:\*\* Node.js (v18+)

\* \*\*Linguagem:\*\* TypeScript 5.0+

\* \*\*Framework Web:\*\* Express.js

\* \*\*Banco de Dados:\*\* PostgreSQL 15+ (Driver Native `pg`)

\* \*\*Autenticação \& Segurança:\*\* JWT (JSON Web Tokens), `bcryptjs`, CORS



\### Frontend

\* \*\*Core:\*\* HTML5 Semântico, CSS3 Moderno, JavaScript Vanilla (ES6+)

\* \*\*UI Components \& Icons:\*\* Bootstrap Icons



\### Tooling \& Dev Environment

\* \*\*tsx\*\* — Execução rápida de TypeScript sem compilação prévia

\* \*\*Nodemon\*\* — Live reload durante desenvolvimento

\* \*\*Dotenv\*\* — Gerenciamento seguro de variáveis de ambiente



</details>



\---



\## 📂 Estrutura do Projeto



```

trabalho-final-gestao-gado/

├── 🌐 public/                     # Frontend estático e assets

│   ├── index.html                 # Landing Page \& Portal de Acesso

│   ├── dashboard.html             # Painel Principal de Operações

│   ├── css/                       # Estilização global e componentes

│   └── js/                        # Camada de integração API e componentes JS

├── 🛠️ src/                        # Código-fonte do Backend

│   ├── config/                    # Configurações do banco e serviços

│   ├── controllers/               # Camada de controle e resposta HTTP

│   ├── database/                  # Scripts SQL e Migrations

│   ├── middlewares/               # Autenticação, autorização e validações

│   ├── models/                    # Entidades e interfaces do domínio

│   ├── repositories/              # Camada de persistência de dados (Data Access)

│   ├── routes/                    # Definição das rotas e endpoints

│   ├── services/                  # Regras de negócio e lógica da aplicação

│   ├── utils/                     # Helpers, geradores e validadores

│   └── app.ts                     # Ponto de entrada da aplicação Express

├── ⚙️ .env.example                 # Exemplo de variáveis de ambiente

├── ⚙️ tsconfig.json                # Configurações do compilador TypeScript

└── 📦 package.json                # Dependências e scripts do projeto

```



\---





\## 🔐 Autenticação \& Permissões



\### 🔑 Credenciais Padrão (Seed Inicial)



| E-mail | Senha | Perfil de Acesso |

| :--- | :--- | :--- |

| `admin@admin.com` | `123456` | \*\*Admin\*\* |



\---



\## 📡 Endpoints da API



<details>

<summary><strong>📑 Expandir Tabela de Rotas</strong></summary>



\### 🔑 Autenticação (`/api/auth`)

| Método | Endpoint | Descrição |

| :---: | :--- | :--- |

| `POST` | `/api/auth/register` | Registrar novo usuário na plataforma |

| `POST` | `/api/auth/login` | Autenticar usuário e gerar token JWT |



\---



\### 🐮 Gestão do Rebanho (`/api/animais`)

| Método | Endpoint | Descrição | Auth |

| :---: | :--- | :--- | :---: |

| `GET` | `/` | Listar todos os animais | 🔒 |

| `GET` | `/:brinco` | Buscar dados do animal pelo brinco | 🔒 |

| `GET` | `/:brinco/tree` | Obter árvore genealógica | 🔒 |

| `GET` | `/stats` | Estatísticas consolidadas do rebanho | 🔒 |

| `POST` | `/` | Cadastrar novo animal | 🔒 |

| `PUT` | `/:brinco` | Atualizar cadastro do animal | 🔒 |

| `DELETE` | `/:brinco` | Remover animal do sistema | 🔒 |



\---



\### 🥛 Produção Leiteira (`/api/producoes`)

| Método | Endpoint | Descrição | Auth |

| :---: | :--- | :--- | :---: |

| `GET` | `/` | Listar registros de produção | 🔒 |

| `GET` | `/:id` | Obter registro específico | 🔒 |

| `GET` | `/animal/:brinco` | Histórico de produções por animal | 🔒 |

| `GET` | `/top-vacas` | Ranking das vacas mais produtoras | 🔒 |

| `GET` | `/stats` | Estatísticas globais de produção | 🔒 |

| `GET` | `/relatorio` | Relatório consolidado para exportação | 🔒 |

| `POST` | `/` | Registrar ordenha/produção diária | 🔒 |

| `PUT` | `/:id` | Editar registro de produção | 🔒 |

| `DELETE` | `/:id` | Excluir registro de produção | 🔒 |



\---



\### 👤 Gerenciamento de Usuários (`/api/users`)

| Método | Endpoint | Descrição | Auth |

| :---: | :--- | :--- | :---: |

| `GET` | `/` | Listar usuários do sistema | 👑 Admin |

| `GET` | `/:id` | Buscar usuário por ID | 👑 Admin |

| `POST` | `/` | Criar usuário via painel | 👑 Admin |

| `PUT` | `/:id` | Atualizar perfil do usuário | 👑 Admin |

| `PATCH` | `/:id/toggle-status` | Ativar/Desativar usuário | 👑 Admin |

| `DELETE` | `/:id` | Excluir usuário | 👑 Admin |



</details>



\---



\## 📦 Scripts do Projeto



| Script | Comando | Descrição |

| :--- | :--- | :--- |

| \*\*Dev\*\* | `npm run dev` | Inicia servidor com Hot-Reload (TSX/Nodemon) |

| \*\*Build\*\* | `npm run build` | Compila arquivos TypeScript para JavaScript (`/dist`) |

| \*\*Start\*\* | `npm start` | Executa a versão compilada em produção |

| \*\*Migrate\*\* | `npm run migrate` | Executa scripts de criação de tabelas no banco |



\---



\## 🔄 Roadmap \& Próximas Melhorias



\- \[ ] Suporte a contêineres com \*\*Docker\*\* e \*\*Docker Compose\*\*

\- \[ ] Cobertura de testes unitários e de integração com \*\*Jest\*\*

\- \[ ] Módulo de exportação automática de relatórios em \*\*PDF\*\* e \*\*Excel\*\*

\- \[ ] Notificações e alertas em tempo real via WebSockets

\- \[ ] Dashboard responsivo com suporte a PWA (Progressive Web App)



\---



\## 🤝 Contribuição



Contribuições tornam a comunidade open-source um lugar incrível para aprender, inspirar e criar. Qualquer contribuição é \*\*muito apreciada\*\*!



1\. Faça um \*\*Fork\*\* do projeto

2\. Crie uma Branch para sua Feature (`git checkout -b feature/IncrivelFeature`)

3\. Adicione suas alterações (`git commit -m 'feat: adiciona nova incrível feature'`)

4\. Envie a Branch (`git push origin feature/IncrivelFeature`)

5\. Abra um \*\*Pull Request\*\*



\---



\## 📝 Licença



Este projeto foi desenvolvido como trabalho acadêmico. Todos os direitos reservados.



\---



\## 👨‍💻 Autor



<p align="center">

&#x20; <strong>João Vitor Tibes de Campos</strong><br>

&#x20; Engenharia de Software / Engenharia de Requisitos

</p>



<p align="center">

&#x20; <a href="https://github.com/seu-usuario">

&#x20;   <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge\&logo=github\&logoColor=white" alt="GitHub">

&#x20; </a>

</p>



\---



<div align="center">

&#x20; <sub>🐄 <strong>Gestão de Gado</strong> — Simplificando e modernizando o manejo do seu rebanho.</sub>

</div>

