import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'

// load our environemnt with the email etc to Playwright
dotenv.config({ path: '.env.local' })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 90_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    // FloatingTimer.tsx reads these to override the real 25min/15s check-ins
    env: {
      NEXT_PUBLIC_CHECKIN_INTERVAL_MS: '30000',
      NEXT_PUBLIC_CHECKIN_RESPONSE_WINDOW_MS: '15000',
    },
  }
})
