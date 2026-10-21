# Design

Sistema visual: **KRONOS // ARCHIVE**, documentado em [`kronos-design-system.html`](../kronos-design-system.html) (workbench com tokens, contraste, tipografia, geometria e componentes). O Figma não é mais usado: o HTML é a única fonte de verdade para identidade visual, tokens e componentes.

## Regra
- **Estilo vem do Kronos**: cores, tipografia, espaçamento, raio, bordas, foco, movimento e estados dos componentes seguem os tokens abaixo, aplicados no `src/index.css` (mapeados para as variáveis do shadcn/ui). Não inventar cor, fonte ou medida fora dos tokens.
- **Estrutura das telas** (seções, ordem, campos, componentes e comportamento responsivo) está na tabela de telas. Não há frames de referência: onde o enunciado ou o PRD não detalham, componha com os componentes do Kronos.
- Páginas e componentes de contexto usam apenas `ui/components`, `ui/layout` e as classes/tokens. Nada de cor hex, fonte ou componente base próprio.
- Ao abrir o `kronos-design-system.html`, o CSS no `<style>` (bloco `:root`, "GENERATED from design-tokens.dtcg.json") é a referência exata dos valores; se divergir deste documento, vale o HTML.

## Princípios
- Campo claro dominante, estrutura em grafite, ação em cobalto. A cor livre pertence à **obra** (a imagem do NFT); a interface é mineral e sustenta o contexto.
- Cada NFT é tratado como registro permanente: tipografia precisa, preço legível até o último Wei.
- **Cobalto só em CTA primário e foco.** Nunca em carimbos, selos ou decoração.
- Arte sem raio e sem sombra difusa: a obra e a moldura mantêm raio zero.
- Hover atua na estrutura; o foco pertence à ação e fica fora do `clip-path` da obra.

## Tokens

### Cor
| Token | Valor | Papel |
|-------|-------|-------|
| `--paper` (Papel de Arquivo) | `#F0F1ED` | Fundo dominante, texto sobre ação e sobre tinta |
| `--plate` (Placa) | `#DDE1DE` | Hover, selecionado, desabilitado, skeleton |
| `--ink` (Grafite) | `#161D1B` | Texto, bordas estruturais, botão tinta, badge de versão |
| `--muted` | `#5D6861` | Texto secundário, **somente sobre Papel** (sobre Placa o contraste é 4,39:1, abaixo do AA) |
| `--line` | `#7C8880` | Borda de controle (input, botão, stepper, opção) |
| `--action` (Cobalto) | `#2F4DEB` | CTA primário e anel de foco |
| `--error` | `#9E2E24` | Erro, cotação vencida, ação destrutiva |
| `--hair` | `rgb(22 29 27 / 0.18)` | Separador decorativo; nunca borda de controle nem texto |

Bordas: `--border-structure` (1px ink), `--border-control` (1px line), `--border-subtle` (1px hair), `--border-error` (1px error). Contorno da mídia: `rgb(0 0 0 / 0.16)` em `img` e `canvas`. Confirmação de conexão em tempo real usa o ponto verde `#34D399` da barra utilitária.

### Tipografia
| Família | Token | Uso |
|---------|-------|-----|
| Barlow Condensed (600, 700) | `--display` | Títulos h1 a h3, **caixa alta**, título inteiro na mesma fonte |
| Manrope (400, 600, 700) | `--ui` | Corpo (14px/1.6), botões, campos, navegação |
| IBM Plex Mono (400, 500) | `--mono` | Preços em ETH/Wei, IDs de token, versões, carimbos, rótulos de campo, legenda; `tabular-nums` e `zero` ativos |

- Escalas fluidas: capa `clamp(110px, 23vw, 340px)` e vitrine `clamp(65px, 9vw, 138px)` (monumental, não padrão); h1 do hero `clamp(54px, 7.5vw, 118px)` com `line-height: 0.88`; título de card 30px.
- `eyebrow`: mono 10,5px, caixa alta, `letter-spacing: 0.08em`. Rótulo de campo: mono 600 11px, caixa alta.
- **Valores monetários nunca passam por ponto flutuante**: entrada decimal, conversão para `BigInt` (Wei) e saída com até 18 casas.

### Espaçamento, grid e raio
- Unidade `8px`. Escala `--space-*`: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 76.
- Gutter fluido `clamp(20px, 4.2vw, 72px)`; container máximo `1720px`.
- Fundo com grade de calibração: linhas a cada `32px` (4,5%) e `128px` (9%) de grafite.
- Raios: `--radius-none` 0 (obra, moldura, badge de versão), `--radius-xs` 4px (abas), `--radius-inner` 6px (botão, input, select, stepper, edição, opção), `--radius-outer` 14px. O contêiner segue o raio do controle somado ao respiro.
- **Chanfro**: canto superior direito cortado, `--cut` 12px (`--cut-large` 17px), marca da moldura.

