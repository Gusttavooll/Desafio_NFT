# Carrinho e Cotação — entrega parcial de Jair

Branch isolada `codex/cart-domain`, baseada no main. Regras puras implementadas com testes escritos antes do código: adicionar/somar edição, separar NFTs/edições, alterar quantidade com estoque/limite, remover, contar unidades e propor mesclagem com ajustes explícitos. Não há aritmética monetária no cliente.

## Bloqueios concretos no main inspecionado

- `domain/catalog/index.ts`: não exporta `Edition`, disponibilidade ou limite por compra.
- `application/account/index.ts`: não exporta `useSession`.
- `infrastructure/cart/index.ts` e `mocks/core/index.ts`: contratos/estado ainda vazios.
- Contrato de Cupom em `details` e operação idempotente de mesclagem ainda pendentes conforme `docs/specs/cart.md`.

Por AGENTS.md, não editar o contexto dos colegas para inventar essas interfaces. `EditionLimit` é entrada local das regras do Carrinho, não substitui `Edition` do Catálogo.

## Próximos passos

1. Integrar fundações do grupo; revisar tipos de Edição (Oziel), Sessão (Gustavo), Cart/Quote DTO e mocks/core (Samuel).
2. Implementar persistência visitante, `useCart`, mutations sem retry automático e rollback; query keys por sessão.
3. Implementar `useQuote` e QuoteSummary a partir de `POST /quotes`, cupom e estados de erro/carregamento.
4. Conectar carrinho ao Header, detalhe e checkout pelas APIs públicas.
5. Implementar mesclagem idempotente no backend simulado e limpeza pós-confirmação sem apagar itens adicionados depois.
6. Eventos de disponibilidade/preço via interface do contexto Tempo real e E2E desktop/mobile.

A função `mergeCarts` calcula uma proposta de mesclagem, não oferece idempotência de rede. A mesma tentativa deve ser identificada e deduplicada no servidor/mocks antes de reutilizá-la. Checkout, recibo, carteira e Stripe não fazem parte da entrega original de Carrinho.
