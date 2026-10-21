import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { importer } from 'ipfs-unixfs-importer';
import { MemoryBlockstore } from 'blockstore-core/memory';
import { CarWriter } from '@ipld/car';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { ROOT } from './build.mjs';

const OUTPUT = resolve(ROOT, 'release');
// As entradas canônicas viajam com o pacote, sem depender do workspace de geração.
const SOURCE = resolve(ROOT, 'release/assets');
const names = ['50000', '62288', '74576'];
const hash = (data) => createHash('sha256').update(data).digest('hex');
const asJson = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');

async function archive(files, name) {
  const store = new MemoryBlockstore();
  // MemoryBlockstore.getAll() reconstructs raw CIDs; keep the original codecs
  // so UnixFS directory/file DAG-PB blocks remain resolvable in the CAR.
  const cids = new Map();
  const put = store.put.bind(store);
  store.put = (cid, value, options) => {
    cids.set(cid.toString(), cid);
    return put(cid, value, options);
  };
  let root;
  for await (const entry of importer(files, store, { cidVersion: 1, rawLeaves: true, wrapWithDirectory: true })) root = entry.cid;
  if (!root) throw new Error('Empty content archive');
  const { writer, out } = CarWriter.create([root]);
  const collect = (async () => {
    const chunks = [];
    for await (const chunk of out) chunks.push(chunk);
    await writeFile(resolve(OUTPUT, `${name}.car`), Buffer.concat(chunks));
  })();
  for (const cid of cids.values()) {
    const chunks = [];
    for await (const chunk of store.get(cid)) chunks.push(chunk);
    await writer.put({ cid, bytes: Buffer.concat(chunks) });
  }
  await writer.close();
  await collect;
  for (const file of files) {
    const dest = resolve(OUTPUT, name, file.path);
    await mkdir(resolve(dest, '..'), { recursive: true });
    await writeFile(dest, file.content);
  }
  return root.toString();
}

await mkdir(OUTPUT, { recursive: true });
const datasetInfo = JSON.parse(await readFile(resolve(SOURCE, 'dataset.json'), 'utf8'));
const dataset = await readFile(resolve(SOURCE, 'pi-decimals-90000.txt'));
if (hash(dataset) !== datasetInfo.sha256) throw new Error('Pi dataset checksum mismatch');
const assets = [{ path: 'pi-decimals-90000.txt', content: dataset },
  { path: 'dataset.json', content: asJson(datasetInfo) }];
const pieces = [];
for (const name of names) {
  const directory = resolve(SOURCE, name);
  const info = JSON.parse(await readFile(resolve(directory, 'metadata.json'), 'utf8'));
  if (info.status !== 'generated') throw new Error(`Image not generated: ${name}`);
  const output = info.outputs[0];
  const image = await readFile(resolve(directory, output.file));
  const digits = await readFile(resolve(directory, 'digits.txt'));
  if (hash(image) !== output.fileSha256 || hash(digits) !== info.digitsSha256) throw new Error(`Checksum mismatch: ${name}`);
  if (dataset.subarray(info.start - 1, info.start - 1 + info.length).compare(digits) !== 0) throw new Error('Coordinate mismatch');
  for (const other of pieces) {
    if (info.start < other.info.start + other.info.length && other.info.start < info.start + info.length) throw new Error('Overlapping intervals');
    if (output.fileSha256 === other.info.outputs[0].fileSha256) throw new Error('Duplicate artwork');
  }
  for (const filename of [output.file, 'noise.png', 'noise-64.png', 'digits.txt', 'prompt.txt', 'metadata.json']) {
    assets.push({ path: `${info.start}/${filename}`, content: await readFile(resolve(directory, filename)) });
  }
  pieces.push({ info, name, imageName: output.file });
}
const assetsCid = await archive(assets, 'assets');
const metadata = pieces.map(({ info, imageName }) => ({
  name: `Kronos Pi #${info.start} - ${info.title}`,
  description: 'Genesis edition of three. AI artwork generated using an actual Pi-derived grayscale noise image as visual reference. The token represents this collection entry, not ownership of Pi or an uncopyable image.',
  image: `ipfs://${assetsCid}/${info.start}/${imageName}`,
  attributes: [
    { trait_type: 'Pi start (1-based)', value: info.start },
    { trait_type: 'Pi end (inclusive)', value: info.endInclusive },
    { trait_type: 'Digit count', value: info.length },
    { trait_type: 'Edition', value: '1 of 1' },
    { trait_type: 'Generator', value: info.returnedModel ?? info.requestedModel },
  ],
  properties: {
    pi_dataset_sha256: info.piDatasetSha256,
    digits_sha256: info.digitsSha256,
    image_sha256: info.outputs[0].fileSha256,
    noise: `ipfs://${assetsCid}/${info.start}/noise.png`,
    digits: `ipfs://${assetsCid}/${info.start}/digits.txt`,
    generation_record: `ipfs://${assetsCid}/${info.start}/metadata.json`,
    prompt: `ipfs://${assetsCid}/${info.start}/prompt.txt`,
    generation_mode: info.generationMode,
  },
}));
const metadataCid = await archive(metadata.map((entry, i) => ({ path: `${pieces[i].info.start}.json`, content: asJson(entry) })), 'metadata');
const types = ['uint256', 'bytes32', 'bytes32', 'string'];
const values = pieces.map(({ info }) => [info.start, `0x${info.digitsSha256}`, `0x${info.outputs[0].fileSha256}`, `ipfs://${metadataCid}/${info.start}.json`]);
const tree = StandardMerkleTree.of(values, types);
const manifest = {
  collection: 'Kronos Pi Genesis', symbol: 'KPI', maxSupply: 3, digitCount: 90000, intervalLength: 12288,
  status: 'prepared_locally_not_published_or_minted',
  assetsCid, metadataCid, manifestRoot: tree.root, piDatasetHash: `0x${datasetInfo.sha256}`,
  merkleEncoding: types,
  pieces: values.map((value, i) => ({ title: pieces[i].info.title, start: value[0], digitsHash: value[1], imageHash: value[2], tokenURI: value[3], proof: tree.getProof(i) })),
  publication: { assetsPinned: false, metadataPinned: false, contractAddress: null, chainId: null, transactionHashes: [] },
};
await writeFile(resolve(OUTPUT, 'manifest.json'), asJson(manifest));
await writeFile(resolve(OUTPUT, 'merkle-tree.json'), asJson(tree.dump()));
console.log(JSON.stringify({ status: manifest.status, assetsCid, metadataCid, root: tree.root, pieces: values.length }, null, 2));
