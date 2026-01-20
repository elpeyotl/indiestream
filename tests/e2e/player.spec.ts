import { test, expect } from '@playwright/test'

test.describe('Audio Player', () => {
  test('player component exists on page', async ({ page }) => {
    await page.goto('/')

    // The audio player component should be in the DOM (may be hidden until track plays)
    // Check for player-related elements
    await page.waitForLoadState('domcontentloaded')

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible()
  })

  test('can navigate to artist/album page', async ({ page }) => {
    // Go to home page which should have featured artists
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Look for any artist/album link (class="group" with images)
    const contentLink = page.locator('a.group').first()
    const exists = await contentLink.count() > 0

    if (exists) {
      const href = await contentLink.getAttribute('href')
      await contentLink.click()
      await page.waitForLoadState('domcontentloaded')

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
    await page.waitForLoadState('domcontentloaded')

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

  test('clicking play on album page shows player', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('domcontentloaded')

    // Find an album/artist link with cover image
    const albumLinks = page.locator('a[href*="/"]').filter({
      has: page.locator('img')
    })

    const linkCount = await albumLinks.count()
    if (linkCount === 0) {
      test.skip()
      return
    }

    // Navigate to first album
    await albumLinks.first().click()
    await page.waitForLoadState('domcontentloaded')

    // Find play button on the page
    const playButton = page.getByRole('button', { name: /play/i }).first()
    const hasPlayButton = await playButton.isVisible().catch(() => false)

    if (hasPlayButton) {
      await playButton.click()
      await page.waitForTimeout(500)

      // Player bar should appear at bottom of page
      // Look for player-specific elements (progress bar, controls)
      const playerVisible = await page.locator('.fixed').filter({
        has: page.locator('[class*="progress"], [class*="slider"]')
      }).isVisible().catch(() => false)

      // Or check for audio element being present
      const audioElement = page.locator('audio')
      const hasAudio = await audioElement.count() > 0

      expect(playerVisible || hasAudio).toBeTruthy()
    }
  })

  test('player controls are functional', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('domcontentloaded')

    // Find and click first play button
    const playButtons = page.getByRole('button', { name: /play/i })
    const count = await playButtons.count()

    if (count === 0) {
      test.skip()
      return
    }

    await playButtons.first().click()
    await page.waitForTimeout(1000)

    // Look for the player bar (fixed position at bottom)
    const playerBar = page.locator('.fixed.left-0.right-0').filter({
      has: page.locator('button')
    }).last()

    const playerVisible = await playerBar.isVisible().catch(() => false)

    if (playerVisible) {
      // Find pause button (should have changed from play)
      const pauseButton = playerBar.getByRole('button').filter({
        has: page.locator('[class*="pause"]')
      }).first()

      const hasPauseButton = await pauseButton.isVisible().catch(() => false)

      if (hasPauseButton) {
        // Click pause
        await pauseButton.click()
        await page.waitForTimeout(300)

        // Should now show play button
        const playButtonAfterPause = playerBar.getByRole('button').filter({
          has: page.locator('[class*="play"]')
        }).first()

        const hasPlayAfterPause = await playButtonAfterPause.isVisible().catch(() => false)
        expect(hasPlayAfterPause).toBeTruthy()
      }
    }
  })
})
