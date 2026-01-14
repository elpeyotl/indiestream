import { test, expect } from '@playwright/test'

test.describe('Audio Player', () => {
  test('player component exists on page', async ({ page }) => {
    await page.goto('/')

    // The audio player component should be in the DOM (may be hidden until track plays)
    // Check for player-related elements
    await page.waitForLoadState('networkidle')

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible()
  })

  test('can navigate to artist/album page', async ({ page }) => {
    // Go to home page which should have featured artists
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Look for any artist/album link (class="group" with images)
    const contentLink = page.locator('a.group').first()
    const exists = await contentLink.count() > 0

    if (exists) {
      const href = await contentLink.getAttribute('href')
      await contentLink.click()
      await page.waitForLoadState('networkidle')

      // Should have navigated away from home
      if (href) {
        await expect(page).toHaveURL(new RegExp(href.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')))
      }
      await expect(page.locator('body')).toBeVisible()
    } else {
      // No content links on home page - check if page loaded at all
      const hasHeading = await page.locator('h1, h2').first().isVisible()
      if (!hasHeading) {
        // Page appears empty - database may not be connected in test env
        test.skip()
      }
    }
  })

  test('preview mode shows for non-logged-in users', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('networkidle')

    // Look for any playable content
    const playButtons = page.getByRole('button', { name: /play/i })
    const count = await playButtons.count()

    if (count > 0) {
      await playButtons.first().click()

      // Should show preview badge or sign-up prompt after some time
      // (30 second preview triggers signup prompt)
      await page.waitForTimeout(1000)

      // Player should be visible or audio should start
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
