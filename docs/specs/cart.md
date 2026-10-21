# Spec: Carrinho e Cotação

Contexto: Carrinho e Cotação (`cart`) · Dono: @jairbonifacio · Branch: `feat/cart` · Depende de: Catálogo (NFT, Edição, Disponibilidade), Conta e Sessão (Sessão, Visitante/Colecionador), Tempo real (`nft.updated`), Simulação (cenários e fixtures)

## Problema
Quem navega no marketplace quer juntar vários NFTs antes de pagar e saber exatamente quanto vai pagar. Preço e Disponibilidade mudam em tempo real, a rede pode falhar e a pessoa pode começar como Visitante e só autenticar no fim. Se o Carrinho perder itens ao recarregar a página ou ao fazer login, aceitar quantidades acima da Disponibilidade, calcular totais no cliente com `number` (perdendo precisão) ou mostrar um total diferente do que a API vai cobrar, o colecionador perde a confiança e o checkout falha depois.

## Solução
Um Carrinho que guarda Itens do carrinho por Edição de NFT com quantidade inteira, sempre limitada pela Disponibilidade e pelo limite de quantidade por compra. Ele sobrevive ao refresh e, quando o Visitante autentica, é mesclado ao Carrinho do Colecionador sem perder nada. O resumo (subtotal, desconto, Taxa de rede, total) nunca é calculado na UI: vem da Cotação oficial da API, que também valida o Cupom. Quando chega `nft.updated`, o Carrinho reflete o novo preço ou a nova Disponibilidade e avisa a pessoa. O contador no Header mostra a quantidade de itens em qualquer tela, e o resumo e o campo de Cupom são reutilizados pelo Checkout.

