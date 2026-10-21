# Spec: Simulação

Contexto: Simulação (`Scenario`, `Fixture`) · Dono: @Samuel-Kepler (revisão de todos em mudanças no núcleo) · Branch: `chore/foundation-contracts` (Fase 0) · Depende de: shared kernel (`EthAmount`, `DomainEvent`, `ApiError`)

## Problema
O marketplace não tem backend, blockchain, carteiras nem gateway de pagamento reais. Mesmo assim, o Visitante e o Colecionador precisam navegar, comprar e acompanhar pedidos como se existisse uma API de verdade. O Avaliador do desafio precisa reproduzir sucesso e falha de forma determinística: rede lenta, respostas fora de ordem, sessão expirada, preço alterado, edição esgotada, timeout após criação do pedido, pagamento recusado. Sem uma camada de simulação única e controlável:
- cada dev inventa respostas fictícias dentro de componentes, hooks ou Axios, o que o PRD proíbe;
- os dados de um contexto não batem com os de outro;
- os testes de tempo real e de falha ficam impossíveis de escrever.

## Solução
Uma camada de Simulação na **rede**, com MSW para REST e `@mswjs/socket.io-binding` para Socket.IO. O código da aplicação fala com "uma API real" via Axios e socket.io-client e não sabe que existem mocks.

A camada tem um **estado simulado único**, partilhado entre REST e eventos. Ele é carregado a partir de **Fixtures** fixas, segue um **Cenário** selecionável e pode ser **resetado** para um estado conhecido.

Um **controle dos mocks** permite ao Playwright e ao Avaliador:
- trocar o Cenário durante o teste;
- disparar `nft.updated` e `order.updated`;
- resetar tudo.

A simulação fica ativa no dev, nos testes e no build de demonstração publicado.

