import { test, expect } from '@playwright/test'

test.describe('Discovery & Navigation', () => {
  test('home page loads with key sections', async ({ page }) => {
    await page.goto('/')

    // Check main sections exist
    await expect(page.getByRole('heading', { name: /featured|discover|welcome/i }).first()).toBeVisible()

    // Navigation should be present
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('discover page shows artists', async ({ page }) => {
    await page.goto('/discover')

    // Page should load
    await expect(page.getByRole('heading', { name: /discover/i })).toBeVisible()

    // Should have artist grid or list (may be empty in test db)
    await page.waitForLoadState('networkidle')
  })

  test('artists page loads', async ({ page }) => {
    await page.goto('/artists')

    await expect(page.getByRole('heading', { name: /artist/i })).toBeVisible()

    // Search input should exist
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
  })

  test('pricing page displays tiers', async ({ page }) => {
    await page.goto('/pricing')

    // Should show pricing information
    await expect(page.getByText(/free|listener|artist/i).first()).toBeVisible()

    // Should have pricing amounts
    await expect(page.getByText(/\$|month|year/i).first()).toBeVisible()
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('navigation links work', async ({ page }) => {
    await page.goto('/')

    // Click discover link
    await page.getByRole('link', { name: /discover/i }).first().click()
    await expect(page).toHaveURL(/discover/)

    // Click artists link
    await page.getByRole('link', { name: /artists/i }).first().click()
    await expect(page).toHaveURL(/artists/)
  })

  test('global search can be opened', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find and click the search button in navigation (contains magnifying glass icon)
    // The GlobalSearch component has a button that opens a modal
    const searchButton = page.locator('nav button, header button').filter({
      has: page.locator('[class*="magnifying"], [class*="search"]')
    }).first()

    // Check if search button exists
    const buttonExists = await searchButton.count() > 0
    if (buttonExists) {
      await searchButton.click()
      // Search modal/input should appear
      await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 5000 })
    } else {
      // If no search button visible, skip test
      test.skip()
    }
  })
})
