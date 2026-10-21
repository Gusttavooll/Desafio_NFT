# Kronos Pi Genesis — contrato e pacote de emissão

Preparado em 21/10/2026. **Contrato compilado e testado localmente; nenhuma emissão em rede pública.** Não há carteira do usuário configurada. Os arquivos IPFS foram empacotados e verificados localmente, mas ainda não foram publicados ou fixados em um serviço.

## Para você começar

1. Acesse [metamask.io/download](https://metamask.io/download) no Chrome ou Edge, escolha a extensão do navegador e instale pela loja oficial indicada. O navegador interno do Codex pode não ter a extensão.
2. Abra a extensão e siga o fluxo de criar uma carteira. Guarde as credenciais de recuperação conforme as instruções da carteira. Não as envie ao chat.
3. Copie somente o endereço **público da conta Ethereum/EVM**, no formato `0x` seguido de 40 caracteres hexadecimais. Esse endereço será o administrador da coleção e destinatário inicial das três peças.
4. Após configurar o armazenamento das imagens, revisar a rede e a taxa mostrada na carteira, a emissão exige assinatura na sua carteira. Não é necessário fornecer a chave privada ao script ou ao assistente.

Criar uma carteira não emite os NFTs. Ter somente o endereço público também não permite ao assistente assinar em seu nome.

## Rede proposta

| Rede | Finalidade | Chain ID | RPC | Explorador |
|---|---|---|---|---|
| Base | Coleção pública definitiva | 8453 | `https://mainnet.base.org` | [BaseScan](https://basescan.org) |
| Base Sepolia | Ensaio em testnet | 84532 | `https://sepolia.base.org` | [Base Sepolia Scan](https://sepolia.basescan.org) |

Os parâmetros foram conferidos na [documentação oficial da Base](https://docs.base.org/get-started/connect-to-base). As chamadas diretas de conferência aos dois RPCs retornaram erro HTTP neste ambiente; não foi confirmada conectividade para implantação. Ambos usam ETH para taxas, mas ETH de testnet não paga taxas na rede principal. Não há cotação de custo nesta entrega: conferir a taxa atual antes da assinatura. Base Sepolia é um ensaio, não a coleção definitiva.

## O que o contrato garante

- ERC-721 com nome `Kronos Pi Genesis`, símbolo `KPI` e limite imutável de **3 tokens**.
- Cada token usa seu início em Pi como ID: `50000`, `62288` e `74576` no manifesto preparado.
- Cada intervalo ocupa 12.288 casas, dentro da base de 90.000 casas.
- Qualquer sobreposição de intervalos é rejeitada, mesmo que a coordenada inicial seja diferente.
- Um mesmo hash de arquivo de arte não pode ser emitido duas vezes neste contrato.
- Somente as entradas do manifesto fixado na implantação podem ser emitidas. O manifesto compromete coordenada, hash dos dígitos, hash da arte e URI dos metadados.
- Somente o administrador da coleção pode emitir. A transferência de administração usa confirmação do novo administrador.
- O proprietário do token pode transferi-lo conforme ERC-721. Transferir não libera o trecho ocupado.
- Não existe função para trocar imagem, URI, manifesto, base de Pi, aumentar a tiragem, queimar e reemitir, ou atualizar o contrato por proxy.
- A emissão protege contra reentrada e desfaz todas as mudanças se o destinatário recusar o NFT.

O administrador pode renunciar à administração pela função herdada de Ownable. Não fazer isso antes de emitir as peças: depois da renúncia, novas emissões ficam impossíveis. Isso não apaga tokens existentes nem altera seu proprietário.

## Limites da exclusividade

A exclusividade é **deste contrato nesta rede**. Alguém pode copiar o arquivo, seu conteúdo, o código ou criar outro contrato; isso não duplica a identidade do token original. Alterar um arquivo muda seu hash e não impede semelhança visual. Os dígitos de Pi não passam a pertencer ao comprador.

O contrato confere um manifesto imutável de dados preparados e verificados fora da blockchain; ele não recalcula Pi nem prova o comportamento interno do Gemini. O ruído de Pi foi enviado como referência visual, e os prompts também influenciaram a composição.

A Genesis contempla apenas as três peças atuais. Expandir a coleção exige outra decisão de contrato; exclusividade entre coleções futuras precisará de um registro compartilhado. Este contrato não implementa checkout, cobrança, royalties ou venda secundária.

## Conteúdo e armazenamento

`release/manifest.json` contém os três registros, provas de Merkle, os CIDs e o estado de publicação. `release/assets.car` empacota as artes, ruídos, dígitos e registros de geração. `release/metadata.car` empacota os JSONs dos NFTs, que apontam para as artes por `ipfs://`.

CID dos arquivos:

```text
bafybeielr2h6ibkyi7kaeyh7ekni33q4nfenq7wesrfmzqc2irumc2zuwq
```

CID dos metadados:

```text
bafybeiddpgxjfi6zatscr2lmkvin7lfhhng6sxfbrch27iuufmu2mi4h3y
```

**Calcular um CID não publica nem mantém o conteúdo disponível.** É necessário importar e fixar os dois CARs em armazenamento IPFS, confirmar os CIDs retornados e verificar a leitura dos três metadados e das imagens antes de emitir. Ainda não há provedor autenticado configurado neste projeto. A documentação do IPFS distingue [endereçamento, persistência e pinning](https://docs.ipfs.tech/concepts/persistence/).

Manter cópia dos CARs permite republicar os mesmos bytes com os mesmos endereços. Não recomprimir as artes nem editar os metadados depois de fixar o manifesto: o conteúdo e os CIDs mudariam.

## Arquivos técnicos

- `contracts/KronosPiGenesis.sol`: contrato original com OpenZeppelin 5.6.1.
- `artifacts/KronosPiGenesis.json`: ABI e bytecode compilados com Solidity 0.8.37, otimizador 200 e EVM Cancun.
- `artifacts/standard-input.json`: fontes completas, incluindo dependências, para reproduzir a compilação e verificar o código no explorador.
- `release/manifest.json`: compromissos e provas de cada NFT.
- `release/local-validation.json`: resultado da implantação e das três emissões em EVM local efêmera, chain ID 31337. Não são transações de Base ou Sepolia.
- `scripts/prepare-transactions.mjs`: prepara transações sem assinatura; não envia nada à rede nem lê chaves privadas.
- `test/`: testes de regras, controle de acesso, reentrada, transferência, CARs e payloads.

## Comandos

Executar nesta pasta (`integrations/pi-genesis`). O pacote possui lockfile próprio. As entradas de `package:assets` estão incluídas em `release/assets`; não há dependência da pasta de geração de outro computador. Atributos Git preservam os bytes comprometidos pelos hashes e CIDs. Transações preparadas para uma carteira são ignoradas pelo Git.

```powershell
npm ci --ignore-scripts
npm run build
npm run package:assets
npm run check
node scripts/validate-local.mjs
```

Depois que existir uma carteira real, substituir `SEU_ENDERECO_PUBLICO` pelo endereço conferido. O comando abaixo somente prepara os dados para revisão:

```powershell
npm run prepare:transactions -- --owner=SEU_ENDERECO_PUBLICO --network=base-sepolia
```

Para Base definitiva, selecionar explicitamente `--network=base`. O arquivo resultante inclui o payload de implantação e os argumentos do construtor. As transações de mint permanecem `null` até informar o endereço **já implantado e conferido**:

```powershell
npm run prepare:transactions -- --owner=SEU_ENDERECO_PUBLICO --network=base --contract=ENDERECO_DO_CONTRATO
```

Conferir a rede, o código implantado, `owner()`, `manifestRoot()` e `piDatasetHash()` antes de assinar chamadas de mint. O script prepara payloads, mas não valida uma implantação informada pelo usuário.

## Evidência de conclusão pública exigida

Uma implantação só será registrada como concluída após recibo de sucesso, endereço do contrato e consulta de seu código na rede escolhida. Uma peça só será registrada como emitida após confirmação de `ownerOf(tokenId)`, `tokenURI(tokenId)`, procedência e recibo da transação. Registrar os links públicos no handoff quando existirem; não usar endereços da simulação como se fossem públicos.

Na preparação original, 19 testes passaram e a simulação emitiu as três peças com proprietário e URI conferidos. A consolidação adiciona uma regressão de empacotamento portátil que preserva os mesmos CIDs e manifesto. Isso é validação de desenvolvimento, não auditoria externa nem comprovação de implantação pública.

A checagem `npm audit` terminou com zero alertas conhecidos. Foram fixadas as dependências transitivas `tmp` 0.2.7 e `uuid` 11.1.1 por overrides, mantendo o compilador e o formato das provas; os 19 testes passaram novamente após o ajuste. O relatório está em `release/dependency-audit.json`.

Fontes técnicas: [ERC-721](https://eips.ethereum.org/EIPS/eip-721), [OpenZeppelin ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721), [Base](https://docs.base.org/get-started/connect-to-base), [instalação da MetaMask](https://support.metamask.io/start/getting-started-with-metamask/).
