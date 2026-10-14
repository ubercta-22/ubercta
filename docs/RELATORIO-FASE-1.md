# Relatório da fase 1

## Alterações realizadas

A estrutura web original foi preservada. Foram adicionados um README de execução, documentação da análise inicial, arquitetura planejada e matriz de testes. A entrada foi adaptada para desktop preservando a proporção vertical da arte enviada, e a Home recebeu um layout de duas colunas em telas largas para evitar a apresentação estreita de celular em notebooks e monitores.

Também foram preservadas as alterações visuais previamente solicitadas na primeira tela e na tela de carregamento. Nenhum identificador, rota, evento, função de navegação ou fluxo de Viagem/Reserve foi renomeado ou removido.

## Validações executadas

- Backup da versão original criado e validado com `unzip -t`.
- `node --check app.js` executado com sucesso.
- Renderização da entrada em 1440×900.
- Renderização da Home em 1440×900.
- Renderização da tela de carregamento em 390×844.
- Servidor HTTP local respondendo na porta 4173.
- Site público respondendo HTTP 200.
- ZIP atualizado validado com `unzip -t`.

## O que não foi declarado como concluído

Não foram inventadas integrações de autenticação, pagamentos, motoristas, tarifas, banco ou Google Maps. O projeto recebido não contém backend, migrations, chaves ou contratos operacionais. Os fluxos existentes continuam demonstrativos ou condicionados a endpoints, conforme já indicado na interface e em `RESERVE_BACKEND.md`.

## Próxima fase recomendada

A próxima etapa deve escolher o backend e o provedor de banco, formalizar contratos de autenticação, viagens e reservas, e só então criar migrations e endpoints. Depois disso, as integrações públicas de mapas devem ser substituídas ou mantidas por adaptadores configuráveis com credenciais e limites documentados.

## Esqueleto adicional criado

Foi adicionada a pasta `backend/` com manifesto Node.js/Fastify, configuração `.env.example`, rota `GET /api/health`, migration SQL inicial e instruções. Esse esqueleto não é uma integração de produção: não conecta o frontend, não autentica usuários e não confirma viagens ou reservas.

## Atualização após definição do escopo real

Após a decisão do produto, o backend passou a conter rotas reais de autenticação de passageiros, viagens sem despacho, reservas com idempotência, Google Routes server-side e Mercado Pago com preferência e webhook assinado. PostgreSQL e Docker Compose foram adicionados para desenvolvimento local. O sistema de motoristas não foi criado nesta fase.

A integração em produção ainda requer as credenciais das contas Google Cloud e Mercado Pago, domínio HTTPS para callbacks, Docker na máquina de desenvolvimento e definição operacional da tarifa. Sem esses itens, o código permanece corretamente bloqueado e não simula sucesso.
