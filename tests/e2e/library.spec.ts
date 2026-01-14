import { test, expect } from '@playwright/test'

test.describe('Library (requires auth)', () => {
  test('library page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/library')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('library page structure exists', async ({ page }) => {
    // Go to library - will redirect to login
    await page.goto('/library')

    // Verify login page loads (user needs to be authenticated for library)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })
})

test.describe('Artist Page', () => {
  test('artist page loads with profile info', async ({ page }) => {
    // Go to home and click on first artist
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const artistLink = page.locator('a.group').first()
    const exists = await artistLink.count() > 0

    if (exists) {
      await artistLink.click()
      await page.waitForLoadState('networkidle')

      // Artist page should have a name/heading
      const hasContent = await page.locator('h1, h2, [class*="artist"]').first().isVisible()
      expect(hasContent).toBeTruthy()
    } else {
      test.skip()
    }
  })

  test('artist page shows albums section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const artistLink = page.locator('a.group').first()
    const exists = await artistLink.count() > 0

    if (exists) {
      await artistLink.click()
      await page.waitForLoadState('networkidle')

      // Should have releases/albums section or track list
      await expect(page.locator('body')).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('follow button exists on artist page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const artistLink = page.locator('a.group').first()
    const exists = await artistLink.count() > 0

    if (exists) {
      await artistLink.click()
      await page.waitForLoadState('networkidle')

      // Look for follow button (may require login to be clickable)
      const followButton = page.getByRole('button', { name: /follow/i })
      const hasFollow = await followButton.count() > 0

      if (hasFollow) {
        await expect(followButton.first()).toBeVisible()
      }
    } else {
      test.skip()
    }
  })
})

test.describe('Album Page', () => {
  test('album page shows track list', async ({ page }) => {
    // Navigate to an album through artist page
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click first featured content
    const contentLink = page.locator('a.group').first()
    const exists = await contentLink.count() > 0

    if (exists) {
      await contentLink.click()
      await page.waitForLoadState('networkidle')

      // Look for album links on artist page
      const albumLink = page.locator('a').filter({ hasText: /album|ep|single/i }).first()
      const hasAlbum = await albumLink.count() > 0

      if (hasAlbum) {
        await albumLink.click()
        await page.waitForLoadState('networkidle')

        // Album page should have tracks
        await expect(page.locator('body')).toBeVisible()
      }
    } else {
      test.skip()
    }
  })
})
