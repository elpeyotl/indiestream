interface PublicUserProfile {
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

interface UserProfile {
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
}

export const useUserProfile = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const profile = ref<PublicUserProfile | UserProfile | null>(null)

  // Fetch public profile (for viewing)
  const fetchPublicProfile = async (userId: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<PublicUserProfile>(`/api/user/${userId}`)
      profile.value = data
    } catch (e: any) {
      console.error('Failed to fetch user profile:', e)
      error.value = e.message || 'Failed to load profile'
    } finally {
      loading.value = false
    }
  }

  // Fetch own profile (for settings)
  const fetchOwnProfile = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<UserProfile>('/api/user/profile')
      profile.value = data
    } catch (e: any) {
      console.error('Failed to fetch user profile:', e)
      error.value = e.message || 'Failed to load profile'
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates: {
    displayName?: string
    bio?: string
    location?: string
    website?: string
  }) => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch('/api/user/profile', {
        method: 'PUT',
        body: updates
      })
      // Update local profile if it matches
      if (profile.value && profile.value.id === data.id) {
        profile.value = { ...profile.value, ...data }
      }
      return data
    } catch (e: any) {
      console.error('Failed to update profile:', e)
      error.value = e.message || 'Failed to update profile'
      throw e
    } finally {
      loading.value = false
    }
  }

  const uploadAvatar = async (file: File) => {
    loading.value = true
    error.value = null
    try {
      // Step 1: Get presigned upload URL
      const { uploadUrl, avatarKey } = await $fetch('/api/user/avatar-upload-url', {
        method: 'POST',
        body: {
          fileName: file.name,
          contentType: file.type
        }
      })

      // Step 2: Upload file to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload avatar')
      }

      // Step 3: Update profile with new avatar_key
      const client = useSupabaseClient()
      const user = useSupabaseUser()

      const { error: updateError } = await client
        .from('profiles')
        .update({ avatar_key: avatarKey })
        .eq('id', user.value?.id)

      if (updateError) {
        throw updateError
      }

      // Refresh profile to get new avatar URL
      await fetchOwnProfile()

      return avatarKey
    } catch (e: any) {
      console.error('Failed to upload avatar:', e)
      error.value = e.message || 'Failed to upload avatar'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    profile,
    fetchPublicProfile,
    fetchOwnProfile,
    updateProfile,
    uploadAvatar
  }
}
