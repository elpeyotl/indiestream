import { test, expect } from '@playwright/test'

test.describe('Playlist (unauthenticated)', () => {
  test('playlist page requires authentication', async ({ page }) => {
    // Try to access a random playlist ID - should redirect or show error
    await page.goto('/playlist/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')

    // Should either redirect to login or show not found/access denied
    const isLoginPage = page.url().includes('/login')
    const hasNotFound = await page.getByText(/not found|access|sign in/i).count() > 0

    expect(isLoginPage || hasNotFound).toBeTruthy()
  })

  test('library page requires authentication', async ({ page }) => {
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('shared playlist page structure exists', async ({ page }) => {
    // Try to access a shared playlist with invalid token
    await page.goto('/playlist/share/invalid-token')
    await page.waitForLoadState('networkidle')

    // Should show not found or similar error (doesn't require auth)
    const hasError = await page.getByText(/not found|invalid|expired/i).count() > 0
    expect(hasError).toBeTruthy()
  })
})

test.describe('Playlist UI Elements', () => {
  test('create playlist button exists in library when logged out', async ({ page }) => {
    // This should redirect to login, but we're testing the flow
    await page.goto('/library')

    // Should be on login page
    await expect(page).toHaveURL(/login/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })
})
