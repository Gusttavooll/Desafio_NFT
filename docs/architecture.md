# Arquitetura

> Proposta inicial a partir do enunciado do desafio. Decisões que mudarem durante a implementação devem virar ADR em `docs/adr/`. Limitações e desvios do design system Kronos vão no `ARCHITECTURE.md` da raiz, conforme o enunciado.

## Visão geral
SPA em React + TypeScript (Vite). Toda a API e os eventos em tempo real são simulados na camada de rede com MSW, de modo que o código da aplicação fala com "uma API real" via Axios e socket.io-client, sem saber que existem mocks.

```
UI (React + shadcn/ui + Tailwind)
  └─ TanStack Router (rotas, search params, guards)
  └─ TanStack Query (consultas, mutations, cache)
        └─ Axios (REST)            Socket.IO client (eventos)
              └──────── rede ────────┘
                  MSW (handlers REST + socket.io-binding)
                  └─ estado simulado + fixtures + cenários
```

## Stack e responsabilidades
| Responsabilidade | Tecnologia |
|------------------|------------|
| Interface | React |
| Linguagem | TypeScript (strict) |
| Build | Vite |
| Roteamento | TanStack Router |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios |
| Tempo real | Socket.IO (socket.io-client) |
| Estilização e componentes | Tailwind CSS + shadcn/ui |
| Mocking | MSW + @mswjs/socket.io-binding |
| Testes E2E e visual | Playwright |
| Auditoria | Lighthouse |

## Camadas
- **domain**: regras puras e tipos, sem importar framework nem rede. Exemplos: `EthAmount` (aritmética decimal), regras de quantidade e disponibilidade, máquina de estados do pedido, comparação de versão de eventos.
- **application**: casos de uso e orquestração. Hooks de TanStack Query, mutations (com otimismo e rollback), fluxo de checkout, reconciliação e tratamento de eventos.
- **infrastructure**: Axios, socket.io-client, storage de sessão, schemas de transporte e mapeadores DTO → domínio.
- **ui**: componentes e rotas. Só consome a camada application.
- **mocks** (fora do bundle de produção lógico, mas presente no build de demo): handlers MSW, fixtures, cenários e estado simulado.

Regra: o domínio não importa nada de infraestrutura ou UI. Componentes, hooks e Axios não contêm respostas fictícias.

## Estrutura de `src/`
Cada camada é subdividida por bounded context (`shared`, `catalog`, `cart`, `orders`, `account`, `wallets`, `realtime`), conforme `docs/adr/0002-contextos-dentro-das-camadas.md`. Detalhes e regras de import em `CONTRIBUTING.md`.

```
src/
├── domain/            # tipos, EthAmount, estados do pedido, regras
├── application/       # queries, mutations, checkout, realtime
├── infrastructure/    # http (axios), socket, storage, dto/mappers
├── ui/                # components, layouts, pages
├── routes/            # TanStack Router (file-based ou code-based)
├── mocks/             # handlers, fixtures, scenarios, socket, db
└── main.tsx
```

## Bounded contexts e contratos
Contextos definidos em `docs/glossary.md`: Catálogo, Carrinho e Cotação, Pedidos, Conta e Sessão, Carteiras, Tempo real, Simulação.

### Contratos REST (mínimos)
Prefixo sugerido: `/api`. Valores em ETH sempre como string decimal. Erros seguem um envelope único `{ code, message, details? }`.

