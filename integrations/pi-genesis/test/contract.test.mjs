import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { network } from 'hardhat';
import { BrowserProvider, ContractFactory, ZeroAddress, ZeroHash, id } from 'ethers';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { compile, ROOT } from '../scripts/build.mjs';

const types = ['uint256', 'bytes32', 'bytes32', 'string'];
const piece = (start, suffix = String(start), art = suffix) => [start, id(`digits-${suffix}`), id(`art-${art}`), `ipfs://bafy-test-${suffix}/metadata.json`];
let connection, provider, owner, buyer, other, compiled, receiverCompiled;

before(async () => {
  const result = compile({ 'Receiver.sol': { content: readFileSync(resolve(ROOT, 'test/Receiver.sol'), 'utf8') } }).output;
  compiled = result.contracts['KronosPiGenesis.sol'].KronosPiGenesis;
  receiverCompiled = result.contracts['Receiver.sol'].ReentrantReceiver;
  connection = await network.create('local');
  provider = new BrowserProvider(connection.provider, undefined, { cacheTimeout: -1 });
  provider.pollingInterval = 10;
  [owner, buyer, other] = await Promise.all([0, 1, 2].map((i) => provider.getSigner(i)));
});
after(async () => { await provider?.destroy(); await connection?.close(); });

async function setup(values = [piece(50000), piece(62288), piece(74576)]) {
  const tree = StandardMerkleTree.of(values, types);
  const factory = new ContractFactory(compiled.abi, `0x${compiled.evm.bytecode.object}`, owner);
  const contract = await factory.deploy(await owner.getAddress(), tree.root, id('pi-dataset'));
  await contract.waitForDeployment();
  const mint = (index, recipient = buyer) => recipient.getAddress().then((address) => contract.mint(address, ...values[index], tree.getProof(index))).then((tx) => tx.wait());
  return { contract, tree, mint, values };
}

test('mints an ERC-721 to the recipient and records immutable provenance', async () => {
  const { contract, mint, values, tree } = await setup();
  await mint(0);
  assert.equal(await contract.ownerOf(50000), await buyer.getAddress());
  assert.equal(await contract.balanceOf(await buyer.getAddress()), 1n);
  assert.equal(await contract.tokenURI(50000), values[0][3]);
  assert.equal(await contract.manifestRoot(), tree.root);
  assert.equal(await contract.totalSupply(), 1n);
  assert.equal(await contract.supportsInterface('0x80ac58cd'), true);
  assert.equal(await contract.supportsInterface('0x5b5e139f'), true);
  const provenance = await contract.provenance(50000);
  assert.equal(provenance.digitsHash, values[0][1]);
  assert.equal(provenance.imageHash, values[0][2]);
});

test('cannot mint the same interval twice, even to another wallet', async () => {
  const { mint, contract } = await setup();
  await mint(0);
  await assert.rejects(mint(0, other));
  assert.equal(await contract.totalSupply(), 1n);
});

test('blocks overlapping intervals with different starting coordinates', async () => {
  const { mint } = await setup([piece(50000), piece(50001)]);
  await mint(0);
  await assert.rejects(mint(1));
});

test('allows adjacent nonoverlapping intervals and exactly three pieces', async () => {
  const { mint, contract } = await setup([piece(1), piece(12289), piece(24577), piece(36865)]);
  await mint(0); await mint(1); await mint(2);
  assert.equal(await contract.totalSupply(), 3n);
  await assert.rejects(mint(3));
});

test('blocks duplicate artwork hashes even at disjoint coordinates', async () => {
  const { mint } = await setup([piece(1, 'a', 'same'), piece(12289, 'b', 'same')]);
  await mint(0);
  await assert.rejects(mint(1));
});

test('only the collection owner may mint', async () => {
  const { contract, values, tree } = await setup();
  await assert.rejects(contract.connect(other).mint(await buyer.getAddress(), ...values[0], tree.getProof(0)));
});

test('rejects altered coordinate, image, digits and metadata URI despite a valid proof for the original', async () => {
  const { contract, values, tree } = await setup();
  for (const [index, replacement] of [[0, 50001], [1, id('fake-digits')], [2, id('fake-art')], [3, 'ipfs://different/metadata.json']]) {
    const altered = [...values[0]];
    altered[index] = replacement;
    await assert.rejects(contract.mint(await buyer.getAddress(), ...altered, tree.getProof(0)));
  }
});