## Histórias de usuário
1. Como Visitante, quero navegar no Catálogo com NFTs, Edições e preços coerentes, para experimentar o marketplace sem backend real.
2. Como Visitante, quero que os NFTs do Catálogo, do detalhe e do Carrinho venham da mesma fonte, para nunca ver preço ou Disponibilidade divergentes entre telas.
3. Como Visitante, quero que meu Carrinho simulado sobreviva ao refresh, para não perder o que montei.
4. Como Colecionador, quero me cadastrar e fazer login com credenciais fictícias, para acessar checkout, Pedidos, Favoritos e Carteiras.
5. Como Colecionador, quero que minha senha nunca seja guardada em claro, nem na simulação, para que o produto trate credenciais com o cuidado de um sistema real.
6. Como Colecionador, quero que minha Sessão simulada continue válida após o refresh, para não precisar entrar de novo a cada recarga.
7. Como Colecionador, quero que meus Favoritos, Carteiras, perfil e Pedidos fiquem isolados dos de outro Colecionador, para que meus dados nunca apareçam para outro usuário.
8. Como Colecionador, quero que um Pedido criado continue existindo após o refresh, para recuperar um Pedido pendente.
9. Como Colecionador, quero que reenviar um Pedido com a mesma Chave de idempotência devolva o mesmo Pedido, para nunca ser cobrado duas vezes.
10. Como Colecionador, quero receber `idempotency_conflict` ao reusar uma Chave de idempotência com conteúdo diferente, para que tentativas distintas não se misturem.
11. Como Colecionador, quero que o Pedido pendente evolua para confirmado ou recusado e que eu receba `order.updated`, para ver o resultado sem recarregar.
12. Como Colecionador, quero que o Recibo seja um snapshot do Pedido confirmado, para que ele não mude quando o Catálogo mudar.
13. Como Colecionador, quero que a Cotação considere Cupom, Taxa de rede e Disponibilidade atuais do estado simulado, para que o total exibido seja o que a API calcularia.
14. Como Colecionador, quero que a Conexão da carteira possa ser conectada, recusada ou desconectada, para experimentar os três estados do checkout.
15. Como Visitante, quero que uma mudança de preço ou Disponibilidade apareça ao mesmo tempo na REST e no Evento `nft.updated`, para que o tempo real e a reconsulta concordem.
16. Como Visitante, quero que os Eventos tenham identidade estável e Versão crescente por recurso, para que o cliente consiga ignorar duplicatas e eventos antigos.
17. Como Avaliador do desafio, quero escolher o Cenário pela URL (`?scenario=`), para reproduzir um caso sem editar código.
18. Como Avaliador do desafio, quero um Cenário de sucesso como padrão, para ver o fluxo feliz completo do Catálogo ao Recibo.
19. Como Avaliador do desafio, quero o Cenário "vazio", para verificar o tratamento de Catálogo sem resultados.
20. Como Avaliador do desafio, quero o Cenário de latência variável, para observar skeletons e estados de carregamento.
21. Como Avaliador do desafio, quero o Cenário "fora de ordem", em que uma consulta antiga responde depois da nova, para verificar que o Catálogo não mostra resultado obsoleto.
22. Como Avaliador do desafio, quero o Cenário de falha de conexão, para ver mensagens de erro e novas tentativas.
23. Como Avaliador do desafio, quero Cenários de erros 4xx e 5xx com o envelope `{ code, message, details? }`, para validar o tratamento de cada `code`.
24. Como Avaliador do desafio, quero o Cenário de Sessão expirada (`session_expired`) durante a navegação e o checkout, para validar a retomada com contexto preservado.
25. Como Avaliador do desafio, quero o Cenário de conflito de cadastro, para validar o erro de e-mail ou usuário já existente.
26. Como Avaliador do desafio, quero o Cenário de Cupom inválido e de Cupom expirado, para validar os erros do Cupom.
27. Como Avaliador do desafio, quero o Cenário de preço alterado (`price_changed`) na Revalidação, para validar que a mudança exige nova confirmação.
28. Como Avaliador do desafio, quero o Cenário de Edição esgotada (`availability_conflict`), para validar o bloqueio da compra.
29. Como Avaliador do desafio, quero o Cenário de timeout após a criação do Pedido, em que o Pedido é criado mas a resposta não chega, para validar a recuperação pela Chave de idempotência.
30. Como Avaliador do desafio, quero os Cenários de pagamento confirmado e de pagamento recusado, para validar os dois estados terminais do Pedido.
31. Como Avaliador do desafio, quero um reset que restaure Fixtures, Sessões e Pedidos ao estado conhecido, para repetir os testes a partir de um checkout limpo.
32. Como Avaliador do desafio, quero que a simulação funcione no build de demonstração publicado na Vercel, para testar a URL pública sem rodar nada localmente.
33. Como Avaliador do desafio, quero que as limitações do transporte Socket.IO simulado estejam documentadas, para entender o que difere de um servidor real.
34. Como Avaliador do desafio, quero pelo menos dois Colecionadores com credenciais fictícias documentadas, para testar troca de usuário e isolamento de dados.
35. Como Avaliador do desafio, quero Fixtures variadas (coleções, redes, faixas de preço, Edições com Disponibilidade diferente, NFT sem estoque), para exercitar filtros, ordenação e paginação com mais de uma página.
36. Como Dev do time, quero que cada contexto registre seus handlers só no seu próprio módulo de mocks, para trabalhar em paralelo sem editar arquivos de outros contextos.
37. Como Dev do time, quero um núcleo de simulação com acesso tipado ao estado, para que meus handlers leiam e alterem dados sem duplicar estruturas.
38. Como Dev do time, quero helpers para responder com o envelope de erro padrão e com a latência do Cenário atual, para que todos os contextos se comportem igual sob o mesmo Cenário.
39. Como Dev do time, quero emitir um Evento a partir de um handler REST (por exemplo, ao confirmar um Pedido), para que a mudança de estado chegue aos clientes em tempo real.
40. Como Dev do time, quero que todo Evento emitido incremente automaticamente a Versão do recurso e ganhe um id único, para não calcular isso à mão.
41. Como Dev do time, quero que o estado simulado use os mesmos tipos dos contratos (DTO) que a infraestrutura consome, para que mock e aplicação nunca divirjam.
42. Como Dev do time, quero que Valores em ETH nas Fixtures e nas respostas sejam strings decimais válidas, para que a precisão seja preservada de ponta a ponta.
43. Como Dev do time, quero um controle dos mocks acessível ao Playwright para trocar o Cenário, disparar Eventos e resetar, para testar tempo real e falhas sem esperas arbitrárias.
44. Como Dev do time, quero que o controle dos mocks só exista quando a simulação está ativa, para que ele nunca vaze para um build sem mocks.
45. Como Dev do time, quero que cada teste parta de estado isolado e de um Cenário explícito, para que os testes rodem em paralelo sem interferência.
46. Como Dev do time, quero que os mocks deixem passar requisições não simuladas (assets, fontes), para não quebrar o carregamento da página.
47. Como Dev do time, quero que o Cenário atual sobreviva ao refresh da página até um reset ou troca explícita, para testar recuperação após refresh dentro do mesmo Cenário.

