# Spec: Pedidos

Contexto: Pedidos (`orders`) · Dono: @Samuel-Kepler · Branch: `feat/orders-wallets` · Depende de: Carrinho e Cotação (`Cart`, `Quote`, `QuoteSummary`), Carteiras (`Wallet`, `PrimaryWallet`), Conta e Sessão (`useSession`, retomada após expiração), Tempo real (`order.updated`), Simulação (cenários de pagamento e timeout)

## Problema
O Colecionador quer finalizar a compra dos NFTs do Carrinho e ter certeza do resultado: pagou o valor certo, não pagou duas vezes e recebeu um comprovante. Hoje não há Checkout. Sem cuidado, a rede ruim e os preços que mudam em tempo real levam a problemas sérios: pedido duplicado por clique repetido ou reenvio após timeout, confirmação com Cotação desatualizada, tela de sucesso para um pedido que ainda não foi confirmado ou que foi recusado, e Carrinho perdido depois de uma falha.

## Solução
Um fluxo de Checkout em uma única página. O Colecionador preenche os dados do perfil, escolhe a Carteira e a Rede, simula a Conexão da carteira, revisa os itens e a Cotação e confirma a compra. Antes de enviar, o app faz uma Revalidação. Se preço, Disponibilidade, Cupom ou Taxa de rede mudaram, ele mostra o que mudou e pede uma nova confirmação.

O envio cria um Pedido com uma Chave de idempotência. Repetir o envio, seja por cliques repetidos ou por reenvio após timeout, recupera o mesmo Pedido em vez de criar outro.

O Pedido passa por `pending` até chegar a um estado terminal, `confirmed` ou `rejected`. Ele é acompanhado por `order.updated` e por consulta REST, e sobrevive a refresh e reconexão. Só um Pedido `confirmed` abre o modal de confirmação com o Recibo: um snapshot imutável com Transação e link de explorador simulado. Nesse caso saem do Carrinho apenas os itens e as quantidades comprados. Um Pedido `rejected` ou uma falha de rede preservam o Carrinho.

