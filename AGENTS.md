# AGENTS.md

Este projeto usa `CLAUDE.md` como fonte principal de instruções.
Qualquer agente de IA deve ler `CLAUDE.md`, `docs/glossary.md` e `docs/adr/` antes de editar código.

Resumo mínimo:
- Comandos: ver seção "Comandos" do `CLAUDE.md`.
- Testes e lint devem passar antes de qualquer entrega.
- Respeitar a linguagem ubíqua do domínio e os ADRs.

## Trabalho em paralelo por bounded context
Quatro devs trabalham ao mesmo tempo, cada um dono de contextos (ADR 0002). A tabela de donos, pastas, rotas e branches está em `CONTRIBUTING.md`; a posse formal, em `.github/CODEOWNERS`.

- Descubra o contexto da tarefa pela branch atual (`feat/catalog`, `feat/cart`, `feat/orders-wallets`, `feat/account-realtime` e derivadas) e edite só `src/*/<contexto>/`, `src/mocks/<contexto>/` e `tests/e2e/<contexto>/`.
- Outro contexto só via `index.ts` (`@/<camada>/<contexto>`). Se precisar de algo que ele ainda não exporta, pare e avise; não edite a pasta do outro dev.
- `domain/shared`, `application/shared`, `mocks/core`, `ui/components`, `package*.json`, rotas novas e ADRs exigem PR próprio: não misture com a feature.
- Antes de entregar, rode o agente `context-guard` para checar se o diff respeita a divisão.

## Design
- **Não é preciso ser pixel-perfect.** Siga a estrutura (telas, seções, ordem, campos e componentes) e o comportamento responsivo; medidas e espaçamentos exatos não importam.
- Estrutura das telas está em `docs/design.md`.
- Estilização vem do design system Kronos (`kronos-design-system.html`, resumido em `docs/design.md`), aplicado como tokens no `src/index.css`. Nunca invente cores, fontes ou medidas fora dos tokens; use `ui/components`, `ui/layout` e as classes dos tokens.
