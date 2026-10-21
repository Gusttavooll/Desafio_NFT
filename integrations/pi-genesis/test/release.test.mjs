import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { CarReader } from '@ipld/car';
import { MemoryBlockstore } from 'blockstore-core/memory';
import { exporter } from 'ipfs-unixfs-exporter';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { Interface, getCreateAddress } from 'ethers';
import { ROOT } from '../scripts/build.mjs';
import { prepare } from '../scripts/prepare-transactions.mjs';

const hash = (data) => createHash('sha256').update(data).digest('hex');
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('repackages the included sources without changing their CIDs or manifest', async () => {
  const before = await readJson('release/manifest.json');
  execFileSync(process.execPath, [resolve(ROOT, 'scripts/package-assets.mjs')], { cwd: ROOT, stdio: 'pipe' });
  const after = await readJson('release/manifest.json');
  assert.equal(after.assetsCid, before.assetsCid);
  assert.equal(after.metadataCid, before.metadataCid);
  assert.equal(after.manifestRoot, before.manifestRoot);
  assert.deepEqual(after.pieces, before.pieces);
});

async function openCar(name, expectedRoot) {
  const reader = await CarReader.fromBytes(await readFile(resolve(ROOT, `release/${name}.car`)));
  assert.equal((await reader.getRoots())[0].toString(), expectedRoot);
  const store = new MemoryBlockstore();
  for await (const block of reader.blocks()) {
    assert.equal(block.cid.multihash.code, 0x12);
    assert.equal(hash(block.bytes), Buffer.from(block.cid.multihash.digest).toString('hex'));
    await store.put(block.cid, block.bytes);
  }
  return async (path) => {
    const entry = await exporter(`${expectedRoot}/${path}`, store);
    // A small UnixFS file may be represented by one raw leaf block.
    assert.ok(entry.type === 'file' || entry.type === 'raw');
    const chunks = [];
    for await (const chunk of entry.content()) chunks.push(chunk);
    return Buffer.concat(chunks);
  };
}

test('both CAR archives resolve all token metadata, original artwork and digit excerpts', async () => {
  const manifest = await readJson('release/manifest.json');
  const assets = await openCar('assets', manifest.assetsCid);
  const metadata = await openCar('metadata', manifest.metadataCid);
  const pi = await assets('pi-decimals-90000.txt');
  assert.equal(`0x${hash(pi)}`, manifest.piDatasetHash);
  for (const piece of manifest.pieces) {
    const data = JSON.parse((await metadata(`${piece.start}.json`)).toString());
    const imagePath = data.image.replace(`ipfs://${manifest.assetsCid}/`, '');
    assert.equal(`0x${hash(await assets(imagePath))}`, piece.imageHash);
    const digits = await assets(`${piece.start}/digits.txt`);
    assert.equal(`0x${hash(digits)}`, piece.digitsHash);
    assert.deepEqual(digits, pi.subarray(piece.start - 1, piece.start - 1 + manifest.intervalLength));
    assert.ok(StandardMerkleTree.verify(manifest.manifestRoot, manifest.merkleEncoding,
      [piece.start, piece.digitsHash, piece.imageHash, piece.tokenURI], piece.proof));
  }
});

test('unsigned plan requires explicit network and valid nonzero wallet; does not guess recipients', async () => {
  const owner = '0x1111111111111111111111111111111111111111';
  await assert.rejects(prepare(owner, undefined));
  await assert.rejects(prepare(owner, 'ethereum'));
  await assert.rejects(prepare('0x0000000000000000000000000000000000000000', 'base'));
  await assert.rejects(prepare('not-an-address', 'base'));
  const plan = await prepare(owner, 'base-sepolia');
  assert.equal(plan.deployment.chainId, '0x14a34');
  assert.ok(plan.mint.every((item) => !item.readyToSign && item.transaction === null));
  assert.equal(plan.status, 'unsigned_not_broadcast');
});

test('mint payload targets the supplied contract, recipient and committed files', async () => {
  const owner = '0x1111111111111111111111111111111111111111';
  const address = getCreateAddress({ from: owner, nonce: 0 });
  const plan = await prepare(owner, 'base', address);
  const manifest = await readJson('release/manifest.json');
  const artifact = await readJson('artifacts/KronosPiGenesis.json');
  const iface = new Interface(artifact.abi);
  assert.equal(plan.deployment.chainId, '0x2105');
  for (let i = 0; i < plan.mint.length; i++) {
    const transaction = plan.mint[i].transaction;
    assert.equal(transaction.to, address);
    assert.equal(transaction.value, '0x0');
    const decoded = iface.decodeFunctionData('mint', transaction.data);
    assert.equal(decoded.recipient, owner);
    assert.equal(decoded.start, BigInt(manifest.pieces[i].start));
    assert.equal(decoded.metadataURI, manifest.pieces[i].tokenURI);
  }
});
