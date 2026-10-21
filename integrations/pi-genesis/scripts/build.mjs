import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import solc from 'solc';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function compile(extraSources = {}) {
  const input = {
    language: 'Solidity',
    sources: {
      'KronosPiGenesis.sol': { content: readFileSync(resolve(ROOT, 'contracts/KronosPiGenesis.sol'), 'utf8') },
      ...extraSources,
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'cancun',
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object', 'metadata'] } },
    },
  };
  const imported = {};
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: (name) => {
    if (!name.startsWith('@openzeppelin/contracts/') || name.includes('..')) return { error: 'Unsupported import' };
    try {
      const contents = readFileSync(resolve(ROOT, 'node_modules', name), 'utf8');
      imported[name] = { content: contents };
      return { contents };
    } catch { return { error: `Missing import ${name}` }; }
  } }));
  const errors = (output.errors ?? []).filter((entry) => entry.severity === 'error');
  if (errors.length) throw new Error(errors.map((entry) => entry.formattedMessage).join('\n'));
  return { output, input: { ...input, sources: { ...input.sources, ...imported } } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { output, input } = compile();
  const contract = output.contracts['KronosPiGenesis.sol'].KronosPiGenesis;
  const artifact = {
    contractName: 'KronosPiGenesis', compiler: solc.version(),
    abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}`,
    deployedBytecode: `0x${contract.evm.deployedBytecode.object}`, metadata: JSON.parse(contract.metadata),
  };
  mkdirSync(resolve(ROOT, 'artifacts'), { recursive: true });
  writeFileSync(resolve(ROOT, 'artifacts/KronosPiGenesis.json'), JSON.stringify(artifact, null, 2));
  writeFileSync(resolve(ROOT, 'artifacts/standard-input.json'), JSON.stringify(input, null, 2));
  console.log(`Compiled ${artifact.contractName}; runtime ${contract.evm.deployedBytecode.object.length / 2} bytes; ${artifact.compiler}`);
}
