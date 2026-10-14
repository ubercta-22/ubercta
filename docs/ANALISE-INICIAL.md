# Análise inicial — Uber Coroatá

## Escopo analisado

A análise foi feita antes de qualquer reorganização estrutural. O backup da versão original recebida foi criado e validado com `unzip -t`.

## Tecnologia identificada

O projeto não é um aplicativo Android nativo. É uma aplicação web estática composta por HTML, CSS e JavaScript puro:

- não há `package.json`;
- não há framework ou bundler detectado;
- não há `AndroidManifest.xml`, `.csproj` ou equivalente;
- as dependências visuais são carregadas por arquivos locais e scripts no HTML;
- o servidor local pode ser um servidor HTTP simples.

Essa escolha deve ser preservada para evitar substituir funcionalidades ou quebrar os contratos existentes.

## Sistemas encontrados

### Autenticação e cadastro

`index.html` e `app.js` contêm:

- entrada por credenciais e Google demonstrativo;
- seleção de conta passageiro/motorista;
- cadastro de passageiro;
- verificação por código;
- cadastro de motorista em sete etapas;
- uploads e pré-visualizações documentais;
- eventos preparados para futuras integrações.

A autenticação real e o armazenamento seguro ainda não estão conectados.

### Home

`home-script.js` controla:

- busca de destino;
- agendamento demonstrativo;
- casa, trabalho, locais salvos e histórico demonstrativos;
- serviços Viagem, Reserve, Entrega e Delivery;
- conta e opções;
- carrossel com autoplay, teclado e gesto de toque;
- navegação para Viagem e Reserve.

### Viagem

O fluxo já possui:

- mapa MapLibre GL JS;
- base visual OpenFreeMap;
- centro inicial em Coroatá-MA;
- seleção de origem por GPS ou mapa;
- busca e geocodificação via Nominatim/OpenStreetMap;
- seleção de destino;
- rota demonstrativa via OSRM;
- seleção de categoria, pagamento e cupom;
- validações antes da confirmação.

A solicitação não é enviada para um backend de motoristas.

### Reserve

O fluxo já possui:

- mapa e marcadores;
- busca real de endereços;
- seleção por mapa;
- regras locais de data, horário e antecedência;
- escolha de veículo;
- revisão;
- chave de idempotência;
- envio condicionado a `reserveApiUrl`.

Sem endpoint configurado, nenhuma reserva real é registrada.

## Integrações externas atuais

| Serviço | Uso atual | Limite |
|---|---|---|
| MapLibre GL JS | Renderização de mapas | Biblioteca local; exige camada externa |
| OpenFreeMap | Estilo/base do mapa | Sem SLA operacional documentado no projeto |
| Nominatim | Busca e geocodificação | Limites do provedor público |
| OSRM público | Rota demonstrativa | Não é backend operacional de transporte |

Não existe integração Google Maps nem chave de API no projeto recebido.

## Pendências críticas

1. Backend de autenticação e autorização.
2. Banco de dados e migrations.
3. Backend de viagens e disponibilidade de motoristas.
4. Backend de reservas, tarifas e cancelamentos.
5. Tarifas e regras operacionais oficiais.
6. Credenciais e restrições de APIs cartográficas.
7. Monitoramento, logs e tratamento operacional.

## Decisões de preservação

- Manter IDs, classes, eventos e nomes de funções existentes.
- Não substituir MapLibre, Nominatim ou OSRM por Google Maps sem configurar e validar as credenciais.
- Não declarar fluxos demonstrativos como integrações reais.
- Fazer a adaptação desktop por CSS e componentes adicionais, evitando reescrever a aplicação.
