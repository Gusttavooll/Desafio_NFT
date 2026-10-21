# Spec: Catálogo

Contexto: Catálogo (NFT, Edição, Catálogo, Destaque, Favorito, Disponibilidade) · Dono: @ozielrsdev · Branch: `feat/catalog` · Depende de: shared kernel, Simulação (fixtures e cenários), Conta e Sessão (`useSession`), Tempo real (`nft.updated`)

## Problema
O Visitante e o Colecionador precisam encontrar NFTs num catálogo grande e escolher a Edição certa para comprar. Preço e Disponibilidade mudam em tempo real, e a rede pode estar lenta, falhar ou responder fora de ordem. Hoje não há catálogo: as rotas de Início e de detalhe são placeholders. Os outros contextos (Carrinho, Pedidos, Tempo real) também dependem dos tipos e componentes do Catálogo para mostrar NFTs de forma consistente.

## Solução
- **Início:** seção de Destaques, seguida do Catálogo navegável com busca, filtros combináveis (coleção, faixa de preço, rede), abas (Todos, Novos lançamentos, Em alta), ordenação e paginação. Todo o estado do Catálogo vive na URL, sobrevive a refresh e ao histórico, e mudar qualquer filtro volta para a primeira página.
- **Detalhe do NFT:** galeria, informações, seletor de Edição, quantidade limitada pela Disponibilidade e pelo limite por compra, Favoritar e Comprar (que adiciona ao Carrinho). Tem estados claros para NFT inexistente e Edição indisponível.
- **Favoritos:** o Colecionador autenticado marca e desmarca NFTs. A mudança aparece na hora (atualização otimista) e é desfeita com aviso se a API falhar. O Visitante que tenta favoritar é levado ao login e volta ao mesmo lugar.
- **Estados de carregamento e erro:** skeletons com shimmer sem deslocamento de layout, resultado vazio, falha com opção de tentar de novo, e descarte de respostas obsoletas.
- **Componentes reutilizáveis:** o Catálogo exporta `NftCard` e o carrossel de NFTs, usados também no carrinho e no detalhe.

## Histórias de usuário

### Início e Destaques
1. Como Visitante, quero ver Destaques no topo do Início, para conhecer rapidamente NFTs promovidos.
2. Como Visitante, quero que o Destaque mostre título, imagem, preço e uma chamada para explorar, para decidir se abro o detalhe.
3. Como Visitante, quero navegar entre os Destaques por um indicador de slides acessível por teclado, para ver todos sem usar mouse.
4. Como Visitante, quero ver um bloco "NFT em destaque" junto aos filtros, para descobrir uma oferta sem sair do catálogo.
5. Como Visitante, quero que os Destaques mostrem um skeleton enquanto carregam, para entender que o conteúdo está a caminho.
6. Como Visitante, quero que uma falha nos Destaques não derrube o Catálogo, para continuar navegando mesmo assim.

