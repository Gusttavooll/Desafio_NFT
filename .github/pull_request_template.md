## O que muda
<!-- Uma intenção por PR. Qual requisito do docs/PRD.md isto atende? -->

## Contexto
- [ ] Catálogo  - [ ] Carrinho e Cotação  - [ ] Pedidos  - [ ] Carteiras
- [ ] Conta e Sessão  - [ ] Tempo real  - [ ] Shared kernel / mocks core / dependências

## Checklist
- [ ] Usa os termos de `docs/glossary.md`
- [ ] Só mexe nas pastas do meu contexto (ou é um PR próprio de `shared/`, `mocks/core`, `ui/components`, dependência ou rota nova)
- [ ] Testes escritos antes da regra de negócio (`npm run test:unit` / `npx playwright test`)
- [ ] `npm run lint` e `npm run build` passando
- [ ] Nenhum snapshot visual atualizado sem aprovação
- [ ] Decisão de arquitetura nova registrada em `docs/adr/`
