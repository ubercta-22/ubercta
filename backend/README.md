# Backend — Uber Coroatá

Backend Node.js 22, Fastify e PostgreSQL. Inclui cadastro/login de passageiros, viagens sem despacho, reservas com idempotência, Google Routes server-side e integração de pagamento Mercado Pago condicionada a credenciais reais.

## Preparar localmente

Na raiz do projeto, inicie o PostgreSQL com Docker:

```bash
docker compose up -d postgres
```

Na pasta `backend/`:

```bash
cp .env.example .env
# Edite .env e troque JWT_SECRET por um segredo aleatório com ao menos 32 caracteres.
npm ci
npm run check
npm run dev
```

Os comandos `npm run dev` e `npm start` carregam o arquivo `.env` automaticamente. O serviço escuta na porta `8787`; o frontend servido em `http://127.0.0.1:4173` aponta para `http://127.0.0.1:8787/api` por padrão. Consulte `GET http://127.0.0.1:8787/api/health` e confirme `"database":"connected"`.

Se hospedar frontend e backend em origens diferentes, defina `apiBaseUrl` em `reserve-config.js` para a raiz pública do backend (por exemplo, `https://api.seudominio.com/api`) e configure `FRONTEND_ORIGIN` em `backend/.env` para a origem exata do frontend. A lista de origens deve ser atualizada quando o domínio do frontend mudar.

## Variáveis e credenciais

`DATABASE_URL` e `JWT_SECRET` são obrigatórios. `GOOGLE_MAPS_SERVER_KEY` é privada e usada somente pelo backend. `GOOGLE_MAPS_BROWSER_KEY` é pública, mas deve ter restrição de domínio. `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_WEBHOOK_SECRET` ficam somente no servidor.

Não envie segredos pelo chat nem faça commit/publicação do arquivo `backend/.env`.

## Rotas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/maps/route`
- `GET /api/maps/browser-config`
- `POST /api/trips`
- `POST /api/reservations`
- `POST /api/payments/mercadopago/preference`
- `POST /api/payments/mercadopago/webhook`

Viagens e reservas exigem Bearer token. O despacho de motorista não é executado nesta fase. Tarifas reais e credenciais externas precisam ser definidas antes de pagamentos.

## Banco de dados

A migration `database/migrations/001_initial_schema.sql` cria usuários, viagens, reservas e pagamentos. A autenticação armazena hash Argon2 e nunca retorna `password_hash`.
