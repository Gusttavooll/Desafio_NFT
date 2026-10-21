# Stripe: extensão em modo de teste

Implementação inicial isolada do desafio MSW. O adaptador chama a API real de Checkout via `fetch` nativo do Node; nenhum pacote novo e nenhuma chave no frontend. Apenas chaves `sk_test_` são aceitas. Ainda não há endpoint público, banco ou pagamento end-to-end.

## Executar os testes sem credenciais

`node --test integrations/stripe/checkout.test.mjs`

Os testes usam transporte controlado; não fazem cobranças nem demonstram uma sessão criada no Stripe.

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