## Histórias de usuário
1. Como Visitante, quero ser levado ao login ao tentar abrir o Checkout, para poder finalizar a compra depois de autenticar.
2. Como Visitante, quero voltar ao Checkout logo após o login, com o mesmo Carrinho, para não refazer a navegação.
3. Como Colecionador, quero abrir o Checkout a partir de "Conectar e finalizar" no Carrinho, para iniciar o pagamento.
4. Como Colecionador, quero ser redirecionado ao Carrinho se ele estiver vazio ao abrir o Checkout, para não tentar pagar nada.
5. Como Colecionador, quero ver um breadcrumb Início / Mercado / Pagamento, para saber onde estou no fluxo.
6. Como Colecionador, quero ver o formulário "Perfil do colecionador" pré-preenchido com os dados do meu perfil, para não digitar de novo.
7. Como Colecionador, quero informar nome de exibição, nome de usuário, e-mail e nome ENS, para identificar o comprador do Pedido.
8. Como Colecionador, quero ver os campos obrigatórios marcados, para saber o que preciso preencher.
9. Como Colecionador, quero ver cada erro de validação junto do campo, ligado a ele para leitores de tela, para corrigir rapidamente.
10. Como Colecionador, quero que o foco vá para o primeiro campo inválido ao tentar confirmar, para não procurar o erro.
11. Como Colecionador, quero ver os erros de validação devolvidos pela API (`validation_error`) nos campos correspondentes, para entender o que o servidor rejeitou.
12. Como Colecionador, quero escrever uma observação opcional, para registrar algo sobre a compra.
13. Como Colecionador, quero que minha Carteira principal venha selecionada por padrão, para pagar com o mínimo de passos.
14. Como Colecionador, quero escolher outra Carteira cadastrada ("Usar outra carteira?"), para pagar com a Carteira secundária.
15. Como Colecionador sem Carteira cadastrada, quero ser orientado a cadastrar uma Carteira, para conseguir pagar.
16. Como Colecionador, quero selecionar a Rede (por exemplo Ethereum ou Polygon), para definir onde a compra é registrada.
17. Como Colecionador, quero que a Taxa de rede da Cotação acompanhe a Rede escolhida, para pagar o valor correto.
18. Como Colecionador, quero conectar a Carteira escolhida (MetaMask, Coinbase Wallet, WalletConnect simulados), para autorizar o pagamento.
19. Como Colecionador, quero ver o estado da Conexão da carteira (conectada, recusada, desconectada), para saber se posso confirmar.
20. Como Colecionador, quero uma mensagem clara e a opção de tentar de novo quando a conexão for recusada, para não ficar travado.
21. Como Colecionador, quero ser avisado se a Carteira desconectar antes do envio, com o botão "Confirmar compra" bloqueado até reconectar, para não enviar um Pedido sem autorização.
22. Como Colecionador, quero ver em "Seus NFTs" cada item com miniatura, nome, ID do token, Edição, quantidade e subtotal, para revisar o que estou comprando.
23. Como Colecionador, quero ver o `QuoteSummary` com subtotal, desconto, Taxa de rede e total vindos da API, para conferir o valor final.
24. Como Colecionador, quero aplicar ou remover um Cupom também no Checkout, para não precisar voltar ao Carrinho.
25. Como Colecionador, quero que os valores em ETH apareçam exatamente como a API devolve, sem arredondamento, para confiar no total.
26. Como Colecionador, quero que uma Revalidação aconteça ao clicar em "Confirmar compra", para nunca pagar com Cotação desatualizada.
27. Como Colecionador, quero ver destacado o que mudou na Revalidação (preço, Disponibilidade, Cupom expirado, Taxa de rede), para decidir se aceito.
28. Como Colecionador, quero confirmar de novo depois de uma mudança na Revalidação, para dar consentimento explícito ao novo valor.
29. Como Colecionador, quero ser informado quando uma Edição esgotar antes do envio, com a opção de ajustar o Carrinho, para não tentar comprar o que não existe.
30. Como Colecionador, quero que a Cotação exibida no Checkout se atualize com `nft.updated`, mas que a mudança só valha para o envio depois da Revalidação, para não ser surpreendido.
31. Como Colecionador, quero que o botão "Confirmar compra" fique desabilitado e mostre progresso enquanto o envio está em andamento, para não clicar duas vezes.
32. Como Colecionador, quero que cliques repetidos em "Confirmar compra" resultem em um único Pedido, para não pagar em dobro.
33. Como Colecionador, quero que, após um timeout no envio, o app reenvie com a mesma Chave de idempotência e recupere o mesmo Pedido, para não duplicar a compra.
34. Como Colecionador, quero ver o estado "processando" enquanto o Pedido está `pending`, para saber que a compra está em andamento.
35. Como Colecionador, quero que o Pedido `pending` seja retomado após um refresh da página, para não perder o acompanhamento.
36. Como Colecionador, quero que o Pedido `pending` seja reconciliado com a REST após reconexão do socket, para ver o estado real mesmo se perdi um evento.
37. Como Colecionador, quero que `order.updated` com Pedido `confirmed` abra o modal de confirmação, para saber imediatamente que a compra deu certo.
38. Como Colecionador, quero que `order.updated` com Pedido `rejected` mostre o motivo da recusa e mantenha meu Carrinho, para tentar de novo.
39. Como Colecionador, quero que eventos duplicados ou antigos de `order.updated` não reabram o modal nem repitam avisos, para não ver efeitos repetidos.
40. Como Colecionador, quero que um Pedido em estado terminal nunca volte para `pending`, para que o resultado seja definitivo.
41. Como Colecionador, quero que a confirmação apareça só para um Pedido realmente `confirmed`, nunca por tempo ou por suposição, para não ser enganado.
42. Como Colecionador, quero que uma falha de rede ou um erro 5xx no envio preserve o Carrinho e o formulário, para tentar de novo sem perder nada.
43. Como Colecionador, quero que, após a confirmação, saiam do Carrinho apenas os itens e as quantidades comprados, para manter o que adicionei depois.
44. Como Colecionador, quero ver no Recibo o ID da Transação, data, total e Carteira usada, para ter o comprovante da compra.
45. Como Colecionador, quero ver no Recibo cada NFT com Edição, quantidade e subtotal, além da Taxa de rede e do total, para conferir o que paguei.
46. Como Colecionador, quero um link "Ver no explorador" para a Transação simulada, para consultar a referência da compra.
47. Como Colecionador, quero que o Recibo não mude quando preços do catálogo mudarem depois, para que o comprovante seja confiável.
48. Como Colecionador, quero reabrir o Recibo pela URL de confirmação após refresh, para consultar a compra depois.
49. Como Colecionador, quero fechar o modal de confirmação por botão, tecla Esc ou clique fora, voltando para a navegação, para seguir explorando.
50. Como Colecionador, quero que o foco fique preso no modal de confirmação e volte ao elemento de origem ao fechar, para navegar só pelo teclado.
51. Como Colecionador, quero que a sessão expirada durante o Checkout me leve ao login e me devolva ao Checkout com os dados preenchidos, para retomar a compra.
52. Como Colecionador, quero que um envio interrompido por sessão expirada seja retomado com a mesma Chave de idempotência, para não duplicar o Pedido.
53. Como Colecionador, quero que outro Colecionador no mesmo navegador nunca veja meu Pedido ou Recibo, para manter minha privacidade.
54. Como Colecionador, quero que eventos `order.updated` de uma Sessão anterior sejam ignorados, para não ver pedidos de outra conta.
55. Como Colecionador, quero usar o Checkout em 390, 768 e 1440 px sem overflow horizontal, para comprar em qualquer dispositivo.
56. Como Colecionador no mobile, quero ver o modal de confirmação como tela inteira, para ler o Recibo confortavelmente.
57. Como Colecionador, quero navegar e enviar todo o Checkout pelo teclado, com foco visível, para ter acessibilidade completa.
58. Como Colecionador, quero ver skeletons no resumo enquanto a Cotação carrega, sem deslocamento de layout, para uma experiência estável.
59. Como Avaliador do desafio, quero selecionar os cenários "pagamento confirmado" e "pagamento recusado", para verificar os dois estados terminais.
60. Como Avaliador do desafio, quero selecionar o cenário "timeout após criação do pedido", para comprovar a recuperação pela Chave de idempotência.
61. Como Avaliador do desafio, quero selecionar os cenários "preço alterado" e "edição esgotada", para comprovar a Revalidação.
62. Como Avaliador do desafio, quero ver o reuso de uma Chave de idempotência com conteúdo diferente gerar `idempotency_conflict`, para comprovar a proteção da API.
63. Como Avaliador do desafio, quero ver no E2E a compra completa do catálogo ao Recibo confirmado, para validar o fluxo principal do PRD.
64. Como Avaliador do desafio, quero uma regressão visual estável da página de pagamento em desktop e mobile, para verificar a fidelidade estrutural a `docs/design.md` e ao Kronos.

