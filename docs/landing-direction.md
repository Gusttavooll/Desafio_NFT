# Landing KRONOS — direção e escopo

Alvo: MIV existente em `docs/design.md` e `kronos-design-system.html`. Usuário confirmou KRONOS, não Building Cap. Não importamos promessas nem roteiro do outro produto.

## Reference lock

Fundação dominante: KRONOS + estrutura técnica de mostlikely (https://mostlikely.at). Preservar campo mineral, linhas estruturais, tipografia condensada monumental, dados mono, molduras sem raio e cobalto exclusivamente em CTA/foco.

Emprestar de Gamma (https://www.gamma.io) somente a escala e protagonismo da arte. Emprestar de A24 (https://a24films.com) a hierarquia de cartaz. Rarible (https://refero.design/pages/34339ded-5d56-4029-a0a2-bd207eb6f619) orienta filtros, resultados e cartões de catálogo. Não importar paletas, fontes, pills ou glow desses sites.

| Decisão | Fonte | Papel |
|---|---|---|
| Hero texto + obra, CTA explorar | docs/design.md | Entrada na coleção |
| Grafite, papel e cobalto | MIV KRONOS | Estrutura neutra e ação destacada |
| Tipografia de cartaz | MIV + A24 | Hierarquia, sem trocas decorativas de fonte |
| Grade filtrável + URL | PRD + Rarible | Descoberta, refresh e histórico |
| Arte local em moldura chanfrada | MIV + Gamma | Cor pertence à obra |
| Rótulo de demonstração | PRD/estado do main | Não apresentar simulação como mercado ativo |

Mídia: seis JPGs locais preexistentes em `nft-marketplace-challenge/public/assets`, reutilizados como obras demonstrativas do mesmo KRONOS; geração/origem anterior não foi reverificada. Não são evidência de NFTs cunhados ou de autoria comercial. Fontes locais OFL da fundação. Não foi necessário chamar Gemini, ler chave ou gerar imagens.

Implementação inicial em `codex/catalog-landing`, consolidada com as quatro fundações a pedido do usuário. A integração preserva a sessão do Header e os tokens globais do design system.

O catálogo usa MSW → Axios → TanStack Query → UI. A integração passa a consumir as 26 obras e os cenários do núcleo compartilhado, sem manter um segundo catálogo privado. As seis artes do estudo inicial ficam preservadas em assets; as imagens da consulta vêm do contrato NftDto. Listagem usa ListNftsResponse e parâmetros search/collectionId/sort/page/pageSize; detalhe mantém edições e versão, com preços validados sem conversão para number. Filtros usam as coleções retornadas e ordenações recentes/preço/em alta. Escopo: landing, descoberta e inspeção; favoritos, seleção para compra e checkout completos continuam nas features dos respectivos responsáveis.
