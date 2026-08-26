\# 🐄 Gestão de Gado



Sistema completo para gerenciamento de rebanho e produção de leite.



!\[Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

!\[Node](https://img.shields.io/badge/Node.js-18%2B-green)

!\[TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)

!\[PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue)



\---



\## 📋 Sobre o Projeto



O \*\*Gestão de Gado\*\* é um sistema web desenvolvido como trabalho final da faculdade, com o objetivo de auxiliar produtores rurais no gerenciamento eficiente do rebanho e da produção de leite.



O sistema permite:

\- Cadastro e controle de animais (rebanho)

\- Registro de produção de leite diária

\- Árvore genealógica dos animais

\- Relatórios e estatísticas

\- Gestão de usuários com níveis de acesso



\---



\## 🚀 Tecnologias Utilizadas



\### Backend

\- \*\*Node.js\*\* - Runtime JavaScript

\- \*\*TypeScript\*\* - Tipagem estática

\- \*\*Express.js\*\* - Framework web

\- \*\*PostgreSQL\*\* - Banco de dados relacional

\- \*\*JWT\*\* - Autenticação e autorização

\- \*\*bcryptjs\*\* - Hash de senhas



\### Frontend

\- \*\*HTML5\*\* + \*\*CSS3\*\* - Estrutura e estilos

\- \*\*JavaScript Vanilla\*\* - Interatividade

\- \*\*Bootstrap Icons\*\* - Ícones



\### Ferramentas

\- \*\*tsx\*\* - Execução de TypeScript em desenvolvimento

\- \*\*nodemon\*\* - Reinício automático do servidor

\- \*\*pg\*\* - Driver PostgreSQL

\- \*\*cors\*\* - Middleware de segurança



\---



\## 📂 Estrutura do Projeto



trabalho-final-gestao-gado/

├── public/

│ ├── index.html # Landing Page

│ ├── dashboard.html # Dashboard principal

│ ├── css/

│ │ └── style.css # Estilos globais

│ └── js/

│ ├── api.js # Comunicação com API

│ ├── app.js # Lógica do dashboard

│ └── landing.js # Lógica da landing page

├── src/

│ ├── config/

│ │ └── database.ts # Configuração do PostgreSQL

│ ├── controllers/

│ │ ├── AnimalController.ts

│ │ ├── ProducaoController.ts

│ │ └── UserController.ts

│ ├── database/

│ │ └── migrations/

│ │ └── 001\_create\_tables.ts

│ ├── middlewares/

│ │ ├── auth.ts # Autenticação JWT

│ │ ├── role.ts # Controle de permissões

│ │ └── validation.ts # Validação de dados

│ ├── models/

│ │ ├── Animal.ts

│ │ ├── ProducaoLeite.ts

│ │ └── User.ts

│ ├── repositories/

│ │ ├── AnimalRepository.ts

│ │ ├── ProducaoRepository.ts

│ │ └── UserRepository.ts

│ ├── routes/

│ │ ├── animalRoutes.ts

│ │ ├── authRoutes.ts

│ │ ├── producaoRoutes.ts

│ │ └── userRoutes.ts

│ ├── services/

│ │ ├── AnimalService.ts

│ │ ├── ProducaoService.ts

│ │ └── UserService.ts

│ ├── utils/

│ │ ├── cpfValidator.ts

│ │ ├── dateUtils.ts

│ │ └── passwordGenerator.ts

│ └── app.ts # Ponto de entrada

├── .env # Variáveis de ambiente

├── .gitignore

├── package.json

├── tsconfig.json

└── README.md





\---



