# Stripe: extensão em modo de teste

Extensão isolada do desafio MSW. O adaptador chama a API real de Checkout via `fetch` nativo do Node; nenhum pacote novo e nenhuma chave no frontend. Apenas chaves `sk_test_` são aceitas. Há handlers HTTP testados, mas ainda não há servidor publicado, banco conectado ou pagamento end-to-end.

## Executar os testes sem credenciais

`node --test integrations/stripe/*.test.mjs`

Os testes usam transporte controlado; não fazem cobranças nem demonstram uma sessão criada no Stripe.

## Handlers HTTP

`http.mjs` exporta `createPaymentHandler(config)`, que recebe `Request` e retorna `Response` (Fetch API). Rotas implementadas:

- `POST /payments/checkout`: exige origem confiável e sessão; aceita somente `{ "orderId": "..." }`, confere dono e estado, revalida no repositório e persiste a sessão antes de devolver sua URL.
- `GET /payments/orders/:id`: exige sessão do dono e retorna somente ID, estado, valor e moeda; não confirma pagamentos pelo retorno do navegador.
- `POST /payments/webhook`: limita o corpo a 64 KiB, verifica assinatura nos bytes originais e delega a aplicação atômica ao repositório. Falhas de persistência retornam 503 para permitir retry.

Todas as respostas usam `Cache-Control: no-store`. Erros de infraestrutura não expõem detalhes ou segredos.

O host deve fornecer `origin`, `secretKey`, `webhookSecret`, `authenticate(request)` e `repository`. `authenticate` deve retornar `{ id }` somente após validar uma sessão real no servidor. Não reutilizar tokens simulados do MSW.

Contrato obrigatório do repositório, ainda sem implementação conectada:

| Método | Garantia exigida |
| --- | --- |
| `getOwnedOrder(id, collectorId)` | Consulta restrita ao dono; retorna null quando inacessível. |
| `prepareCheckout(id, collectorId)` | Revalida cotação e estoque, congela valor fiat/revisão imutável e recupera a mesma tentativa em concorrência. |
| `saveCheckout(id, revision, session)` | Persiste sessão com unicidade por pedido/revisão e sessão; repetição idêntica é segura, sessão diferente gera conflito. |
| `applyEvent(event, decide)` | Transação: deduplica event.id, busca pedido por sessão, chama decide(order), aplica compare-and-set, recibo e estoque; confirma evento apenas no commit. Sessão ainda não persistida deve lançar erro para retry. |

O handler não substitui essas garantias de banco. O parâmetro opcional `checkout` é uma injeção para testes, não um bypass de preço ou autenticação em produção.

## Reutilização do sandbox Zenway

Autorizada pelo usuário em 21/10/2026 para testes. Não foi localizada chave Stripe test utilizável nos arquivos de ambiente locais inspecionados do Zenway. O painel Stripe pediu login. Nenhuma credencial foi copiada e nenhuma chamada autenticada ao gateway foi feita nesta etapa.

Depois do acesso: usar somente chave test; configurar endpoint/webhook específico do Kronos. O segredo de assinatura de um endpoint Zenway não valida automaticamente eventos de outro endpoint. Não reutilizar preços de assinatura Zenway para pedidos de NFTs nem alterar sua configuração de produção.

## Contrato de integração no futuro backend

1. `POST /payments/checkout`: autenticar com sessão real; validar CSRF/origem; receber somente `orderId`; carregar Pedido do banco por esse usuário e revalidar cotação/estoque. Nunca aceitar preços ou identidade enviados pelo navegador como fonte de verdade.
2. Congelar um Pedido `pending`, com `revision` imutável, `amountMinor` em centavos e moeda fiduciária. ETH do desafio não é BRL: definir catálogo fiat ou política explícita de câmbio antes de conectar.
3. Chamar `createCheckout(order, { secretKey, origin })` no servidor. Ler segredo do ambiente sem logar. A mesma tentativa usa a mesma revisão/chave, inclusive após timeout; não criar revisão nova automaticamente.
4. Persistir `stripeSessionId` antes de devolver a URL. Falha após a criação deve recuperar a mesma sessão por idempotência. Conflitos concorrentes exigem unicidade por Pedido/revisão.
5. Webhook: limitar tamanho, receber bytes originais, validar `Stripe-Signature` com `verifyEvent`, procurar Pedido por sessão e executar `paymentDecision` dentro de transação. Deduplicar `event.id` com índice único e fazer atualização condicional de `pending`; recibo, estoque, deduplicação e estado devem ser atômicos. Só responder 2xx após persistir; erro transitório deve gerar retry.
6. A página de retorno consulta o backend autenticado. `success_url`, query string e MSW nunca confirmam pagamento. Eventos desconhecidos podem receber 2xx sem efeito.
7. Testar sessão de cartão em sandbox, retorno/cancelamento, assinatura inválida, duplicação, expiração, recusa e webhook anterior ao retorno. Testar recuperação se o webhook chegar antes de persistir a sessão (resposta transitória/reconciliação).

## Configuração pendente

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `APP_ORIGIN` pertencem somente ao servidor. Não usar prefixo `VITE_`. Gemini não fornece credenciais Stripe. Nenhum segredo foi lido, salvo ou validado nesta entrega.

## Fontes

- https://docs.stripe.com/api/checkout/sessions/create
- https://docs.stripe.com/webhooks

Esta pasta deve ser revisada como extensão separada. Não altera a posse do checkout (`@Samuel-Kepler`) nem o escopo original de pagamentos simulados.