## Histórias de usuário
1. Como Visitante, quero adicionar uma Edição de um NFT ao Carrinho a partir do detalhe, para comprar depois sem precisar criar conta antes.
2. Como Visitante, quero escolher a quantidade antes de adicionar ao Carrinho, para levar mais de uma unidade da mesma Edição.
3. Como Visitante, quero que adicionar uma Edição que já está no Carrinho some a quantidade ao Item do carrinho existente, para não ver linhas duplicadas.
4. Como Visitante, quero que Edições diferentes do mesmo NFT apareçam como Itens do carrinho separados, para saber exatamente o que estou comprando.
5. Como Visitante, quero ver no Header um contador com a quantidade de itens do Carrinho, para saber o que já separei em qualquer tela.
6. Como Visitante, quero que o contador do Header se atualize assim que adiciono, altero ou removo um item, para confiar no que vejo.
7. Como Visitante, quero abrir o Carrinho e ver cada item com imagem, título do NFT, Edição, ID do token, preço unitário, quantidade e total da linha, para revisar a compra.
8. Como Visitante, quero aumentar ou diminuir a quantidade de um item com o `QuantityStepper`, para ajustar o pedido sem sair da tela.
9. Como Visitante, quero que o botão de aumentar fique desabilitado ao atingir a Disponibilidade da Edição, para não pedir mais do que existe.
10. Como Visitante, quero que o botão de aumentar fique desabilitado ao atingir o limite de quantidade por compra, mesmo com Disponibilidade maior, para entender a regra antes do checkout.
11. Como Visitante, quero que a quantidade nunca fique abaixo de 1 pelo stepper, para remover o item só pela ação de remover.
12. Como Visitante, quero remover um item do Carrinho, para desistir de uma Edição.
13. Como Visitante, quero ver um estado vazio com um caminho de volta ao Catálogo quando o Carrinho não tiver itens, para continuar explorando.
14. Como Visitante, quero que o Carrinho continue igual depois de recarregar a página, para não perder o que separei.
15. Como Visitante, quero que o Carrinho continue igual ao abrir o site em outra aba do mesmo navegador, para ter uma experiência consistente.
16. Como Visitante, quero ver o resumo com subtotal, desconto, Taxa de rede e total, para saber quanto vou pagar.
17. Como Visitante, quero que a Taxa de rede apareça marcada como estimada, para entender que ela pode mudar até a confirmação.
18. Como Visitante, quero ver os valores em ETH exatamente como a API devolve, sem arredondamentos estranhos, para confiar nos totais.
19. Como Visitante, quero aplicar um Cupom, para ter o desconto antes de pagar.
20. Como Visitante, quero ver uma mensagem de erro associada ao campo quando o Cupom for inválido, para corrigir o código.
21. Como Visitante, quero ver uma mensagem específica quando o Cupom estiver expirado, para não insistir num código que não vale mais.
22. Como Visitante, quero remover um Cupom aplicado, para voltar ao total sem desconto.
23. Como Visitante, quero que o Cupom aplicado continue no Carrinho após refresh, para não ter que digitá-lo de novo.
24. Como Visitante, quero ver um skeleton no resumo enquanto a Cotação carrega, sem o layout pular, para entender que os valores estão chegando.
25. Como Visitante, quero que o resumo mostre um erro com opção de tentar de novo quando a Cotação falhar, para não ver números errados ou vazios.
26. Como Visitante, quero que a Cotação seja refeita sempre que altero itens, quantidades ou o Cupom, para o resumo nunca ficar desatualizado.
27. Como Visitante, quero que respostas de Cotação antigas, que chegam fora de ordem, sejam descartadas, para o resumo não voltar a um estado anterior.
28. Como Visitante, quero ver o novo preço de um item quando ele mudar em tempo real, para não ser surpreendido no pagamento.
29. Como Visitante, quero ser avisado de forma discreta quando o preço de um item do meu Carrinho mudar, para perceber a alteração.
30. Como Visitante, quero que a quantidade de um item seja reduzida para a nova Disponibilidade quando ela cair em tempo real, com aviso, para não seguir com um pedido impossível.
31. Como Visitante, quero que um item cuja Edição esgotou fique marcado como indisponível e bloqueie a finalização até eu removê-lo, para entender por que não posso seguir.
32. Como Visitante, quero que eventos repetidos ou antigos não alterem meu Carrinho nem repitam avisos, para não ver mensagens duplicadas.
33. Como Visitante, quero clicar em "Conectar e finalizar" e ser levado ao login com retorno ao checkout, para comprar sem perder o fluxo.
34. Como Visitante, quero "Continuar explorando" para voltar ao Catálogo, para adicionar mais itens.
35. Como Visitante, quero ver a seção "Colecionadores também viram" no Carrinho, para descobrir outros NFTs.
36. Como Colecionador, quero que os itens que separei como Visitante sejam mantidos ao fazer login, para não montar o Carrinho de novo.
37. Como Colecionador, quero que, ao fazer login, os itens do Visitante sejam mesclados com o Carrinho que eu já tinha salvo, para não perder nenhum dos dois.
38. Como Colecionador, quero que na mesclagem a mesma Edição some as quantidades respeitando a Disponibilidade e o limite por compra, para não ter um Carrinho inválido.
39. Como Colecionador, quero ser avisado quando a mesclagem precisar reduzir alguma quantidade, para saber o que mudou.
40. Como Colecionador, quero que meu Carrinho fique salvo no servidor, para continuar a compra depois de outro login.
41. Como Colecionador, quero que alterações de quantidade apareçam na hora e sejam desfeitas com aviso se a API recusar, para ter uma interface rápida e honesta.
42. Como Colecionador, quero ver um erro claro quando a API recusar uma quantidade por conflito de Disponibilidade, para ajustar o pedido.
43. Como Colecionador, quero que o Carrinho de outro colecionador nunca apareça para mim após logout e novo login, para manter meus dados isolados.
44. Como Colecionador, quero que o logout limpe o Carrinho do Colecionador da tela e volte a mostrar um Carrinho de Visitante vazio, para que quem usar o computador depois não veja minha compra.
45. Como Colecionador, quero que, se a Sessão expirar enquanto edito o Carrinho, eu possa autenticar de novo e encontrar o Carrinho como deixei, para não perder trabalho.
46. Como Colecionador, quero seguir do Carrinho para o checkout vendo o mesmo resumo e o mesmo Cupom, para confirmar que nada mudou.
47. Como Colecionador, quero que o checkout use a Cotação do Carrinho como referência, para que a Revalidação compare com o que eu vi.
48. Como Colecionador, quero que, após um Pedido confirmado, saiam do Carrinho só os itens e as quantidades comprados, para manter o que não comprei.
49. Como Colecionador, quero que um Pedido recusado ou uma falha preserve meu Carrinho intacto, para tentar de novo.
50. Como Visitante em mobile, quero ver os itens em cards e o resumo fixo embaixo com o botão de finalizar, para comprar com uma mão.
51. Como Visitante, quero usar todo o Carrinho pelo teclado, com foco visível no stepper, no remover, no Cupom e nos botões, para ter acessibilidade.
52. Como Visitante com leitor de tela, quero que o stepper anuncie a quantidade e os limites e que as mudanças do resumo sejam anunciadas, para acompanhar a compra.
53. Como Visitante, quero que o Carrinho não tenha rolagem horizontal em 390, 768 e 1440 px, para usá-lo em qualquer dispositivo.
54. Como Avaliador do desafio, quero ativar o cenário de Cupom inválido e ver o erro no campo, para validar o tratamento.
55. Como Avaliador do desafio, quero ativar o cenário de Cupom expirado e ver a mensagem específica, para validar o tratamento.
56. Como Avaliador do desafio, quero disparar `nft.updated` com novo preço e ver Carrinho, resumo e contador coerentes, para validar o tempo real.
57. Como Avaliador do desafio, quero disparar `nft.updated` com Edição esgotada e ver o item bloqueado, para validar a Disponibilidade em tempo real.
58. Como Avaliador do desafio, quero ativar latência variável e respostas fora de ordem na Cotação e ver o resumo correto no fim, para validar a resiliência.
59. Como Avaliador do desafio, quero ativar falha 5xx na Cotação e ver o erro com opção de tentar de novo, para validar o tratamento de falhas.
60. Como Avaliador do desafio, quero montar um Carrinho como Visitante, autenticar com um dos usuários de fixture e ver a mesclagem, para validar a preservação ao autenticar.
61. Como Avaliador do desafio, quero comparar o Carrinho com o Figma em desktop e mobile na regressão visual, para validar a estrutura.

