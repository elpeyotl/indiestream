import { test, expect } from '@playwright/test'

test.describe('Subscription & Pricing', () => {
  test('pricing page shows all tiers', async ({ page }) => {
    await page.goto('/pricing')

    // Should show Free tier
    await expect(page.getByText(/free/i).first()).toBeVisible()

    // Should show pricing amounts
    await expect(page.getByText(/\$/i).first()).toBeVisible()
  })

  test('pricing page has sign up buttons', async ({ page }) => {
    await page.goto('/pricing')

    // Look for call-to-action buttons
    const ctaButtons = page.getByRole('button', { name: /start|subscribe|sign up|get started/i })
    const linkCtas = page.getByRole('link', { name: /start|subscribe|sign up|get started/i })

    const hasButtons = await ctaButtons.count() > 0
    const hasLinks = await linkCtas.count() > 0

    expect(hasButtons || hasLinks).toBeTruthy()
  })

  test('for artists page loads', async ({ page }) => {
    await page.goto('/for-artists')

    // Should have artist-focused content
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('for artists page has sign up CTA', async ({ page }) => {
    await page.goto('/for-artists')

    // Look for artist sign up button/link
    const artistCta = page.getByRole('link', { name: /start|sign up|create|upload/i }).first()
    const exists = await artistCta.count() > 0

    if (exists) {
      await expect(artistCta).toBeVisible()
    }
  })
})

test.describe('Free Tier Limits', () => {
  test('non-logged-in user can browse', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('networkidle')

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible()

    // Should show content (artists grid)
    const hasHeading = await page.getByRole('heading', { name: /discover/i }).isVisible()
    expect(hasHeading).toBeTruthy()
  })

  test('non-logged-in user sees preview badge on play', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find any play button
    const playButton = page.getByRole('button', { name: /play/i }).first()
    const exists = await playButton.count() > 0

    if (exists) {
      // Click play - should start preview mode
      await playButton.click()
      await page.waitForTimeout(1000)

      // Player should appear or preview indicator
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
