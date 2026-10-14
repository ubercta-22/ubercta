# Guia de backend e banco de dados

## Situação encontrada

Não há backend ou banco no projeto recebido. O frontend mantém estados locais e eventos preparados, mas não existe persistência real de usuários, motoristas, viagens, reservas ou pagamentos.

## Arquitetura recomendada

Manter o frontend vanilla atual e adicionar um serviço Node.js separado, com API HTTP versionada, validação no servidor, autenticação segura, autorização por papel e CORS restrito. PostgreSQL é o banco recomendado para produção por suportar relacionamentos, concorrência e evolução operacional.

## Módulos de domínio

- **Identidade:** usuários, perfis, sessões, códigos de verificação e recuperação.
- **Motoristas:** aprovação, documentos, veículos, categorias e disponibilidade.
- **Viagens:** solicitação, origem, destino, rota, estado, eventos e cancelamento.
- **Reserve:** reserva, horário, disponibilidade, tarifa, idempotência e cancelamento.
- **Operação:** pagamentos, cupons, auditoria e configurações.

## Regras de segurança

Senhas devem usar hash forte e nunca ser armazenadas em texto puro. Segredos, tokens privados e credenciais do banco devem permanecer no ambiente do servidor. Toda entrada precisa ser validada, e cada recurso deve verificar o usuário autorizado antes de ler ou alterar dados.

## Migrations mínimas futuras

As primeiras migrations devem definir `users`, `passenger_profiles`, `driver_profiles`, `vehicles`, `trips`, `trip_events`, `reservations`, `saved_places`, `payments` e `audit_events`, com chaves, índices, timestamps e estados enumerados. A modelagem final precisa ser aprovada junto às regras reais da operação.

## Contratos necessários antes da implementação

Antes de criar endpoints de produção, definir autenticação, formato de erro, estados de viagem, política de cancelamento, cálculo de tarifa, disponibilidade de motoristas, retenção de documentos, consentimento de localização e responsabilidades por pagamento.

Até que esses contratos existam, o frontend deve continuar informando claramente quando uma ação é apenas demonstrativa ou quando o endpoint não está configurado.