### Catálogo: busca, filtros, ordenação e paginação
7. Como Visitante, quero buscar NFTs por texto, para achar rapidamente o que procuro.
8. Como Visitante, quero que a busca não dispare uma requisição a cada tecla, para que a interface fique estável e a rede não seja sobrecarregada.
9. Como Visitante, quero filtrar por uma ou mais coleções, para ver só o que me interessa.
10. Como Visitante, quero ver quantos NFTs há em cada coleção e rede, para saber o que cada filtro vai trazer.
11. Como Visitante, quero filtrar por faixa de preço em ETH e aplicar o filtro, para ficar dentro do meu orçamento.
12. Como Visitante, quero ser avisado quando o preço mínimo for maior que o máximo, para corrigir a faixa antes de aplicar.
13. Como Visitante, quero filtrar por Rede (por exemplo Ethereum, Polygon, Solana), para ver NFTs da rede que uso.
14. Como Visitante, quero combinar busca, coleções, faixa de preço e rede ao mesmo tempo, para refinar o resultado.
15. Como Visitante, quero alternar entre as abas Todos, Novos lançamentos e Em alta, para ver recortes diferentes do Catálogo.
16. Como Visitante, quero ordenar por mais recentes, menor preço e maior preço, para comparar opções.
17. Como Visitante, quero paginar os resultados, para navegar por catálogos grandes.
18. Como Visitante, quero que mudar qualquer filtro, busca, aba ou ordenação volte para a página 1, para não cair numa página vazia.
19. Como Visitante, quero que busca, filtros, aba, ordenação e página fiquem na URL, para compartilhar o link e reabrir o mesmo resultado.
20. Como Visitante, quero que o refresh mantenha exatamente o mesmo resultado, para não perder o que eu montei.
21. Como Visitante, quero que voltar e avançar no navegador restaurem os estados anteriores do Catálogo, para navegar pelo histórico normalmente.
22. Como Visitante, quero que parâmetros inválidos na URL (página negativa, ordenação desconhecida, preço não numérico) sejam corrigidos para valores padrão, para que um link quebrado não quebre a página.
23. Como Visitante, quero limpar todos os filtros de uma vez, para recomeçar a busca.
24. Como Visitante, quero ver uma mensagem e uma ação para limpar filtros quando não houver resultados, para entender que o resultado está vazio e não quebrado.
25. Como Visitante, quero ver um erro com "Tentar de novo" quando a listagem falhar, para recuperar sem recarregar a página.
26. Como Visitante, quero que só a resposta do meu último pedido apareça quando eu mudo filtros rápido, para nunca ver resultados de um filtro antigo.
27. Como Visitante, quero que a grade mostre skeletons com o mesmo tamanho dos cards, para que o layout não pule ao carregar.
28. Como Visitante, quero que, ao paginar, os resultados anteriores fiquem visíveis até os novos chegarem, para a tela não piscar.
29. Como Visitante que prefere menos movimento, quero que o shimmer respeite `prefers-reduced-motion`, para não ser incomodado por animações.

### NftCard e carrossel
30. Como Visitante, quero que cada card mostre imagem, título e preço em ETH, para comparar NFTs de relance.
31. Como Visitante, quero ver o preço antigo riscado quando o preço baixar, para notar a oportunidade.
32. Como Visitante, quero ver um selo quando um NFT estiver esgotado ou for raro, para saber disso antes de abrir o detalhe.
33. Como Visitante, quero abrir o detalhe clicando no card ou com Enter, para navegar por mouse ou teclado.
34. Como Visitante, quero ver um carrossel "Mais desta coleção" no detalhe, para descobrir NFTs relacionados.
35. Como Visitante, quero navegar no carrossel por teclado e pelos indicadores, para usá-lo sem gestos.
36. Como Visitante em mobile, quero a grade em duas colunas e o carrossel deslizável, para usar bem a tela pequena.

### Detalhe do NFT
37. Como Visitante, quero abrir o detalhe por link direto, para chegar de um link compartilhado.
38. Como Visitante, quero ver uma galeria com miniaturas e a imagem principal, para examinar o NFT.
39. Como Visitante, quero trocar a imagem principal pelas miniaturas com mouse ou teclado, para ver todos os ângulos.
40. Como Visitante, quero ver título, preço, avaliação, descrição, ID do token, coleção e atributos, para avaliar o NFT.
41. Como Visitante, quero escolher entre as Edições disponíveis, para comprar a variante que quero.
42. Como Visitante, quero ver a Disponibilidade de cada Edição, para saber quantas unidades restam.
43. Como Visitante, quero que uma Edição esgotada apareça desabilitada e com o motivo, para não tentar comprar algo impossível.
44. Como Visitante, quero que a Edição inicial seja a primeira disponível, para começar de uma escolha válida.
45. Como Visitante, quero aumentar e diminuir a quantidade, para comprar mais de uma unidade.
46. Como Visitante, quero que a quantidade seja inteira, no mínimo 1 e no máximo o menor valor entre a Disponibilidade e o limite por compra, para não montar um pedido inválido.
47. Como Visitante, quero ser avisado do motivo quando chego ao máximo, para entender se é falta de estoque ou o limite por compra.
48. Como Visitante, quero que trocar de Edição ajuste a quantidade ao novo máximo, para não ficar com um valor inválido.
49. Como Visitante, quero adicionar a Edição escolhida ao Carrinho com "Comprar", para seguir para a compra.
50. Como Visitante, quero ver confirmação ao adicionar ao Carrinho, e erro claro se faltar Disponibilidade, para saber o que aconteceu.
51. Como Visitante, quero ver uma página "NFT não encontrado" com caminho de volta ao Catálogo quando o id não existir, para não ficar numa tela quebrada.
52. Como Visitante, quero ver um erro com "Tentar de novo" se o detalhe falhar por rede, diferente de "não encontrado", para saber se vale insistir.
53. Como Visitante, quero ver um skeleton do detalhe enquanto carrega, sem deslocamento de layout, para a página parecer estável.
54. Como Visitante, quero abas "Detalhes do NFT" e "Avaliações", navegáveis por teclado, para alternar as informações.
55. Como Visitante em mobile, quero uma barra fixa com quantidade, preço e Comprar, para comprar sem rolar a página.
56. Como Visitante, quero um breadcrumb Início / Mercado, para voltar ao Catálogo.

