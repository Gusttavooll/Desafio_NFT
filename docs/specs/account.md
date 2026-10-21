# Spec: Conta e Sessão

Contexto: Conta e Sessão (`account`) · Dono: @Gusttavooll · Branch: `feat/account-realtime` · Depende de: Simulação (`mocks/core`, cenários), shared kernel (`ApiError`, `scopedQueryKey`)

## Problema
O marketplace precisa diferenciar Visitante e Colecionador. Sem uma Sessão confiável, o Colecionador perde o contexto ao dar refresh, é deslogado no meio do Checkout sem conseguir retomar e pode ver dados (Favoritos, Pedidos, Carteiras, Perfil) de outro usuário que usou o mesmo navegador. O Avaliador do desafio precisa comprovar cadastro com conflito, login com retorno ao fluxo anterior, expiração de Sessão e isolamento entre usuários, tudo com credenciais fictícias e sem senha em claro.

## Solução
Um contexto Conta e Sessão que oferece cadastro, login, logout e uma Sessão recuperável após refresh. A Sessão expõe a identidade do usuário atual (Visitante ou Colecionador) para todos os contextos, que a usam nas query keys. Quando a API responde `session_expired`, o usuário é levado ao login preservando a rota e o contexto do Checkout e, após autenticar, volta exatamente onde estava. Logout e troca de usuário limpam todo o cache privado e encerram as subscriptions de Tempo real. O Perfil permite editar dados, avatar e senha, mostrando os erros da API associados aos campos. Login e cadastro abrem como modal sobre a página no desktop e como tela inteira no mobile (estrutura de `docs/design.md`).

