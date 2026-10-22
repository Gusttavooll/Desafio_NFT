/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    // O plugin do Router precisa vir antes do plugin do React.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      // Public browsing is the entry point; load its UI/CSS alongside the app and MSW.
      codeSplittingOptions: {
        splitBehavior: ({ routeId }) => routeId === '/' || routeId === '/nfts/$nftId' ? [] : undefined,
      },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Testes unitários ficam ao lado do código; E2E ficam em tests/e2e (Playwright).
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
