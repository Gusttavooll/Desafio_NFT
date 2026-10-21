# Carrinho e Cotação — entrega parcial de Jair

Branch isolada `codex/cart-domain`, baseada no main. Regras puras implementadas com testes escritos antes do código: adicionar/somar edição, separar NFTs/edições, alterar quantidade com estoque/limite, remover, contar unidades e propor mesclagem com ajustes explícitos. Não há aritmética monetária no cliente.

## Estado após consolidar as fundações

- `domain/catalog/index.ts` já exporta `Edition` e disponibilidade; limite por compra ainda não está no contrato compartilhado.
- `application/account/index.ts` já exporta `useSession`.
- `infrastructure/cart/index.ts` e `mocks/core/index.ts` já oferecem contratos e estado. Os handlers completos de Carrinho/Cotação e seus hooks ainda precisam ser implementados.
- Contrato de Cupom em `details` e operação idempotente de mesclagem ainda pendentes conforme `docs/specs/cart.md`.

Por AGENTS.md, não editar o contexto dos colegas para inventar essas interfaces. `EditionLimit` é entrada local das regras do Carrinho, não substitui `Edition` do Catálogo.

## Próximos passos

1. Fundações integradas. Confirmar limite por compra e contrato de mesclagem antes de conectar estas regras ao servidor simulado.
2. Implementar persistência visitante, `useCart`, mutations sem retry automático e rollback; query keys por sessão.
3. Implementar `useQuote` e QuoteSummary a partir de `POST /quotes`, cupom e estados de erro/carregamento.
4. Conectar carrinho ao Header, detalhe e checkout pelas APIs públicas.
5. Implementar mesclagem idempotente no backend simulado e limpeza pós-confirmação sem apagar itens adicionados depois.
6. Eventos de disponibilidade/preço via interface do contexto Tempo real e E2E desktop/mobile.

A função `mergeCarts` calcula uma proposta de mesclagem, não oferece idempotência de rede. A mesma tentativa deve ser identificada e deduplicada no servidor/mocks antes de reutilizá-la. Checkout, recibo, carteira e Stripe não fazem parte da entrega original de Carrinho.

O núcleo do Carrinho está consolidado com as fundações e com a API pública do Catálogo. Os próximos passos acima descrevem a feature ainda pendente.
