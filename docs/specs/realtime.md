# Spec: Tempo real

Contexto: Tempo real (`realtime`) · Dono: @Gusttavooll · Branch: `feat/account-realtime` · Depende de: Conta e Sessão (`useSession`, ciclo de vida da Sessão), Catálogo, Carrinho e Cotação e Pedidos (aplicação dos eventos nos seus caches), Simulação (emissão de eventos pelo socket simulado), shared kernel (`DomainEvent`, `isDomainEventApplicable`)

## Problema
Preço e Disponibilidade das Edições mudam enquanto o usuário navega, e o resultado do Pedido chega depois do envio. Sem tempo real, o Catálogo, o detalhe do NFT e o Carrinho mostram valores desatualizados, e o Colecionador precisa recarregar para saber se o Pedido foi confirmado ou recusado. Em rede ruim, eventos chegam duplicados, fora de ordem ou se perdem durante uma queda de conexão; se aplicados ingenuamente, a tela regride a estados antigos, mostra a confirmação duas vezes ou vaza eventos de uma Sessão anterior para outro usuário.

## Solução
Um contexto Tempo real que mantém uma única conexão Socket.IO ligada ao ciclo de vida da Sessão, recebe os Eventos `nft.updated` e `order.updated`, descarta duplicatas e Eventos antigos pela Versão, e entrega cada Evento aplicável ao contexto dono do cache afetado. Ao reconectar, faz a Reconciliação com a REST dos recursos ativos. Efeitos de interface (avisos, redirecionamento para a confirmação) acontecem uma única vez por Evento. Eventos de uma Sessão anterior nunca atualizam outro usuário.

## Histórias de usuário
1. Como Visitante, quero ver o preço de um NFT no Catálogo mudar sem recarregar a página, para decidir com a informação atual.
2. Como Visitante, quero ver a Disponibilidade de uma Edição atualizada no detalhe do NFT, para saber se ainda posso comprá-la.
3. Como Visitante, quero ver uma Edição marcada como esgotada assim que a Disponibilidade chegar a zero, para não tentar comprar o que acabou.
4. Como Visitante, quero que o limite de quantidade no detalhe se ajuste quando a Disponibilidade cair, para não escolher mais do que existe.
5. Como Visitante, quero que o Carrinho reflita mudanças de preço e Disponibilidade em tempo real, para saber o custo atualizado.
6. Como Visitante, quero ser avisado quando um Item do carrinho ficar indisponível ou com quantidade acima da Disponibilidade, para ajustar antes do Checkout.
7. Como Visitante, quero ser avisado de forma discreta quando o preço de um Item do carrinho mudar, para não ser surpreendido no total.
8. Como Colecionador, quero que a Cotação do Carrinho seja recalculada pela API quando um Evento afetar seus itens, para que o resumo fique coerente com a API.
9. Como Colecionador, quero ver meu Pedido pendente mudar para confirmado sem recarregar, para saber que a compra deu certo.
10. Como Colecionador, quero ver a confirmação somente quando o Pedido estiver realmente confirmado, para não ser enganado por um estado intermediário.
11. Como Colecionador, quero ver a recusa do Pedido com o motivo quando o pagamento for recusado, para tentar de novo.
12. Como Colecionador, quero que o aviso de confirmação ou recusa apareça uma única vez, mesmo que o Evento chegue repetido, para não ver mensagens duplicadas.
13. Como Colecionador, quero ser levado à confirmação uma única vez, mesmo após reconexão, para não ser redirecionado de novo ao navegar.
14. Como Colecionador, quero que um Pedido em estado terminal (confirmado ou recusado) nunca volte a pendente, para confiar no resultado.
15. Como Colecionador, quero que Eventos duplicados sejam ignorados, para que a tela não pisque nem repita efeitos.
16. Como Colecionador, quero que Eventos com Versão menor ou igual à atual sejam ignorados, para que a tela nunca volte a um estado antigo.
17. Como Colecionador, quero que, após uma queda de conexão, a tela se alinhe com a REST automaticamente, para não ficar com dados perdidos durante a queda.
18. Como Colecionador, quero que a Reconciliação refaça apenas os recursos ativos (Catálogo visível, detalhe aberto, Carrinho, Pedido pendente), para não gerar requisições desnecessárias.
19. Como Colecionador, quero que, se a REST tiver uma Versão mais nova que a última recebida por Evento, prevaleça a REST, para ter sempre o estado mais recente.
20. Como Colecionador, quero recuperar o estado do meu Pedido pendente após refresh e reconexão, para não perder o resultado da compra.
21. Como Colecionador, quero ver um indicador discreto quando a conexão em tempo real estiver caída, para saber que os dados podem estar desatualizados.
22. Como Colecionador, quero que a conexão seja restabelecida automaticamente, para não precisar recarregar.
23. Como Colecionador, quero que, ao sair, a conexão em tempo real seja encerrada, para que nenhum Evento meu chegue a quem usar o navegador depois.
24. Como Colecionador, quero que, ao trocar de usuário, Eventos da Sessão anterior sejam descartados, para não ver Pedidos de outra pessoa.
25. Como Colecionador, quero que listeners sejam liberados ao sair de uma página, para que o app não fique lento com o tempo.
26. Como Visitante, quero receber atualizações de preço e Disponibilidade mesmo sem Sessão, para navegar com dados atuais.
27. Como Visitante, quero não receber Eventos de Pedidos, para que dados privados só cheguem a quem tem Sessão.
28. Como Visitante, quero que atualizações em tempo real não desloquem o layout nem tirem o foco do que estou usando, para não perder meu lugar.
29. Como Visitante que usa leitor de tela, quero que mudanças importantes (esgotado, preço alterado no Carrinho) sejam anunciadas de forma educada, para acompanhar sem ver a tela.
30. Como Avaliador do desafio, quero disparar `nft.updated` pelo controle dos mocks e ver Catálogo, detalhe e Carrinho atualizados, para verificar o requisito.
31. Como Avaliador do desafio, quero disparar `order.updated` com confirmado e recusado, para verificar confirmação e recusa.
32. Como Avaliador do desafio, quero disparar o mesmo Evento duas vezes e ver um único efeito, para verificar o descarte de duplicatas.
33. Como Avaliador do desafio, quero disparar um Evento com Versão antiga e ver que ele é ignorado, para verificar a ordenação.
34. Como Avaliador do desafio, quero derrubar e restabelecer a conexão simulada e ver a Reconciliação, para verificar a recuperação.
35. Como Avaliador do desafio, quero ver as limitações do transporte Socket.IO nos mocks documentadas, para saber o que a simulação cobre.

