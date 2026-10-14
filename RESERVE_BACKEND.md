# Reserve — integração e limites atuais

## O que já funciona no front-end

- O cartão **Reserve** abre diretamente a etapa de origem/destino.
- Pesquisa de endereço e geocodificação reversa usam resultados reais do Nominatim/OpenStreetMap; não há lista de endereços inventada.
- O mapa vetorial MapLibre/OpenFreeMap apresenta os pontos e permite escolher origem/destino. O GPS só é consultado após ação explícita do usuário.
- Data, horário, antecedência e janela configuráveis são validados localmente. Os valores iniciais em `reserve-config.js` são regras de demonstração, não regras oficiais da operação.
- O usuário pode avançar e voltar entre trajeto, agenda, veículo e revisão sem perder o rascunho da sessão.
- A categoria não mostra tarifa fictícia.
- O envio é protegido contra toque duplicado e inclui a chave `Idempotency-Key`. Sem endpoint configurado, o app informa que **nada foi registrado**.

## Integração de reservas que ainda falta

O projeto recebido não contém um backend de reservas, serviço de tarifa, autenticação persistida nem disponibilidade operacional. Portanto, a versão não consegue confirmar reservas reais, associar motoristas, listar reservas futuras, notificar atualizações ou cancelar reservas. A confirmação de sucesso só aparece se o serviço responder com um registro válido.

Para habilitar o envio, configure `reserveApiUrl` em `reserve-config.js` com a URL HTTPS completa do endpoint de criação. Não coloque chaves privadas ou credenciais no JavaScript público. O endpoint precisa autenticar o passageiro no servidor, autorizar os locais/categorias e horários, verificar tarifa e disponibilidade, aplicar regras de cancelamento e deduplicar requisições pela `Idempotency-Key`.

### Requisição esperada

```json
{
  "origin": { "address": "endereço escolhido", "latitude": -4.13, "longitude": -44.12 },
  "destination": { "address": "endereço escolhido", "latitude": -4.14, "longitude": -44.13 },
  "scheduledAt": "2026-10-14T12:00:00",
  "vehicleCategory": "economico",
  "idempotencyKey": "uuid-gerado-pelo-cliente"
}
```

O navegador envia `Content-Type: application/json` e `Idempotency-Key: <mesma chave>`. A API deve exigir CORS para o domínio de hospedagem do app (não `*` em produção) e responder com JSON.

### Resposta de sucesso esperada

HTTP 2xx com um identificador e um estado retornados pelo serviço, por exemplo:

```json
{ "reservationId": "RC-123", "status": "registered" }
```

Respostas sem ID ou estado não são tratadas como sucesso. Erros devem usar HTTP não-2xx e podem trazer `{ "message": "..." }`; a interface preserva o rascunho para correção/reenvio.

## Serviços externos

- **Nominatim/OpenStreetMap:** geocodificação real; requer internet e deve respeitar os termos/limites do provedor.
- **MapLibre GL JS + OpenFreeMap:** biblioteca servida localmente e camada vetorial externa, sem chave. O provedor permite uso comercial, mas não oferece SLA; requer internet e atribuição visível. Consulte [termos e disponibilidade do OpenFreeMap](https://openfreemap.org/) antes da publicação.
- **OpenStreetMap Routing Machine (OSRM):** cálculo demonstrativo da rota na tela de Viagem; a operação pública não substitui um serviço contratado ou garantia de disponibilidade.
- **Backend de reservas/tarifas:** não estava presente nos arquivos recebidos e precisa ser fornecido/configurado pela operação.
