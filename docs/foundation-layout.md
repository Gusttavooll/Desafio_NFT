# Fundação de layout — Jair

Branch independente `codex/foundation-layout`. Escopo autorizado: AppShell, AccountLayout, Breadcrumb, PriceTag, QuantityStepper, aplicação na raiz e fontes.

- AppShell fornece cabeçalho, navegação, link de salto, main único, rodapé e Tab Bar mobile. Contagem opcional por prop, sem fingir um carrinho conectado. Autenticação será conectada quando `useSession` existir.
- AccountLayout envolve `/profile` e `/wallets` na raiz, sem editar as páginas de Conta/Carteiras.
- PriceTag renderiza a string ETH diretamente, inclusive 18 casas. Não converte para ponto flutuante.
- QuantityStepper é controlado; desativa incremento no limite, decremento em 1 e toda entrada inválida/esgotada. A revalidação definitiva pertence ao Carrinho/API.
- Fontes reutilizadas do projeto local KRONOS em `nft-marketplace-challenge/public/fonts`, com licenças SIL OFL copiadas.
- Tokens foram transcritos de `docs/design.md` para `ui/layout/layout.css`; consolidar com a fundação de design system do Oziel ao integrar. Nenhuma mudança no `src/index.css` foi feita nesta branch.
- Nenhuma contagem, conexão em tempo real ou autenticação é apresentada como ativa. Rotas ainda podem ter conteúdo placeholder do main.

O GitHub registra `@jairbonifacio-collab` como dono do layout e Carrinho; a sessão CLI atual pertence a `Jairfilhobonifacio`. Não foram alteradas atribuições nem publicados commits.
