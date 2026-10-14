# Como continuar o desenvolvimento

## Abrir no editor

Abra a pasta principal no Visual Studio Code. Não é necessário converter o projeto para outro framework. A interface pode ser executada com um servidor HTTP simples para que scripts, módulos visuais e mapas funcionem corretamente.

```bash
cd uber-coroata
python3 -m http.server 4173 --bind 0.0.0.0
```

Abra `http://127.0.0.1:4173`.

## Ordem recomendada

Primeiro concluir a auditoria manual da matriz de testes em `docs/MATRIZ-TESTES.md`. Depois escolher o backend e o banco. Em seguida criar contratos e migrations, implementar autenticação, integrar reservas e viagens com endpoints reais e só então configurar Google Maps Platform.

## Regras para novas alterações

Preserve os IDs, classes, atributos `data-*`, eventos, funções globais (`openTripScreen`, `openReserveFlow`) e estados dos fluxos. Não coloque chaves no frontend. Não transforme respostas de demonstração em confirmações reais. Sempre valide mobile e desktop após alterações de CSS.

## Pontos de entrada por tela

- Entrada, login e cadastro: `index.html` + `app.js`.
- Home e modais: `index.html` + `home-script.js`.
- Viagem: bloco `#trip-screen` + `home-script.js`.
- Reserve: bloco `#reserve-flow` + `reserve.js`.
- Configuração pública de Reserve: `reserve-config.js`.
