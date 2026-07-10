import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Vitest's default include pattern also matches *.spec.ts anywhere in
    // the repo, which picks up the Playwright tests in e2e/ (a different
    // runner, imports @playwright/test, not installed for Vitest). Exclude
    // that folder so the two test runners stay separate.
    exclude: ['node_modules/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})