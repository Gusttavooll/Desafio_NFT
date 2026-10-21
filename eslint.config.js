import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Fronteiras de camada e de bounded context (docs/adr/0002-contextos-dentro-das-camadas.md).
const contexts = 'shared|catalog|cart|orders|account|wallets|realtime'

const contextBoundaries = [
  {
    regex: `^@/(domain|application|infrastructure|ui|mocks)/(${contexts})/.+`,
    message: 'Importe outro contexto só pela API pública (index.ts): @/<camada>/<contexto>.',
  },
  {
    regex: `^(\\.\\./)+(${contexts})(/|$)`,
    message: 'Para outro contexto use @/<camada>/<contexto>, não caminho relativo.',
  },
]

const forbidLayers = (layers, message) => ({
  regex: `^@/(${layers.join('|')})(/|$)`,
  message,
})

const restrictImports = (...patterns) => ({
  'no-restricted-imports': ['error', { patterns: [...contextBoundaries, ...patterns] }],
})

export default defineConfig([
  globalIgnores(['dist', 'src/routeTree.gen.ts', 'public/mockServiceWorker.js', 'playwright-report', 'test-results', 'blob-report']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: restrictImports(),
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: restrictImports(
      forbidLayers(['application', 'infrastructure', 'ui', 'routes', 'mocks'], 'O domínio não importa outras camadas.'),
      {
        regex: '^(react|react-dom|axios|socket\\.io-client|msw|@tanstack/.+)(/|$)',
        message: 'O domínio não importa framework nem rede.',
      },
    ),
  },
  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: restrictImports(forbidLayers(['ui', 'routes', 'mocks'], 'application não importa UI, rotas nem mocks.')),
  },
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: restrictImports(
      forbidLayers(['application', 'ui', 'routes', 'mocks'], 'infrastructure só depende do domínio.'),
    ),
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/routes/**/*.tsx'],
    rules: restrictImports(
      forbidLayers(['infrastructure', 'mocks'], 'A UI consome dados só via application (TanStack Query).'),
      {
        regex: '^@/domain(/|$)',
        allowTypeImports: true,
        message: 'A UI só importa tipos do domínio; regras ficam em application.',
      },
      { regex: '^(axios|socket\\.io-client|msw)(/|$)', message: 'A UI não acessa a rede diretamente.' },
    ),
  },
  {
    // Rotas file-based exportam `Route` com o componente local; o autoCodeSplitting
    // do TanStack Router separa o componente em outro módulo, mantendo o HMR.
    files: ['src/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
