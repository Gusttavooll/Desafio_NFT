# Desafio_NFT

Marketplace de NFTs: descoberta e compra de NFTs, carrinho, checkout com carteiras simuladas, pedidos com recibo, conta do colecionador (perfil, favoritos, carteiras) e atualizações em tempo real de preço e disponibilidade.

## Stack
- React + TypeScript + Vite (npm)
- TanStack Router (rotas), TanStack Query (estado de servidor), Axios (HTTP), Socket.IO client (tempo real)
- Tailwind CSS + shadcn/ui
- MSW + @mswjs/socket.io-binding (mocks de API e WebSocket)
- Playwright (E2E e regressão visual) e Lighthouse (performance/acessibilidade)
- Deploy: Vercel

## Comandos
- Instalar: `npm ci`
- Testes unitários (domínio): `npm run test:unit` (Vitest, `src/**/*.test.ts`)
- Testes E2E: `npx playwright test`
- Lint: `npm run lint` (eslint + `tsc --noEmit`)
- Build: `npm run build`

## Fluxo de trabalho (obrigatório)
1. Ler `docs/PRD.md`, `docs/glossary.md` e os ADRs relevantes antes de mexer em código.
2. Para qualquer tarefa não trivial: apresentar um plano e esperar aprovação (`/plan`).
3. Escrever o teste primeiro (TDD) quando houver regra de negócio.
4. Mudanças pequenas. Um commit = uma intenção.
5. Antes de finalizar: rodar testes e lint. Não declarar "pronto" sem rodar.

## Arquitetura e domínio
- Seguir DDD: usar exatamente os termos de `docs/glossary.md` (Ubiquitous Language). Nunca inventar nomes de domínio.
- Camadas: domain → application → infrastructure. O domínio não importa nada de infraestrutura (nem React, Axios ou Socket.IO).
- Decisões de arquitetura ficam em `docs/adr/`. Não desfazer uma decisão sem criar um novo ADR.

## Regras
- NÃO instalar dependência nova sem justificar e pedir aprovação (verificar se o pacote realmente existe).
- NÃO ler, imprimir ou commitar segredos (`.env`, chaves, tokens).
- NÃO alterar testes só para fazê-los passar.
- NÃO atualizar snapshots de regressão visual sem aprovação explícita.
- NÃO refatorar código fora do escopo da tarefa.
- Se algo estiver ambíguo, perguntar em vez de assumir.

## Convenções
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
- TypeScript em modo strict; sem `any` implícito.
- Componentes em PascalCase; hooks começam com `use`.
- Acesso a API só via `infrastructure` (Axios/Socket.IO); componentes consomem dados via TanStack Query.
- Componentes de UI base vêm de shadcn/ui; estilos com classes Tailwind.