## Decisões de implementação
- **Módulos**: domínio do Tempo real (regras de aplicabilidade sobre o `DomainEvent` do shared kernel, registro de ids vistos e Versão por recurso, regra de "efeito único por Evento"), aplicação (ciclo de vida da conexão, roteamento dos Eventos para os contextos donos, Reconciliação após reconexão, estado da conexão para a UI) e infraestrutura (cliente Socket.IO e mapeamento do envelope de transporte para `DomainEvent`).
- **Envelope** (de `docs/architecture.md`): `{ id, resource, resourceId, version, occurredAt, payload }`. `nft.updated` traz preço e Disponibilidade por Edição; `order.updated` traz o estado do Pedido (`pending`, `confirmed`, `rejected`).
- **Aplicabilidade**: todo Evento passa por `isDomainEventApplicable` (shared kernel) com os ids já vistos e a Versão atual do recurso; os não aplicáveis são descartados sem efeito.
- **Inversão de dependência**: o Tempo real não conhece a forma dos caches dos outros contextos. Cada contexto dono expõe no seu `index.ts` um aplicador de Evento e a lista das query keys ativas que precisam de Reconciliação:
  - Catálogo: aplica `nft.updated` na listagem e no detalhe do NFT e informa a Versão atual do recurso.
  - Carrinho e Cotação: aplica `nft.updated` aos Itens do carrinho e dispara nova Cotação.
  - Pedidos: aplica `order.updated` ao Pedido, respeitando estados terminais, e executa o efeito único de confirmação ou recusa.
- **API pública do contexto (index.ts)**: um provedor/inicializador do Tempo real montado na raiz da aplicação, um hook de estado da conexão (conectado, reconectando, desconectado) e o registro de aplicadores de Evento pelos contextos.
- **Ciclo de vida**: a conexão abre na inicialização da aplicação; ao iniciar uma Sessão, a conexão é refeita com a identidade do Colecionador para receber Eventos de Pedidos; ao ouvir "sessão encerrada/trocada" (Conta), a conexão é fechada, os ids vistos e as subscriptions privadas são descartados e Eventos atrasados da Sessão anterior são ignorados por identificador de sessão.
- **Reconciliação**: ao reconectar, invalida e refaz as queries ativas registradas pelos contextos; o estado REST vence quando sua Versão for mais nova.
- **Efeitos únicos**: avisos e redirecionamentos derivados de um Evento são registrados por id de Evento e por recurso, e não se repetem em reconexão ou duplicata.
- **Transporte**: com os mocks ativos, o cliente Socket.IO usa só o transporte WebSocket, porque o `@mswjs/socket.io-binding` não intercepta long-polling.
- **Simulação**: o socket simulado (`@mswjs/socket.io-binding`) partilha o estado com os handlers REST; o controle dos mocks para testes permite emitir Eventos, derrubar e restabelecer a conexão.

## Decisões de teste
- Um bom teste verifica só comportamento externo: o que o usuário vê após um Evento, ou a saída de uma regra pura. Nada de inspecionar listeners, cache interno ou contagem de chamadas.
- **Domínio puro (Vitest)**: registro de ids vistos e Versão por recurso; descarte de duplicatas e Eventos antigos; efeito único por Evento; Pedido terminal não regride; descarte de Eventos de Sessão anterior.
- **Navegador (Playwright + MSW)**, com Cenário definido e reset antes de cada teste, usando o **controle dos mocks** para emitir Eventos e controlar a conexão:
  - `nft.updated` atualiza preço e Disponibilidade no Catálogo, no detalhe e no Carrinho; Edição esgotada;
  - `order.updated` confirmado leva à confirmação uma única vez; recusado mostra a recusa e preserva o Carrinho;
  - Evento duplicado e Evento com Versão antiga não alteram a tela;
  - queda e reconexão disparam Reconciliação e a tela fica coerente com a REST;
  - logout e troca de usuário: Eventos emitidos para a Sessão anterior não aparecem.
- **Prior art**: testes do shared kernel com Vitest, em especial `isDomainEventApplicable`.

## Fora de escopo
- Outros Eventos além de `nft.updated` e `order.updated` (por exemplo, Favoritos ou Carteiras em tempo real).
- Servidor Socket.IO real; toda a emissão é simulada.
- Notificações push do navegador e funcionamento offline.

## Notas
- Depende de os contextos Catálogo, Carrinho e Cotação e Pedidos exporem seus aplicadores de Evento e queries ativas no `index.ts`; a forma exata desse registro deve ser combinada na Fase 0.
- O identificador de sessão no envelope ou na conexão (para descartar Eventos de Sessão anterior) não está no envelope de `docs/architecture.md`; se for adicionado ao envelope, atualizar o doc e o shared kernel.
- As limitações do transporte Socket.IO nos mocks devem ser registradas no `ARCHITECTURE.md` final.
