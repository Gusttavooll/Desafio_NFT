# 0003. Persistir o estado simulado no localStorage com chave versionada

- Status: aceito
- Data: 2026-10-21

## Contexto
A Simulação (MSW) precisa de um estado único, partilhado entre REST e Eventos, que sobreviva ao refresh (Carrinho, Sessão, Favoritos, Carteiras, Pedido pendente) e que possa voltar a um estado conhecido para os testes. Resolve a pendência 4 de `docs/architecture.md`.

## Decisão
1. O estado (`SimState`) e o Cenário atual são gravados juntos no `localStorage`, sob a chave `nft-simulation:v1`. O número da versão faz parte da chave: ao mudar o formato do estado, sobe-se a versão, o dado antigo é ignorado e as Fixtures são recarregadas.
2. A ordem de resolução do Cenário é: parâmetro de URL `?scenario=`, depois o Cenário persistido, depois `success`.
3. O `reset` recria o estado a partir das Fixtures (encerrando Sessões e apagando Pedidos) e mantém o Cenário atual, a menos que outro seja informado.
4. JSON corrompido, armazenamento indisponível ou cheio não derrubam a simulação: ela segue só em memória.
5. A Versão de cada recurso (`nft:<id>`, `order:<id>`) vive no próprio estado, para a REST e os Eventos devolverem a mesma Versão.
6. A persistência é por navegador. Não há compartilhamento entre dispositivos.

## Alternativas consideradas
- `sessionStorage`: perde o estado ao fechar a aba, o que atrapalha a demonstração publicada.
- IndexedDB: assíncrono e mais pesado do que o volume de dados exige.
- Só memória: o refresh perderia Carrinho, Sessão e Pedido pendente, que a spec exige preservar.

## Consequências
- Mudar o formato de `SimState` exige subir a versão da chave.
- Testes unitários usam um armazenamento injetável; os E2E começam sempre com `reset` e Cenário explícito.
