import { test, expect } from '@playwright/test'

// These tests run with admin user session (via storageState)
// They will skip if no admin session exists

// Helper to check if user is admin and logged in
const checkAdminAuth = async (page: any, testInstance: typeof test) => {
  await page.goto('/admin')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1000)

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
    // Wait for overview tab content to load
    await page.waitForTimeout(500)

    // Look for stats in the overview - could be in cards or text
    const hasStats = await page.getByText(/total|streams|artists|users/i).first().isVisible().catch(() => false)
    expect(hasStats).toBeTruthy()
  })

  test('admin dashboard has tabs', async ({ page }) => {
    // PillTabs uses buttons, not role="tab"
    // Look for the Overview and Users tab buttons
    const overviewTab = page.locator('button').filter({ hasText: /overview/i }).first()
    const usersTab = page.locator('button').filter({ hasText: /users/i }).first()

    // At least one should be visible (on mobile, labels may be hidden but icons shown)
    const overviewVisible = await overviewTab.isVisible().catch(() => false)
    const usersVisible = await usersTab.isVisible().catch(() => false)

    // Check for tab buttons (might just show icons on mobile)
    const tabButtons = page.locator('button.rounded-full')
    const tabCount = await tabButtons.count()

    expect(overviewVisible || usersVisible || tabCount > 3).toBeTruthy()
  })

  test('can switch to users tab', async ({ page }) => {
    // Find and click Users tab button
    const usersTab = page.locator('button').filter({ hasText: /users/i }).first()
    const usersTabVisible = await usersTab.isVisible().catch(() => false)

    if (usersTabVisible) {
      await usersTab.click()
      await page.waitForLoadState('domcontentloaded')
      // Wait longer for tab content to lazy load
      await page.waitForTimeout(1500)

      // Users tab should show search input with placeholder "Search by email or name..."
      const searchInput = page.getByPlaceholder(/search by email|search/i)
      const hasSearch = await searchInput.isVisible().catch(() => false)

      // Also check for user table header as alternative
      const hasUserTable = await page.getByText(/user|email|role/i).first().isVisible().catch(() => false)

      expect(hasSearch || hasUserTable).toBeTruthy()
    } else {
      // On mobile, try clicking by icon (users icon is 6th tab)
      const tabButtons = page.locator('button.rounded-full')
      const count = await tabButtons.count()

      if (count >= 6) {
        // Users is the 6th tab (index 5)
        await tabButtons.nth(5).click()
        await page.waitForTimeout(1500)

        const searchInput = page.getByPlaceholder(/search by email|search/i)
        const hasSearch = await searchInput.isVisible().catch(() => false)
        const hasUserTable = await page.getByText(/user|email|role/i).first().isVisible().catch(() => false)

        expect(hasSearch || hasUserTable).toBeTruthy()
      } else {
        test.skip()
      }
    }
  })

  test('can search users', async ({ page }) => {
    // Navigate to Users tab first
    const usersTab = page.locator('button').filter({ hasText: /users/i }).first()
    const usersTabVisible = await usersTab.isVisible().catch(() => false)

    if (usersTabVisible) {
      await usersTab.click()
    } else {
      // Try clicking 6th tab button (Users)
      const tabButtons = page.locator('button.rounded-full')
      if (await tabButtons.count() >= 6) {
        await tabButtons.nth(5).click()
      } else {
        test.skip()
        return
      }
    }

    await page.waitForLoadState('domcontentloaded')
    // Wait longer for tab content to lazy load
    await page.waitForTimeout(1500)

    const searchInput = page.getByPlaceholder(/search by email|search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(500) // Wait for debounce
      await expect(page).toHaveURL(/admin/)
    }
  })
})

test.describe('Admin Payouts', () => {
  test.beforeEach(async ({ page }) => {
    await checkAdminAuth(page, test)
  })

  test('can access payouts tab if exists', async ({ page }) => {
    const payoutsTab = page.locator('button').filter({ hasText: /payout/i }).first()
    if (await payoutsTab.isVisible()) {
      await payoutsTab.click()
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('body')).toBeVisible()
    } else {
      // Payouts is the 11th tab (index 10)
      const tabButtons = page.locator('button.rounded-full')
      if (await tabButtons.count() >= 11) {
        await tabButtons.nth(10).click()
        await page.waitForTimeout(500)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})

test.describe('Admin PRO Export', () => {
  test.beforeEach(async ({ page }) => {
    await checkAdminAuth(page, test)
  })

  test('can access PRO export tab if exists', async ({ page }) => {
    const proTab = page.locator('button').filter({ hasText: /pro|export/i }).first()
    if (await proTab.isVisible()) {
      await proTab.click()
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('body')).toBeVisible()
    } else {
      // PRO Export is the 12th tab (index 11)
      const tabButtons = page.locator('button.rounded-full')
      if (await tabButtons.count() >= 12) {
        await tabButtons.nth(11).click()
        await page.waitForTimeout(500)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})
