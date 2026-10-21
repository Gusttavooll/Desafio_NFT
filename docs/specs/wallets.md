# Spec: Carteiras

Contexto: Carteiras (`wallets`) · Dono: @Samuel-Kepler · Branch: `feat/orders-wallets` · Depende de: Conta e Sessão (`useSession`, `AccountLayout` compartilhado com o Perfil), Simulação (fixtures de carteiras e cenários de erro)

## Problema
Para pagar no Checkout, o Colecionador precisa ter Carteiras cadastradas e saber qual delas é usada por padrão. Hoje não há onde cadastrar ou editar uma Carteira. Sem validação, um endereço inválido ou uma Rede errada só seriam descobertos no pagamento. Os erros da API (validação, sessão expirada, falha transitória) precisam ser mostrados sem perder o que o Colecionador digitou.

## Solução
Uma página de Carteiras dentro do `AccountLayout`, a mesma sidebar "Meu perfil" do Perfil. Nela o Colecionador:
- cadastra e edita a Carteira principal, que é a padrão no Checkout;
- opcionalmente cadastra uma Carteira secundária, ou marca que ela é igual à principal.

O formulário valida no cliente, exibe os erros da API ligados aos campos e preserva os dados em caso de falha. O contexto expõe as Carteiras do Colecionador para o Checkout escolher entre principal e secundária.

## Histórias de usuário
1. Como Visitante, quero ser levado ao login ao abrir a página de Carteiras, para ver só as minhas Carteiras depois de autenticar.
2. Como Visitante, quero voltar à página de Carteiras logo após o login, para continuar o que eu ia fazer.
3. Como Colecionador, quero acessar Carteiras pela sidebar "Meu perfil", para encontrar a gestão de Carteiras junto do Perfil.
4. Como Colecionador, quero ver o item "Carteiras" marcado como ativo na sidebar, para saber em que seção estou.
5. Como Colecionador, quero ver uma explicação de que as Carteiras ficam disponíveis no pagamento e para receber NFTs, para entender a finalidade.
6. Como Colecionador sem Carteira, quero ver um estado vazio com a ação "Adicionar", para cadastrar minha primeira Carteira.
7. Como Colecionador, quero cadastrar a Carteira principal com nome de exibição, apelido, Rede, nome do perfil, endereço, tipo de carteira, e-mail e nome ENS, para usá-la no pagamento.
8. Como Colecionador, quero escolher a Rede em uma lista (por exemplo Ethereum ou Polygon), para não digitar um valor inválido.
9. Como Colecionador, quero escolher o tipo de carteira (MetaMask, Coinbase Wallet, WalletConnect), para indicar como vou conectar no Checkout.
10. Como Colecionador, quero que o endereço seja validado no formato 0x com 40 caracteres hexadecimais, para não cadastrar um endereço impossível.
11. Como Colecionador, quero que o nome ENS seja validado com o sufixo .eth, para não cadastrar um nome inválido.
12. Como Colecionador, quero que o e-mail seja validado, para receber comunicações corretamente.
13. Como Colecionador, quero ver os campos obrigatórios marcados, para saber o que preciso preencher.
14. Como Colecionador, quero ver cada erro junto do campo, ligado a ele para leitores de tela, para corrigir rapidamente.
15. Como Colecionador, quero que o foco vá para o primeiro campo inválido ao salvar, para não procurar o erro.
16. Como Colecionador, quero ver os erros de validação da API (`validation_error`) nos campos correspondentes, para entender o que o servidor rejeitou.
17. Como Colecionador, quero que o botão "Salvar carteira" mostre progresso e evite envio duplo, para não criar Carteiras repetidas.
18. Como Colecionador, quero uma confirmação visível quando a Carteira for salva, para ter certeza de que deu certo.
19. Como Colecionador, quero editar a Carteira principal já cadastrada com os dados pré-preenchidos, para corrigir uma informação.
20. Como Colecionador, quero que uma falha de rede ou um erro 5xx ao salvar preserve o que digitei e permita tentar de novo, para não perder o trabalho.
21. Como Colecionador, quero que a sessão expirada ao salvar me leve ao login e me devolva à página com os dados preservados, para retomar a edição.
22. Como Colecionador, quero adicionar uma Carteira secundária, para ter uma alternativa no pagamento.
23. Como Colecionador, quero ver "Você ainda não adicionou uma carteira secundária" quando não houver uma, para saber o estado atual.
24. Como Colecionador, quero marcar "Igual à carteira principal", para não repetir os mesmos dados na secundária.
25. Como Colecionador, quero editar a Carteira secundária, para manter os dados atualizados.
26. Como Colecionador, quero que só exista uma Carteira principal por vez, para que o Checkout saiba qual usar por padrão.
27. Como Colecionador, quero que a Carteira principal venha selecionada no Checkout, para pagar com menos passos.
28. Como Colecionador, quero poder escolher a Carteira secundária no Checkout, para pagar com outra Carteira.
29. Como Colecionador, quero que uma Carteira cadastrada ou editada apareça imediatamente no Checkout, para não precisar recarregar a página.
30. Como Colecionador, quero que outro Colecionador no mesmo navegador nunca veja minhas Carteiras, para manter minha privacidade.
31. Como Colecionador, quero que minhas Carteiras saiam do cache ao fazer logout, para que ninguém as veja depois.
32. Como Colecionador, quero ver skeletons enquanto as Carteiras carregam, sem deslocamento de layout, para uma experiência estável.
33. Como Colecionador, quero usar a página em 390, 768 e 1440 px sem overflow horizontal, com a sidebar virando um menu no topo no mobile, para gerenciar Carteiras em qualquer dispositivo.
34. Como Colecionador, quero navegar e salvar o formulário só pelo teclado, com foco visível, para ter acessibilidade completa.
35. Como Colecionador, quero que os itens da sidebar fora do escopo (Atividade, Ofertas, Arquivos baixados, Suporte) não aparentem funcionar, para não ser enganado.
36. Como Avaliador do desafio, quero que as fixtures tenham pelo menos um Colecionador com Carteira principal e secundária e outro sem Carteira, para verificar os dois estados.
37. Como Avaliador do desafio, quero selecionar cenários de erro de validação, sessão expirada e falha transitória ao salvar, para comprovar o tratamento de erros da API.
38. Como Avaliador do desafio, quero ver as Carteiras persistirem após refresh, para comprovar que vêm da API simulada.

