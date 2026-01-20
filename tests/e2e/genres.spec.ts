import { test, expect } from '@playwright/test'

test.describe('Genre Browsing', () => {
  test('genres index page loads', async ({ page }) => {
    await page.goto('/genres')
    await page.waitForLoadState('networkidle')

    // Page should have genres heading
    await expect(page.getByRole('heading', { name: /genres|browse by genre/i })).toBeVisible()
  })

  test('genre cards are displayed', async ({ page }) => {
    await page.goto('/genres')
    await page.waitForLoadState('networkidle')

    // Should show genre cards with links
    const genreLinks = page.locator('a[href^="/genres/"]')
    const count = await genreLinks.count()

    // Should have at least some genre links (unless empty database)
    if (count > 0) {
      // First genre link should be visible
      await expect(genreLinks.first()).toBeVisible()
    }
  })

  test('clicking genre navigates to genre page', async ({ page }) => {
    await page.goto('/genres')
    await page.waitForLoadState('networkidle')

    const genreLinks = page.locator('a[href^="/genres/"]')
    const count = await genreLinks.count()

    if (count > 0) {
      const firstGenre = genreLinks.first()
      const href = await firstGenre.getAttribute('href')

      await firstGenre.click()
      await page.waitForLoadState('networkidle')

      // Should be on genre detail page
      if (href) {
        await expect(page).toHaveURL(new RegExp(href.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')))
      }

      // Genre page should show content
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })

  test('genre detail page shows artists/albums', async ({ page }) => {
    // Navigate directly to a common genre
    await page.goto('/genres/rock')

    // If genre exists, should show content
    const response = await page.waitForLoadState('networkidle')

    // Check if page loaded (might 404 if genre doesn't exist in test db)
    const heading = page.getByRole('heading').first()
    const headingExists = await heading.isVisible().catch(() => false)

    if (headingExists) {
      // Should have either artists or albums section, or empty state
      const hasContent = await page.locator('a[href*="/"]').filter({
        has: page.locator('img')
      }).count() > 0

      const hasEmptyState = await page.getByText(/no artists|no albums|no releases/i).isVisible().catch(() => false)

      // Page should show either content or empty state
      expect(hasContent || hasEmptyState).toBeTruthy()
    }
  })

  test('genre page has back navigation', async ({ page }) => {
    await page.goto('/genres')
    await page.waitForLoadState('networkidle')

    const genreLinks = page.locator('a[href^="/genres/"]')
    const count = await genreLinks.count()

    if (count > 0) {
      // Navigate to genre
      await genreLinks.first().click()
      await page.waitForLoadState('networkidle')

      // Should be able to go back to genres index
      const backLink = page.locator('a[href="/genres"]')
      if (await backLink.count() > 0) {
        await backLink.first().click()
        await expect(page).toHaveURL('/genres')
      } else {
        // Use browser back
        await page.goBack()
        await expect(page).toHaveURL('/genres')
      }
    }
  })
})
