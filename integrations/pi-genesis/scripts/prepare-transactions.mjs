import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContractFactory, Interface, getAddress, ZeroAddress } from 'ethers';
import { ROOT } from './build.mjs';

export const NETWORKS = {
  'base-sepolia': { chainId: 84532, rpc: 'https://sepolia.base.org', explorer: 'https://sepolia.basescan.org', testnet: true },
  base: { chainId: 8453, rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org', testnet: false },
};

export async function prepare(ownerInput, networkName, contractInput) {
  if (!NETWORKS[networkName]) throw new Error('Choose --network=base-sepolia or --network=base explicitly.');
  const owner = getAddress(ownerInput);
  if (owner === ZeroAddress) throw new Error('A nonzero public wallet address is required.');
  const manifest = JSON.parse(await readFile(resolve(ROOT, 'release/manifest.json'), 'utf8'));
  const artifact = JSON.parse(await readFile(resolve(ROOT, 'artifacts/KronosPiGenesis.json'), 'utf8'));
  const params = [owner, manifest.manifestRoot, manifest.piDatasetHash];
  const factory = new ContractFactory(artifact.abi, artifact.bytecode);
  const deploy = await factory.getDeployTransaction(...params);
  const chainId = `0x${NETWORKS[networkName].chainId.toString(16)}`;
  const contract = contractInput ? getAddress(contractInput) : null;
  if (contract === ZeroAddress) throw new Error('Contract address cannot be zero.');
  const iface = new Interface(artifact.abi);
  return {
    status: 'unsigned_not_broadcast', network: networkName, networkConfig: NETWORKS[networkName],
    owner, constructorArguments: params,
    prerequisites: ['Publish and pin both CAR archives, and verify retrieval.',
      'Confirm network, recipient and current fees in the wallet.',
      'Deploy first; then prepare mint calls with the confirmed contract address.'],
    deployment: { from: owner, chainId, data: deploy.data, value: '0x0' },
    mint: manifest.pieces.map((piece) => {
      const data = iface.encodeFunctionData('mint', [owner, piece.start, piece.digitsHash, piece.imageHash, piece.tokenURI, piece.proof]);
      return { tokenId: piece.start, title: piece.title, readyToSign: Boolean(contract), callData: data,
        transaction: contract ? { from: owner, to: contract, chainId, value: '0x0', data } : null };
    }),
    note: 'This file prepares data only. It does not sign, estimate fees, pin files, deploy, or mint. Do not submit a mint transaction without a validated to address.',
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')));
  if (!args.owner || !args.network) throw new Error('Required: --owner=PUBLIC_ADDRESS --network=base-sepolia|base; optional: --contract=DEPLOYED_ADDRESS');
  const plan = await prepare(args.owner, args.network, args.contract);
  const path = resolve(ROOT, 'release', `unsigned-${args.network}.json`);
  await writeFile(path, JSON.stringify(plan, null, 2));
  console.log(`Prepared unsigned transactions: ${path}. Nothing broadcast.`);
}
