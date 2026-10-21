# Desafio NFT

Marketplace de NFTs com catálogo, carrinho, checkout com carteiras simuladas e atualizações em tempo real. Toda a API REST e o Socket.IO são simulados com MSW. Produto e arquitetura estão em [`docs/`](docs/).

> Esta versão conecta catálogo, favoritos, cadastro/login, perfil, carrinho/cotação, carteiras e checkout até o recibo. É uma demonstração com API e pagamentos simulados no navegador, sem cobrança ou emissão de NFT. [Arquitetura](ARCHITECTURE.md) · [Escopo e validação](docs/marketplace-completion.md).

## Requisitos
- Node.js 22.12 ou superior (Node 20 instala sem o binding nativo do Rolldown e o Vitest não inicia)
- npm
- Para rodar o conjunto completo, incluindo SQLite do Stripe e Pi Genesis: Node.js 24 (também usado no CI).

## Setup
```bash
npm ci
npx playwright install chromium
```

## Scripts
| Script | O que faz |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Typecheck e build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | `tsc -b` (sem emitir arquivos) |
| `npm run lint` | ESLint e typecheck |
| `npm run test:e2e` | Testes Playwright (Chromium desktop 1440 e mobile 390); relatório em `playwright-report/` |
| `npm run test:stripe` | Testes do servidor Stripe sem credenciais ou chamadas externas |
| `npm run test:pi` | Contrato, arquivos IPFS e transações sem assinatura em EVM local; instalar antes as dependências de `integrations/pi-genesis` |
| `npm run test:all` | Unitários do frontend, Stripe, Pi Genesis e E2E |

O [sandbox Stripe](integrations/stripe/README.md) usa pedido demonstrativo fiat em modo test. O [Pi Genesis](integrations/pi-genesis/README.md) contém as três artes, contrato e pacote de emissão; não foi implantado em rede pública. Esses pacotes não alteram o fluxo MSW do desafio nem exigem segredos no frontend.

## Variáveis de ambiente
Defina num `.env.local` (fora do Git) ou no ambiente. Nenhuma é segredo.

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_ENABLE_MOCKS` | desligado | `true` liga o MSW. Necessário para usar o app sem backend, inclusive no build de demonstração. |
| `VITE_API_URL` | `/api` | Base da API REST |
| `VITE_SOCKET_URL` | origem da página | URL do servidor Socket.IO |

O Playwright já sobe o servidor com `VITE_ENABLE_MOCKS=true`. Para desenvolvimento e build da demonstração no PowerShell:

```powershell
$env:VITE_ENABLE_MOCKS='true'
npm run dev
# ou npm run build para gerar dist/
```

## Experimentar a compra simulada

1. Abra uma obra, escolha edição/quantidade e adicione ao carrinho.
2. Confira rede, cupom e cotação; selecione **Conectar e finalizar**.
3. Entre com uma conta fictícia abaixo ou crie outra conta de demonstração.
4. Conecte a carteira simulada e confirme os dados e valores. Mudanças de preço exigem novo aceite.
5. Aguarde a confirmação e consulte o recibo. Refresh recupera a mesma tentativa; recusa preserva o carrinho.

O estado fica somente nesse navegador. Use dados fictícios. Login social e recuperação por e-mail não integram o desafio.

## Simulação (mocks)
Com `VITE_ENABLE_MOCKS=true` o MSW responde à API. O estado fica no `localStorage` (chave `nft-simulation:v1`) e sobrevive ao refresh.

**Colecionadores fictícios**

| E-mail | Senha | Carteiras |
|--------|-------|-----------|
| `ana@kronos.test` | `Colecionador#1` | Principal (Ethereum) e secundária (Polygon) cadastradas |
| `bruno@kronos.test` | `Colecionador#2` | nenhuma |

**Cupons:** `KRONOS10` (10%, válido) e `EXPIRADO5` (expirado). Qualquer outro código é inexistente.

**Cenários** (`?scenario=<nome>` na URL): `success` (padrão), `empty`, `slow`, `out-of-order`, `network-error`, `server-error`, `session-expired`, `register-conflict`, `coupon-invalid`, `coupon-expired`, `price-changed`, `edition-sold-out`, `order-timeout`, `payment-confirmed`, `payment-rejected`. O cenário persiste após refresh até a troca explícita. Exceções: `price-changed` e `edition-sold-out` são aplicados uma vez ao enviar um pedido e retornam a `success`; um login bem-sucedido encerra `session-expired`. O reset restaura os dados e mantém o cenário atual, salvo quando outro é informado.

**Controle dos mocks:** com a simulação ativa, `window.__mocks` expõe `setScenario`, `reset`, `emit` (dispara `nft.updated` ou `order.updated`), `disconnect`, `reconnect` e `summary`. O Playwright usa esses métodos com `page.evaluate`. A conexão usa WebSocket; eventos privados são filtrados pela sessão. Reiniciar a conexão reconcilia os recursos ativos pela REST.

**Imagens das Fixtures:** `node scripts/generate-nft-images.mjs` recria os SVGs de `public/nfts/`.

## Stack
React 19, TypeScript 6 (strict), Vite 8, TanStack Router (rotas file-based em `src/routes/`), TanStack Query, Axios, socket.io-client, Tailwind CSS 4, shadcn/ui, MSW 2 com `@mswjs/socket.io-binding` e Playwright.

Versões fixadas de propósito:
- **MSW 2.15.0**: o `@mswjs/socket.io-binding` 0.2.0 exige `msw ^2.10.2`.
- **TypeScript 6.0.3**: o `typescript-eslint` 8.72 aceita no máximo `<6.1.0`.

## Estrutura
```
src/
├── domain/          # regras e tipos puros
├── application/     # casos de uso e TanStack Query
├── infrastructure/  # Axios e socket.io-client
├── ui/              # componentes (shadcn em ui/components/ui)
├── routes/          # rotas file-based do TanStack Router
├── mocks/           # MSW
├── lib/             # utilitários do shadcn
└── main.tsx
```
`src/routeTree.gen.ts` é gerado pelo plugin do Router e fica versionado.

## Deploy (Vercel)
O `vercel.json` reescreve as rotas para `index.html`, permitindo refresh e acesso direto. O build da demonstração precisa de `VITE_ENABLE_MOCKS=true`.

O projeto público `kronos-marketplace` usa publicação estática manual de `dist/`; enviar código ao GitHub não atualiza esse deploy automaticamente. Após gerar o build com mocks, copie `vercel.json` para `dist/vercel.json` e publique essa pasta pela CLI Vercel no projeto existente. Em um projeto conectado ao Git, configure a variável no ambiente de build da Vercel.