## Histórias de usuário
1. Como Visitante, quero criar uma conta com nome de exibição, nome de usuário, e-mail e senha, para me tornar Colecionador e finalizar compras.
2. Como Visitante, quero ver um erro claro no campo quando o e-mail ou nome de usuário já estiver em uso, para corrigir sem perder o restante do formulário.
3. Como Visitante, quero ver erros de validação associados a cada campo do cadastro, para saber exatamente o que corrigir.
4. Como Visitante, quero que a senha seja validada (tamanho mínimo e confirmação), para não criar uma conta com senha inválida.
5. Como Visitante, quero entrar com e-mail e senha, para acessar Favoritos, Checkout, Pedidos, Perfil e Carteiras.
6. Como Visitante, quero ver uma mensagem genérica quando as credenciais estiverem erradas, para não revelar se o e-mail existe.
7. Como Visitante, quero mostrar e ocultar a senha no campo, para conferir o que digitei.
8. Como Visitante, quero alternar entre "Entrar" e "Criar conta" no mesmo modal, para não precisar navegar.
9. Como Visitante no desktop, quero que login e cadastro abram como modal sobre a página atual, para não perder o que estava vendo.
10. Como Visitante no mobile, quero que login e cadastro ocupem a tela inteira, para preencher com conforto.
11. Como Visitante, quero que o foco vá para o primeiro campo ao abrir o modal, fique preso nele e volte ao gatilho ao fechar, para navegar só com teclado.
12. Como Visitante, quero fechar o modal com Esc ou pelo botão fechar, para desistir do login.
13. Como Visitante, quero ser enviado ao login quando tento finalizar a compra, favoritar ou acessar Perfil, Pedidos ou Carteiras, para que o sistema me peça autenticação só quando necessário.
14. Como Visitante, quero voltar à página e ao passo em que estava após entrar, para continuar o fluxo sem recomeçar.
15. Como Visitante, quero que os itens do meu Carrinho sejam preservados ao entrar, para não perder o que escolhi.
16. Como Colecionador, quero que minha Sessão continue ativa após dar refresh, para não precisar entrar de novo.
17. Como Colecionador, quero que a Sessão seja recuperada antes de a página mostrar conteúdo privado, para não ver um "deslogado" piscando.
18. Como Colecionador, quero ser avisado quando minha Sessão expirar durante a navegação, para entender por que preciso entrar de novo.
19. Como Colecionador, quero que a expiração durante o Checkout preserve os dados preenchidos, a Carteira e a Rede escolhidas, para retomar após entrar.
20. Como Colecionador, quero voltar à mesma rota após reautenticar por expiração, para continuar de onde parei.
21. Como Colecionador, quero que várias requisições que falham por expiração ao mesmo tempo gerem um único pedido de login, para não ver vários avisos.
22. Como Colecionador, quero sair da conta, para proteger meus dados em um computador compartilhado.
23. Como Colecionador, quero que, ao sair, Favoritos, Pedidos, Carteiras, Perfil e Carrinho do usuário deixem de aparecer imediatamente, para que ninguém veja meus dados.
24. Como Colecionador, quero que, ao sair, as atualizações em tempo real da minha Sessão sejam encerradas, para que eventos meus não cheguem a quem usar o navegador depois.
25. Como Colecionador, quero que, ao entrar com outro usuário no mesmo navegador, nenhum dado do anterior apareça, para garantir isolamento.
26. Como Colecionador, quero ver o estado autenticado no header (minha conta em vez de "Entrar"), para saber que estou logado.
27. Como Colecionador, quero consultar meus dados de Perfil (nome de exibição, nome de usuário, e-mail, nome ENS, apelido da carteira, avatar), para conferir o que está cadastrado.
28. Como Colecionador, quero editar meus dados de Perfil e salvar, para mantê-los atualizados.
29. Como Colecionador, quero ver erros da API associados aos campos do Perfil (por exemplo, nome de usuário em uso), para corrigir.
30. Como Colecionador, quero alterar meu avatar e removê-lo, para personalizar minha conta.
31. Como Colecionador, quero ver erro quando o avatar tiver formato ou tamanho inválido, para escolher outra imagem.
32. Como Colecionador, quero alterar minha senha informando a atual, a nova e a confirmação, para manter a conta segura.
33. Como Colecionador, quero ver erro quando a senha atual estiver errada ou a confirmação não bater, para corrigir.
34. Como Colecionador, quero que o botão Salvar fique indisponível enquanto envia, para não enviar duas vezes.
35. Como Colecionador, quero navegar entre Dados do perfil e Carteiras pela sidebar "Meu perfil", para gerenciar a conta em um só lugar.
36. Como Colecionador, quero que itens da sidebar fora do escopo (Atividade, Ofertas, Arquivos baixados, Suporte) não aparentem funcionar, para não ser enganado.
37. Como Colecionador no mobile, quero usar Perfil em 390 px com a sidebar virando menu no topo, para gerenciar a conta no celular.
38. Como Visitante, quero que login social e "Esqueceu a senha?" fiquem claramente indisponíveis, para não esperar algo que não existe.
39. Como Avaliador do desafio, quero usar pelo menos dois usuários fictícios documentados, para testar isolamento e troca de usuário.
40. Como Avaliador do desafio, quero que nenhuma senha apareça em claro no armazenamento, nos logs ou nas respostas da API, para comprovar o requisito de segurança.
41. Como Avaliador do desafio, quero ativar o Cenário de Sessão expirada, para verificar a retomada do fluxo.
42. Como Avaliador do desafio, quero ativar o Cenário de conflito de cadastro, para verificar o tratamento de erro.
43. Como Avaliador do desafio, quero que falhas transitórias (`unavailable`) no login mostrem mensagem de tentar novamente sem perder o formulário, para verificar resiliência.
44. Como Colecionador, quero que rotas privadas acessadas diretamente pela URL sem Sessão me levem ao login e depois de volta, para que links diretos funcionem.

## Decisões de implementação
- **Módulos**: domínio da Conta (regras puras de validação de cadastro, Perfil e senha; modelo de Sessão: Visitante ou Colecionador), aplicação (hooks de consulta e mutations de sessão, cadastro, login, logout, Perfil, avatar e senha; orquestração de expiração e retomada), infraestrutura (chamadas REST de auth e Perfil, armazenamento do token, mapeadores DTO → domínio) e UI (modal/tela de login e cadastro, página de Perfil).
- **API pública do contexto (index.ts)**, consumida por todos os outros:
  - `useSession()`: retorna o estado atual da Sessão (carregando, Visitante ou Colecionador com id e dados básicos) e o id do usuário usado em `scopedQueryKey`.
  - Ações `login`, `logout` e `register`, e um modo de exigir autenticação (`requireCollector`) que abre o login guardando a rota de retorno.
  - Um evento/gancho de ciclo de vida "sessão encerrada/trocada", que o Tempo real e outros contextos usam para liberar recursos.
