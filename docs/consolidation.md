# Consolidação das entregas KRONOS

Solicitada por Jair em 21/10/2026, incluindo expressamente o pacote Pi Genesis. Reúne as branches locais depois dos PRs de fundação #13–#16, preservando os commits e os contratos compartilhados.

| Entrega | Conteúdo incorporado | Limite atual |
|---|---|---|
| Landing / Catálogo | Hero, busca, filtros, ordenação, paginação e detalhe usando os 26 NFTs de mocks/core e os DTOs canônicos | Favoritos, seleção de edição para compra, tab=new específico e atualizações por socket ainda pertencem à feature de Catálogo |
| Carrinho | Regras puras de itens/quantidade/estoque/mesclagem, exports e 13 testes | Hooks, persistência, cotação, cupom, UI e mesclagem idempotente de rede ainda pendentes |
| Stripe | Adaptador Checkout test, handlers, servidor local, sessão própria, SQLite, reconciliação e recibos | Pedido demonstrativo BRL; não conecta o carrinho em ETH ao pagamento real. Webhook externo não configurado |
| Pi Genesis | Contrato ERC-721, compilador/ABI, testes, manifesto, CARs e três artes com procedência | Validado em EVM local; sem publicação IPFS ou emissão em rede pública |

## Executar e verificar

```sh
npm ci
npm ci --ignore-scripts --prefix integrations/pi-genesis
npm run lint
npm run build
npm run build --prefix integrations/pi-genesis
npx playwright install chromium
npm run test:all
```

No frontend, habilitar `VITE_ENABLE_MOCKS=true` para a demonstração. O CTA de Stripe aparece somente em DEV/loopback; comandos e variáveis do servidor estão em `integrations/stripe/README.md`. Nenhuma credencial, sessão de navegador, banco local ou configuração de carteira integra o Git.

Pi Genesis mantém dependências próprias; seus scripts apenas compilam, empacotam, testam localmente ou preparam transações sem assinatura. A especificação conceitual em `integrations/pi-genesis/PI-SPEC.md` é uma proposta histórica; o contrato implementado e o manifesto Genesis fixam três peças e prevalecem para esse pacote.

As rotinas de CI validam frontend, Stripe sem credenciais e Pi Genesis em EVM efêmera. Estes merges publicam código no repositório; não significam deploy do marketplace, cobrança real ou emissão de NFTs.