## Decisões de implementação
- **Fonte da verdade**:
  - Para o Colecionador, o Carrinho vive no servidor (simulado pelo MSW).
  - Para o Visitante, vive no armazenamento local do navegador e sobrevive ao refresh.
  - A UI nunca escolhe a fonte diretamente: um único caso de uso de Carrinho na camada application decide qual usar a partir da Sessão.
- **Domínio do Carrinho** (puro, sem framework):
  - `Cart` e `CartItem` identificam o item pela dupla NFT + Edição.
  - A quantidade é inteira e ≥ 1.
  - Regras:
    - **Adicionar** soma à linha existente.
    - **Alterar** limita a `min(Disponibilidade, limite por compra)`.
    - **Remover**.
    - **Contar itens** para o Header, somando as quantidades.
    - **Mesclar o Carrinho do Visitante com o do Colecionador**: soma por Edição e limita pela Disponibilidade e pelo limite por compra conhecidos; devolve o Carrinho resultante e a lista de ajustes feitos, para gerar avisos.
    - **Aplicar `nft.updated` a um Carrinho**: atualiza o preço exibido, reduz a quantidade acima da nova Disponibilidade e marca como indisponível a Edição com Disponibilidade zero; devolve a lista de mudanças.
- **Cotação** (`Quote`):
  - Sempre vem de `POST /quotes`, com os itens (NFT, Edição, quantidade) e o Cupom opcional.
  - A resposta traz subtotal, desconto, Taxa de rede (estimada), total e a Disponibilidade por item, todos os valores como `EthAmount` (string decimal).
  - A UI não soma nem multiplica valores. O total de cada linha também vem da Cotação.
- **Cupom** (`Coupon`):
  - Aplicar ou remover significa refazer a Cotação com ou sem o código.
  - Código inválido ou expirado volta como `validation_error` (422), com `details` indicando o campo do Cupom e o motivo (`invalid` ou `expired`).
  - O Cupom aplicado fica guardado junto com o Carrinho (servidor ou armazenamento local).
- **Contratos REST**, seguindo `docs/architecture.md`:
  - `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` para o Colecionador.
  - `POST /quotes` para todos, inclusive o Visitante, enviando os itens no corpo.
  - Erros usam o envelope `ApiError`:
    - `availability_conflict` (409) quando a quantidade excede a Disponibilidade;
    - `price_changed` (409) quando aplicável;
    - `session_expired` (401);
    - `unavailable` (503).
- **Mesclagem ao autenticar**:
  - Quando a Sessão passa de Visitante para Colecionador, o caso de uso envia os itens locais ao servidor, recebe o Carrinho mesclado, limpa o armazenamento local e avisa os ajustes.
  - A operação é idempotente: um refresh no meio do processo não duplica itens.
- **Query keys**:
  - Usam `scopedQueryKey` do shared kernel: Carrinho e Cotação ficam no escopo do usuário (ou de `guest`).
  - A key da Cotação inclui os itens e o Cupom; mudanças cancelam a requisição anterior via `AbortSignal`.
  - O logout limpa o escopo do Colecionador.
- **Mutations**:
  - Alterar quantidade e remover item têm atualização otimista com rollback em falha.
  - Mutations não têm retry automático.
  - Cada mutation bem-sucedida invalida a Cotação.
- **Tempo real**:
  - O contexto Tempo real repassa `nft.updated` já filtrado (sem duplicatas e versões antigas, via `isDomainEventApplicable`).
  - O Carrinho expõe um handler de aplicação de evento, que atualiza o cache do Carrinho e refaz a Cotação.
  - Cada mudança gera no máximo um aviso.
