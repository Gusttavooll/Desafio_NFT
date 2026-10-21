# Contribuindo

Quatro devs trabalham em paralelo, cada um dono de bounded contexts (ver `docs/adr/0002-contextos-dentro-das-camadas.md` e `.github/CODEOWNERS`).

## Quem cuida do quê

| Dev | Contextos | Pastas | Rotas | Branch base |
|-----|-----------|--------|-------|-------------|
| @ozielrsdev | Catálogo e Favoritos | `src/*/catalog`, `tests/e2e/catalog` | `/`, `/nfts/$nftId` | `feat/catalog` |
| @jairbonifacio-collab | Carrinho e Cotação | `src/*/cart`, `tests/e2e/cart` | `/cart` | `feat/cart` |
| @Samuel-Kepler | Pedidos e Carteiras | `src/*/orders`, `src/*/wallets`, `tests/e2e/{orders,wallets}` | `/checkout`, `/checkout/confirmation`, `/wallets` | `feat/orders-wallets` |
| @Gusttavooll | Conta e Sessão, Tempo real | `src/*/account`, `src/*/realtime`, `tests/e2e/{account,realtime}` | `/login`, `/register`, `/profile` | `feat/account-realtime` |

## Fase 0: fundação (antes das features)
Cada dev entrega uma peça compartilhada em PR próprio para o `main`. As features só começam depois que as quatro forem integradas. Estrutura das telas e componentes em `docs/design.md`.

| Dev | Branch | Entrega |
|-----|--------|---------|
| @ozielrsdev | `chore/foundation-design-system` | Tokens visuais definidos com a skill `ui-ux-pro-max` no `src/index.css` (variáveis do shadcn) e componentes base em `ui/components` (Button, Input, PasswordInput, Select, Textarea, RadioGroup, Dialog, Sheet, Tabs, Skeleton, Badge) |
| @jairbonifacio-collab | `chore/foundation-layout` | `ui/layout`: `AppShell` (Header, Footer, Breadcrumb, Tab Bar mobile) e `AccountLayout`, aplicados no `__root.tsx`; `PriceTag` e `QuantityStepper` em `ui/components` |
| @Samuel-Kepler | `chore/foundation-contracts` | Tipos dos contratos REST (`docs/architecture.md`) nas pastas `infrastructure/<contexto>`; `mocks/core` (estado simulado, cenários, reset) e fixtures (2 usuários e NFTs variados, com imagens em `public/`) |
| @Gusttavooll | `chore/foundation-session` | `useSession()` mínimo em `application/account` (visitante ou colecionador, usado nas query keys), interceptor de 401 no `http-client` e ciclo de vida do socket |

Na mesma fase, cada dev publica no `index.ts` do seu contexto os tipos e stubs que os outros vão consumir: `Nft`, `Edition` e as query keys do catálogo; `Cart`, `Quote` e `useCart`; `Wallet`; `useSession`.

## Onde fica cada coisa

```
src/
├── domain/<contexto>/          # regras puras + *.test.ts (Vitest)
├── application/<contexto>/     # hooks TanStack Query, mutations, casos de uso
├── infrastructure/<contexto>/  # chamadas Axios/Socket.IO e mapeadores DTO → domínio
├── ui/<contexto>/              # páginas e componentes do contexto
├── ui/components/              # shadcn/ui, PriceTag, QuantityStepper (compartilhado)
├── ui/layout/                  # AppShell, AccountLayout (compartilhado)
├── routes/                     # só delegam para a página em ui/<contexto>
└── mocks/<contexto>/handlers.ts  # handlers MSW do contexto (mocks/core: db, cenários, reset)
tests/e2e/<contexto>/           # Playwright
```

`domain/shared` e `application/shared` formam o shared kernel: `EthAmount`, `DomainEvent`, `ApiError` e `scopedQueryKey`.

## Regras de import (verificadas pelo `npm run lint`)
- Outro contexto só pela API pública: `import { X } from '@/domain/catalog'`, nunca `@/domain/catalog/arquivo`. Exporte no `index.ts` o que os outros contextos podem usar.
- `domain` não importa outras camadas, React, Axios, Socket.IO nem TanStack.
- `infrastructure` só depende de `domain`.
- `ui` e `routes` não importam `infrastructure`, `mocks`, Axios nem Socket.IO; do `domain`, só tipos (`import type`).

## Fluxo
1. Crie branches curtas a partir da sua branch base ou do `main`: `feat/catalog-filtros`, `fix/cart-cupom`.
2. Faça rebase no `main` todo dia (`git pull --rebase origin main`).
3. Abra PRs pequenos, com uma intenção cada, seguindo o template. O CI precisa passar: lint, testes unitários, build e E2E.
4. Estes itens vão **sempre em PR próprio**, revisado por pelo menos mais um dev, porque afetam todo mundo:
   - `domain/shared`, `application/shared`, `mocks/core`
   - componentes novos em `ui/components` ou `ui/layout`, e mudanças de tokens no `src/index.css`
   - dependência nova (`package.json` / `package-lock.json`)
   - rota nova (regenera `src/routeTree.gen.ts`)
   - ADR novo
5. Contratos REST e de eventos seguem `docs/architecture.md`. Para mudar um contrato, altere primeiro o doc ou o shared kernel e só depois o código.
6. Precisa de algo de outro contexto que ainda não existe? Combine a interface no `index.ts` do dono e use um stub até o PR dele entrar.

## Comandos
- `npm run test:unit`: Vitest (domínio)
- `npx playwright test`: E2E
- `npm run lint`: ESLint + `tsc`
- `npm run build`
