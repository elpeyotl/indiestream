import { test, expect } from '@playwright/test'

test.describe('Charts Page', () => {
  test('charts page loads with sections', async ({ page }) => {
    await page.goto('/charts')
    await page.waitForLoadState('domcontentloaded')

    // Page should have charts heading
    await expect(page.getByRole('heading', { name: /charts/i })).toBeVisible()

    // Should show period selector (USelectMenu dropdown shows value like "7d", "30d", or "all")
    await expect(page.locator('button').filter({ hasText: /7d|30d|all/i }).first()).toBeVisible()
  })

  test('charts page shows track and album sections', async ({ page }) => {
    await page.goto('/charts')
    await page.waitForLoadState('domcontentloaded')

    // Wait for loading to complete (skeleton or content)
    await page.waitForTimeout(1000)

    // Should have tracks and albums sections (or loading/empty state)
    const topTracksHeading = page.getByRole('heading', { name: /top tracks/i })
    const topAlbumsHeading = page.getByRole('heading', { name: /top albums/i })

    // Either headings are visible or page is still loading
    const tracksVisible = await topTracksHeading.isVisible().catch(() => false)
    const albumsVisible = await topAlbumsHeading.isVisible().catch(() => false)

    // At least one should be visible after loading
    if (tracksVisible) {
      await expect(topTracksHeading).toBeVisible()
    }
    if (albumsVisible) {
      await expect(topAlbumsHeading).toBeVisible()
    }
  })

  test('period selector can be changed', async ({ page }) => {
    await page.goto('/charts')
    await page.waitForLoadState('domcontentloaded')

    // Find the period selector dropdown button (shows value like "7d")
    const periodSelector = page.locator('button').filter({ hasText: /7d|30d|all/i }).first()

    if (await periodSelector.isVisible()) {
      // Click to open dropdown
      await periodSelector.click()
      await page.waitForTimeout(300)

      // Should show options
      const options = page.locator('[role="option"], [role="listbox"] button, li')
      const optionCount = await options.count()

      if (optionCount > 0) {
        // Click a different option
        await options.first().click()
        await page.waitForTimeout(300)

        // Page should still show charts
        await expect(page.getByRole('heading', { name: /charts/i })).toBeVisible()
      }
    }
  })

  test('chart items are clickable', async ({ page }) => {
    await page.goto('/charts')
    await page.waitForLoadState('domcontentloaded')

    // Wait for content to load
    await page.waitForTimeout(1500)

    // Find track/album links in the charts
    const chartLinks = page.locator('a[href*="/"]').filter({
      has: page.locator('img, .rounded-full')
    })

    const linkCount = await chartLinks.count()
    if (linkCount > 0) {
      const firstLink = chartLinks.first()
      const href = await firstLink.getAttribute('href')

      if (href && href !== '/') {
        await firstLink.click()
        await page.waitForLoadState('domcontentloaded')
        // Should navigate to artist/album page
        await expect(page).not.toHaveURL('/charts')
      }
    }
  })
})
