<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        Back to Dashboard
      </NuxtLink>
      <h1 class="text-3xl font-bold text-zinc-100">Create Your Artist Profile</h1>
      <p class="text-zinc-400 mt-2">Set up your band or artist page to start uploading music</p>
    </div>

    <!-- Form -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Artist Photo (Required) -->
        <UFormGroup label="Artist Photo" required>
          <div class="flex items-center gap-6">
            <!-- Preview -->
            <div
              class="w-24 h-24 rounded-xl overflow-hidden shrink-0 border-2 transition-colors"
              :class="avatarFile ? 'border-green-500/50' : 'border-dashed border-zinc-600'"
              :style="{ background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #8B5CF6 0%, #c026d3 100%)' }"
            >
              <img
                v-if="avatarPreview"
                :src="avatarPreview"
                alt="Artist avatar preview"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-heroicons-camera" class="w-8 h-8 text-white/60" />
              </div>
            </div>

            <!-- Upload Button -->
            <div class="flex-1">
              <input
                ref="avatarInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="handleAvatarSelect"
              />
              <UButton
                color="gray"
                variant="outline"
                :disabled="loading"
                @click="avatarInput?.click()"
              >
                <UIcon name="i-heroicons-camera" class="w-4 h-4 mr-2" />
                {{ avatarFile ? 'Change Photo' : 'Upload Photo' }}
              </UButton>
              <p class="text-xs text-zinc-500 mt-2">
                Required. Square image, at least 400x400px. JPG, PNG, or WebP.
              </p>
              <p v-if="avatarFile" class="text-xs text-green-400 mt-1">
                <UIcon name="i-heroicons-check-circle" class="w-3 h-3 inline mr-1" />
                {{ avatarFile.name }}
              </p>
            </div>
          </div>
        </UFormGroup>

        <!-- Artist/Band Name -->
        <UFormGroup label="Artist / Band Name" required>
          <UInput
            v-model="form.name"
            placeholder="e.g. The Midnight Waves"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <!-- URL Slug -->
        <UFormGroup label="Your URL" required>
          <template #hint>
            <span class="text-zinc-500">indiestream.art/</span>
          </template>
          <div class="relative">
            <UInput
              v-model="form.slug"
              placeholder="the-midnight-waves"
              size="lg"
              :disabled="loading"
              @input="onSlugInput"
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <UIcon
                v-if="slugStatus === 'checking'"
                name="i-heroicons-arrow-path"
                class="w-5 h-5 text-zinc-400 animate-spin"
              />
              <UIcon
                v-else-if="slugStatus === 'available'"
                name="i-heroicons-check-circle"
                class="w-5 h-5 text-green-500"
              />
              <UIcon
                v-else-if="slugStatus === 'taken'"
                name="i-heroicons-x-circle"
                class="w-5 h-5 text-red-500"
              />
            </div>
          </div>
          <template #help>
            <span v-if="slugStatus === 'taken'" class="text-red-400">
              This URL is already taken
            </span>
            <span v-else-if="slugStatus === 'available'" class="text-green-400">
              This URL is available
            </span>
            <span v-else class="text-zinc-500">
              Choose a unique URL for your artist page
            </span>
          </template>
        </UFormGroup>

        <!-- Bio -->
        <UFormGroup label="Bio" hint="Optional">
          <UTextarea
            v-model="form.bio"
            placeholder="Tell your story..."
            :rows="4"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <!-- Location -->
        <UFormGroup label="Location" hint="Optional">
          <UInput
            v-model="form.location"
            placeholder="e.g. Berlin, Germany"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <!-- Genres -->
        <UFormGroup label="Genres" hint="Optional - Add up to 5 genres">
          <div class="flex gap-2 mb-2">
            <UInput
              v-model="genreInput"
              placeholder="Add a genre..."
              size="lg"
              :disabled="loading || form.genres.length >= 5"
              @keydown.enter.prevent="addGenre"
            />
            <UButton
              color="gray"
              variant="solid"
              :disabled="!genreInput.trim() || form.genres.length >= 5"
              @click="addGenre"
            >
              Add
            </UButton>
          </div>
          <div v-if="form.genres.length" class="flex flex-wrap gap-2">
            <UBadge
              v-for="(genre, index) in form.genres"
              :key="index"
              color="violet"
              variant="soft"
              class="cursor-pointer"
              @click="removeGenre(index)"
            >
              {{ genre }}
              <UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1" />
            </UBadge>
          </div>
        </UFormGroup>

        <!-- Submit -->
        <div class="flex justify-end gap-3 pt-4">
          <UButton
            color="gray"
            variant="ghost"
            to="/dashboard"
            :disabled="loading"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="violet"
            size="lg"
            :loading="loading"
            :disabled="!isValid"
          >
            Create Artist Profile
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { createBand, isSlugAvailable, generateSlug } = useBand()
const router = useRouter()
const toast = useToast()