### Tempo real no Catálogo
57. Como Visitante, quero que preço e Disponibilidade atualizem sozinhos na grade e no detalhe quando chegar `nft.updated`, para decidir com dados atuais.
58. Como Visitante, quero que a Edição selecionada fique desabilitada se esgotar enquanto estou no detalhe, com aviso, para não tentar comprá-la.
59. Como Visitante, quero que a quantidade escolhida seja reduzida se a Disponibilidade cair abaixo dela, para manter a escolha válida.
60. Como Visitante, quero que eventos repetidos ou antigos não revertam o preço mostrado, para nunca ver um valor regredir.

### Favoritos
61. Como Colecionador, quero favoritar um NFT no detalhe e no card, para guardá-lo para depois.
62. Como Colecionador, quero ver o estado do favorito mudar na hora, para ter retorno imediato.
63. Como Colecionador, quero que o favorito volte ao estado anterior, com aviso, se a API falhar, para não acreditar num estado falso.
64. Como Colecionador, quero que meus Favoritos persistam após refresh e em outra sessão, para não perdê-los.
65. Como Colecionador, quero que cliques repetidos e rápidos em Favoritar terminem no último estado escolhido, para o resultado ser previsível.
66. Como Visitante, quero ser levado ao login ao tentar favoritar e voltar à mesma página, para concluir a ação sem me perder.
67. Como Colecionador, quero que ao sair da conta meus Favoritos deixem de aparecer, para outra pessoa no mesmo navegador não vê-los.
68. Como Colecionador, quero que trocar de usuário mostre só os Favoritos do novo usuário, para não misturar dados.
69. Como Colecionador, quero que o botão Favoritar tenha estado acessível (pressionado ou não), para usar com leitor de tela.

### Acessibilidade e responsividade
70. Como Visitante, quero navegar por filtros, abas, cards, paginação e galeria só com teclado e com foco visível, para usar o Catálogo sem mouse.
71. Como Visitante em mobile, quero os filtros num painel (Sheet) com foco controlado, para filtrar sem perder o contexto.
72. Como Visitante, quero que a contagem de resultados e os erros sejam anunciados a leitores de tela, para saber o efeito do que fiz.
73. Como Visitante, quero que Início e detalhe funcionem em 390, 768 e 1440 px sem rolagem horizontal, para usar em qualquer dispositivo.
74. Como Visitante, quero imagens com texto alternativo e carregamento adiado fora da tela, para acessibilidade e performance.

### Avaliador do desafio
75. Como Avaliador do desafio, quero alternar Cenários (vazio, latência, fora de ordem, falha, 5xx, NFT inexistente, Edição esgotada) e reproduzir cada estado do Catálogo, para verificar a resiliência.
76. Como Avaliador do desafio, quero fixtures com coleções, redes e preços variados suficientes para várias páginas, para testar filtros e paginação.
77. Como Avaliador do desafio, quero que o Lighthouse do Início e do detalhe atinja as metas do PRD em mobile e desktop, para validar performance e acessibilidade.
78. Como Avaliador do desafio, quero regressão visual estável do Início e do detalhe, para conferir a estrutura do Figma.

