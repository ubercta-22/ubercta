# Uber Coroatá

Aplicativo web do Uber Coroatá, feito em HTML, CSS e JavaScript, com backend Fastify e PostgreSQL para cadastro e login de passageiros, solicitações de viagem e reservas.

## Executar localmente

Requisitos: Node.js 22+, PostgreSQL (ou Docker para iniciar o PostgreSQL) e Python 3.

1. Na raiz do projeto, crie o banco local com Docker:

   ```bash
   docker compose up -d postgres
   ```

   A primeira inicialização aplica a migration `backend/database/migrations/001_initial_schema.sql`.

2. Configure e inicie o backend:

   ```bash
   cd backend
   cp .env.example .env
   # Edite .env: use um JWT_SECRET aleatório com pelo menos 32 caracteres.
   npm ci
   npm run check
   npm run dev
   ```

   O backend usa a porta `8787`, carrega `backend/.env` automaticamente e fica acessível em `http://127.0.0.1:8787`.

3. Em outro terminal, na raiz do projeto, inicie o frontend:

   ```bash
   python3 -m http.server 4173 --bind 0.0.0.0
   ```

4. Abra `http://127.0.0.1:4173`. A configuração identifica essa porta e encaminha `/api` ao backend na porta `8787`. O app mostra uma mensagem explicativa se o backend estiver desligado ou a URL estiver incorreta.

Verifique o backend em `http://127.0.0.1:8787/api/health`; a resposta deve indicar `"database":"connected"`.

## Configurar publicação

O navegador precisa enviar cadastro e login ao **backend Node/Fastify**, não ao servidor estático. Em `reserve-config.js`, configure `apiBaseUrl` para a raiz HTTPS da API, incluindo `/api`, por exemplo:

```js
window.UBER_COROATA_CONFIG = {
  apiBaseUrl: 'https://api.seudominio.com/api'
};
```

No arquivo `backend/.env` de produção, configure `DATABASE_URL`, um `JWT_SECRET` aleatório, `FRONTEND_ORIGIN` com a origem pública exata do site e as demais credenciais necessárias. Publique o backend e o PostgreSQL com HTTPS/rede segura. **Não coloque segredos no frontend nem publique o `.env`.** O backend deve estar ativo e o banco acessível para cadastro e login funcionarem; o arquivo estático sozinho não armazena contas.

## Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Estrutura das telas e carregamento dos scripts |
| `api-client.js` | Requisições de autenticação, viagens e reservas |
| `reserve-config.js` | URL pública do backend e regras do fluxo Reserve |
| `app.js` | Cadastro/login e navegação de autenticação |
| `home-script.js` | Home, modais, viagem e mapa |
| `reserve.js` | Fluxo de reservas |
| `backend/src/server.js` | API Fastify |
| `backend/database/migrations/` | Estrutura PostgreSQL |

## Rotas reais disponíveis

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/trips`
- `POST /api/reservations`
- Rotas de Google Routes e Mercado Pago, quando as credenciais do serviço estiverem configuradas.

O despacho de motoristas, a validação de tarifa, OAuth Google e verificação por SMS/e-mail ainda exigem integrações e configuração operacional. O app não simula que essas funções estejam ativas.
