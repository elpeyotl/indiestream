/**
 * Test User Credentials for E2E Tests
 *
 * To run authenticated tests, create these users in your Supabase instance:
 *
 * 1. TEST_USER: Regular listener account
 *    - Create via /register page or Supabase dashboard
 *
 * 2. TEST_ARTIST: User with artist profile
 *    - Create account, then create an artist via /dashboard/artist/new
 *
 * 3. TEST_ADMIN: Admin user
 *    - Create account, then set role='admin' in profiles table:
 *    UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
 *
 * Alternatively, set environment variables:
 * - TEST_USER_EMAIL / TEST_USER_PASSWORD
 * - TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 */

// Regular listener user
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
}

// User with artist profile
export const TEST_ARTIST = {
  email: process.env.TEST_ARTIST_EMAIL || 'artist@example.com',
  password: process.env.TEST_ARTIST_PASSWORD || 'artistpassword123',
}

// Admin user (role: 'admin' in profiles table)
export const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'adminpassword123',
}
