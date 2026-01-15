<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { profile, loading, error, fetchOwnProfile, updateProfile, uploadAvatar } = useUserProfile()
const toast = useToast()

// Form state
const form = reactive({
  displayName: '',
  bio: '',
  location: '',
  website: ''
})

const user = useSupabaseUser()
const showImpactPublicly = ref(false)

// Load current profile
onMounted(async () => {
  await fetchOwnProfile()
  if (profile.value) {
    form.displayName = profile.value.displayName || ''
    form.bio = profile.value.bio || ''
    form.location = profile.value.location || ''
    form.website = profile.value.website || ''
    showImpactPublicly.value = (profile.value as any).showImpactPublicly || false
  }
})

// Avatar upload
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)

const handleAvatarClick = () => {
  avatarInput.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: 'Error',
      description: 'Avatar must be less than 5MB',
      color: 'red'
    })
    return
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: 'Error',
      description: 'Avatar must be JPEG, PNG, WebP, or GIF',
      color: 'red'
    })
    return
  }

  avatarUploading.value = true
  try {
    await uploadAvatar(file)
    toast.add({
      title: 'Success',
      description: 'Avatar updated successfully',
      color: 'green'
    })
  } catch (e: any) {
    toast.add({
      title: 'Error',
      description: e.message || 'Failed to upload avatar',
      color: 'red'
    })
  } finally {
    avatarUploading.value = false
  }
}

// Character counter
const bioLength = computed(() => form.bio.length)
const bioLimitReached = computed(() => bioLength.value > 280)

// Form submission
const saving = ref(false)

const handleSubmit = async () => {
  // Validation
  if (!form.displayName.trim()) {
    toast.add({
      title: 'Error',
      description: 'Display name is required',
      color: 'red'
    })
    return
  }

  if (bioLimitReached.value) {
    toast.add({
      title: 'Error',
      description: 'Bio must be 280 characters or less',
      color: 'red'
    })
    return
  }

  if (form.website && !form.website.match(/^https?:\/\//)) {
    toast.add({
      title: 'Error',
      description: 'Website must start with http:// or https://',
      color: 'red'
    })
    return
  }

  saving.value = true
  try {
    await updateProfile({
      displayName: form.displayName.trim(),
      bio: form.bio.trim() || undefined,
      location: form.location.trim() || undefined,
      website: form.website.trim() || undefined,
      showImpactPublicly: showImpactPublicly.value
    })

    toast.add({
      title: 'Success',
      description: 'Profile updated successfully',
      color: 'green'
    })

    // Navigate to public profile
    if (user.value) {
      setTimeout(() => {
        navigateTo(`/user/${user.value!.id}`)
      }, 1000)
    }
  } catch (e: any) {
    toast.add({
      title: 'Error',
      description: e.message || 'Failed to update profile',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 md:p-8">
    <h1 class="text-3xl font-bold text-zinc-100 mb-8">Settings</h1>

    <!-- Loading state -->
    <div v-if="loading && !profile" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-zinc-400" />
    </div>

    <!-- Form -->
    <UCard v-else>
      <h2 class="text-xl font-semibold text-zinc-100 mb-6">Profile</h2>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Avatar section -->
        <div>
          <label class="block text-sm font-medium text-zinc-300 mb-2">
            Avatar
          </label>
          <div class="flex items-center gap-4">
            <UserAvatar
              v-if="profile"
              :user="profile"
              size="xl"
            />
            <div>
              <input
                ref="avatarInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="hidden"
                @change="handleAvatarChange"
              />
              <UButton
                type="button"
                variant="outline"
                :loading="avatarUploading"
                @click="handleAvatarClick"
              >
                {{ avatarUploading ? 'Uploading...' : 'Change Avatar' }}
              </UButton>
              <p class="text-xs text-zinc-500 mt-1">
                JPEG, PNG, WebP, or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        <!-- Display name -->
        <div>
          <label for="displayName" class="block text-sm font-medium text-zinc-300 mb-2">
            Display Name *
          </label>
          <UInput
            id="displayName"
            v-model="form.displayName"
            placeholder="Your name"
            required
            maxlength="50"
          />
        </div>

        <!-- Bio -->
        <div>
          <label for="bio" class="block text-sm font-medium text-zinc-300 mb-2">
            Bio
          </label>
          <UTextarea
            id="bio"
            v-model="form.bio"
            placeholder="Tell us about yourself..."
            rows="4"
            maxlength="280"
          />
          <p
            :class="[
              'text-xs text-right mt-1',
              bioLimitReached ? 'text-red-400' : 'text-zinc-500'
            ]"
          >
            {{ bioLength }} / 280
          </p>
        </div>

        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-zinc-300 mb-2">
            Location
          </label>
          <UInput
            id="location"
            v-model="form.location"
            placeholder="e.g. San Francisco, CA"
            maxlength="100"
          />
        </div>

        <!-- Website -->
        <div>
          <label for="website" class="block text-sm font-medium text-zinc-300 mb-2">
            Website
          </label>
          <UInput
            id="website"
            v-model="form.website"
            type="url"
            placeholder="https://example.com"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <UButton
            type="submit"
            color="violet"
            :loading="saving"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </UButton>
        </div>
      </form>
    </UCard>

    <!-- Privacy Settings -->
    <UCard class="mt-6">
      <h2 class="text-xl font-semibold text-zinc-100 mb-6">Privacy</h2>

      <div class="space-y-4">
        <label class="flex items-start gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-3 -mx-3 transition-colors">
          <UCheckbox v-model="showImpactPublicly" class="mt-1" />
          <div>
            <span class="text-sm font-medium text-zinc-300 block mb-1">
              Show my impact stats on my public profile
            </span>
            <span class="text-xs text-zinc-500 leading-relaxed block">
              Let others see how much you've supported artists on Indiestream. This displays your total earnings sent to artists, number of artists supported, listening time, and stream count on your public profile page.
            </span>
          </div>
        </label>
      </div>

      <!-- Note: Privacy setting auto-saves with profile -->
      <p class="text-xs text-zinc-500 mt-6 p-3 bg-zinc-900/50 rounded-lg">
        <UIcon name="i-heroicons-information-circle" class="inline-block mr-1" />
        Privacy settings are saved when you save your profile changes.
      </p>
    </UCard>
  </div>
</template>
