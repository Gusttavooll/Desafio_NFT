# Marketplace: conclusão dos fluxos

Escopo autorizado em 21/10/2026: concluir a experiência do desafio na demonstração pública. A base é a main 751a3f2; esse commit continha catálogo funcional e páginas de fundação. O fluxo novo conecta conta, favoritos, edição/quantidade, carrinho/cotação, carteiras, pedido idempotente e recibo. Stripe real e emissão pública não fazem parte da simulação.

## Decisões de interface

Fonte primária: `docs/design.md` e `kronos-design-system.html`. Preservar Papel de Arquivo, Grafite, Barlow Condensed, preços em IBM Plex Mono, arte com chanfro e ação/foco em cobalto. Nenhuma nova paleta ou identidade.

| Decisão | Referência | Adaptação |
|---|---|---|
| Carrinho com itens editáveis e resumo lateral | [ASOS bag no Refero](https://refero.design/pages/bddd1a24-da7c-46cc-bc40-1eb3e772dabe) | Miniatura, edição, quantidade, subtotal; resumo empilhado em mobile |
| Revisão explícita antes de confirmar | [Nudea review no Refero](https://refero.design/pages/eca36f60-65e6-49d2-a55d-0b03f367a9b3) | Coletor, carteira/rede e cotação visíveis; aceitar novamente se a cotação mudar |
| Falha não aparenta compra concluída | [On checkout no Refero](https://refero.design/flows/13825) | Preservar dados/carrinho após recusa e explicar a retomada; recibo somente em confirmed |
| Formulários acessíveis | Refero craft-details e spec Conta | Labels, autocomplete, erro ligado ao campo, estado de envio e sucesso real |

## Contratos complementares

- `EditionDto.purchaseLimit?: number`: limite por compra; simulações antigas sem o campo usam a disponibilidade. Fixtures novas usam limite 10; estoque menor continua prevalecendo.
- `StoredOrder.request?` e `walletAddress?`: snapshot interno persistido para liquidar pedidos pendentes após refresh. Nunca retornados como credenciais ou fonte mutável do recibo.
- `POST /cart/merge`: consome atomicamente os itens de visitante e soma no carrinho autenticado; repetição não reintroduz itens já consumidos.

As interfaces se conectam por APIs públicas de contexto, sem respostas falsas em componentes.

### Miniaturas e exemplos de compra

Os itens da cotação e do recibo carregam `image?`, copiado do catálogo na criação do pedido e preservado no snapshot. O checkout e a confirmação exibem essa miniatura sem consultar o catálogo para reconstruir um recibo. Pedidos antigos sem o campo continuam legíveis. O Carrinho reutiliza `NftCarousel` pela API pública do Catálogo para mostrar outras obras da coleção do primeiro item carregado. As fixtures oferecem Ana com principal Ethereum e secundária Polygon; Bruno continua sem carteiras para exercitar o cadastro e o isolamento. O resumo mobile permanece empilhado, conforme a adaptação visual acima.

## Verificação local em 21/10/2026

- ESLint, fronteiras entre contextos, TypeScript e build com mocks: aprovados.
- 221 testes unitários do aplicativo passaram na execução completa. Também passaram 16 testes Stripe e 20 testes Pi Genesis.
- 56 cenários Playwright validados em desktop e mobile. Na última execução integral, 54 passaram e dois apontaram um seletor ambíguo após adicionar recomendações ao carrinho. O seletor foi restringido à região de itens; os dois casos passaram na reexecução, sem retries.
- Jornadas: cadastro/login/expiração/isolamento, perfil/avatar/senha, filtros e destaques, favoritos, carrinho/cupom, carteiras, checkout, recusa, novo aceite de preço, timeout idempotente, latência variável, refresh de pedido/recibo e reconexão com descarte de eventos antigos.
- A revisão visual do checkout encontrou cartões de rádio vazios; a correção usa o texto dentro dos cartões do design system. A jornada de compra passou novamente em desktop e mobile. Após a última otimização de inicialização, oito testes de catálogo, compra e tempo real passaram novamente nos dois tamanhos.
- Os relatórios funcionais são gerados em `playwright-report/` e `test-results/`. A auditoria Lighthouse possui configuração reproduzível e resultado separado em `docs/lighthouse-report.md`.

## Limites da entrega

A demonstração roda no navegador, com estado local e usuários fictícios. Não é um backend multiusuário, uma cobrança Stripe real nem uma emissão de NFT. Os pacotes em `integrations/` continuam isolados. O PR #19 consolidou a base anterior; a conclusão dos fluxos é uma entrega posterior. Publicação requer atualizar o deploy estático com este build; apenas enviar o código ao GitHub não atualiza esse projeto Vercel automaticamente.
