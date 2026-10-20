# Glossário (Linguagem Ubíqua)

Domínio: Marketplace de NFTs, com descoberta e compra de NFTs, carrinho, checkout com carteiras simuladas, pedidos com recibo, conta do colecionador (perfil, favoritos, carteiras) e atualizações em tempo real de preço e disponibilidade.

Regra: usar estes termos exatamente, no código, nos testes e na documentação. Em código, usar o equivalente em inglês indicado na coluna "Código".

| Termo | Código | Definição | Não confundir com |
|-------|--------|-----------|-------------------|
| NFT | `Nft` | Item colecionável digital listado no catálogo, com título, imagens, descrição e preço. | **Edição** (um NFT pode ter várias edições) |
| Edição | `Edition` | Variante ou tiragem de um NFT com disponibilidade própria. É a unidade que se compra e que se esgota. | NFT (o conceito geral) |
| Disponibilidade | `Availability` | Quantidade de unidades de uma edição ainda compráveis. Muda em tempo real. | Limite de quantidade por compra |
| Catálogo | `Catalog` | Conjunto navegável de NFTs, com busca, filtros, ordenação e paginação. Seu estado vive na URL. | Destaques (seleção editorial do início) |
| Destaque | `Featured` | NFT promovido na seção de destaques da página inicial. | Favorito |
| Colecionador | `Collector` | Usuário autenticado que compra, favorita e gerencia carteiras. | Visitante (sem sessão) |
| Visitante | `Guest` | Usuário sem sessão. Pode navegar e montar carrinho, mas não finalizar compra. | Colecionador |
| Sessão | `Session` | Autenticação ativa do colecionador, recuperável após refresh e sujeita a expiração. | Conta (cadastro permanente) |
| Favorito | `Favorite` | NFT marcado pelo colecionador autenticado e persistido para ele. | Destaque, item do carrinho |
| Carrinho | `Cart` | Conjunto de itens que o usuário pretende comprar. Persiste após refresh e é preservado ao autenticar. | Pedido (compromisso de compra já enviado) |
| Item do carrinho | `CartItem` | Uma edição de NFT com quantidade inteira no carrinho. | Item do pedido (snapshot imutável) |
| Cupom | `Coupon` | Código que gera desconto na cotação. Pode ser inválido ou expirado. | Desconto (valor calculado) |
| Taxa de rede | `NetworkFee` | Custo da rede blockchain simulada, em ETH, incluído na cotação. | Taxa do marketplace |
| Cotação | `Quote` | Cálculo oficial da API (subtotal, desconto, taxa de rede, total, disponibilidade). É a referência para finalizar o pedido e muda em tempo real. | **Recibo** (a cotação é volátil, o recibo é imutável) |
| Valor em ETH | `EthAmount` | Quantia em ETH representada como string decimal, nunca como `number`, para preservar precisão. | Quantidade (inteira) |
| Carteira | `Wallet` | Carteira cadastrada pelo colecionador, principal ou secundária, usada para pagar. Totalmente simulada. | Conta do colecionador |
| Carteira principal | `PrimaryWallet` | Carteira padrão do colecionador no checkout. | Carteira secundária |
| Rede | `Network` | Rede blockchain simulada selecionada no pagamento (por exemplo Ethereum, Polygon). | Carteira |
| Conexão da carteira | `WalletConnection` | Estado simulado da carteira no checkout: conectada, recusada ou desconectada. | Cadastro da carteira |
| Checkout | `Checkout` | Fluxo de pagamento: dados, carteira e rede, revisão e envio do pedido. | Carrinho |
| Revalidação | `Revalidation` | Nova consulta de cotação feita antes de confirmar. Se algo mudou, exige nova confirmação do usuário. | Atualização em tempo real |
| Pedido | `Order` | Compra enviada pelo colecionador. Estados: `pending`, `confirmed`, `rejected`. | Carrinho |
| Pedido pendente | `pending` | Pedido enviado e ainda sem resultado. Deve ser recuperável após refresh ou reconexão. | Pedido confirmado |
| Pedido confirmado | `confirmed` | Estado terminal de sucesso. Só então a confirmação é exibida. | Pedido pendente |
| Pedido recusado | `rejected` | Estado terminal de falha (por exemplo pagamento recusado). Preserva os itens no carrinho. | Erro de rede |
| Chave de idempotência | `IdempotencyKey` | Identificador da tentativa de pedido. A mesma chave recupera o mesmo pedido; reutilizada com conteúdo diferente gera conflito. | ID do pedido |
| Recibo | `Receipt` | Snapshot imutável do pedido confirmado (itens, taxas, total, transação). Não muda com o catálogo. | Cotação |
| Transação | `Transaction` | Referência simulada da compra, exibida no recibo com link de exploração simulado. | Pedido |
| Evento | `DomainEvent` | Mensagem Socket.IO com identidade estável, recurso afetado e versão. Duplicatas e antigos são ignorados. | Resposta REST |
| Versão | `version` | Número que ordena atualizações de um recurso, impedindo regredir a um estado mais antigo. | Versão da API |
| Reconciliação | `Reconciliation` | Reconsulta à REST dos recursos ativos após reconexão, para alinhar o cache. | Invalidação de cache |
| Cenário | `Scenario` | Conjunto determinístico de comportamentos dos mocks (sucesso, vazio, falha, expirada, etc.). | Fixture (dados) |
| Fixture | `Fixture` | Dados fixos usados pelos mocks e pelos testes. | Cenário |

## Bounded contexts

| Contexto | Responsabilidade | Principais termos |
|----------|------------------|-------------------|
| **Catálogo** | Descoberta de NFTs, detalhe, favoritos e disponibilidade | NFT, Edição, Catálogo, Favorito, Disponibilidade |
| **Carrinho e Cotação** | Itens, cupom, taxas e totais coerentes com a API | Carrinho, Item do carrinho, Cupom, Cotação, Taxa de rede |
| **Pedidos** | Checkout, envio idempotente, estados e recibo | Checkout, Pedido, Chave de idempotência, Recibo, Transação |
| **Conta e Sessão** | Cadastro, login, logout, expiração, perfil e isolamento de dados por usuário | Colecionador, Visitante, Sessão |
| **Carteiras** | Cadastro, edição e conexão simulada | Carteira, Rede, Conexão da carteira |
| **Tempo real** | Eventos Socket.IO, ordenação por versão e reconciliação | Evento, Versão, Reconciliação |
| **Simulação** | MSW, cenários, fixtures e reset (infraestrutura de teste e demo) | Cenário, Fixture |

### Relações entre contextos
- **Carrinho e Cotação** depende de **Catálogo** (preço e disponibilidade) e recebe atualizações de **Tempo real**.
- **Pedidos** consome a **Cotação** do **Carrinho** e a **Carteira** escolhida; produz o **Recibo**.
- **Conta e Sessão** governa o acesso a Pedidos, Carteiras, Favoritos e Perfil, e dispara a limpeza de cache e subscriptions no logout.