## Decisões de implementação

### Domínio do Catálogo
- **Tipos:** `Nft` (id, título, descrição, imagens, coleção, rede, atributos, ID do token, avaliação, preço atual e anterior opcional como `EthAmount`, Edições, `version`) e `Edition` (id, rótulo, `Availability` inteira, limite por compra, preço como `EthAmount`).
- **Regras puras:**
  - quantidade máxima de uma Edição: o menor valor entre a Disponibilidade e o limite por compra;
  - ajuste de quantidade ao máximo (`clamp`), sempre inteira e no mínimo 1;
  - Edição esgotada quando a Disponibilidade é 0;
  - escolha da Edição inicial: a primeira disponível;
  - motivo do limite: Disponibilidade ou limite por compra.
- **Parâmetros do Catálogo:** modelo `CatalogSearch` com busca, coleções (lista), preço mínimo e máximo (`EthAmount`), Rede, aba, ordenação e página. Tem normalização, que leva valores inválidos ao padrão e ordena as listas para gerar uma chave estável, e uma regra de transição: mudar qualquer campo que não seja a página reinicia a página em 1. A comparação de preços usa a aritmética de `EthAmount` do shared kernel, que depende da escolha da biblioteca de decimais.
- **Aplicação de `nft.updated`:** função pura que recebe o `Nft` atual e o evento e devolve o `Nft` atualizado. O evento já chega filtrado pelo Tempo real (duplicatas e versões antigas descartadas com `isDomainEventApplicable`); o Catálogo só aplica e informa a Versão atual do recurso.

### Aplicação
- **Queries:** `useCatalog(search)`, `useFeatured()` e `useNft(id)`, com chaves geradas por `scopedQueryKey` (id do usuário + todos os parâmetros normalizados).
  - Respostas obsoletas são descartadas pelo `AbortSignal` do TanStack Query. A paginação mantém os dados anteriores enquanto carrega.
  - Falhas de rede e 5xx têm retry limitado. Um 404 no detalhe não tem retry e vira o estado "não encontrado".
- **Favoritos:** `useFavorites()` e `useToggleFavorite()`. A mutation é otimista: cancela as queries em voo, faz um snapshot, aplica o novo estado e faz rollback com aviso em caso de erro. Cliques repetidos são serializados para que valha o último estado. Só ficam habilitados para o Colecionador; para o Visitante, a ação leva ao login com retorno.
- **Integração com o Tempo real:** o Catálogo registra no Tempo real (a) o aplicador de `nft.updated` no cache de detalhe, de listagem e de Destaques e (b) as query keys ativas que precisam de Reconciliação após reconexão. O Tempo real só os chama e não conhece a forma do cache.
- **Integração com o Carrinho:** "Comprar" chama a ação pública de adicionar item que o contexto Carrinho exporta, passando NFT, Edição e quantidade. O Catálogo não manipula o Carrinho diretamente.

### Infraestrutura
- `GET /nfts` com os parâmetros de `CatalogSearch`. Responde com a página de itens, o total, a página atual e as contagens por coleção e por Rede (facets).
- `GET /nfts/:id` responde com o NFT, as Edições e a `version`; responde 404 `not_found` quando o NFT não existe.
- Destaques: `GET /nfts?featured=true` (ver Notas).
- `GET /favorites`, `PUT /favorites/:nftId` e `DELETE /favorites/:nftId`, que exigem Sessão; um 401 `session_expired` segue o fluxo da Conta e Sessão.
- Mapeadores DTO → domínio validam valores em ETH como string decimal (`parseEthAmount`) e quantidades inteiras. Erros seguem o envelope `ApiError`.

