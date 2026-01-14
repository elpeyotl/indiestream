import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(__dirname, 'tests/fixtures/.auth/user.json')
const adminAuthFile = path.join(__dirname, 'tests/fixtures/.auth/admin.json')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Setup project - runs first to create auth state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Tests that don't need auth
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /.*\.(authenticated|admin)\.spec\.ts/,
    },
    // Tests that need logged-in user
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      testMatch: /.*\.authenticated\.spec\.ts/,
      dependencies: ['setup'],
    },
    // Tests that need admin user
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: adminAuthFile,
      },
      testMatch: /.*\.admin\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
