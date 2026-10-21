# Design

Arquivo Figma: [Marketplace de NFTs GreenMint](https://www.figma.com/design/1OGU2QratbH5oEQf63jK6K/Frontend-Challenge--c%C3%B3pia-?node-id=0-1) (acesso pelo MCP do Figma: `fileKey` `1OGU2QratbH5oEQf63jK6K`).

## Regra
- **Do Figma vem só a estrutura**: telas, seções, ordem do conteúdo, campos dos formulários, componentes e comportamento responsivo. Não é pixel-perfect.
- **A estilização vem das skills**: cores, tipografia, espaçamento, raio, sombras e estados visuais são definidos com a skill `ui-ux-pro-max` e aplicados como tokens no `src/index.css` (variáveis do shadcn/ui). Não copiar cores, fontes ou medidas do Figma.
- Páginas e componentes de contexto usam apenas `ui/components`, `ui/layout` e as classes dos tokens. Nada de cor hex, fonte ou componente base próprio.

## Telas

Links: `https://www.figma.com/design/1OGU2QratbH5oEQf63jK6K/?node-id=<node>` (troque `:` por `-` no node).

| Tela | Rota | Desktop | Mobile | Contexto | Seções (em ordem) |
|------|------|---------|--------|----------|-------------------|
| Início | `/` | `2:2` | `14:5226` | Catálogo | Hero com destaque (texto + CTA + imagem + indicador de slides); catálogo: sidebar de filtros (coleções com contagem, faixa de preço, rede) + bloco "NFT em destaque", abas (Todos, Novos lançamentos, Em alta), ordenação, grade de `NftCard`, paginação. Mobile: busca + botão de filtros, hero, abas, grade em 2 colunas, Tab Bar |
| Detalhe do NFT | `/nfts/$nftId` | `10:244` | `15:5536` | Catálogo | Breadcrumb; galeria (miniaturas + imagem principal); título, preço, avaliação; descrição; seletor de **Edição**; `QuantityStepper`; Comprar e Favoritar; ID do token, coleção, atributos; abas (Detalhes, Avaliações); carrossel "Mais desta coleção". Mobile: imagem no topo, voltar e favoritar, folha de detalhes, barra fixa com quantidade, preço, Comprar e carrinho |
| Carrinho | `/cart` | `11:1278` | `16:360` | Carrinho | Breadcrumb; tabela de itens (NFT + ID do token, preço, `QuantityStepper`, total, remover); `QuoteSummary` com cupom (subtotal, desconto, taxa de rede, total), "Conectar e finalizar", "Continuar explorando"; carrossel "Colecionadores também viram". Mobile: cards de item + resumo fixo embaixo |
| Pagamento | `/checkout` | `11:2862` | `16:748` | Pedidos + Carteiras | Breadcrumb; formulário "Perfil do colecionador" (nome de exibição, usuário, rede, endereço da carteira, carteira secundária, tipo de carteira, e-mail, nome ENS, observação); coluna "Seus NFTs" (itens + `QuoteSummary`); "Carteira e rede" (opções de carteira em radio); "Confirmar compra" |
| Confirmação | `/checkout/confirmation` | `11:4385` (modal `70376:239`) | — | Pedidos | Modal sobre o pagamento: mensagem de sucesso; transação, data, total, carteira; itens com edições e subtotal; taxa de rede e total; texto da transação; "Ver no explorador" |
| Login | `/login` | `9:115` (modal `70381:239`) | `16:1022` | Conta | Abas Entrar / Criar conta; e-mail, senha com mostrar/ocultar, "Esqueceu a senha?"; Entrar; login social. Desktop: modal sobre o marketplace. Mobile: tela inteira |
| Cadastro | `/register` | `9:1022` (modal `70383:239`) | `16:1228` | Conta | Mesma estrutura do login, com os campos de cadastro e "Criar perfil" |
| Perfil | `/profile` | `9:1238` | — | Conta | `AccountLayout` (sidebar "Meu perfil"); dados do perfil (nome de exibição, usuário, e-mail, nome ENS, apelido da carteira, avatar com Alterar e Remover); Alterar senha (atual, nova, confirmar, com mostrar/ocultar); Salvar |
| Carteiras | `/wallets` | `9:1670` | — | Carteiras | `AccountLayout`; Carteira principal (formulário + Salvar carteira); Carteira secundária (vazia, "Igual à principal", Adicionar) |

Telas sem frame mobile (Perfil, Carteiras, Confirmação) devem funcionar em 390 px seguindo o mesmo padrão: sidebar vira menu no topo e o modal vira tela inteira.

## Componentes compartilhados

| Componente | Onde aparece | Pasta | Dono |
|------------|--------------|-------|------|
| Componentes base do shadcn: Button (cheio, contorno, link), Input, PasswordInput, Select, Textarea, RadioGroup, Dialog, Sheet, Tabs, Skeleton, Badge | todas as telas | `ui/components` | compartilhado |
| `QuantityStepper` | detalhe, carrinho | `ui/components` | compartilhado |
| `PriceTag` (`EthAmount`, preço antigo riscado opcional) | todas as telas com preço | `ui/components` | compartilhado |
| `AppShell`: Header (logo, menu, busca, carrinho com contador, Entrar/conta), Footer, Breadcrumb, Tab Bar mobile | todas as telas | `ui/layout` | compartilhado |
| `AccountLayout` (sidebar "Meu perfil") | perfil, carteiras | `ui/layout` | compartilhado |
| `NftCard`, carrossel de NFTs | início, detalhe, carrinho | `ui/catalog` (exportado no `index.ts`) | Catálogo |
| `QuoteSummary`, campo de cupom | carrinho, pagamento | `ui/cart` (exportado no `index.ts`) | Carrinho |
| Lista de itens do pedido (miniatura, nome, ID do token, edições, subtotal) | pagamento, confirmação | `ui/orders` | Pedidos |

## Fora do escopo (PRD)
Aparecem no Figma, mas não podem parecer funcionais. Use texto estático, ou links e botões desabilitados ou sem ação de sucesso:
- Menus "Criadores" e "Aprenda", seção de promos, blog "Diário da Cunhagem", newsletter, links do rodapé e redes sociais.
- Na sidebar "Meu perfil": Atividade, Ofertas, Arquivos baixados e Suporte.
- Login social (Google e Facebook) e "Esqueceu a senha?".
