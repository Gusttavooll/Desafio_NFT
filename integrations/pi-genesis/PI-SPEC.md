# Kronos — lógica dos NFTs de Pi

Especificação proposta em 21/10/2026. Este documento define as regras e o pseudocódigo; não representa funcionalidade integrada nem emissão em blockchain. O desafio existente usa Pedidos, Carteiras e Transações simuladas.

## 1. O que o Colecionador compra

Uma Edição de tiragem **1**, associada a um intervalo exclusivo das casas decimais de Pi e a uma arte gerada por algoritmo versionado. A quantidade por compra é sempre 1 nesta coleção.

O NFT contém duas imagens: o mapa de ruído em escala de cinza e a arte derivada dele. Ambas são reproduzíveis a partir dos dados registrados.

A exclusividade é uma regra do marketplace sobre coordenadas. Não significa propriedade dos dígitos de Pi, exclusividade mundial ou impossibilidade de alguém copiar a imagem. Coordenadas diferentes também não são uma prova matemática de imagens diferentes.

## 2. Convenção das coordenadas

- Armazenar somente os decimais de Pi, sem `3.`, espaços ou quebras de linha.
- A coordenada é baseada em 1: a posição 1 corresponde ao primeiro `1` de `3.14159…`.
- Na versão inicial, cada mapa tem **64 × 64 pixels**.
- Cada pixel consome **3 dígitos**; cada NFT ocupa **12.288 casas decimais**.
- O usuário escolhe qualquer posição inicial inteira válida; não precisa escolher um múltiplo do tamanho do bloco.
- `endExclusive = start + 12288`. O intervalo inclui `start` e termina em `endExclusive - 1`.
- Se a base contém `N` casas, aceitar apenas `1 ≤ start ≤ N - 12288 + 1`.
- Validar inteiros seguros e limitar o tamanho no servidor antes de ler ou alocar imagens.

Exemplo: início **50.000** ocupa as casas **50.000 a 62.287**, inclusive. O próximo intervalo adjacente pode começar em **62.288**.

Intervalos A e B se sobrepõem quando:

```text
A.start < B.endExclusive E B.start < A.endExclusive
```

Portanto, bloquear apenas coordenadas iniciais iguais é insuficiente: começar em 50.001 reutilizaria quase todo o trecho de 50.000.

## 3. Pi → imagem de ruído

Usar uma base de dígitos de Pi previamente validada e somente leitura. Registrar sua origem, quantidade de casas, versão e checksum SHA-256. A versão identifica uma fonte reproduzível; trocar o arquivo não libera coordenadas já vendidas da mesma coleção.

Para cada grupo de três dígitos, interpretar um inteiro `v` de 0 a 999 e calcular:

```text
gray = floor(v × 256 / 1000)
pixel = [gray, gray, gray, 255]
```

Exemplos: `000 → 0`, `141 → 36`, `592 → 151`, `999 → 255`.

Preencher a imagem da esquerda para a direita, de cima para baixo. A conversão não é reversível: vários grupos podem produzir o mesmo cinza. Ela é um mapa visual do trecho, e não uma codificação que preserva todos os dígitos. Não declarar distribuição perfeitamente uniforme ou usar isso como fonte de aleatoriedade de segurança.

```text
generateNoise(start, piDigits):
    length = 64 * 64 * 3
    validar start e quantidade de dígitos disponíveis
    digits = piDigits.slice(start - 1, start - 1 + length)
    exigir que digits tenha exatamente length caracteres, todos de 0 a 9
    pixels = nova matriz RGBA 64 por 64
    para i de 0 até 4095:
        v = inteiro decimal de digits.slice(i * 3, i * 3 + 3)
        gray = floor(v * 256 / 1000)
        pixels[i] = [gray, gray, gray, 255]
    retornar pixels
```

## 4. Ruído → arte final sem API de IA

Proposta inicial: arte abstrata em faixas coloridas, gerada diretamente do mapa de ruído. Não requer modelo de IA nem credenciais; há apenas o custo normal de execução e armazenamento.

Algoritmo `pi-contours-v1`:

1. Aplicar quatro passagens de suavização à matriz de cinza. Cada pixel vira a média inteira de sua vizinhança 3 × 3. Nas bordas, repetir o pixel da borda. Cada passagem lê a matriz anterior e escreve uma nova, para não depender da ordem do loop.
2. Encontrar o menor e o maior cinza da matriz suavizada.
3. Normalizar cada valor com `floor((valor - min) * 255 / (max - min))`. Se `max == min`, usar 0 para todos.
4. Mapear cada valor normalizado a uma das oito cores da paleta fixa abaixo usando `min(7, floor(valor * 8 / 256))`.
5. Ampliar a matriz para 512 × 512, repetindo cada pixel em um bloco 8 × 8, sem interpolação.
6. Exportar PNG, registrar o hash dos pixels RGBA e o hash do arquivo efetivamente armazenado.

