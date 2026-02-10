---

🎓 Concursos Aqui — Backend (API)

<p align="center">
API REST para a plataforma Concursos Aqui, responsável pelo gerenciamento de candidatos, professores, concursos e administradores, com autenticação, aprovação manual de professores e recuperação de senha via e-mail.
</p><p align="center">
<strong>Status:</strong> MVP funcional finalizado<br/>
<strong>Frontend:</strong> <a href="https://github.com/josemiguelvieira/concursos-aqui-frontend">Repositório do frontend</a>
</p>
---

🏗️ Arquitetura

API REST baseada em Node.js + Express

Arquitetura organizada por camadas:

Routes → Controllers → Database

Separação clara entre:

rotas

regras de negócio

acesso ao banco

autenticação


Autenticação stateless via JWT (professores)

Envio de e-mails transacionais com Nodemailer

Persistência em banco relacional MySQL


---

🧰 Tecnologias

Node.js

Express

MySQL

mysql2

JWT (jsonwebtoken)

bcrypt

Nodemailer

dotenv

CORS



---

🗄️ Modelo de Dados

📌 Entidades principais

👤 Candidato

id

nome

email (único)

senha (bcrypt)

foto_perfil (avatar automático – DiceBear)

reset_token

reset_expires



---

👨‍🏫 Professor

id

nome

sobrenome

email

senha (bcrypt)

area_atuacao

foto_perfil (Base64)

formacao

link_curriculo

metodo_gravacao

status (pendente | aprovado | reprovado)

reset_token

reset_expires



---

👨‍💼 Admin

id

nome

email

senha (bcrypt)



---

📚 Concurso

id

(demais campos conforme tabela de concursos)



---

🔐 Autenticação e Segurança

Autenticação via JWT apenas para professores

Tokens assinados com HS256

Middleware próprio de autenticação:


authProfessor.js

Senhas armazenadas com bcrypt

Sessão totalmente stateless

Controle de acesso por rota



---

🔐 Recuperação de senha

Implementada para:

candidatos

professores


Fluxo:

geração de código numérico de 6 dígitos

armazenamento no banco

data de expiração

validação do código

redefinição de senha

limpeza do token após uso


Envio automático por e-mail com Nodemailer (Gmail SMTP).


---

🔌 Endpoints da API

👤 Candidatos

POST   /candidatos
POST   /candidatos/login
PUT    /candidatos/senha
PUT    /candidatos/dados
POST   /candidatos/forgot-password
POST   /candidatos/reset-password
DELETE /candidatos/:id


---

👨‍🏫 Professores

Rotas públicas

POST /professores
POST /professores/login
POST /professores/forgot-password
POST /professores/reset-password

Rotas protegidas (JWT)

GET  /professores/me
PUT  /professores/perfil
PUT  /professores/senha


---

👨‍💼 Administração

POST /admin/login
GET  /admin/professores/pendentes
POST /admin/professores/:id/aprovar
POST /admin/professores/:id/reprovar


---

📚 Concursos

GET /concursos


---

📏 Regras de Negócio

E-mail de candidato não pode ser duplicado

E-mail de professor não pode ser duplicado

Professores só podem acessar a área restrita após aprovação do administrador

Login de professor é bloqueado se o status não for aprovado

Nova senha não pode ser igual à senha atual

Senhas devem possuir no mínimo 8 caracteres

Tokens de redefinição possuem validade

Sistema não revela se o e-mail existe durante a recuperação de senha



---

⚙️ Como rodar o projeto localmente

🔧 Pré-requisitos

Node.js

MySQL

Conta de e-mail Gmail para SMTP



---

📄 Configuração

Crie um arquivo .env na raiz do projeto:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=*****
DB_NAME=concursos

EMAIL_USER=seuemail@gmail.com
EMAIL_PASS=sua_senha_de_app


---

▶️ Execução

Instalação:

npm install

Execução:

npm start

A API estará disponível em:

http://localhost:3001


---

🧪 Testes

Testes manuais realizados via Postman e frontend React.

Testes dos fluxos:

cadastro

login

aprovação de professores

redefinição de senha

rotas protegidas por JWT



---

🧱 Estrutura de pastas

src/
├── controllers/
│   ├── adminController.js
│   ├── candidatosController.js
│   ├── concursosController.js
│   └── professoresController.js
│
├── middleware/
│   └── authProfessor.js
│
├── routes/
│   ├── admin.js
│   ├── candidatos.js
│   ├── concursos.js
│   └── professores.js
│
├── db.js
└── server.js


---

🗺️ Roadmap

[x] Cadastro completo de candidatos

[x] Cadastro completo de professores

[x] Aprovação manual de professores

[x] Envio automático de e-mail

[x] Autenticação JWT para professores

[x] Recuperação de senha

[x] Integração total com frontend

[ ] Logs estruturados

[ ] Health check

[ ] Testes automatizados



---

📄 Licença

Este projeto está sob licença MIT.


---

👨‍💻 Autor

José Miguel Vieira

GitHub
https://github.com/josemiguelvieira

LinkedIn
https://www.linkedin.com/in/jos%C3%A9-miguel-vieira-732650349/


---
