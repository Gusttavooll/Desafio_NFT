# PRD: Desafio_NFT

## Problema
Colecionadores precisam descobrir, comprar e acompanhar NFTs em um marketplace com preço e disponibilidade que mudam em tempo real. O desafio é entregar essa experiência de ponta a ponta (descoberta, carrinho, checkout, conta) sem depender de blockchain, carteiras ou pagamentos reais: toda a integração é simulada com MSW, inclusive o tempo real via Socket.IO.

O produto deve ser confiável mesmo em condições ruins de rede: nunca duplicar pedido, nunca confirmar compra com cotação desatualizada, nunca expor dados de um usuário a outro.

## Usuários
- **Visitante**: navega no catálogo, busca, filtra, vê detalhes e monta um carrinho. Não faz checkout.
- **Colecionador (autenticado)**: tudo do visitante, mais favoritos, checkout, pedidos, perfil e carteiras.
- **Avaliador do desafio**: executa os fluxos, cenários de falha, testes Playwright e auditorias Lighthouse a partir de um checkout limpo e da URL publicada.

## Objetivos e métricas de sucesso
| Objetivo | Métrica |
|----------|---------|
| Fidelidade ao Figma (desktop e mobile) | Regressão visual Playwright estável em início, detalhe, carrinho e pagamento |
| Fluxos completos de compra e conta | Compra do catálogo ao recibo confirmado passando em E2E |
| Resiliência | Timeout após criação do pedido recupera o mesmo pedido pela chave de idempotência |
| Tempo real | `nft.updated` e `order.updated` tratados com duplicatas, eventos antigos e reconexão, via socket.io-client |
| Performance | Lighthouse (mediana de 3 medições) Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90 em início e detalhe, mobile e desktop |
| Acessibilidade | Navegação por teclado, foco visível, foco controlado em diálogos e drawers, erros associados aos campos |
| Qualidade | Tipagem estrita, lint e testes passando no CI |

## Fora de escopo
- Integração real com blockchain, extensões de carteira e gateways de pagamento.
- Páginas editoriais, suporte, atividade, ofertas e downloads.
- Ações auxiliares fora do escopo não devem aparentar sucesso funcional.
- Backend real: toda a API é simulada pela camada de rede (MSW).

## Requisitos principais

### Descoberta
- Início com destaques, catálogo, busca, filtros combináveis, ordenação e paginação.
- Busca, filtros, ordenação e página vivem na URL e sobrevivem a refresh e ao histórico. Mudar filtro reinicia a paginação.
- Tratamento de resultado vazio, falha e respostas fora de ordem.
- Detalhe do NFT com galeria, informações, edição, quantidade, favoritos e compra; acesso direto, NFT inexistente, edição indisponível e limite de quantidade.

### Carrinho
- Adicionar, alterar e remover itens respeitando a disponibilidade por NFT e edição.
- Persiste após refresh; itens do visitante são preservados ao autenticar.
- Cupom aplicável e removível, com erro para código inválido ou expirado.
- Resumo com subtotal, desconto, taxa de rede e total conforme a resposta da API.
- Reflete mudanças de preço e disponibilidade recebidas em tempo real.
- Valores em ETH são strings decimais, sem perda de precisão. Quantidades são inteiras.

### Pagamento e confirmação
- Dados do colecionador, seleção de carteira e rede, revisão e envio.
- Simulação de conexão, recusa e desconexão da carteira.
- Revalidação de preço, disponibilidade, cupom e taxas antes de confirmar; mudanças exigem nova confirmação.
- Pedido idempotente: sem duplicidade em cliques repetidos ou reenvio após timeout.
- Estados do pedido: pendente, confirmado e recusado (terminais: confirmado e recusado), com recuperação após refresh ou reconexão.
- Confirmação exibida somente para pedido realmente confirmado.
- Falhas preservam o carrinho; após confirmação, remove apenas itens e quantidades comprados.
- Recibo é snapshot imutável do pedido.

### Conta e sessão
- Cadastro (com tratamento de conflito), login (com retorno ao fluxo anterior), logout e sessão recuperável após refresh.
- Expiração de sessão durante navegação e checkout, preservando contexto para retomada.
- Logout e troca de usuário limpam cache privado e subscriptions.
- Perfil (dados, avatar, senha) e carteiras (principal e secundária) com validação e erros da API.
- Favoritos persistem para o usuário autenticado.
- Credenciais fictícias; senhas nunca em claro.

### Tempo real
- `nft.updated` atualiza preço e disponibilidade no catálogo, detalhe e carrinho.
- `order.updated` atualiza o pedido e apresenta confirmação ou recusa.
- Eventos têm identidade estável, recurso afetado e versão; duplicatas e eventos antigos são ignorados.
- Após reconexão, reconcilia recursos ativos com a REST.
- Eventos de sessão anterior nunca atualizam outro usuário.

### Mocking e cenários
- MSW na camada de rede para REST e Socket.IO (`@mswjs/socket.io-binding`), sem respostas fictícias em componentes, hooks ou Axios.
- Cenários determinísticos e configuráveis: sucesso, vazio, latência variável, fora de ordem, falha de conexão, 4xx/5xx, sessão expirada, conflito de cadastro, cupom inválido, preço alterado, edição esgotada, timeout após criação do pedido, pagamento confirmado e recusado.
- Pelo menos dois usuários e fixtures variadas para filtros e paginação.
- Reset restaura um cenário conhecido. Mocks disponíveis no build de demonstração.

### Interface e acessibilidade
- Desktop, tablet e mobile (390, 768 e 1440 px), sem overflow horizontal.
- Skeletons com shimmer em catálogo, detalhe e resumo do carrinho, sem deslocamento de layout e respeitando `prefers-reduced-motion`.
- Perfil, carteiras e confirmação funcionam em mobile mesmo sem frame no Figma.

### Entrega
- Repositório com código, lockfile, assets, mocks, fixtures, testes e configuração do Lighthouse.
- Deploy público (Vercel recomendado) com refresh e acesso direto funcionando.
- `README.md` e `ARCHITECTURE.md` conforme o enunciado.
- Relatório HTML do Playwright e traces das falhas; relatórios Lighthouse HTML/JSON com versões e ambiente.
