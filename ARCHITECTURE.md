# Arquitetura da demonstração KRONOS

Este documento complementa a proposta em [docs/architecture.md](docs/architecture.md), o [PRD](docs/PRD.md) e as decisões em [docs/adr](docs/adr). Descreve a implementação da demonstração; não constitui evidência de publicação nem de pagamentos reais.

## Fronteiras e composição

A SPA usa React, TypeScript estrito e Vite. TanStack Router organiza as rotas; TanStack Query mantém consultas e mutations. Axios e socket.io-client falam com a camada de rede. Com `VITE_ENABLE_MOCKS=true`, MSW intercepta REST e Socket.IO e usa o estado de `mocks/core`. Sem essa configuração, os handlers simulados não são iniciados; isso não disponibiliza automaticamente um backend real.

Cada camada se divide em Catálogo, Carrinho, Pedidos, Conta, Carteiras e Tempo real. `domain` concentra regras puras; `application` coordena os casos de uso; `infrastructure` adapta contratos e persistência; `ui` apresenta páginas e componentes. Contextos consomem os outros por seus `index.ts` públicos. Rotas delegam às páginas. As regras de importação são verificadas pelo ESLint.

A conclusão integrada dos fluxos e as mudanças compartilhadas foram autorizadas para esta entrega. A distribuição de responsabilidade original continua registrada em `CONTRIBUTING.md` e `.github/CODEOWNERS`; essa integração não transfere a posse dos contextos. `docs/marketplace-completion.md` registra os contratos complementares.

## Dados, sessão e recuperação

O catálogo público usa chaves que incluem os filtros da consulta; detalhes e listas de destaque têm caches próprios. Busca, coleções, rede, preços, aba, ordenação e página vivem na URL. Consultas HTTP usam cancelamento quando suportado pelo fluxo. O destaque é independente da busca no acervo.

Consultas privadas usam chaves por usuário. O encerramento de sessão limpa caches privados e subscriptions; operações assíncronas conferem a sessão antes de aplicar resultados. Favoritos e edição/remoção do carrinho fazem atualização otimista com rollback. O merge autenticado consome os itens do visitante, evitando somá-los novamente na repetição; preferências de cupom e rede já salvas pelo coletor prevalecem.

O estado simulado persiste no armazenamento local do navegador e pode ser restaurado pelas ferramentas de cenário/reset. Eventos de `storage` permitem recarregar mudanças entre abas. Esse armazenamento é controlável pelo próprio navegador e não é um banco transacional nem uma barreira de segurança. Escritas simultâneas em abas diferentes não têm garantia de serialização distribuída. Use somente dados fictícios na demonstração.

## Cotação e pedidos

Preços são strings decimais em ETH, com até 18 casas. A cotação usa inteiros `BigInt` em wei para multiplicação, descontos e taxas; não usa ponto flutuante. Quantidades devem ser inteiros positivos e respeitar disponibilidade e limite por compra. Descontos percentuais descartam a fração inferior a um wei. A API recalcula os valores a partir das edições do catálogo.

O checkout revalida a cotação antes de enviar e pede nova confirmação se valores ou disponibilidade mudarem. A criação usa `Idempotency-Key` e fingerprint do corpo por coletor: reenvio idêntico recupera o pedido; conteúdo diferente com a mesma chave gera conflito. A tentativa persistida permite recuperar um timeout ou refresh. Pedidos transitam de `pending` para `confirmed` ou `rejected`; estados terminais não regridem.

A confirmação usa um snapshot do servidor simulado. Somente a liquidação confirmada reduz estoque e remove do carrinho as quantidades compradas. Recusa mantém o carrinho. O recibo não é recalculado a partir de preços posteriores. Essas garantias são da simulação local, sem processamento financeiro ou transação em blockchain.

## Tempo real

Eventos carregam identidade, recurso e versão. O cliente descarta duplicatas e versões antigas. Atualizações de NFT preservam os campos ausentes dos payloads parciais e são aplicadas aos caches de detalhe, listagem e carrosséis. REST e eventos compartilham o estado simulado. Reconexão reconcilia consultas ativas; pedidos pendentes também usam polling REST para recuperação. Eventos de pedido são restritos à sessão do coletor no transporte simulado.

O cliente Socket.IO é importado sob demanda depois de `worker.start()`: Engine.IO captura o construtor WebSocket ao carregar. As rotas podem carregar em paralelo sem abrir a conexão antes do simulador. O transporte simulado usa apenas WebSocket, sem long-polling; o handler MSW 2.15 compara a origem após normalizar o prefixo `/socket.io/`. Não simula todas as funcionalidades de um servidor Socket.IO, como salas ou namespaces. `disconnect()` e `reconnect()` no controle dos mocks exercitam reconciliação sem alterar os dados REST.

O bootstrap baixa os módulos da aplicação e do simulador em paralelo. `mountApp` só executa após o worker estar pronto; não existe uma montagem antecipada que deixe requisições escaparem da simulação.

As duas rotas públicas do Catálogo carregam seus componentes e CSS junto com a aplicação, evitando uma etapa adicional antes de mostrar a obra. Conta, Carrinho e Pedidos permanecem sob demanda. Logs detalhados do MSW ficam desativados no build de produção, mantendo todos os handlers e cenários.

## Design e limites visuais

A fonte visual é `docs/design.md` e o design system KRONOS: Papel de Arquivo, Grafite, cobalto, tipografia condensada e valores monoespaçados. `src/index.css` mantém os tokens compartilhados; `ui/layout/layout.css` compõe a estrutura e `market.css` compõe os formulários e fluxos comerciais. O catálogo mantém a direção editorial documentada em `docs/landing-direction.md`. Resumos laterais passam a blocos empilhados em telas pequenas. Referências e adaptações dos fluxos estão em `docs/marketplace-completion.md`.

As fontes locais foram convertidas de TTF para WOFF2 com FontTools, mantendo os glifos e licenças originais em `public/fonts`. A fonte do título recebe preload. A conversão reduz o download sem mudar a identidade visual ou depender de serviços de fontes externos.

## Extensões isoladas

`integrations/stripe` é um servidor Node separado, limitado ao sandbox local de teste, com SQLite, sessão HttpOnly própria e segredo somente no servidor. Não usa a sessão MSW, não recebe o total do navegador, não converte automaticamente ETH em BRL e não integra a compra simulada do catálogo. O deploy estático não publica esse servidor. Webhook externo e backend real exigem configuração e validação próprias; consulte seu README.

`integrations/pi-genesis` contém contratos, artefatos, testes e pacote de assets próprios. Compilação e empacotamento locais não equivalem a implantação, publicação IPFS ou emissão de NFT. Nenhuma compra da demonstração assina transações.

## Verificação

`npm run lint` verifica fronteiras e tipos; `npm run test:unit` cobre regras e serviços; Playwright cobre jornadas de desktop/mobile. Stripe e Pi têm testes isolados em `test:stripe` e `test:pi`. Resultados finais e publicação devem ser registrados após a validação da revisão correspondente. Metas Lighthouse e regressão visual do PRD requerem suas próprias medições; testes funcionais não comprovam essas metas.

## Miniaturas preservadas no pedido

`QuoteItemDto.image?`, `ReceiptItemDto.image?` e `ReceiptItem.image?` carregam a URL da miniatura. A cotação canônica obtém essa URL do catálogo no momento da criação; o pedido guarda o snapshot revalidado e a liquidação o copia para o recibo. A tela do recibo não consulta o catálogo para recompor imagens. O campo é opcional para manter legíveis pedidos persistidos antes dessa extensão: sem imagem salva, continua exibindo os metadados e valores originais.
