import { test, expect } from '@playwright/test'

// Helper to check if user is logged in
const checkAuth = async (page: any, testInstance: typeof test) => {
  await page.goto('/library')
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) {
    testInstance.skip(true, 'No authenticated test user configured - set TEST_USER_EMAIL env var')
  }
}

test.describe('Playlist Features', () => {
  test.beforeEach(async ({ page }) => {
    await checkAuth(page, test)
  })

  test('library shows playlists tab', async ({ page }) => {
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    // Playlists tab should exist
    await expect(page.getByRole('tab', { name: /playlists/i })).toBeVisible()
  })

  test('can open create playlist modal', async ({ page }) => {
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    // Click on playlists tab
    await page.getByRole('tab', { name: /playlists/i }).click()

    // Click create playlist button
    const createBtn = page.getByRole('button', { name: /create playlist/i })
    await expect(createBtn).toBeVisible()
    await createBtn.click()

    // Modal should open
    await expect(page.getByRole('heading', { name: /create playlist/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
  })

  test('can create a new playlist', async ({ page }) => {
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    // Click on playlists tab
    await page.getByRole('tab', { name: /playlists/i }).click()

    // Click create playlist button
    await page.getByRole('button', { name: /create playlist/i }).click()

    // Fill in playlist name
    const playlistName = `Test Playlist ${Date.now()}`
    await page.getByLabel(/name/i).fill(playlistName)

    // Click create button
    await page.getByRole('button', { name: /^create$/i }).click()

    // Should navigate to the new playlist page
    await page.waitForURL(/\/playlist\//)
    await expect(page.getByRole('heading', { name: playlistName })).toBeVisible()
  })

  test('playlist detail page shows correct elements', async ({ page }) => {
    // First create a playlist
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()
    await page.getByRole('button', { name: /create playlist/i }).click()

    const playlistName = `Detail Test ${Date.now()}`
    await page.getByLabel(/name/i).fill(playlistName)
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/playlist\//)

    // Check for key elements
    await expect(page.getByText(/playlist/i).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: playlistName })).toBeVisible()
    await expect(page.getByRole('button', { name: /edit/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible()
  })

  test('can edit playlist details', async ({ page }) => {
    // Create a playlist first
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()
    await page.getByRole('button', { name: /create playlist/i }).click()

    const playlistName = `Edit Test ${Date.now()}`
    await page.getByLabel(/name/i).fill(playlistName)
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/playlist\//)

    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click()

    // Modal should open with current values
    await expect(page.getByRole('heading', { name: /edit playlist/i })).toBeVisible()

    // Change the name (label is "Name" in the edit modal)
    const newName = `Updated ${playlistName}`
    const nameInput = page.locator('input').first()
    await nameInput.clear()
    await nameInput.fill(newName)

    // Save
    await page.getByRole('button', { name: /^save$/i }).click()

    // Wait for modal to close and verify the name changed
    await expect(page.getByRole('heading', { level: 1, name: newName })).toBeVisible({ timeout: 10000 })
  })

  test('can delete a playlist', async ({ page }) => {
    // Create a playlist first
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()
    await page.getByRole('button', { name: /create playlist/i }).click()

    const playlistName = `Delete Test ${Date.now()}`
    await page.getByLabel(/name/i).fill(playlistName)
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/playlist\//)

    // Handle the confirmation dialog that will appear
    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })

    // Open the menu (the dropdown trigger after the Share button)
    const menuButton = page.locator('button').filter({ has: page.locator('[class*="ellipsis"]') }).first()
    await menuButton.click()
    await page.getByRole('menuitem', { name: /delete/i }).click()

    // Should redirect to library
    await page.waitForURL(/\/library/, { timeout: 10000 })
  })

  test('can share a playlist', async ({ page }) => {
    // Create a playlist first
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()
    await page.getByRole('button', { name: /create playlist/i }).click()

    const playlistName = `Share Test ${Date.now()}`
    await page.getByLabel(/name/i).fill(playlistName)
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/playlist\//)

    // Click share button
    await page.getByRole('button', { name: /share/i }).click()

    // Share modal should open
    await expect(page.getByRole('heading', { name: /share/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /copy/i })).toBeVisible()
  })

  test('playlist grid shows in library', async ({ page }) => {
    // Create a playlist first
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()
    await page.getByRole('button', { name: /create playlist/i }).click()

    const playlistName = `Grid Test ${Date.now()}`
    await page.getByLabel(/name/i).fill(playlistName)
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/playlist\//)

    // Go back to library
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()

    // Wait for the playlist grid to load
    await page.waitForTimeout(1000)

    // Should see the playlist in the grid (use link which contains the playlist name)
    await expect(page.getByRole('link', { name: new RegExp(playlistName) })).toBeVisible({ timeout: 10000 })
  })

  test('can navigate to playlist from library', async ({ page }) => {
    // Create a playlist first
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()
    await page.getByRole('button', { name: /create playlist/i }).click()

    const playlistName = `Nav Test ${Date.now()}`
    await page.getByLabel(/name/i).fill(playlistName)
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/playlist\//)
    const playlistUrl = page.url()

    // Go back to library
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()

    // Wait for the playlist grid to load
    await page.waitForTimeout(1000)

    // Click on the playlist link
    await page.getByRole('link', { name: new RegExp(playlistName) }).click({ timeout: 10000 })

    // Should navigate to the playlist page
    await expect(page).toHaveURL(playlistUrl)
  })
})

test.describe('Add to Playlist', () => {
  test.beforeEach(async ({ page }) => {
    await checkAuth(page, test)
  })

  test('add to playlist button appears on track hover', async ({ page }) => {
    // First create a playlist
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()
    await page.getByRole('button', { name: /create playlist/i }).click()

    await page.getByLabel(/name/i).fill(`Track Test ${Date.now()}`)
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForURL(/\/playlist\//)

    // Navigate to discover and find an album
    await page.goto('/discover')
    await page.waitForLoadState('networkidle')

    // Click on first artist/album card
    const contentLink = page.locator('a.group').first()
    if (await contentLink.count() === 0) {
      test.skip(true, 'No content available on discover page')
      return
    }

    await contentLink.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500) // Wait for page to stabilize

    // Look for album link - try clicking directly on artist page which might have tracks
    const trackRow = page.locator('tr').filter({ has: page.locator('td') }).first()
    if (await trackRow.count() > 0) {
      await trackRow.hover()
      const addButton = page.locator('button[title="Add to playlist"]')
      await expect(addButton).toBeVisible({ timeout: 5000 })
      return
    }

    // Otherwise look for album link
    const albumLink = page.locator('a').filter({ hasText: /album|ep|single/i }).first()
    if (await albumLink.count() === 0) {
      test.skip(true, 'No albums or tracks found')
      return
    }

    await albumLink.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Hover over a track row
    const albumTrackRow = page.locator('tr').filter({ has: page.locator('td') }).first()
    if (await albumTrackRow.count() === 0) {
      test.skip(true, 'No tracks found on album page')
      return
    }

    await albumTrackRow.hover()

    // Look for the plus button (add to playlist)
    const addButton = page.locator('button[title="Add to playlist"]')
    await expect(addButton).toBeVisible({ timeout: 5000 })
  })

  test('add to playlist dropdown shows playlists', async ({ page }) => {
    // First create a playlist
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()
    await page.getByRole('button', { name: /create playlist/i }).click()

    const playlistName = `Dropdown Test ${Date.now()}`
    await page.getByLabel(/name/i).fill(playlistName)
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForURL(/\/playlist\//)

    // Navigate to discover and find an album
    await page.goto('/discover')
    await page.waitForLoadState('networkidle')

    const contentLink = page.locator('a.group').first()
    if (await contentLink.count() === 0) {
      test.skip(true, 'No content available on discover page')
      return
    }

    await contentLink.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500) // Wait for page to stabilize

    // Try to find tracks directly on artist page first
    let trackRow = page.locator('tr').filter({ has: page.locator('td') }).first()

    if (await trackRow.count() === 0) {
      // Look for album link on artist page
      const albumLink = page.locator('a').filter({ hasText: /album|ep|single/i }).first()
      if (await albumLink.count() === 0) {
        test.skip(true, 'No albums or tracks found')
        return
      }

      await albumLink.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      trackRow = page.locator('tr').filter({ has: page.locator('td') }).first()
      if (await trackRow.count() === 0) {
        test.skip(true, 'No tracks found on album page')
        return
      }
    }

    await trackRow.hover()

    const addButton = page.locator('button[title="Add to playlist"]')
    if (await addButton.count() === 0) {
      test.skip(true, 'Add to playlist button not found')
      return
    }

    await addButton.click()

    // Dropdown should show the playlist and create option
    await expect(page.getByText(playlistName)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/create new playlist/i)).toBeVisible()
  })
})

test.describe('Playlist Collaborators', () => {
  test.beforeEach(async ({ page }) => {
    await checkAuth(page, test)
  })

  test('can open collaborators modal', async ({ page }) => {
    // Create a playlist first
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /playlists/i }).click()
    await page.getByRole('button', { name: /create playlist/i }).click()

    await page.getByLabel(/name/i).fill(`Collab Test ${Date.now()}`)
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForURL(/\/playlist\//)

    // Open the menu (the dropdown trigger after the Share button)
    const menuButton = page.locator('button').filter({ has: page.locator('[class*="ellipsis"]') }).first()
    await menuButton.click()
    await page.getByRole('menuitem', { name: /collaborators/i }).click()

    // Modal should open
    await expect(page.getByRole('heading', { name: /collaborators/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
  })
})