## Decisões de implementação
- **Módulos.**
  - O **núcleo de simulação** é compartilhado e revisado por todos. Contém: estado simulado (o "db"), Fixtures, registro de Cenários, persistência, reset, helpers de resposta (envelope de erro, latência do Cenário) e o emissor de Eventos.
  - Os **módulos de mocks por contexto** (Catálogo, Carrinho e Cotação, Pedidos, Conta e Sessão, Carteiras, Tempo real) registram apenas os próprios handlers.
  - O **agregador de handlers** já existe e não muda no dia a dia (ADR 0002).
- **Estado simulado único.**
  - É a fonte de verdade de NFTs, Edições, Disponibilidade, Colecionadores, Sessões, Favoritos, Carrinhos, Cupons, Carteiras, Pedidos e Recibos.
  - Handlers REST e emissor de Eventos leem e escrevem no mesmo estado, então uma mudança aparece pelas duas vias.
  - As entidades usam os tipos de contrato (DTO) da camada de infraestrutura de cada contexto e os tipos do shared kernel (`EthAmount`, `DomainEvent`, `ApiError`).
- **Persistência.**
  - O estado e o Cenário atual são persistidos no armazenamento local do navegador, sob uma chave versionada da simulação, para sobreviver ao refresh.
  - Se a estrutura do estado mudar entre versões, a chave versionada descarta o dado antigo e recarrega as Fixtures.
  - Esta decisão resolve a pendência 4 do `docs/architecture.md` e deve virar ADR na mesma Fase 0.
