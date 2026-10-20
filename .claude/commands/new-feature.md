---
description: Fluxo spec → plano → testes → código para uma feature
argument-hint: <nome da feature>
---
Feature: $ARGUMENTS

1. Crie `docs/specs/$ARGUMENTS.md` com: objetivo, regras de negócio, casos de borda, critérios de aceite.
2. Pare e peça revisão da spec.
3. Após aprovação, gere o plano de tarefas e espere novo OK.
4. Implemente com TDD, uma tarefa por vez, rodando testes e lint a cada passo.
5. Se uma decisão de arquitetura for tomada, rode `/adr`.
