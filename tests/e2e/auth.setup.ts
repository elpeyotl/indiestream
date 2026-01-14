import { test as setup, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(__dirname, '../fixtures/.auth/user.json')
const adminAuthFile = path.join(__dirname, '../fixtures/.auth/admin.json')

// Helper to create empty auth state (for when users don't exist)
const createEmptyAuthState = (filePath: string) => {
  fs.writeFileSync(filePath, JSON.stringify({
    cookies: [],
    origins: []
  }))
}

// Setup for regular user - creates auth state file
setup('authenticate as user', async ({ page }) => {
  // Skip if no test user is configured
  if (!process.env.TEST_USER_EMAIL) {
    console.log('No TEST_USER_EMAIL set - creating empty auth state for user tests')
    createEmptyAuthState(authFile)
    return
  }

  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD || 'testpassword123'

  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for successful login (redirect to dashboard or home)
  try {
    await page.waitForURL(/dashboard|\/(?!login)/, { timeout: 15000 })
    await expect(page).not.toHaveURL(/login/)
    await page.context().storageState({ path: authFile })
  } catch {
    console.log('User login failed - test user may not exist. Creating empty auth state.')
    createEmptyAuthState(authFile)
  }
})

// Setup for admin user
setup('authenticate as admin', async ({ page }) => {
  // Skip if no admin user is configured
  if (!process.env.TEST_ADMIN_EMAIL) {
    console.log('No TEST_ADMIN_EMAIL set - creating empty auth state for admin tests')
    createEmptyAuthState(adminAuthFile)
    return
  }

  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD || 'adminpassword123'

  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()

  try {
    await page.waitForURL(/dashboard|\/(?!login)/, { timeout: 15000 })
    await expect(page).not.toHaveURL(/login/)
    await page.context().storageState({ path: adminAuthFile })
  } catch {
    console.log('Admin login failed - admin user may not exist. Creating empty auth state.')
    createEmptyAuthState(adminAuthFile)
  }
})