## Decisões de implementação
- **Módulos do contexto:**
  - **Domínio:** tipos `Wallet`, `PrimaryWallet`, `Network` e tipo de carteira, mais as regras de validação de endereço, ENS e campos obrigatórios, e a regra de unicidade da Carteira principal.
  - **Aplicação:** consulta das Carteiras do Colecionador e mutations de cadastro e atualização.
  - **Infraestrutura:** cliente REST e mapeadores DTO → domínio.
  - **UI:** página de Carteiras com os formulários de Carteira principal e secundária.
- **API pública do contexto (index):**
  - tipos `Wallet`, `PrimaryWallet` e `Network`;
  - hook de consulta das Carteiras, que devolve a principal e a secundária;
  - query keys criadas com `scopedQueryKey`, incluindo o id do Colecionador.

  É consumida pelo Checkout no contexto Pedidos. A `WalletConnection` (conectada, recusada, desconectada) é um estado do Checkout e pertence ao contexto Pedidos; Carteiras só fornece os dados cadastrados.
- **Contratos REST** (conforme `docs/architecture.md`):
  - `GET /wallets`, `POST /wallets` e `PATCH /wallets/:id`.
  - O corpo indica se a Carteira é principal ou secundária e se a secundária é igual à principal.
  - Erros usam o envelope único: `validation_error` com `details` por campo, `session_expired`, `not_found` e `unavailable`.
- **Fonte de verdade e invalidação:** o servidor é a fonte de verdade. Depois de salvar, as queries de Carteiras são invalidadas, e o Checkout reflete a mudança. Não há atualização otimista: a Carteira só aparece como salva depois que a API confirma.
- **Validação nos dois lados:** a validação do cliente evita idas desnecessárias à API, mas os erros da API sempre têm prioridade e são mapeados para os campos.
- **Layout:**
  - O `AccountLayout` compartilhado, com a sidebar "Meu perfil", vem da Fase 0, em `ui/layout`. Carteiras e Perfil apenas o usam.
  - A estrutura segue `docs/design.md`: Carteira principal com o formulário e "Salvar carteira", e Carteira secundária com o estado vazio, "Igual à carteira principal" e "Adicionar".
  - O estilo vem dos tokens (skill `ui-ux-pro-max`).
- **Guard de rota:** exige Sessão. Sem Sessão, leva ao login guardando o retorno, usando o mecanismo de retomada do contexto Conta e Sessão.

## Decisões de teste
- **O que é um bom teste:** valida o comportamento externo (o que o Colecionador vê e o que a API recebe), não detalhes de implementação. Usa os termos do glossário nos nomes dos testes.
- **Seam 1, domínio puro (Vitest):** validação de endereço 0x, ENS e campos obrigatórios; unicidade da Carteira principal; regra de "igual à principal".
- **Seam 2, navegador (Playwright + MSW):**
  - cada teste começa com reset e um Cenário conhecido;
  - cadastrar a Carteira principal e vê-la selecionada no Checkout;
  - adicionar a Carteira secundária e escolhê-la no Checkout;
  - editar e persistir após refresh;
  - erros por campo vindos da API; falha transitória preservando o formulário; sessão expirada com retomada;
  - isolamento entre dois Colecionadores;
  - navegação por teclado; layout em 390 px.
- **Seam 3, controle dos mocks:** trocar o Cenário no meio do teste, por exemplo para fazer o próximo `POST /wallets` responder com `validation_error`, `session_expired` ou `unavailable`.
- **Prior art:** os testes do shared kernel com Vitest, ao lado do código (`EthAmount`, `DomainEvent`, `scopedQueryKey`).

## Fora de escopo
- Conexão real com extensões de carteira, assinatura de mensagens e leitura de saldo on-chain.
- Exclusão de Carteiras: o Figma não tem essa ação.
- Mais de uma Carteira secundária.
- Verificação real de ENS ou de propriedade do endereço.
- Itens da sidebar fora do escopo do PRD: Atividade, Ofertas, Arquivos baixados e Suporte.

## Notas
- O formulário do Figma tem "Código de indicação" obrigatório, sem regra no PRD. Proposta: campo opcional e sem efeito, alinhado com a spec de Pedidos.
- "Nome de exibição", "Nome do perfil" e "E-mail" se repetem entre Perfil, Carteira e Checkout. Vale confirmar com o contexto Conta e Sessão se a Carteira guarda cópias próprias ou referencia o perfil. Proposta: cópias próprias na Carteira, como mostra o Figma.
- A lista de Redes e de tipos de carteira deve vir das fixtures da Simulação, para que Pedidos e Carteiras usem os mesmos valores.