### Movimento
- `--duration-fast` 160ms (hover, active), `--duration-media` 450ms (zoom da imagem do card, 1,03), `--duration-shimmer` 1400ms (skeleton).
- Easing: `--ease-out` `cubic-bezier(0.2, 0.75, 0.25, 1)`, `--ease-spring` `cubic-bezier(0.16, 1, 0.3, 1)`.
- `prefers-reduced-motion`: desativa animações, transições e rolagem suave. O skeleton fica estático e o estado continua escrito.

### Acessibilidade
- Alvo de toque mínimo **44 × 44px**; botão com altura mínima de **46px**.
- Foco visível: anel de 3px cobalto, afastamento de 4px e anel interno de 2px em Papel. Tab percorre controles nativos, sem armadilhas.
- Ícone decorativo usa `aria-hidden`; ação exige nome acessível. Contraste é verificado por par de cores.
- Link "Pular para o conteúdo" no topo.

### Ícones
Traço de 1,75px em grade de 24px, nós de 3px, abertura direcional e diagonais de 45°. Tamanho padrão 18px; mínimo do símbolo 16px, recomendado 24px, área de proteção 16px.

## Componentes do Kronos

| Componente | Estrutura e estados |
|------------|---------------------|
| Botão | Padrão: Papel, borda `--line`, raio 6px, Manrope 700 12px. Hover: fundo Placa e borda grafite. Active: `scale(0.97)`. Variantes: **primário** (cobalto, texto Papel, hover escurece 12%), **tinta** (grafite), **perigo** (texto e borda `--error`). Desabilitado: Placa com cursor `not-allowed`. `aria-busy` bloqueia reenvio (cursor `progress`) |
| Campo (`field-group`) | Rótulo mono em caixa alta; input 44px, raio 6px, borda `--line`; hover borda grafite; foco com anel cobalto; `aria-invalid` borda `--error` com mensagem de erro; desabilitado em Placa |
| Moldura de arte (`art-frame`) | Padding 8px, borda 1px grafite, chanfro diagonal no canto superior direito; mídia quadrada (`aspect-ratio: 1`), sem raio |
| `NftCard` | Moldura + botão de favorito circular 40px (pressionado: invertido em grafite) + barra de registro (mono 10px) + título 30px caixa alta + rodapé com preço e separador `--hair` |
| Carimbo e tag de versão | `stamp`: borda grafite, mono 9,5px, marcador quadrado de 4px. `version-tag`: grafite com texto Papel, mono 10px |
| Seletor de edição | Cartão de largura total, raio 6px; selecionado (`aria-pressed`): borda de 2px grafite e fundo Placa |
| `QuantityStepper` | Altura 44px, raio 6px, botões 38px, saída mono; limite por edição, sem frações, sem valor acima do estoque; trocar a edição restaura a quantidade |
| Linha do carrinho (`cart-row`) | Grade `84px 1fr auto`, borda grafite, miniatura + dados + ações |
| `QuoteSummary` (`summary-line`) | Painel com borda grafite e padding 24px; linhas com separador `--hair`; **total** com borda superior de 2px grafite e fonte 15px/700 |
| Caixa de proveniência | Borda grafite, mono 11px; pares chave/valor com separador `--hair` (ID do token, coleção, atributos) |
| Opção de carteira/rede (`rail-option`) | Grade de 2 colunas, raio 6px; selecionada: borda 2px grafite e fundo Placa |
| Aviso de cotação vencida (`stale-lock-banner`) | Borda e texto `--error`, fundo listrado a 45°; suspende a confirmação até o aceite explícito da nova cotação |
| Toast | Fixo embaixo, centralizado, grafite com texto Papel, raio 6px |
| Skeleton | Placa com shimmer horizontal de 1,4s |
| Abas (`tab-btn`) | 44px de altura, raio 4px; ativa: grafite com texto Papel; contador em `badge-count` mono 10px |
| Busca e select | 46px de altura, raio 6px, borda `--line`; foco com anel cobalto |
| Cabeçalho | Barra utilitária grafite (mono 10px, indicador de conexão) + masthead fixo com blur, wordmark KRONOS e borda inferior grafite |
| Erro e carregamento | `error-panel` (borda `--line`, padding fluido); `loading-page` com altura mínima de 50vh |
| Paginação | Linha flexível com espaço entre anterior, página atual e próxima |

## Layouts responsivos
- Até **1024px**: hero, detalhe e comércio passam a uma coluna; grade do catálogo vai de 3 para 2 colunas.
- Até **640px**: grade do catálogo, linhas de 2 campos e seletor de opções passam a uma coluna.
- Mínimo suportado: **390px**. Sem rolagem horizontal.
- Telas sem desenho próprio (Perfil, Carteiras, Confirmação) seguem o mesmo padrão: sidebar vira menu no topo e o modal vira tela inteira.

