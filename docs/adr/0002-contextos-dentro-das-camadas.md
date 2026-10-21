# 0002. Organizar cada camada por bounded context para trabalho em paralelo

- Status: aceito
- Data: 2026-10-21

## Contexto
Quatro pessoas vão desenvolver o marketplace ao mesmo tempo. Com a estrutura apenas por camada (`src/domain`, `src/application`, ...), todo mundo editaria as mesmas pastas e os mesmos arquivos agregadores (handlers do MSW, rotas, query client), gerando conflitos de merge e acoplamento entre contextos.

## Decisão
1. Manter as camadas de `docs/architecture.md` (domain → application → infrastructure → ui) e criar, dentro de cada uma, uma subpasta por bounded context do `docs/glossary.md`, com o nome em inglês:
   `catalog` (Catálogo e Favoritos), `cart` (Carrinho e Cotação), `orders` (Pedidos), `account` (Conta e Sessão), `wallets` (Carteiras), `realtime` (Tempo real). A Simulação fica em `src/mocks/<contexto>` e `src/mocks/core`.
2. `shared/` (em domain e application) é o shared kernel: tipos e regras usados por mais de um contexto (`EthAmount`, `DomainEvent`, envelope de erro, query keys).
3. Cada pasta de contexto expõe sua API pública em `index.ts`. Outro contexto só importa pelo `index.ts`, nunca arquivos internos.
4. Arquivos agregadores são escritos uma vez e não mudam no dia a dia: `src/mocks/handlers.ts` já importa os handlers de todos os contextos; cada arquivo de `src/routes` só delega para a página em `src/ui/<contexto>`.
5. As regras de import são verificadas pelo ESLint (`no-restricted-imports`) e a posse das pastas é definida em `.github/CODEOWNERS`.
6. Testes unitários de domínio rodam com Vitest (`*.test.ts` ao lado do código); E2E ficam em `tests/e2e/<contexto>`.

## Alternativas consideradas
- Pastas por feature no topo (`src/features/catalog/{domain,ui,...}`): desfaria a estrutura de `docs/architecture.md` e espalharia a regra de camadas em dezenas de pastas.
- Manter só camadas e dividir por arquivo: sem fronteira verificável e com conflitos frequentes.
- Monorepo com pacotes por contexto: custo de build e configuração desproporcional ao tamanho do desafio.

## Consequências
- Cada dev trabalha quase só nas suas pastas; conflitos ficam restritos ao shared kernel, a `package*.json` e a rotas novas, que exigem PR próprio.
- Mudar um contrato compartilhado exige PR em `shared/` revisado por mais de uma pessoa.
- Nova dependência de desenvolvimento: Vitest.