## Decisões de implementação
- **Módulos do contexto:**
  - **Domínio:** máquina de estados do Pedido; regra de comparação entre a Cotação revisada e a Cotação revalidada (o que mudou); cálculo de quais itens e quantidades saem do Carrinho após a confirmação; construção do Recibo a partir do Pedido confirmado.
  - **Aplicação:** caso de uso de Checkout, com estado do formulário, Revalidação, envio idempotente e acompanhamento do Pedido.
  - **Infraestrutura:** cliente REST de pedidos e mapeadores DTO → domínio.
  - **UI:** página de Checkout, modal de confirmação e lista de itens do pedido. A lista de itens é reutilizada no Checkout e no Recibo.
- **Máquina de estados do Pedido.** Os terminais são definitivos, e transições inválidas são ignoradas, não lançam erro:

  ```
  pending   -> confirmed | rejected
  confirmed -> (terminal)
  rejected  -> (terminal)
  ```

- **API pública do contexto (index):**
  - tipos `Order`, `OrderStatus`, `Receipt`, `Transaction` e `IdempotencyKey`;
  - hook de Checkout;
  - hook de consulta do Pedido por id;
  - query keys de Pedido, criadas com `scopedQueryKey` e incluindo o id do Colecionador;
  - função que aplica `order.updated` ao cache, consumida pelo contexto Tempo real.
- **Contratos REST** (conforme `docs/architecture.md`):
  - `POST /quotes` faz a Revalidação.
  - `POST /orders` leva o header `Idempotency-Key` e o corpo com itens, Carteira, Rede, Cupom, dados do colecionador e a Cotação aceita.
  - `GET /orders/:id` devolve o estado e, quando `confirmed`, o Recibo.
  - Erros usam o envelope único: `validation_error`, `session_expired`, `availability_conflict`, `price_changed`, `idempotency_conflict` e `unavailable`.
- **Chave de idempotência:**
  - É gerada no cliente por tentativa de Pedido, ou seja, por conteúdo revisado e confirmado.
  - Fica guardada junto do id do Pedido pendente para sobreviver a refresh e à expiração de Sessão.
  - A mesma chave é reutilizada em reenvios.
  - Uma nova chave só é gerada quando o conteúdo muda, depois de uma nova confirmação na Revalidação.