Paleta fixa, do índice 0 ao 7: `#101020`, `#24244A`, `#434078`, `#6966A6`, `#9991C7`, `#C2B3DD`, `#E4D3EB`, `#FFF1F5`. Ela é um parâmetro da arte proposta, não uma alteração do design system da interface.

O mapa de ruído influencia diretamente as formas. Mesmos dígitos, parâmetros e versão geram os mesmos pixels. Preservar a implementação antiga ao lançar novas versões. O arquivo PNG pode ter metadados de codificação diferentes, por isso guardar separadamente seu hash e o hash dos pixels.

Gerar um identificador de procedência:

```text
dnaHash = SHA256(UTF8(JSON.stringify([
    "kronos-pi-dna-v1", collectionId, piDatasetChecksum,
    start, 12288, 64, 64, digits, "pi-contours-v1"
])))
```

Usar os campos na ordem acima e números inteiros. O hash vincula os dados de geração; não impede cópias e não prova qualidade artística. O servidor calcula os valores, sem confiar em hashes enviados pelo cliente.

Se futuramente a equipe adotar IA, criar outra versão do gerador e guardar os arquivos finais, modelo, parâmetros e prompt. Não presumir que enviar esse PNG a qualquer API equivale a controlar seu ruído interno, nem prometer reprodução exata sem validar o modelo escolhido.

## 5. Prévia, reserva e compra

```text
Escolher coordenada
    → validar limites
    → consultar sobreposição
    → gerar prévia de ruído e arte
    → adicionar Edição ao Carrinho
    → revalidar Cotação
    → enviar Pedido com Chave de idempotência
    → reservar intervalo atomicamente e criar Pedido pending
    → confirmar ou recusar o Pedido
```

**Ver uma prévia ou adicionar ao Carrinho não reserva nada.** Outra pessoa pode comprar primeiro. A interface avisa essa possibilidade.

A prévia recebe um ID estável associado à coordenada, base e versão. Repetir a prévia da mesma identidade recupera o mesmo registro. Não criar novas Edições compráveis para contornar uma venda anterior.

Na criação do Pedido, dentro de uma única operação atômica:

1. Autenticar o Colecionador e validar quantidade 1, Cotação, identidade da Edição e arquivos prontos.
2. Verificar a Chave de idempotência, escopada ao Colecionador: mesma chave e mesmo conteúdo recuperam o Pedido; conteúdo diferente gera conflito.
3. Verificar se existe qualquer intervalo sobreposto reservado ou vendido na coleção.
4. Se houver, responder `availability_conflict`; não criar outra compra.
5. Criar a reserva vinculada ao Pedido e o Pedido `pending` juntos.
6. Na confirmação, transformar a reserva em venda definitiva, marcar Pedido `confirmed`, salvar proprietário e Recibo imutável na mesma transação.
7. Na recusa, marcar Pedido `rejected` e liberar sua reserva na mesma transação. O Carrinho é preservado.

Estados da ocupação do trecho:

```text
available → reserved → sold
                ↓
             available  (somente após recusa definitiva)
```

`available` significa ausência de reserva/venda ativa sobreposta. `reserved` é indisponível temporariamente; `sold` é esgotado. Para a Edição, Disponibilidade é 1 quando disponível e 0 nos demais estados; retornar também o motivo para a interface.

**Timeout de rede não é recusa.** Manter reserva enquanto o Pedido está `pending`; consultar/reconciliar o mesmo Pedido. Não liberar por um cronômetro isolado enquanto ainda existe uma confirmação possível. No simulador, o cenário deve resolver o Pedido para `confirmed` ou `rejected`. Um estado terminal nunca retorna para `pending`.

Uma venda bloqueia também todas as outras prévias que usam parte do intervalo. A Disponibilidade deve ser calculada a partir das ocupações, e não apenas de um contador do NFT vendido.

## 6. Concorrência e persistência

Um `if (disponivel)` seguido de uma gravação não protege contra duas compras simultâneas. A reserva e o Pedido precisam de transação com garantia de exclusão de intervalos sobrepostos. Usar restrição de intervalo no banco ou serializar as reservas da coleção com bloqueio transacional. A mesma proteção vale para confirmar e liberar reservas.

Também garantir unicidade de `(collectorId, idempotencyKey)` e registrar uma impressão do conteúdo aceito do Pedido. Dois pedidos simultâneos com a mesma chave recuperam um único resultado.

No MSW, implementar um armazenamento simulado central e uma seção crítica sem esperas assíncronas entre verificar e reservar. Isso demonstra a regra dentro daquela instância. Memória de uma aba não garante concorrência entre navegadores nem persistência após refresh; essas garantias exigem armazenamento e coordenação próprios. Não apresentar o mock como banco de produção.

## 7. Dados necessários