const form = reactive({
  name: '',
  slug: '',
  bio: '',
  location: '',
  genres: [] as string[],
})

const genreInput = ref('')
const loading = ref(false)
const slugStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')

// Avatar upload state
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

let slugCheckTimeout: ReturnType<typeof setTimeout> | null = null

const isValid = computed(() => {
  return form.name.trim() && form.slug.trim() && slugStatus.value === 'available' && avatarFile.value !== null
})

// Track if user has manually edited the slug
const userEditedSlug = ref(false)

// Watch for name changes and auto-update slug
watch(() => form.name, (newName) => {
  if (!userEditedSlug.value) {
    form.slug = generateSlug(newName)
    checkSlugDebounced()
  }
})

// Mark slug as manually edited when user types in slug field
const onSlugInput = () => {
  userEditedSlug.value = true
  checkSlugDebounced()
}

const checkSlugDebounced = () => {
  if (slugCheckTimeout) clearTimeout(slugCheckTimeout)

  const slug = form.slug.trim()
  if (!slug) {
    slugStatus.value = 'idle'
    return
  }

  slugStatus.value = 'checking'
  slugCheckTimeout = setTimeout(async () => {
    try {
      const available = await isSlugAvailable(slug)
      slugStatus.value = available ? 'available' : 'taken'
    } catch (e) {
      slugStatus.value = 'idle'
    }
  }, 500)
}

const handleAvatarSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, or WebP image', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({ title: 'File too large', description: 'Image must be smaller than 5MB', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

const addGenre = () => {
  const genre = genreInput.value.trim()
  if (genre && form.genres.length < 5 && !form.genres.includes(genre)) {
    form.genres.push(genre)
    genreInput.value = ''
  }
}

const removeGenre = (index: number) => {
  form.genres.splice(index, 1)
}

const handleSubmit = async () => {
  if (!isValid.value || !avatarFile.value) return

  loading.value = true

  try {
    // First create the band to get the ID
    const band = await createBand({
      name: form.name.trim(),
      slug: form.slug.trim(),
      bio: form.bio.trim() || undefined,
      location: form.location.trim() || undefined,
      genres: form.genres,
    })

    // Then upload the avatar
    try {
      const formData = new FormData()
      formData.append('file', avatarFile.value)
      formData.append('type', 'avatar')
      formData.append('key', `avatars/${band.id}/avatar.jpg`)

      const { key } = await $fetch<{ key: string }>('/api/upload/process-image', {
        method: 'POST',
        body: formData,
      })

      // Update the band with the avatar key
      const { updateBand } = useBand()
      await updateBand(band.id, { avatar_key: key })
    } catch (uploadError) {
      console.error('Avatar upload failed:', uploadError)
      // Don't fail the whole creation, just show a warning
      toast.add({ title: 'Photo upload issue', description: 'Profile created but photo upload failed. You can add it later in settings.', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    }

    toast.add({ title: 'Artist profile created', color: 'green', icon: 'i-heroicons-check-circle' })
    // Redirect to the new band's management page
    router.push(`/dashboard/artist/${band.id}`)
  } catch (e: any) {
    toast.add({ title: 'Creation failed', description: e.message || 'Failed to create artist profile', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    loading.value = false
  }
}
</script>
