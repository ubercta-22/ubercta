# Guia de configuração do Google Maps Platform

## Situação atual

O projeto recebido não possui chave Google Maps, projeto Google Cloud, billing ou integração oficial. Atualmente, Viagem e Reserve usam MapLibre GL JS com OpenFreeMap, Nominatim/OpenStreetMap e OSRM público.

## Serviços planejados

| Recurso | Serviço Google recomendado | Uso |
|---|---|---|
| Mapa interativo | Maps JavaScript API | Renderizar o mapa no navegador |
| Sugestão de endereço | Places API / Autocomplete | Pesquisar origem e destino |
| Conversão endereço/coordenadas | Geocoding API | Geocodificação e reversa |
| Distância e rota | Routes API | Calcular trajeto, duração e distância |

## Configuração segura

1. Criar ou selecionar um projeto no Google Cloud.
2. Ativar somente as APIs necessárias.
3. Configurar billing e cotas de uso.
4. Criar uma chave para navegador com restrição por domínio HTTPS.
5. Criar credenciais de servidor separadas para chamadas protegidas, se necessárias.
6. Nunca inserir uma chave privada em `index.html`, `app.js`, `home-script.js`, `reserve.js` ou arquivos públicos.
7. Criar uma camada de serviços para que a tela não conheça detalhes do provedor.
8. Configurar tratamento de erro, timeout, indisponibilidade e limites de cota.

## Variáveis esperadas

Um futuro ambiente pode usar nomes como:

```env
GOOGLE_MAPS_BROWSER_KEY=
GOOGLE_MAPS_SERVER_KEY=
GOOGLE_MAPS_ALLOWED_ORIGINS=https://dominio-aprovado.example
```

Os valores são placeholders. Não devem ser preenchidos com chaves de exemplo ou inventadas.

## Migração dos fluxos

A migração deve preservar os objetos de estado atuais (`origin`, `destination`, coordenadas, rascunhos de Reserve e Viagem). O adaptador de mapas deve oferecer operações equivalentes para iniciar o mapa, colocar marcador, pesquisar endereço, geocodificar, calcular rota e tratar erro. O backend deve ser responsável por tarifa, disponibilidade, autorização, histórico e confirmação operacional.

## Custos e responsabilidade

Google Maps Platform pode gerar cobrança conforme uso e configuração de billing. O proprietário do projeto deve revisar preços, créditos, cotas, alertas e termos antes de ativar produção.