- **Fixtures.**
  - **Colecionadores:** pelo menos dois, com e-mail e senha fictícios documentados no README.
  - **NFTs:** pelo menos 24, para gerar mais de uma página do Catálogo. Os nomes seguem os frames originais (Emerald Ape #042, Sage Nomad #009, Neon Vessel #552, Cosmic Bloom #118, Violet Nomad #314, Ivory Baron #088, Golden Beat #207, Golden Signal #160 e variações).
  - **Variação dos NFTs:** coleções, redes (Ethereum, Polygon, Solana) e faixas de preço diferentes, com preço antigo opcional, NFTs marcados como Destaque, várias Edições por NFT (1/1, 1/10, 1/50, aberta) com Disponibilidade distinta e pelo menos uma Edição esgotada.
  - **Cupons:** um válido, um expirado e um inexistente.
  - **Taxa de rede:** um valor por Rede.
  - **Imagens:** servidas como assets estáticos do repositório, exibidas em moldura `art-frame` do Kronos (quadradas, sem raio).
- **Senha e token.**
  - A senha é guardada como hash (Web Crypto, SHA-256 com salt por usuário), nunca em claro.
  - O token de Sessão é opaco, aleatório e associado ao Colecionador e a uma expiração no estado simulado.
  - Esta decisão resolve a pendência 5 e vira ADR junto com a persistência.
- **Contratos.** Os handlers implementam os endpoints, os erros e os códigos HTTP do `docs/architecture.md` com o prefixo `/api`. Todo erro usa o envelope `{ code, message, details? }`.
- **Escopo por usuário.** Todo recurso privado (Favoritos, Carrinho do Colecionador, Carteiras, Pedidos, perfil) é resolvido pelo token da Sessão. Recurso de outro Colecionador responde `forbidden` ou `not_found`, nunca o dado.
- **Idempotência.**
  - O estado guarda Pedidos indexados pela Chave de idempotência, junto com uma impressão (hash) do conteúdo.
  - Mesma chave e mesmo conteúdo devolvem o mesmo Pedido. Mesma chave e conteúdo diferente devolvem `idempotency_conflict`.
- **Ciclo do Pedido.**
  - Todo Pedido nasce `pending`.
  - A transição para `confirmed` ou `rejected` acontece após um atraso determinístico, definido pelo Cenário (padrão: confirmado).
  - A transição emite `order.updated` e, no caso de `confirmed`, gera o Recibo e a Transação simulada.
- **Eventos.**
  - O emissor monta o envelope `{ id, resource, resourceId, version, occurredAt, payload }`.
  - O id é único. A Versão é incrementada por recurso dentro do estado simulado, e a REST devolve essa mesma Versão nos recursos.
  - Os Eventos de um Colecionador só são entregues à conexão autenticada com a Sessão dele.
- **Cenários.**
  - Cada Cenário tem um nome estável e é uma configuração declarativa: latência por rota, respostas forçadas por rota (código e `code`), ordem de resposta e comportamento do Pedido. Os Cenários se combinam com as Fixtures, nunca as substituem.
  - Nomes iniciais: `success` (padrão), `empty`, `slow`, `out-of-order`, `network-error`, `server-error`, `session-expired`, `register-conflict`, `coupon-invalid`, `coupon-expired`, `price-changed`, `edition-sold-out`, `order-timeout`, `payment-confirmed`, `payment-rejected`.
- **Seleção do Cenário.** O Cenário vem do parâmetro de URL `scenario` na carga da página. Sem o parâmetro, vale o Cenário persistido; sem nenhum dos dois, vale `success`.
- **Controle dos mocks (seam de teste).**
  - É exposto como um objeto global da página apenas quando a simulação está ativa.
  - Operações: trocar o Cenário, resetar o estado, disparar `nft.updated` ou `order.updated` (com ou sem Versão explícita, para simular duplicata e evento antigo), derrubar e restabelecer a conexão de tempo real, e ler um resumo do estado para asserções.
  - O Playwright usa o controle executando código na página. Ele não usa requisições HTTP diretas do Playwright, porque essas não passam pelo service worker.
- **Ativação.**
  - Ativada pela variável de ambiente de mocks no dev, no Playwright e no build de demonstração da Vercel.
  - Requisições não simuladas passam direto.
  - Componentes, hooks e o cliente Axios nunca contêm respostas fictícias.
- **Tempo real simulado.**
  - O binding do MSW intercepta o Socket.IO apenas pelo transporte WebSocket.
  - O cliente de tempo real precisa usar esse transporte quando a simulação estiver ativa.
  - A limitação vai documentada no `ARCHITECTURE.md`.
- **API pública do núcleo:**
  - acesso tipado ao estado;
  - consulta do Cenário atual;
  - helpers `respondWithError`, `withScenarioLatency` e `requireSession` (resolve o Colecionador pelo token ou responde `session_expired`);
  - `emitDomainEvent`;
  - reset.

## Decisões de teste
- **Um bom teste** verifica comportamento externo: o que a aplicação mostra ou o que a API simulada responde sob um Cenário. Não verifica a estrutura interna do estado nem como um handler foi escrito.
- **Seam 1, domínio puro (Vitest).** Regras puras do núcleo: cálculo da impressão de conteúdo para idempotência, incremento de Versão por recurso, montagem do envelope de Evento, resolução do Cenário (URL, depois persistido, depois padrão) e validação das Fixtures (todo Valor em ETH é `EthAmount` válido, toda Edição tem Disponibilidade inteira e não negativa, ids únicos).
- **Seam 2, navegador (Playwright + MSW).** Cada teste começa com reset e Cenário explícito. O Cenário de sucesso cobre o fluxo do Catálogo ao Recibo. Cada Cenário de falha tem ao menos um teste no contexto dono do comportamento (por exemplo, `coupon-invalid` em Carrinho e Cotação, `order-timeout` em Pedidos).
- **Seam 3, controle dos mocks.** Testes da própria Simulação garantem que:
  - trocar o Cenário muda a resposta seguinte;
  - o reset restaura as Fixtures e encerra Sessões;
  - um Evento disparado chega ao cliente com id e Versão corretos;
  - derrubar e restabelecer a conexão dispara a reconexão;
  - o controle não existe quando a simulação está desativada.
- **Prior art.** Testes do shared kernel com Vitest: regras de `EthAmount`, `isDomainEventApplicable` e `scopedQueryKey`.

## Fora de escopo
- Backend real, blockchain, extensões de carteira e gateways de pagamento.
- Persistência compartilhada entre navegadores ou dispositivos. O estado é por navegador.
- Interface visual para trocar Cenário (painel de debug). Pode vir depois; por enquanto URL e controle dos mocks bastam.
- Simulação de transporte Socket.IO por long-polling.
- Regras de negócio de cada contexto. A Simulação só oferece dados, Cenários e infraestrutura; o comportamento esperado de cada endpoint é especificado na spec do contexto dono.

## Notas
- Persistência do estado e hash de senha/token precisam de ADRs na Fase 0 (pendências 4 e 5 do `docs/architecture.md`).
- O cliente Socket.IO atual não fixa o transporte. A spec de Tempo real precisa adotar WebSocket quando a simulação estiver ativa, senão o binding não intercepta.
- O atraso determinístico do Pedido pendente deve ser controlável pelo controle dos mocks para os testes, sem depender de esperas arbitrárias.
- Cada contexto especifica seus endpoints na própria spec. Esta spec só garante o envelope de erro, o escopo por usuário, a idempotência e os Eventos comuns.