| Registro | Campos mínimos |
|---|---|
| Base de Pi | `id`, `version`, `digitCount`, `checksum`, `source` |
| NFT | `id`, `collectionId`, `title`, `start`, `length`, `endExclusive`, `piDatasetId`, `dnaHash`, `generatorVersion`, `width`, `height`, `noiseUrl`, `artUrl`, hashes dos pixels e dos arquivos |
| Edição | `id`, `nftId`, `supply: 1`, `priceEth` como string, `network` |
| Ocupação | `id`, `collectionId`, `start`, `endExclusive`, `status: reserved ou sold`, `orderId`, `collectorId` |
| Pedido | contrato existente, Chave de idempotência, conteúdo aceito e snapshot dos itens |

Proteger as coordenadas dentro da coleção mesmo se a versão do gerador mudar. Se a regra comercial for exclusividade em todo o marketplace, retirar o escopo de coleção da checagem e da restrição; esta proposta adota exclusividade por coleção.

Não expor dados pessoais do comprador na consulta pública de disponibilidade.

## 8. Contratos para implementação

Estas rotas são propostas; ainda não existem por causa deste documento.

| Operação | Entrada | Resultado |
|---|---|---|
| `POST /nfts/pi/preview` | `collectionId`, `start` | NFT/Edição estáveis, imagens, procedência e disponibilidade atual; sem reserva |
| `GET /nfts/:id` | ID existente | Detalhe, ruído, arte e motivo de indisponibilidade |
| `POST /quotes` | contrato existente, Edição e quantidade 1 | Cotação revalidada com disponibilidade atual |
| `POST /orders` | contrato existente + `Idempotency-Key` | Pedido `pending` com reserva ou conflito |
| `GET /orders/:id` | ID, sessão do proprietário | Estado verdadeiro e Recibo quando confirmado |

Reutilizar o envelope de erros existente: `validation_error`, `availability_conflict`, `idempotency_conflict`, `session_expired`, `price_changed` e `unavailable`. A checagem na prévia não substitui a checagem atômica na compra.

Após reservar, confirmar ou liberar, publicar `nft.updated` para os NFTs existentes afetados, usando os contratos e versões do projeto. Publicar `order.updated` ao proprietário conforme o contrato existente. Na reconexão, consultar REST para recuperar o estado atual.

Divisão sugerida: Catálogo implementa geração, identidade e leitura de disponibilidade; Carrinho/Cotação mantém quantidade e Revalidação; Pedidos coordena reserva e transições; Simulação fornece persistência de demonstração e cenários; Tempo real propaga as alterações. Mudanças em contratos compartilhados precisam seguir o fluxo de PR do projeto.

## 9. Comportamento da interface

- Campo de coordenada com intervalo válido e botão de gerar prévia.
- Exibir as casas ocupadas, tamanho da imagem e versão do gerador.
- Mostrar o ruído enquanto a arte é preparada, com opção de alternar as duas imagens depois.
- A animação de sintonia termina quando a imagem está pronta. Não significa compra confirmada.
- Respeitar redução de movimento e fornecer estado estático equivalente.
- Em conflito, manter a coordenada visível e oferecer escolher outro trecho.
- Durante `pending`, mostrar processamento; durante reserva de outro Pedido, indisponibilidade temporária; após venda, esgotado.
- Exibir sucesso de compra exclusivamente após `confirmed`.

## 10. Critérios de aceite

1. Posição 1 lê o primeiro decimal e a última posição válida gera exatamente 12.288 dígitos.
2. Zero, negativos, frações, inteiros inseguros e falta de dígitos falham sem gerar prévia parcial.
3. Mesma entrada e versão reproduzem os mesmos pixels e hashes de pixels.
4. Comprar 50.000 bloqueia 50.001; 62.288 continua válido se não houver outra ocupação.
5. Duas compras simultâneas de trechos sobrepostos produzem no máximo uma reserva ativa.
6. Reenvio com a mesma chave e conteúdo retorna o mesmo Pedido; conteúdo diferente falha.
7. Recusa libera só o intervalo daquele Pedido; confirmação nunca libera o intervalo vendido.
8. Timeout mantém o Pedido recuperável, sem duplicar compra ou liberar reserva prematuramente.
9. Evento repetido ou atrasado não reverte venda nem duplica confirmação.
10. Alterar o preço depois da compra não altera o Recibo nem a arte registrada.
11. Duas coordenadas com imagem visualmente igual continuam sendo coordenadas distintas; não anunciar exclusividade visual garantida.

Com um milhão de casas e blocos de 12.288 casas, cabem **no máximo 81** peças sem sobreposição. A escolha livre de coordenadas pode fragmentar os espaços e reduzir esse total. Se a equipe preferir estoque previsível, pode adotar blocos fixos alinhados, mas isso muda a liberdade de escolha descrita nesta proposta.
