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

        <!-- Error Message -->
        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :title="error"
          icon="i-heroicons-exclamation-triangle"
        />

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

const form = reactive({
  name: '',
  slug: '',
  bio: '',
  location: '',
  genres: [] as string[],
})

const genreInput = ref('')
const loading = ref(false)
const error = ref('')
const slugStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')

let slugCheckTimeout: ReturnType<typeof setTimeout> | null = null

const isValid = computed(() => {
  return form.name.trim() && form.slug.trim() && slugStatus.value === 'available'
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
  if (!isValid.value) return

  loading.value = true
  error.value = ''

  try {
    const band = await createBand({
      name: form.name.trim(),
      slug: form.slug.trim(),
      bio: form.bio.trim() || undefined,
      location: form.location.trim() || undefined,
      genres: form.genres,
    })

    // Redirect to the new band's management page
    router.push(`/dashboard/artist/${band.id}`)
  } catch (e: any) {
    error.value = e.message || 'Failed to create artist profile'
  } finally {
    loading.value = false
  }
}
</script>
