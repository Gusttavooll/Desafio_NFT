import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { network } from 'hardhat';
import { BrowserProvider, ContractFactory } from 'ethers';
import { ROOT } from './build.mjs';

const artifact = JSON.parse(await readFile(resolve(ROOT, 'artifacts/KronosPiGenesis.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(ROOT, 'release/manifest.json'), 'utf8'));
const connection = await network.create('local');
const provider = new BrowserProvider(connection.provider, undefined, { cacheTimeout: -1 });
provider.pollingInterval = 10;
try {
  assert.equal((await provider.getNetwork()).chainId, 31337n);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contract = await new ContractFactory(artifact.abi, artifact.bytecode, signer)
    .deploy(address, manifest.manifestRoot, manifest.piDatasetHash);
  const deployReceipt = await contract.deploymentTransaction().wait();
  const receipts = [];
  for (const piece of manifest.pieces) {
    const receipt = await (await contract.mint(address, piece.start, piece.digitsHash, piece.imageHash, piece.tokenURI, piece.proof)).wait();
    assert.equal(await contract.ownerOf(piece.start), address);
    assert.equal(await contract.tokenURI(piece.start), piece.tokenURI);
    receipts.push({ tokenId: piece.start, gasUsed: receipt.gasUsed.toString(), ownerMatches: true, tokenURIMatches: true });
  }
  assert.equal(await contract.totalSupply(), 3n);
  const report = {
    status: 'passed_on_ephemeral_local_evm_only', chainId: 31337,
    publicNetworkDeployment: false, mintedOnPublicNetwork: false,
    manifestRoot: manifest.manifestRoot,
    deploymentGasUsed: deployReceipt.gasUsed.toString(), mints: receipts,
    note: 'Local gas units are not a quote for Base fees. No public wallet, public contract or real funds used.',
  };
  await writeFile(resolve(ROOT, 'release/local-validation.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await provider.destroy(); await connection.close(); }
