// User profile composable with SSR-safe caching
// Uses useState for SSR compatibility
import type { Database } from '~/types/database'

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const isCacheValid = <T>(entry: CacheEntry<T> | undefined | null): entry is CacheEntry<T> => {
  if (!entry) return false
  return Date.now() - entry.timestamp < CACHE_TTL_MS
}

export interface PublicUserProfile {
  id: string
  displayName: string | null
  avatarKey: string | null
  avatarUrl: string | null
  bio: string | null
  location: string | null
  website: string | null
  createdAt: string
  followedArtists: {
    id: string
    name: string
    slug: string
    avatarKey: string | null
    avatarUrl: string | null
    verified: boolean
  }[]
}

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  avatarKey: string | null
  avatarUrl: string | null
  bio: string | null
  location: string | null
  website: string | null
  role: string
  createdAt: string
  showImpactPublicly?: boolean
}

// Module-level cache for public profiles (client-side only, not SSR-sensitive)
const publicProfileCache = new Map<string, CacheEntry<PublicUserProfile>>()

export const useUserProfile = () => {
  // Use useState for SSR-safe shared state (hydrates correctly)
  const ownProfile = useState<UserProfile | null>('ownProfile', () => null)
  const ownProfileLoading = useState<boolean>('ownProfileLoading', () => false)
  const ownProfileError = useState<string | null>('ownProfileError', () => null)
  const ownProfileLoaded = useState<boolean>('ownProfileLoaded', () => false)

  // Computed getters
  const isLoggedIn = computed(() => !!ownProfile.value)
  const displayName = computed(() => ownProfile.value?.displayName || 'User')
  const avatarUrl = computed(() => ownProfile.value?.avatarUrl)
  const isAdmin = computed(() => ownProfile.value?.role === 'admin')

  // Fetch own profile (for settings, navbar, etc.)
  const fetchOwnProfile = async (forceRefresh = false): Promise<UserProfile | null> => {
    // Skip if already loaded and not forcing refresh
    if (ownProfileLoaded.value && !forceRefresh && ownProfile.value) {
      return ownProfile.value
    }

    ownProfileLoading.value = true
    ownProfileError.value = null

    try {
      const data = await $fetch<UserProfile>('/api/user/profile')
      ownProfile.value = data
      ownProfileLoaded.value = true
      return data
    } catch (e: any) {
      console.error('Failed to fetch own profile:', e)
      ownProfileError.value = e.message || 'Failed to load profile'
      return null
    } finally {
      ownProfileLoading.value = false
    }
  }

  // Fetch public profile (for viewing other users)
  const fetchPublicProfile = async (userId: string, forceRefresh = false): Promise<PublicUserProfile | null> => {
    // Check cache first (client-side only)
    if (!forceRefresh && import.meta.client) {
      const cached = publicProfileCache.get(userId)
      if (isCacheValid(cached)) {
        return cached.data
      }
    }

    try {
      const data = await $fetch<PublicUserProfile>(`/api/user/${userId}`)
      // Cache the result (client-side only)
      if (import.meta.client) {
        publicProfileCache.set(userId, { data, timestamp: Date.now() })
      }
      return data
    } catch (e: any) {
      console.error('Failed to fetch public profile:', e)
      return null
    }
  }

  // Update own profile
  const updateProfile = async (updates: {
    displayName?: string
    bio?: string
    location?: string
    website?: string
    showImpactPublicly?: boolean
  }): Promise<UserProfile> => {
    ownProfileLoading.value = true
    ownProfileError.value = null

    try {
      const data = await $fetch<UserProfile>('/api/user/profile', {
        method: 'PUT',
        body: updates,
      })
      // Update state
      ownProfile.value = data
      return data
    } catch (e: any) {
      console.error('Failed to update profile:', e)
      ownProfileError.value = e.message || 'Failed to update profile'
      throw e
    } finally {
      ownProfileLoading.value = false
    }
  }

  // Upload avatar
  const uploadAvatar = async (file: File): Promise<string> => {
    ownProfileLoading.value = true
    ownProfileError.value = null

    try {
      // Step 1: Get presigned upload URL
      const { uploadUrl, avatarKey } = await $fetch<{ uploadUrl: string; avatarKey: string }>(
        '/api/user/avatar-upload-url',
        {
          method: 'POST',
          body: {
            fileName: file.name,
            contentType: file.type,
          },
        }
      )

      // Step 2: Upload file to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload avatar')
      }

      // Step 3: Update profile with new avatar_key
      const client = useSupabaseClient<Database>()
      const user = useSupabaseUser()

      const { error: updateError } = await client
        .from('profiles')
        .update({ avatar_key: avatarKey })
        .eq('id', user.value?.id)

      if (updateError) {
        throw updateError
      }

      // Refresh own profile to get new avatar URL
      await fetchOwnProfile(true)

      return avatarKey
    } catch (e: any) {
      console.error('Failed to upload avatar:', e)
      ownProfileError.value = e.message || 'Failed to upload avatar'
      throw e
    } finally {
      ownProfileLoading.value = false
    }
  }

  // Clear own profile (on logout)
  const clearOwnProfile = () => {
    ownProfile.value = null
    ownProfileLoaded.value = false
    ownProfileError.value = null
  }

  // Invalidate public profile cache
  const invalidatePublicProfile = (userId?: string) => {
    if (import.meta.client) {
      if (userId) {
        publicProfileCache.delete(userId)
      } else {
        publicProfileCache.clear()
      }
    }
  }

  return {
    // State (SSR-safe with useState)
    ownProfile,
    ownProfileLoading,
    ownProfileError,
    ownProfileLoaded,

    // Computed getters
    isLoggedIn,
    displayName,
    avatarUrl,
    isAdmin,

    // Actions
    fetchOwnProfile,
    fetchPublicProfile,
    updateProfile,
    uploadAvatar,
    clearOwnProfile,
    invalidatePublicProfile,
  }
}