- **Mutations sem retry automático.** O reenvio é controlado pelo caso de uso, sempre com a mesma chave. Um timeout faz o caso de uso reenviar ou consultar o Pedido em vez de mostrar sucesso.
- **Pedido pendente:**
  - O id do Pedido `pending` fica guardado de forma escopada ao Colecionador. É removido quando o Pedido chega a um estado terminal, e limpo no logout ou na troca de usuário.
  - Ao recarregar, o Checkout consulta `GET /orders/:id` e retoma o acompanhamento.
- **Tempo real:**
  - O contexto Tempo real entrega `order.updated` já filtrado por id e versão. Pedidos aplica o novo estado ao cache e dispara os efeitos (abrir o modal, mostrar a recusa) uma única vez por transição de estado.
  - Na reconexão, a Reconciliação refaz a consulta do Pedido pendente, e o estado REST vence se for mais novo.
- **Revalidação:**
  - Compara subtotal, desconto, Taxa de rede, total, Disponibilidade por Edição e validade do Cupom.
  - Qualquer diferença bloqueia o envio até nova confirmação explícita.
  - `price_changed` e `availability_conflict` no `POST /orders` também levam a esse estado.
- **Após a confirmação:** o contexto Carrinho expõe uma operação para remover itens e quantidades comprados. Pedidos chama essa operação com os itens do Recibo, nunca limpa o Carrinho inteiro.
- **Recibo:** é exibido a partir do snapshot devolvido pela API e nunca é recalculado com dados do Catálogo. O link de explorador aponta para uma URL simulada da Transação.
- **Interface:**
  - A estrutura segue `docs/design.md`: formulário à esquerda, "Seus NFTs" + `QuoteSummary` + "Carteira e rede" à direita, e "Confirmar compra" no fim. O modal de confirmação segue `docs/design.md`; no mobile vira tela inteira.
  - O estilo vem dos tokens do design system Kronos.
  - O formulário e a seleção de Carteira e Rede consomem a API pública de Carteiras.

## Decisões de teste
- **O que é um bom teste:** valida o comportamento externo, ou seja, o que o Colecionador vê e o que a API recebe, e não detalhes de implementação como estado interno de hooks ou nomes de componentes. Usa os termos do glossário nos nomes dos testes.
- **Seam 1, domínio puro (Vitest):**
  - transições da máquina de estados, incluindo a ignorada após um estado terminal;
  - detecção de mudanças entre Cotações;
  - itens e quantidades a remover do Carrinho;
  - construção do Recibo imutável.
- **Seam 2, navegador (Playwright + MSW):**
  - cada teste começa com reset e um Cenário conhecido;
  - fluxos: compra completa até o Recibo; recusa preserva o Carrinho; cliques repetidos geram um único `POST /orders` efetivo; refresh com Pedido `pending` retoma o acompanhamento;
  - Revalidação com preço alterado e com Edição esgotada; sessão expirada no Checkout com retomada;
  - acessibilidade do modal (foco preso e retorno);
  - regressão visual da página de pagamento em desktop e mobile.
- **Seam 3, controle dos mocks:**
  - disparar `order.updated`, incluindo evento duplicado e evento antigo;
  - trocar o Cenário no meio do teste: timeout após criação do pedido, pagamento confirmado ou recusado;
  - disparar `nft.updated` durante o Checkout.
- **Prior art:** os testes do shared kernel com Vitest, ao lado do código (`DomainEvent`, `EthAmount`, `scopedQueryKey`).

## Fora de escopo
- Integração real com blockchain, extensões de carteira e gateways de pagamento.
- Histórico ou listagem de Pedidos do Colecionador. Só o Pedido atual e o seu Recibo.
- Cancelamento, reembolso ou estorno de Pedido.
- Envio de recibo por e-mail.
- Código de indicação com efeito real: o campo existe nos frames originais, mas não altera a Cotação.
- Link de explorador real (Etherscan).

## Notas
- Os frames originais tinham "Código de indicação" obrigatório. O PRD não fala desse campo. Proposta: mantê-lo opcional e sem efeito até que alguém decida o contrário.
- O formulário de Checkout repete campos da Carteira (endereço, tipo, ENS). Decisão: o Checkout usa uma Carteira já cadastrada e só permite escolher entre principal e secundária. O cadastro e a edição ficam no contexto Carteiras.
- A duração do timeout do envio e o intervalo de consulta do Pedido `pending` devem entrar no ADR de política de cache e retries, que é uma decisão pendente.
