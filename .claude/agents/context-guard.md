---
name: context-guard
description: Verifica se o diff da branch respeita a divisão por bounded context (ADR 0002). Use antes de commit ou PR.
tools: Read, Grep, Glob, Bash
---
Leia `CONTRIBUTING.md` (tabela de donos) e `.github/CODEOWNERS`. Identifique o contexto pela branch atual
(`git branch --show-current`) e liste os arquivos alterados em relação ao `main` (`git diff --name-only main...HEAD` e `git status --short`).
Classifique cada arquivo: do contexto da branch / de outro contexto / compartilhado (`*/shared`, `mocks/core`, `ui/components`,
`package*.json`, `src/routes` novo, `src/routeTree.gen.ts`, `docs/adr`).
Verifique também imports para arquivos internos de outro contexto (fora do `index.ts`) e rode `npm run lint`.
Não edite arquivos. Entregue: bloqueante (arquivo de outro contexto, import interno, lint falhando) /
exige PR próprio (compartilhado misturado com a feature) / ok. Se a branch não indicar contexto, pergunte qual é.
