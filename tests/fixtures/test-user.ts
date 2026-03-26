/**
 * Test User Credentials for E2E Tests
 *
 * These users are created by supabase/seed.sql:
 *
 * 1. TEST_USER: Regular listener (subscribed)
 *    - test@test.test / test123test123
 *
 * 2. TEST_ARTIST: User with artist profile (owns "Iron Veil")
 *    - artist@test.test / test123test123
 *
 * 3. TEST_ADMIN: Admin user
 *    - admin@test.test / test123test123
 *
 * To reset test data: npx supabase db reset --linked
 * Override credentials via env vars if needed.
 */

// Regular listener user (subscribed)
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@test.test',
  password: process.env.TEST_USER_PASSWORD || 'test123test123',
}

// User with artist profile
export const TEST_ARTIST = {
  email: process.env.TEST_ARTIST_EMAIL || 'artist@test.test',
  password: process.env.TEST_ARTIST_PASSWORD || 'test123test123',
}

// Admin user (role: 'admin' in profiles table)
export const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@test.test',
  password: process.env.TEST_ADMIN_PASSWORD || 'test123test123',
}