- **API pública do contexto** (`index.ts`):
  - Domínio: tipos `Cart` e `CartItem`, e as regras de contar itens e de mesclar.
  - Application:
    - o hook do Carrinho, com itens, contagem, adicionar, alterar, remover e estado;
    - o hook da Cotação;
    - aplicar e remover Cupom;
    - o handler de `nft.updated`;
    - a remoção dos itens comprados após Pedido confirmado (consumida por Pedidos);
    - as query keys.
  - UI: `QuoteSummary` (subtotal, desconto, Taxa de rede estimada, total, com skeleton e estado de erro), o campo de Cupom e o indicador de contagem do Header (consumido pelo `AppShell`).
- **Consumo de outros contextos**:
  - Do Catálogo: `Nft`, `Edition`, Disponibilidade, o limite por compra e `NftCard`/carrossel, para "Colecionadores também viram".
  - De Conta e Sessão: `useSession`.
  - Os componentes compartilhados `PriceTag` e `QuantityStepper`.
- **Saída para o checkout**:
  - Visitante: leva ao login com retorno ao checkout, preservando o Carrinho.
  - Colecionador: leva direto ao checkout.
  - Itens indisponíveis ou Cotação com erro desabilitam o botão.
- **Estrutura da tela** segue `docs/design.md`:
  - Desktop: tabela de itens e coluna de resumo.
  - Mobile: cards e resumo fixo.
  - O estilo vem dos tokens definidos pela skill `ui-ux-pro-max`.

## Decisões de teste
- **O que é um bom teste:**
  - Verifica só comportamento externo: o que o usuário vê, ou o que uma função de domínio devolve para uma entrada.
  - Nunca verifica a implementação: hooks internos, chamadas ao cache, estrutura de componentes.
  - Um teste não deve quebrar com refatoração sem mudança de comportamento.
- **Seam 1, domínio puro (Vitest)**, testes escritos antes do código (TDD):
  - adicionar (soma na mesma Edição, linhas separadas por Edição);
  - alterar com limite de Disponibilidade e de limite por compra;
  - quantidade mínima 1;
  - remover;
  - contagem de itens;
  - mesclagem Visitante → Colecionador (soma, limites, lista de ajustes, Carrinhos vazios);
  - aplicação de `nft.updated` (novo preço, Disponibilidade reduzida, Edição esgotada, evento sem relação com o Carrinho).
- **Seam 2, navegador (Playwright + MSW)**, com Cenário selecionado e reset antes de cada teste, em desktop e mobile:
  - fluxo adicionar → alterar → remover;
  - persistência após refresh;
  - limites do stepper;
  - estado vazio;
  - resumo vindo da Cotação;
  - Cupom válido, inválido, expirado e removido;
  - mesclagem ao autenticar com um usuário de fixture;
  - logout limpando o Carrinho;
  - falha 5xx e retry na Cotação;
  - latência e respostas fora de ordem;
  - navegação por teclado;
  - regressão visual do Carrinho, cujo snapshot só é atualizado com aprovação.
- **Seam 3, controle dos mocks**: o teste dispara `nft.updated` (preço alterado, Disponibilidade reduzida, esgotada, duplicado, versão antiga) e troca o Cenário no meio do teste, verificando que Carrinho, resumo e contador ficam coerentes e que os avisos não se repetem.
- **Prior art**: os testes do shared kernel com Vitest (`EthAmount`, `isDomainEventApplicable`, `scopedQueryKey`), que testam funções puras por entrada e saída.

## Fora de escopo
- Calcular desconto, taxa ou total no cliente. Isso é sempre responsabilidade da Cotação da API.
- Checkout, Revalidação, criação do Pedido e Recibo: contexto Pedidos. O Carrinho só fornece a Cotação, o `QuoteSummary` e a remoção pós-confirmação.
- Detalhe do NFT, seletor de Edição e botão de adicionar no detalhe: contexto Catálogo, que chama a API pública do Carrinho.
- Transporte Socket.IO, deduplicação e Reconciliação: contexto Tempo real.
- Sincronizar o Carrinho do Visitante entre dispositivos.
- Taxa do marketplace, múltiplos Cupons simultâneos e Cupom por item.

## Notas
- O limite de quantidade por compra precisa vir do Catálogo: no detalhe da Edição ou na Cotação. Isso precisa ser combinado com @ozielrsdev no `index.ts` do Catálogo.
- O formato de `details` para o erro de Cupom (campo e motivo `invalid`/`expired`) precisa ser combinado com @Samuel-Kepler na Fase 0 (contratos e `mocks/core`).
- Ainda falta decidir se o Visitante usa `POST /quotes` sem Sessão ou se a Cotação do Visitante é anônima. Esta spec assume `POST /quotes` aberto para o Visitante.
- A biblioteca de decimais para `EthAmount` continua pendente (ADR futuro). Esta spec não depende dela, porque o Carrinho não faz aritmética de valores.
- O rótulo "Desconto do lançamento" no Figma corresponde ao desconto da Cotação.