### UI e rotas
- **Rota do Início:** valida os search params com o modelo `CatalogSearch` e grava cada mudança na URL. Filtro, busca, aba e ordenação usam replace ou push conforme a ação, e todos reiniciam a página.
- **Rota de detalhe:** carrega pelo `nftId` e trata separadamente "não encontrado" e falha de rede.
- **API pública da UI do Catálogo:** `HomePage`, `NftDetailPage`, `NftCard` (com variantes para grade e carrossel e skeleton correspondente) e `NftCarousel`, usado pelo Carrinho em "Colecionadores também viram".
- **Componentes compartilhados:** usa `PriceTag`, `QuantityStepper`, Tabs, Sheet, Skeleton e Badge de `ui/components`, e Header, Breadcrumb e Tab Bar de `ui/layout`. A estrutura segue `docs/design.md` e o estilo vem dos tokens.

### API pública do contexto (`index.ts`)
- **Domínio:** `Nft`, `Edition`, `CatalogSearch` e as regras de quantidade máxima.
- **Aplicação:** `useCatalog`, `useNft`, `useFeatured`, `useFavorites`, `useToggleFavorite`, as query keys do Catálogo e o aplicador de `nft.updated` no cache.
- **UI:** `HomePage`, `NftDetailPage`, `NftCard` e `NftCarousel`.

## Decisões de teste
- **Princípio:** um bom teste verifica só comportamento externo (o que o usuário vê na tela ou o que uma regra pura devolve), nunca detalhes de implementação como a forma do cache, nomes de hooks ou chamadas internas.
- **Seam 1, domínio puro (Vitest):**
  - quantidade máxima e ajuste da quantidade, Edição esgotada, Edição inicial e motivo do limite;
  - normalização de `CatalogSearch` e reinício da página ao mudar filtros;
  - aplicação de `nft.updated` (novo preço e Disponibilidade por Edição; a filtragem de duplicatas e versões antigas é testada no Tempo real).

  Prior art: os testes do shared kernel (`EthAmount`, `isDomainEventApplicable`, `scopedQueryKey`).
- **Seam 2, navegador (Playwright + MSW):** cada teste parte de um Cenário com reset e cobre:
  - busca, filtros combinados, aba, ordenação e paginação refletidos na URL, que sobrevivem a refresh e a voltar/avançar;
  - mudar filtro volta à página 1;
  - resultado vazio, falha com tentar de novo e respostas fora de ordem, em que só vale a última;
  - detalhe por acesso direto, NFT inexistente, Edição esgotada e limite de quantidade;
  - Favoritar com sucesso, com rollback em falha e como Visitante redirecionado ao login;
  - navegação por teclado e foco;
  - regressão visual do Início e do detalhe em desktop e mobile, com baselines atualizadas só com aprovação.
- **Seam 3, controle dos mocks:** emitir `nft.updated` durante o teste (preço muda, Edição esgota, evento duplicado e antigo ignorados) e trocar o Cenário no meio do fluxo, por exemplo uma latência alta seguida de resposta fora de ordem.
- **Fora dos testes:** sem testes de componente ou de hook isolados.

## Fora de escopo
- Blog "Diário da Cunhagem", seção de promos, menus "Criadores" e "Aprenda", newsletter e links do rodapé. Aparecem como conteúdo estático, sem aparentar sucesso funcional.
- Envio de avaliações. A aba "Avaliações" só exibe dados das fixtures.
- Página de lista de Favoritos ("Lista de interesse" na sidebar do perfil).
- Compartilhar NFT em redes sociais.
- Lógica do Carrinho, da Cotação e do envio de eventos, que pertencem a outros contextos.

## Notas
- **Endpoint de Destaques:** `docs/architecture.md` não define um. Proponho `GET /nfts?featured=true`, a confirmar com o dono de Simulação/contratos.
- **Contagens por filtro:** as contagens por coleção e Rede vêm na própria resposta de `GET /nfts` (facets). O contrato precisa ser fechado com o dono de Simulação/contratos.
- **Limite por compra:** é um campo da Edição definido pela API. A Cotação e o pedido revalidam no servidor, e o limite no Catálogo serve só para a interface.
- **Dependências bloqueantes:** a aritmética de `EthAmount` (comparar preços) depende da decisão pendente sobre a biblioteca de decimais. "Comprar" depende da ação pública de adicionar item do Carrinho, e até ela existir usa um stub combinado com @jairbonifacio.
