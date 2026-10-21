# Stripe: extensão em modo de teste

Extensão isolada do desafio MSW. O adaptador chama a API real de Checkout via `fetch` nativo do Node; nenhum pacote novo e nenhuma chave no frontend. Apenas chaves `sk_test_` são aceitas. O servidor local sandbox usa SQLite e sessão HttpOnly própria. Um pagamento de teste foi concluído pelo browser e confirmado pelo servidor em 21/10/2026. Não há deploy público nem emissão de NFT.

## Executar o sandbox local

Requer Node 24 (usa `node:sqlite`). Na raiz do projeto, com `STRIPE_SECRET_KEY` test e `APP_ORIGIN=http://127.0.0.1:5201` no arquivo local ignorado `.env.stripe.local`:

```powershell
node --env-file=.env.stripe.local integrations/stripe/server.mjs
```

Abra http://127.0.0.1:5201. O servidor cria uma sessão de teste com cookie HttpOnly e um pedido demonstrativo de R$10,00. Nenhum preço vem do navegador e não existe conversão de ETH. Use cartão `4242 4242 4242 4242`, validade futura, CVC fictício e e-mail fictício. Após pagar, o retorno consulta a API Stripe no servidor, verifica sessão/valor/moeda/pedido/revisão e grava confirmação + recibo atomicamente.

Banco persistido em `integrations/stripe/.local/sandbox.sqlite`, ignorado pelo Git. O servidor só aceita host 127.0.0.1 e origem local configurada. Esta sessão de sandbox não autentica usuários reais do marketplace; a fixture não consome estoque nem emite NFT. Uma sessão de navegador corresponde a um pedido demonstrativo. Para outro teste use uma nova sessão de navegador.

`repository.mjs` implementa isolamento por colecionador, sessão com expiração, associação única à sessão Stripe e deduplicação transacional de eventos/recibos. `reconcile.mjs` permite recuperar a confirmação no retorno e na consulta de status. O webhook exige `STRIPE_WEBHOOK_SECRET` de um endpoint próprio; sua entrega externa ainda não foi configurada/testada. Sem webhook, esta versão local consulta o Stripe ao verificar status — não há processamento em background quando ninguém consulta.

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

Contrato do repositório (implementado para fixture local; revalidação de catálogo/estoque de produção ainda deve ser conectada):

| Método | Garantia exigida |
| --- | --- |
| `getOwnedOrder(id, collectorId)` | Consulta restrita ao dono; retorna null quando inacessível. |
| `prepareCheckout(id, collectorId)` | Revalida cotação e estoque, congela valor fiat/revisão imutável e recupera a mesma tentativa em concorrência. |
| `saveCheckout(id, revision, session)` | Persiste sessão com unicidade por pedido/revisão e sessão; repetição idêntica é segura, sessão diferente gera conflito. |
| `applyEvent(event, decide)` | Transação: deduplica event.id, busca pedido por sessão, chama decide(order), aplica compare-and-set, recibo e estoque; confirma evento apenas no commit. Sessão ainda não persistida deve lançar erro para retry. |

O handler não substitui essas garantias de banco. O parâmetro opcional `checkout` é uma injeção para testes, não um bypass de preço ou autenticação em produção.

## Reutilização do sandbox Zenway

Autorizada pelo usuário em 21/10/2026 para testes. Após login manual, a conta exibida foi **Brothers Milionare**, modo test. A chave test foi guardada somente no arquivo local ignorado `.env.stripe.local`, sem impressão em logs. Checkout criado e pagamento test confirmado às 19:27 BRT. Evidência: `../outputs/stripe-sandbox-confirmed.png` no workspace pai do repositório.

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

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `APP_ORIGIN` pertencem somente ao servidor. Não usar prefixo `VITE_`. A chave test e a origem local foram configuradas; o segredo de webhook próprio permanece pendente. Gemini não fornece credenciais Stripe.

## Fontes

- https://docs.stripe.com/api/checkout/sessions/create
- https://docs.stripe.com/webhooks

Esta pasta deve ser revisada como extensão separada. Não altera a posse do checkout (`@Samuel-Kepler`) nem o escopo original de pagamentos simulados.