## Telas

| Tela | Rota | Contexto | Seções (em ordem) |
|------|------|----------|-------------------|
| Início | `/` | Catálogo | Hero com destaque (texto + CTA + imagem + indicador de slides) e métricas; catálogo: sidebar de filtros (coleções com contagem, faixa de preço, rede) + bloco "NFT em destaque", abas (Todos, Novos lançamentos, Em alta), ordenação, grade de `NftCard`, paginação. Mobile: busca + botão de filtros, hero, abas, grade em 2 colunas, Tab Bar |
| Detalhe do NFT | `/nfts/$nftId` | Catálogo | Breadcrumb; galeria (miniaturas + imagem principal); título, preço, avaliação; descrição; seletor de **Edição**; `QuantityStepper`; Comprar e Favoritar; ID do token, coleção, atributos; abas (Detalhes, Avaliações); carrossel "Mais desta coleção". Mobile: imagem no topo, voltar e favoritar, folha de detalhes, barra fixa com quantidade, preço, Comprar e carrinho |
| Carrinho | `/cart` | Carrinho | Breadcrumb; tabela de itens (NFT + ID do token, preço, `QuantityStepper`, total, remover); `QuoteSummary` com cupom (subtotal, desconto, taxa de rede, total), "Conectar e finalizar", "Continuar explorando"; carrossel "Colecionadores também viram". Mobile: cards de item + resumo fixo embaixo |
| Pagamento | `/checkout` | Pedidos + Carteiras | Breadcrumb; formulário "Perfil do colecionador" (nome de exibição, usuário, rede, endereço da carteira, carteira secundária, tipo de carteira, e-mail, nome ENS, observação); coluna "Seus NFTs" (itens + `QuoteSummary`); "Carteira e rede" (opções em radio); "Confirmar compra" |
| Confirmação | `/checkout/confirmation` | Pedidos | Modal sobre o pagamento: mensagem de sucesso; transação, data, total, carteira; itens com edições e subtotal; taxa de rede e total; texto da transação; "Ver no explorador". Mobile: tela inteira |
| Login | `/login` | Conta | Abas Entrar / Criar conta; e-mail, senha com mostrar/ocultar, "Esqueceu a senha?"; Entrar; login social. Desktop: modal sobre o marketplace. Mobile: tela inteira |
| Cadastro | `/register` | Conta | Mesma estrutura do login, com os campos de cadastro e "Criar perfil" |
| Perfil | `/profile` | Conta | `AccountLayout` (sidebar "Meu perfil"); dados do perfil (nome de exibição, usuário, e-mail, nome ENS, apelido da carteira, avatar com Alterar e Remover); Alterar senha (atual, nova, confirmar, com mostrar/ocultar); Salvar |
| Carteiras | `/wallets` | Carteiras | `AccountLayout`; Carteira principal (formulário + Salvar carteira); Carteira secundária (vazia, "Igual à principal", Adicionar) |

## Componentes compartilhados

| Componente | Onde aparece | Pasta | Dono |
|------------|--------------|-------|------|
| Componentes base (shadcn estilizados com os tokens Kronos): Button (cheio, contorno, link), Input, PasswordInput, Select, Textarea, RadioGroup, Dialog, Sheet, Tabs, Skeleton, Badge | todas as telas | `ui/components` | compartilhado |
| `QuantityStepper` | detalhe, carrinho | `ui/components` | compartilhado |
| `PriceTag` (`EthAmount`, preço antigo riscado opcional, fonte mono) | todas as telas com preço | `ui/components` | compartilhado |
| `AppShell`: Header (logo, menu, busca, carrinho com contador, Entrar/conta), Footer, Breadcrumb, Tab Bar mobile | todas as telas | `ui/layout` | compartilhado |
| `AccountLayout` (sidebar "Meu perfil") | perfil, carteiras | `ui/layout` | compartilhado |
| `NftCard`, carrossel de NFTs | início, detalhe, carrinho | `ui/catalog` (exportado no `index.ts`) | Catálogo |
| `QuoteSummary`, campo de cupom | carrinho, pagamento | `ui/cart` (exportado no `index.ts`) | Carrinho |
| Lista de itens do pedido (miniatura, nome, ID do token, edições, subtotal) | pagamento, confirmação | `ui/orders` | Pedidos |

## Fora do escopo (PRD)
Não podem parecer funcionais. Use texto estático, ou links e botões desabilitados ou sem ação de sucesso:
- Menus "Criadores" e "Aprenda", seção de promos, blog "Diário da Cunhagem", newsletter, links do rodapé e redes sociais.
- Na sidebar "Meu perfil": Atividade, Ofertas, Arquivos baixados e Suporte.
- Login social (Google e Facebook) e "Esqueceu a senha?".