test('rejects malformed bounds, zero hashes, non-IPFS metadata, and zero recipients', async () => {
  const bad = [piece(0), piece(77714), [1, ZeroHash, id('image'), 'ipfs://example'],
    [12289, id('digits'), ZeroHash, 'ipfs://example'], [24577, id('d'), id('i'), 'https://mutable.example/nft.json']];
  const { mint } = await setup(bad);
  for (let i = 0; i < bad.length; i++) await assert.rejects(mint(i));
  const valid = await setup();
  await assert.rejects(valid.contract.mint(ZeroAddress, ...valid.values[0], valid.tree.getProof(0)));
});

test('last valid interval ends exactly at the dataset boundary', async () => {
  const { mint, contract } = await setup([piece(77713)]);
  await mint(0);
  assert.equal(await contract.ownerOf(77713), await buyer.getAddress());
});

test('transfer changes ownership without changing metadata or releasing the interval', async () => {
  const { mint, contract, values } = await setup();
  await mint(0);
  await (await contract.connect(buyer).transferFrom(await buyer.getAddress(), await other.getAddress(), 50000)).wait();
  assert.equal(await contract.ownerOf(50000), await other.getAddress());
  assert.equal(await contract.tokenURI(50000), values[0][3]);
  await assert.rejects(mint(0));
});

test('safe mint failure rolls back availability and supply', async () => {
  const { mint, contract, values, tree } = await setup();
  await assert.rejects(contract.mint(await contract.getAddress(), ...values[0], tree.getProof(0)));
  assert.equal(await contract.totalSupply(), 0n);
  await mint(0);
  assert.equal(await contract.totalSupply(), 1n);
});

test('metadata and provenance have no public mutation path', () => {
  const methods = compiled.abi.filter((entry) => entry.type === 'function').map((entry) => entry.name);
  for (const name of ['setTokenURI', 'setBaseURI', 'setManifestRoot', 'burn', 'upgradeTo']) assert.ok(!methods.includes(name));
});

test('constructor rejects empty commitments', async () => {
  const factory = new ContractFactory(compiled.abi, `0x${compiled.evm.bytecode.object}`, owner);
  await assert.rejects(factory.deploy(await owner.getAddress(), ZeroHash, id('pi')));
  await assert.rejects(factory.deploy(await owner.getAddress(), id('manifest'), ZeroHash));
});

test('a receiving contract that owns the collection cannot reenter mint', async () => {
  const receiver = await new ContractFactory(receiverCompiled.abi, `0x${receiverCompiled.evm.bytecode.object}`, owner).deploy();
  await receiver.waitForDeployment();
  const values = [piece(50000), piece(62288)];
  const tree = StandardMerkleTree.of(values, types);
  const contract = await new ContractFactory(compiled.abi, `0x${compiled.evm.bytecode.object}`, owner)
    .deploy(await receiver.getAddress(), tree.root, id('dataset'));
  await contract.waitForDeployment();
  const outer = contract.interface.encodeFunctionData('mint', [await receiver.getAddress(), ...values[0], tree.getProof(0)]);
  const nested = contract.interface.encodeFunctionData('mint', [await buyer.getAddress(), ...values[1], tree.getProof(1)]);
  await (await receiver.execute(await contract.getAddress(), outer, nested)).wait();
  assert.equal(await receiver.attempted(), true);
  assert.equal(await receiver.blocked(), true);
  assert.equal(await contract.totalSupply(), 1n);
});

test('an unauthorized wallet cannot transfer an existing NFT', async () => {
  const { mint, contract } = await setup();
  await mint(0);
  await assert.rejects(contract.connect(other).transferFrom(await buyer.getAddress(), await other.getAddress(), 50000));
  assert.equal(await contract.ownerOf(50000), await buyer.getAddress());
});

test('collection ownership transfer requires acceptance by the new owner', async () => {
  const { contract } = await setup();
  await (await contract.transferOwnership(await other.getAddress())).wait();
  assert.equal(await contract.owner(), await owner.getAddress());
  await assert.rejects(contract.connect(buyer).acceptOwnership());
  await (await contract.connect(other).acceptOwnership()).wait();
  assert.equal(await contract.owner(), await other.getAddress());
});
