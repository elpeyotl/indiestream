import { test, expect } from '@playwright/test'

// These tests run with authenticated user session (via storageState)
// They will skip if no authenticated session exists

// Helper to check if user is logged in
const checkAuth = async (page: any, testInstance: typeof test) => {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) {
    testInstance.skip(true, 'No authenticated test user configured - set TEST_USER_EMAIL env var')
  }
}

test.describe('User Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await checkAuth(page, test)
  })

  test('dashboard loads with welcome message', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('dashboard shows stats cards', async ({ page }) => {
    await expect(page.getByText(/hours listened/i)).toBeVisible()
    await expect(page.getByText(/total streams/i)).toBeVisible()
  })

  test('can navigate to listening history', async ({ page }) => {
    await page.getByRole('link', { name: /listening|history|hours/i }).first().click()
    await expect(page).toHaveURL(/listening/)
  })

  test('artist section shows on dashboard', async ({ page }) => {
    await expect(page.getByText(/your artist|artist profile/i).first()).toBeVisible()
  })
})

test.describe('Artist Features', () => {
  test.beforeEach(async ({ page }) => {
    await checkAuth(page, test)
  })

  test('can access create artist page', async ({ page }) => {
    await page.goto('/dashboard/artist/new')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByLabel(/name/i).first()).toBeVisible()
  })

  test('can access earnings page', async ({ page }) => {
    await page.goto('/dashboard/earnings')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/login/)
  })
})

test.describe('Library Features', () => {
  test.beforeEach(async ({ page }) => {
    await checkAuth(page, test)
  })

  test('can access library page', async ({ page }) => {
    await page.goto('/library')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/login/)
  })

  test('can follow an artist', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('networkidle')

    const artistLink = page.locator('a.group').first()
    if (await artistLink.count() > 0) {
      await artistLink.click()
      await page.waitForLoadState('networkidle')

      const followBtn = page.getByRole('button', { name: /follow/i })
      if (await followBtn.count() > 0) {
        await expect(followBtn.first()).toBeVisible()
      }
    }
  })
})
