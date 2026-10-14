# Arquitetura planejada

## Princípio

Preservar o frontend atual em HTML, CSS e JavaScript puro. A adaptação para PC deve ser responsiva e incremental, sem conversão automática para React, Flutter, Android ou outro framework.

## Frontend

Manter a separação existente:

- `index.html`: estrutura e contratos de dados;
- `styles.css`, `home-style.css`, `reserve.css`: apresentação responsiva;
- `app.js`, `home-script.js`, `reserve.js`: comportamento das telas;
- `assets/`: recursos visuais e bibliotecas locais.

Adicionar futuramente uma camada `services/` no frontend somente quando houver APIs reais, mantendo funções de interface separadas de chamadas de rede.

## Backend recomendado

Para não alterar a tecnologia do frontend, a opção compatível é um backend separado em **Node.js 22 + Fastify ou Express**, com:

- autenticação baseada em sessão segura ou tokens de curta duração;
- validação de entrada no servidor;
- autorização por passageiro, motorista e administrador;
- idempotência para viagens e reservas;
- CORS restrito ao domínio publicado;
- logs e tratamento uniforme de erros;
- variáveis de ambiente, sem segredos no frontend.

A escolha definitiva entre Fastify e Express deve ser feita antes de criar dependências de produção. Nenhuma dependência foi adicionada nesta etapa de análise.

## Banco de dados recomendado

**PostgreSQL** é a opção recomendada para produção por causa de relacionamentos, consistência, índices geográficos e concorrência. Para desenvolvimento local, pode-se usar PostgreSQL em Docker ou uma instância local compatível.

Entidades esperadas:

- `users`, `passenger_profiles`, `driver_profiles`;
- `vehicles`, `vehicle_categories`;
- `saved_places`;
- `trips`, `trip_events`, `trip_locations`;
- `reservations`;
- `payments`, `coupons`;
- `verification_codes` e registros de auditoria.

Senhas devem ser armazenadas somente com hash forte; credenciais do banco nunca devem ir para o frontend.

## Google Maps Platform

A integração futura deve ser centralizada em serviços próprios:

- Maps JavaScript API para o mapa de interface, se aprovada;
- Places Autocomplete para sugestões;
- Geocoding para conversão entre endereço e coordenadas;
- Routes API para distância, duração e rota.

As chaves precisam ter restrição de domínio, APIs mínimas habilitadas, cotas e faturamento configurados pelo proprietário da conta. Nenhuma chave será inventada ou incluída no repositório.

## Estratégia de migração

1. Preservar e testar o frontend atual.
2. Corrigir responsividade desktop sem alterar contratos.
3. Separar clientes de mapas, viagens e reservas em adaptadores graduais.
4. Criar backend e migrations versionadas após escolher o provedor de banco.
5. Substituir cada integração demonstrativa por endpoint real apenas quando houver contrato e credenciais.
6. Executar a matriz de testes em mobile e desktop a cada etapa.

## Não implementado nesta análise

Backend, banco, autenticação real e Google Maps não foram criados porque faltam credenciais, regras de negócio, provedor operacional e contratos de API. Criá-los sem essas informações produziria uma falsa integração ou dados inventados.

## Esqueleto criado nesta fase

A pasta `backend/` agora contém um manifesto Fastify, um health check, `.env.example` e a migration inicial. O health check identifica as integrações como pendentes; nenhuma rota de negócio foi conectada ao frontend.

## Escopo implementado após aprovação

A primeira implementação real usa PostgreSQL, Fastify, Argon2, Google Routes API server-side e SDK oficial do Mercado Pago. O cadastro de motoristas e o despacho foram adiados conforme solicitado. A interface continua vanilla e o frontend chama os endpoints reais por `api-client.js`.
