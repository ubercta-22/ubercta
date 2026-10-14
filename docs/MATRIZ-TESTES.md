# Matriz de testes

Esta matriz separa o que foi identificado por inspeção estática do que precisa de execução manual com navegador e serviços externos disponíveis.

| Tela | Componente | Ação esperada | Resultado observado/esperado | Erro ou pendência | Correção |
|---|---|---|---|---|---|
| Entrada | Entrar | Abrir login | Evento `data-flow="login"` chama `showStep('login')` | Integração de autenticação ausente | Pendente de backend |
| Entrada | Cadastrar | Abrir seleção de conta | Evento `data-flow="signup"` chama `showStep('account')` | Persistência ausente | Pendente de backend |
| Login | Enviar | Validar campos e iniciar carregamento | Validação local e `startAppEntry('credentials')` | Não autentica servidor | Pendente de API |
| Login | Google | Iniciar fluxo externo | Inicia carregamento demonstrativo | OAuth não configurado | Pendente de credenciais |
| Cadastro | Passageiro | Abrir formulário | Seleção habilita continuação | Persistência ausente | Pendente de backend |
| Cadastro | Motorista | Abrir sete etapas | Validações e uploads locais | Análise/aprovação inexistentes | Pendente de backend |
| Home | Busca | Abrir modal de destino | Modal abre e aceita texto | Não solicita serviço real | Pendente de API |
| Home | Atalhos | Abrir Casa/Trabalho/Salvos/Histórico | Modais e estado de sessão | Não há persistência | Pendente de backend |
| Home | Viagem | Abrir mapa | `openTripScreen()` inicializa mapa | Depende de rede externa | Validar disponibilidade |
| Home | Reserve | Abrir fluxo | `openReserveFlow()` abre etapas | Endpoint vazio | Pendente de backend |
| Viagem | Origem | GPS/mapa | Define ponto e marcador | Permissão/GPS externo | Tratar fallback |
| Viagem | Destino | Buscar/mapa | Define ponto e calcula rota | Nominatim/OSRM públicos | Pendente de serviço operacional |
| Viagem | Veículo | Selecionar categoria | Atualiza `state.vehicle` | Sem tarifa real | Pendente de backend |
| Viagem | Pagamento | Escolher método | Atualiza método visual | Não processa pagamento | Pendente de provedor |
| Viagem | Confirmar | Validar e enviar | Mostra aviso de backend ausente | Solicitação não registrada | Pendente de backend |
| Reserve | Origem/destino | Buscar ou marcar mapa | Atualiza estado e marcadores | Nominatim/OpenFreeMap externos | Validar limites |
| Reserve | Data/horário | Validar regras | Restringe janela demonstrativa | Regras não oficiais | Confirmar operação |
| Reserve | Veículo | Selecionar | Atualiza revisão | Disponibilidade ausente | Pendente de backend |
| Reserve | Confirmar | Enviar com idempotência | Só registra com `reserveApiUrl` | Endpoint não configurado | Pendente de backend |
| Navegação | Voltar | Retornar à tela anterior | Handlers presentes | Testar em cada etapa | A executar manualmente |

## Execução pendente

A execução completa precisa ser feita em navegador com console aberto e rede disponível, cobrindo pelo menos:

- 390×844, 768×1024 e 1440×900;
- entrada, login, cadastro passageiro, cadastro motorista;
- Home, Viagem e Reserve;
- erros de rede, mapa indisponível, GPS negado e endpoint vazio;
- teclado, foco, Enter, Esc, setas do carrossel e mouse.

Nenhum backend, tarifa, motorista ou pagamento deve ser marcado como funcional sem serviço real conectado.