| Recurso | Operações | Endpoints sugeridos |
|---------|-----------|---------------------|
| Sessão e conta | cadastro, login, sessão, logout | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` |
| NFTs | listagem (busca, filtros, ordenação, paginação) e detalhe | `GET /nfts`, `GET /nfts/:id` |
| Favoritos | consulta, inclusão, remoção | `GET /favorites`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId` |
| Carrinho | consulta, inclusão, alteração, remoção | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` |
| Cotação | cupom, disponibilidade, descontos, taxas, total | `POST /quotes` |
| Pedidos | criação idempotente, estado e recibo | `POST /orders` (header `Idempotency-Key`), `GET /orders/:id` |
| Perfil | consulta, atualização, avatar, senha | `GET /me`, `PATCH /me`, `PUT /me/avatar`, `POST /me/password` |
| Carteiras | consulta, cadastro, atualização | `GET /wallets`, `POST /wallets`, `PATCH /wallets/:id` |

### Erros representados
| Situação | HTTP | `code` sugerido |
|----------|------|-----------------|
| Validação | 422 | `validation_error` |
| Sessão inválida ou expirada | 401 | `session_expired` |
| Sem permissão | 403 | `forbidden` |
| Recurso inexistente | 404 | `not_found` |
| Conflito de disponibilidade ou preço | 409 | `availability_conflict`, `price_changed` |
| Reuso de chave de idempotência com conteúdo diferente | 409 | `idempotency_conflict` |
| Falha transitória | 503 | `unavailable` |

### Eventos Socket.IO
Envelope: `{ id, resource, resourceId, version, occurredAt, payload }`.

| Evento | Efeito |
|--------|--------|
| `nft.updated` | Atualiza preço e disponibilidade em catálogo, detalhe e carrinho |
| `order.updated` | Atualiza estado do pedido e mostra confirmação ou recusa |

Regras do cliente: ignorar `id` já visto, ignorar `version` menor ou igual à atual do recurso, e nunca reaplicar efeitos (toasts, redirecionamentos). Subscriptions e listeners são liberados no ciclo de vida e no logout. Eventos de sessão anterior são descartados.

## Estado, cache e sessão
Pontos a documentar no `README.md` e `ARCHITECTURE.md` finais:
- **Query keys** incluem o id do usuário e todos os parâmetros da consulta (isolamento por usuário e por filtro).
- **Catálogo**: estado na URL via search params validados do TanStack Router; `AbortSignal` do Query cancela respostas obsoletas.
- **Stale time, gc time e retries**: definir por tipo de recurso (catálogo com stale curto; sessão e pedidos sem retry automático em mutations). *(decisão pendente → ADR)*
- **Atualização otimista**: favoritos, com rollback em falha.
- **Carrinho**: servidor como fonte de verdade; visitante persiste localmente e é mesclado ao autenticar.
- **Sessão**: token recuperável após refresh, senha nunca em claro; 401 dispara fluxo de retomada preservando a rota e o contexto do checkout. Logout e troca de usuário chamam `queryClient.clear()` e encerram o socket.
- **Reconciliação REST ↔ Socket.IO**: ao reconectar, invalidar e refazer as queries ativas (catálogo visível, detalhe, carrinho, pedido pendente). O estado REST vence se a versão for mais nova.
- **Pedido**: máquina `pending → confirmed | rejected` (terminais). O id do pedido pendente é guardado para recuperação após refresh.

## Simulação (MSW)
- Ativação por variável de ambiente, também no build de demo.
- Handlers REST e eventos Socket.IO partilham o mesmo estado simulado, então mudança nos dados reflete nas duas vias.
- Cenários selecionáveis e reproduzíveis (ex.: query param `?scenario=` ou variável de ambiente), com reset para o estado conhecido.
- Persistência local permitida para sobreviver ao refresh.
- Limitações do transporte Socket.IO nos mocks devem ser documentadas.

## Testes e qualidade
- Playwright em Chromium, viewports desktop e mobile; regressão visual de início, detalhe, carrinho e pagamento com baselines versionadas.
- Cada teste parte de estado isolado (reset do cenário); relógio, latência e eventos controlados.
- Lighthouse: três medições por página e perfil, mediana reportada, configuração versionada.
- CI: install, lint (eslint + `tsc --noEmit`), build e Playwright.

## Decisões pendentes (virar ADR)
1. Rotas file-based ou code-based no TanStack Router.
2. Biblioteca de validação (sugestão: Zod) e de decimais para ETH (sugestão: `decimal.js` ou `big.js`).
3. Política de cache e retries por recurso.
4. Estratégia de mock do estado: onde persiste e como o reset funciona.
5. Hash da senha na simulação (ex.: Web Crypto) e formato do token de sessão.
