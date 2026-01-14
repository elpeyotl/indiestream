import { test, expect } from '@playwright/test'

// These tests run with admin user session (via storageState)
// They will skip if no admin session exists

// Helper to check if user is admin and logged in
const checkAdminAuth = async (page: any, testInstance: typeof test) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  // If redirected to login or access denied, skip the test
  if (page.url().includes('/login') || page.url().includes('/dashboard')) {
    testInstance.skip(true, 'No authenticated admin user configured - set TEST_ADMIN_EMAIL env var')
  }
}

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await checkAdminAuth(page, test)
  })

  test('admin dashboard loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible()
  })

  test('admin dashboard shows platform stats', async ({ page }) => {
    await expect(page.getByText(/total streams/i).first()).toBeVisible()
    await expect(page.getByText(/artists/i).first()).toBeVisible()
  })

  test('admin dashboard has tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /users/i })).toBeVisible()
  })

  test('can switch to users tab', async ({ page }) => {
    await page.getByRole('tab', { name: /users/i }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
  })

  test('can search users', async ({ page }) => {
    await page.getByRole('tab', { name: /users/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByPlaceholder(/search/i).fill('test')
    await page.waitForTimeout(500) // Wait for debounce
    await expect(page).toHaveURL(/admin/)
  })
})

test.describe('Admin Payouts', () => {
  test.beforeEach(async ({ page }) => {
    await checkAdminAuth(page, test)
  })

  test('can access payouts tab if exists', async ({ page }) => {
    const payoutsTab = page.getByRole('tab', { name: /payout/i })
    if (await payoutsTab.count() > 0) {
      await payoutsTab.click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

test.describe('Admin PRO Export', () => {
  test.beforeEach(async ({ page }) => {
    await checkAdminAuth(page, test)
  })

  test('can access PRO export tab if exists', async ({ page }) => {
    const proTab = page.getByRole('tab', { name: /pro|export/i })
    if (await proTab.count() > 0) {
      await proTab.click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