- **Contratos REST** (de `docs/architecture.md`): `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout`, `GET /me`, `PATCH /me`, `PUT /me/avatar`, `POST /me/password`. Erros pelo envelope `ApiError`: `validation_error` (422, com `details` por campo), `session_expired` (401), conflito de cadastro (409, com `details` indicando o campo), `unavailable` (503).
- **Token de Sessão**: guardado no navegador para sobreviver ao refresh e enviado pelo cliente HTTP em toda requisição. Formato do token e hash da senha na simulação são decisão pendente (item 5 de `docs/architecture.md`) e viram ADR.
- **Senha**: nunca guardada nem registrada em claro no cliente; a simulação armazena apenas o hash.
- **Recuperação após refresh**: ao iniciar, a aplicação consulta `GET /auth/session` antes de renderizar conteúdo privado; enquanto carrega, as rotas privadas mostram skeleton.
- **Expiração**: o interceptor do cliente HTTP trata `session_expired`, deduplica requisições concorrentes, marca a Sessão como expirada e abre o login com a rota atual como retorno. O contexto do Checkout é preservado pelo contexto Pedidos (ele guarda seu estado); a Conta só garante o retorno à rota.
- **Guardas de rota**: rotas privadas (Perfil, Carteiras, Checkout) checam a Sessão no carregamento do Router e redirecionam ao login com parâmetro de retorno validado (apenas rotas internas).
- **Logout e troca de usuário**: chamam `POST /auth/logout`, apagam o token, limpam todo o cache do Query client e emitem "sessão encerrada", que encerra o socket. Login com outro usuário faz a mesma limpeza antes de carregar os dados novos.
- **Mesclagem do Carrinho ao autenticar**: a Conta emite "sessão iniciada"; o contexto Carrinho é dono da mesclagem dos itens do Visitante.
- **Isolamento**: toda query key de dado privado usa `scopedQueryKey` com o id do Colecionador; o Visitante usa o escopo `guest`.
- **UI**: login e cadastro são uma rota (`/login`, `/register`) renderizada como modal (Dialog) sobre a página anterior no desktop e como tela inteira no mobile; Perfil usa o `AccountLayout` compartilhado. Erros associados aos campos via atributos de acessibilidade.
- **Fora do escopo visível**: login social, "Esqueceu a senha?" e itens da sidebar fora do escopo são renderizados como desabilitados.

## Decisões de teste
- Um bom teste verifica só comportamento externo: o que o usuário vê e faz, ou a saída de uma regra pura. Nada de testar estado interno, hooks isolados ou chamadas a mocks.
- **Domínio puro (Vitest)**: validação de cadastro e Perfil (campos obrigatórios, e-mail, nome de usuário, senha e confirmação) e o modelo de Sessão (Visitante vs Colecionador, validação da rota de retorno para aceitar só rotas internas).
- **Navegador (Playwright + MSW)**, cada teste com Cenário definido e reset antes de começar:
  - cadastro com sucesso e com conflito; validação por campo;
  - login com sucesso, credenciais inválidas e falha `unavailable`;
  - retorno ao fluxo anterior após login (detalhe do NFT, Carrinho, Checkout);
  - Sessão recuperada após refresh;
  - logout limpa dados privados; troca entre os dois usuários sem vazamento de Favoritos, Pedidos e Perfil;
  - Perfil: editar dados, erro da API por campo, avatar, alteração de senha com erro de senha atual;
  - acessibilidade do modal: foco inicial, foco preso, Esc e retorno do foco; modal no desktop e tela inteira no mobile.
- **Controle dos mocks**: trocar para o Cenário de Sessão expirada no meio do teste (inclusive durante o Checkout) para verificar retomada e preservação de contexto; verificar que, após logout, eventos emitidos para a Sessão anterior não chegam à página.
- **Prior art**: testes do shared kernel com Vitest (`EthAmount`, `DomainEvent`, `scopedQueryKey`).

## Fora de escopo
- Login social (Google, Facebook) e recuperação de senha.
- Verificação de e-mail, autenticação em dois fatores e exclusão de conta.
- Atividade, Ofertas, Arquivos baixados e Suporte na sidebar "Meu perfil".
- Backend real: toda a API é simulada pelo MSW.
- Carteiras (contexto próprio, embora usem o mesmo `AccountLayout`).

## Notas
- Pendente de ADR: formato do token de Sessão e hash da senha na simulação (Web Crypto sugerido).
- A preservação do estado do Checkout após expiração exige acordo com o contexto Pedidos: ele guarda o estado do formulário; a Conta garante a rota de retorno.
- A mesclagem do Carrinho do Visitante é do contexto Carrinho, disparada pelo evento "sessão iniciada" da Conta.
- O encerramento do socket no logout é executado pelo Tempo real ao ouvir "sessão encerrada".
