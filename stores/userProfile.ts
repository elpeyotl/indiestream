// User profile store using plain Pinia
import type { Database } from '~/types/database'

// Types
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

export interface UpdateProfileInput {
  displayName?: string
  bio?: string
  location?: string
  website?: string
  showImpactPublicly?: boolean
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

// Track in-flight revalidations to prevent duplicate requests
let ownProfileRevalidating = false
const revalidatingPublicProfile = new Set<string>()

export const useUserProfileStore = defineStore('userProfile', () => {
  const user = useSupabaseUser()

  // Computed user ID
  const userId = computed(() => user.value?.id || null)

  // State
  const ownProfile = ref<UserProfile | null>(null)
  const ownProfileLoading = ref(false)
  const ownProfileError = ref<string | null>(null)
  const ownProfileLoaded = ref(false)

  // Public profile cache (Map for dynamic keys)
  const publicProfileCache = new Map<string, { data: PublicUserProfile; fetchedAt: number }>()

  // Cache timestamp for own profile
  let ownProfileFetchedAt = 0

  // Check if cache is stale
  const isOwnProfileStale = () => Date.now() - ownProfileFetchedAt > CACHE_TTL
  const isPublicProfileStale = (profileId: string) => {
    const cached = publicProfileCache.get(profileId)
    return !cached || Date.now() - cached.fetchedAt > CACHE_TTL
  }

  // ===== SWR REVALIDATION FUNCTIONS =====

  // Background revalidation for own profile
  const revalidateOwnProfile = async () => {
    if (ownProfileRevalidating) return
    ownProfileRevalidating = true
    try {
      const data = await $fetch<UserProfile>('/api/user/profile')
      ownProfile.value = data
      ownProfileFetchedAt = Date.now()
      ownProfileLoaded.value = true
    } catch (e) {
      console.error('Failed to revalidate own profile:', e)
    } finally {
      ownProfileRevalidating = false
    }
  }

  // Background revalidation for public profile
  const revalidatePublicProfile = async (profileUserId: string) => {
    if (revalidatingPublicProfile.has(profileUserId)) return
    revalidatingPublicProfile.add(profileUserId)
    try {
      const data = await $fetch<PublicUserProfile>(`/api/user/${profileUserId}`)
      publicProfileCache.set(profileUserId, { data, fetchedAt: Date.now() })
    } catch (e) {
      console.error('Failed to revalidate public profile:', e)
    } finally {
      revalidatingPublicProfile.delete(profileUserId)
    }
  }

  // Computed getters for own profile
  const isLoggedIn = computed(() => !!ownProfile.value)
  const displayName = computed(() => ownProfile.value?.displayName || 'User')
  const avatarUrl = computed(() => ownProfile.value?.avatarUrl)
  const isAdmin = computed(() => ownProfile.value?.role === 'admin')

  // SWR: Fetch own profile - returns cached data immediately, revalidates in background if stale
  const fetchOwnProfile = async (forceRefresh = false): Promise<UserProfile | null> => {
    if (import.meta.server) return null
    if (!userId.value) return null

    const hasCachedData = ownProfile.value !== null || ownProfileFetchedAt > 0

    // If we have cached data, return it immediately
    if (hasCachedData && !forceRefresh) {
      // Trigger background revalidation if stale
      if (isOwnProfileStale()) {
        revalidateOwnProfile()
      }
      return ownProfile.value
    }

    // No cached data or force refresh - fetch and wait
    ownProfileLoading.value = true
    ownProfileError.value = null

    try {
      const data = await $fetch<UserProfile>('/api/user/profile')
      ownProfile.value = data
      ownProfileFetchedAt = Date.now()
      ownProfileLoaded.value = true
      return data
    } catch (e: any) {
      console.error('Failed to fetch own profile:', e)
      ownProfileError.value = e.message || 'Failed to fetch profile'
      return null
    } finally {
      ownProfileLoading.value = false
    }
  }

  // SWR: Fetch public profile - returns cached data immediately, revalidates in background if stale
  const fetchPublicProfile = async (profileUserId: string, forceRefresh = false): Promise<PublicUserProfile | null> => {
    if (import.meta.server) return null

    const cached = publicProfileCache.get(profileUserId)

    // If we have cached data (even if stale), return it immediately
    if (cached && !forceRefresh) {
      // Trigger background revalidation if stale
      if (isPublicProfileStale(profileUserId)) {
        revalidatePublicProfile(profileUserId)
      }
      return cached.data
    }

    // No cached data or force refresh - fetch and wait
    try {
      const data = await $fetch<PublicUserProfile>(`/api/user/${profileUserId}`)
      publicProfileCache.set(profileUserId, { data, fetchedAt: Date.now() })
      return data
    } catch (e: any) {
      console.error('Failed to fetch public profile:', e)
      return null
    }
  }

  // Update profile
  const updateProfile = async (updates: UpdateProfileInput): Promise<UserProfile> => {
    const data = await $fetch<UserProfile>('/api/user/profile', {
      method: 'PUT',
      body: updates,
    })

    // Update cache
    ownProfile.value = data
    ownProfileFetchedAt = Date.now()

    return data
  }

  // Upload avatar
  const uploadAvatar = async (file: File): Promise<string> => {
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

      if (!userId.value) {
        throw new Error('User not logged in')
      }

      const { error: updateError } = await client
        .from('profiles')
        .update({ avatar_key: avatarKey })
        .eq('id', userId.value)

      if (updateError) {
        throw updateError
      }

      // Refresh own profile to get new avatar URL
      await fetchOwnProfile(true)

      return avatarKey
    } catch (e: any) {
      console.error('Failed to upload avatar:', e)
      throw e
    }
  }

  // Clear own profile (on logout)
  const clearOwnProfile = () => {
    ownProfile.value = null
    ownProfileFetchedAt = 0
    ownProfileLoaded.value = false
  }

  // Invalidate public profile cache
  const invalidatePublicProfile = (profileUserId?: string) => {
    if (profileUserId) {
      publicProfileCache.delete(profileUserId)
    } else {
      publicProfileCache.clear()
    }
  }

  // Clear state when user logs out
  watch(userId, (newUserId) => {
    if (!newUserId) {
      clearOwnProfile()
    }
  })

  return {
    // State
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
})
