<template>
  <div class="py-6 max-w-2xl">
    <form @submit.prevent="saveSettings" class="space-y-6">
      <!-- Banner Upload -->
      <UFormGroup label="Banner Image">
        <div class="space-y-3">
          <!-- Preview -->
          <div
            class="w-full h-32 md:h-40 rounded-xl overflow-hidden"
            :style="{ background: bannerPreview || band?.banner_url ? 'transparent' : `linear-gradient(135deg, ${editForm.theme_color}40 0%, #09090b 100%)` }"
          >
            <img
              v-if="bannerPreview || band?.banner_url"
              :src="bannerPreview || band?.banner_url || ''"
              alt="Artist banner"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <div class="text-center text-zinc-500">
                <UIcon name="i-heroicons-photo" class="w-8 h-8 mx-auto mb-2" />
                <p class="text-sm">No banner image</p>
              </div>
            </div>
          </div>

          <!-- Upload Button -->
          <div>
            <input
              ref="bannerInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleBannerSelect"
            />
            <UButton
              color="gray"
              variant="ghost"
              :loading="uploadingBanner"
              :disabled="saving"
              @click="bannerInput?.click()"
            >
              <UIcon name="i-heroicons-photo" class="w-4 h-4 mr-2" />
              {{ band?.banner_url ? 'Change Banner' : 'Upload Banner' }}
            </UButton>
            <p class="text-xs text-zinc-500 mt-2">
              Recommended: Wide image (16:9), at least 1920x1080px. JPG, PNG, or WebP.
            </p>
          </div>
        </div>
      </UFormGroup>

      <!-- Avatar Upload -->
      <UFormGroup label="Artist Photo">
        <div class="flex items-center gap-6">
          <!-- Preview -->
          <div
            class="w-24 h-24 rounded-xl overflow-hidden shrink-0"
            :style="{ background: `linear-gradient(135deg, ${editForm.theme_color} 0%, #c026d3 100%)` }"
          >
            <img
              v-if="avatarPreview || band?.avatar_url"
              :src="avatarPreview || band?.avatar_url || ''"
              alt="Artist avatar"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-3xl font-bold text-white">
                {{ editForm.name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
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
              variant="ghost"
              :loading="uploadingAvatar"
              :disabled="saving"
              @click="avatarInput?.click()"
            >
              <UIcon name="i-heroicons-camera" class="w-4 h-4 mr-2" />
              {{ band?.avatar_url ? 'Change Photo' : 'Upload Photo' }}
            </UButton>
            <p class="text-xs text-zinc-500 mt-2">
              Recommended: Square image, at least 400x400px. JPG, PNG, or WebP.
            </p>
          </div>
        </div>
      </UFormGroup>

      <!-- Name -->
      <UFormGroup label="Artist / Band Name">
        <UInput v-model="editForm.name" size="lg" :disabled="saving" />
      </UFormGroup>

      <!-- Tagline -->
      <UFormGroup label="Tagline" :hint="`${editForm.tagline?.length || 0}/150 characters`">
        <UInput
          v-model="editForm.tagline"
          size="lg"
          placeholder="A brief one-liner about your sound..."
          :disabled="saving"
          :maxlength="150"
        />
      </UFormGroup>

      <!-- Bio -->
      <UFormGroup label="Bio" hint="Full bio shown in the About tab">
        <UTextarea
          v-model="editForm.bio"
          :rows="4"
          size="lg"
          placeholder="Tell your story..."
          :disabled="saving"
        />
      </UFormGroup>

      <!-- Location -->
      <UFormGroup label="Location">
        <UInput
          v-model="editForm.location"
          size="lg"
          placeholder="e.g. Berlin, Germany"
          :disabled="saving"
        />
      </UFormGroup>

      <!-- Website -->
      <UFormGroup label="Website">
        <UInput
          v-model="editForm.website"
          size="lg"
          placeholder="https://yourwebsite.com"
          :disabled="saving"
        >
          <template #leading>
            <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-zinc-400" />
          </template>
        </UInput>
      </UFormGroup>

      <!-- Social Links Section -->
      <div class="border-t border-zinc-800 pt-6 mt-2">
        <h3 class="text-lg font-semibold text-zinc-100 mb-1">Social Links</h3>
        <p class="text-sm text-zinc-400 mb-4">Connect with your fans on other platforms</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Instagram -->
          <UFormGroup label="Instagram">
            <UInput
              v-model="editForm.instagram"
              placeholder="@username or full URL"
              size="lg"
              :disabled="saving"
            >
              <template #leading>
                <UIcon name="i-simple-icons-instagram" class="w-4 h-4 text-zinc-400" />
              </template>
            </UInput>
          </UFormGroup>

          <!-- Spotify -->
          <UFormGroup label="Spotify">
            <UInput
              v-model="editForm.spotify"
              placeholder="Spotify artist URL"
              size="lg"
              :disabled="saving"
            >
              <template #leading>
                <UIcon name="i-simple-icons-spotify" class="w-4 h-4 text-zinc-400" />
              </template>
            </UInput>
          </UFormGroup>

          <!-- YouTube -->
          <UFormGroup label="YouTube">
            <UInput
              v-model="editForm.youtube"
              placeholder="YouTube channel URL"
              size="lg"
              :disabled="saving"
            >
              <template #leading>
                <UIcon name="i-simple-icons-youtube" class="w-4 h-4 text-zinc-400" />
              </template>
            </UInput>
          </UFormGroup>

          <!-- SoundCloud -->
          <UFormGroup label="SoundCloud">
            <UInput
              v-model="editForm.soundcloud"
              placeholder="SoundCloud profile URL"
              size="lg"
              :disabled="saving"
            >
              <template #leading>
                <UIcon name="i-simple-icons-soundcloud" class="w-4 h-4 text-zinc-400" />
              </template>
            </UInput>
          </UFormGroup>

          <!-- Bandcamp -->
          <UFormGroup label="Bandcamp">
            <UInput
              v-model="editForm.bandcamp"
              placeholder="Bandcamp page URL"
              size="lg"
              :disabled="saving"
            >
              <template #leading>
                <UIcon name="i-simple-icons-bandcamp" class="w-4 h-4 text-zinc-400" />
              </template>
            </UInput>
          </UFormGroup>

          <!-- Twitter/X -->
          <UFormGroup label="Twitter / X">
            <UInput
              v-model="editForm.twitter"
              placeholder="@username or full URL"
              size="lg"
              :disabled="saving"
            >
              <template #leading>
                <UIcon name="i-simple-icons-x" class="w-4 h-4 text-zinc-400" />
              </template>
            </UInput>
          </UFormGroup>

          <!-- TikTok -->
          <UFormGroup label="TikTok">
            <UInput
              v-model="editForm.tiktok"
              placeholder="@username or full URL"
              size="lg"
              :disabled="saving"
            >
              <template #leading>
                <UIcon name="i-simple-icons-tiktok" class="w-4 h-4 text-zinc-400" />
              </template>
            </UInput>
          </UFormGroup>
        </div>
      </div>

      <!-- Genres -->
      <UFormGroup label="Genres">
        <div class="relative">
          <div class="flex gap-2 mb-2">
            <UInput
              v-model="genreInput"
              placeholder="Search or add a genre..."
              size="lg"
              :disabled="saving || editForm.genres.length >= 5"
              @input="searchGenres"
              @keydown.enter.prevent="selectFirstSuggestion"
              @keydown.escape="genreSuggestions = []"
            />
            <UButton
              color="gray"
              :disabled="!genreInput.trim() || editForm.genres.length >= 5"
              @click="addGenre"
            >
              Add
            </UButton>
          </div>
          <!-- Genre suggestions dropdown -->
          <div
            v-if="genreSuggestions.length > 0"
            class="absolute z-50 top-full left-0 right-16 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            <button
              v-for="suggestion in genreSuggestions"
              :key="suggestion"
              type="button"
              class="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
              @click="selectGenre(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
        <div v-if="editForm.genres.length" class="flex flex-wrap gap-2">
          <UBadge
            v-for="(genre, index) in editForm.genres"
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
        <p class="text-xs text-zinc-500 mt-2">Up to 5 genres. Select existing genres when possible to help fans find your music.</p>
      </UFormGroup>

      <!-- Theme Color -->
      <UFormGroup label="Theme Color">
        <div class="flex items-center gap-3">
          <input
            v-model="editForm.theme_color"
            type="color"
            class="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
            :disabled="saving"
          />
          <UInput v-model="editForm.theme_color" size="lg" class="w-32" :disabled="saving" />
        </div>
      </UFormGroup>

      <!-- Submit -->
      <div class="flex justify-between pt-4">
        <UButton
          color="red"
          variant="ghost"
          :disabled="saving"
          @click="$emit('delete')"
        >
          Delete Artist Profile
        </UButton>
        <UButton
          type="submit"
          color="violet"
          :loading="saving"
        >
          Save Changes
        </UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/stores/band'
import { useArtistDashboard } from '~/composables/useArtistDashboard'

const props = defineProps<{
  band: Band
}>()

const emit = defineEmits<{
  saved: [band: Band]
  delete: []
}>()

const { toast } = useArtistDashboard()
const bandStore = useBandStore()
const { updateBand } = bandStore
const albumStore = useAlbumStore()
const { getStreamUrl } = albumStore

// State
const saving = ref(false)
const genreInput = ref('')
const allGenres = ref<string[]>([])
const genreSuggestions = ref<string[]>([])

// Avatar upload
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const uploadingAvatar = ref(false)

// Banner upload
const bannerInput = ref<HTMLInputElement | null>(null)
const bannerPreview = ref<string | null>(null)
const uploadingBanner = ref(false)

// Edit form
const editForm = reactive({
  name: '',
  tagline: '',
  bio: '',
  location: '',
  website: '',
  theme_color: '#8b5cf6',
  genres: [] as string[],
  instagram: '',
  twitter: '',
  youtube: '',
  spotify: '',
  soundcloud: '',
  bandcamp: '',
  tiktok: '',
})

// Initialize form from band
watch(() => props.band, (newBand) => {
  if (newBand) {
    editForm.name = newBand.name || ''
    editForm.tagline = newBand.tagline || ''
    editForm.bio = newBand.bio || ''
    editForm.location = newBand.location || ''
    editForm.website = newBand.website || ''
    editForm.theme_color = newBand.theme_color || '#8b5cf6'
    editForm.genres = [...(newBand.genres || [])]
    editForm.instagram = newBand.instagram || ''
    editForm.twitter = newBand.twitter || ''
    editForm.youtube = newBand.youtube || ''
    editForm.spotify = newBand.spotify || ''
    editForm.soundcloud = newBand.soundcloud || ''
    editForm.bandcamp = newBand.bandcamp || ''
    editForm.tiktok = newBand.tiktok || ''
  }
}, { immediate: true })

// Load genres on mount for autocomplete
onMounted(() => {
  loadAllGenres()
})

// Load all genres for autocomplete
const loadAllGenres = async () => {
  try {
    const data = await $fetch<{ genres: Array<{ name: string }> }>('/api/genres')
    allGenres.value = data.genres.map(g => g.name)
  } catch (e) {
    console.error('Failed to load genres:', e)
  }
}

const searchGenres = () => {
  const query = genreInput.value.toLowerCase().trim()
  if (!query) {
    genreSuggestions.value = []
    return
  }
  // Filter genres that match query and aren't already selected (case-insensitive)
  genreSuggestions.value = allGenres.value
    .filter(g =>
      g.toLowerCase().includes(query) &&
      !editForm.genres.some(selected => selected.toLowerCase() === g.toLowerCase())
    )
    .slice(0, 5)
}

const selectGenre = (genre: string) => {
  if (editForm.genres.length < 5 && !editForm.genres.some(g => g.toLowerCase() === genre.toLowerCase())) {
    editForm.genres.push(genre)
  }
  genreInput.value = ''
  genreSuggestions.value = []
}

const selectFirstSuggestion = () => {
  if (genreSuggestions.value.length > 0) {
    selectGenre(genreSuggestions.value[0])
  } else {
    addGenre()
  }
}

const addGenre = () => {
  const genre = genreInput.value.trim()
  if (genre && editForm.genres.length < 5 && !editForm.genres.some(g => g.toLowerCase() === genre.toLowerCase())) {
    // Use existing genre casing if it exists, otherwise use input as-is
    const existing = allGenres.value.find(g => g.toLowerCase() === genre.toLowerCase())
    editForm.genres.push(existing || genre)
    genreInput.value = ''
    genreSuggestions.value = []
  }
}

const removeGenre = (index: number) => {
  editForm.genres.splice(index, 1)
}

const handleAvatarSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !props.band) return

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

  uploadingAvatar.value = true

  try {
    // Create preview
    avatarPreview.value = URL.createObjectURL(file)

    // Upload and process image (resizes to square)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'avatar')
    formData.append('key', `avatars/${props.band.id}/avatar.jpg`)

    const { key } = await $fetch<{ key: string }>('/api/upload/process-image', {
      method: 'POST',
      body: formData,
    })

    // Store the key (not the signed URL) so we can generate fresh URLs later
    const updated = await updateBand(props.band.id, { avatar_key: key })

    // Update local state with fresh URL for display
    if (updated) {
      updated.avatar_url = await getStreamUrl(key)
      emit('saved', updated)
    }

    toast.add({ title: 'Photo updated', color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (e: any) {
    console.error('Avatar upload failed:', e)
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to upload photo', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    avatarPreview.value = null
  } finally {
    uploadingAvatar.value = false
    // Reset input
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
  }
}

const handleBannerSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !props.band) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, or WebP image', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  // Validate file size (max 10MB for banners)
  if (file.size > 10 * 1024 * 1024) {
    toast.add({ title: 'File too large', description: 'Banner must be smaller than 10MB', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  uploadingBanner.value = true

  try {
    // Create preview
    bannerPreview.value = URL.createObjectURL(file)

    // Upload and process image (resizes to 1500x500)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'banner')
    formData.append('key', `banners/${props.band.id}/banner.jpg`)

    const { key } = await $fetch<{ key: string }>('/api/upload/process-image', {
      method: 'POST',
      body: formData,
    })

    // Store the key (not the signed URL) so we can generate fresh URLs later
    const updated = await updateBand(props.band.id, { banner_key: key })

    // Update local state with fresh URL for display
    if (updated) {
      updated.banner_url = await getStreamUrl(key)
      emit('saved', updated)
    }

    toast.add({ title: 'Banner updated', color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (e: any) {
    console.error('Banner upload failed:', e)
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to upload banner', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    bannerPreview.value = null
  } finally {
    uploadingBanner.value = false
    // Reset input
    if (bannerInput.value) {
      bannerInput.value.value = ''
    }
  }
}

const saveSettings = async () => {
  if (!props.band) return

  saving.value = true

  try {
    const updated = await updateBand(props.band.id, {
      name: editForm.name,
      tagline: editForm.tagline || undefined,
      bio: editForm.bio || undefined,
      location: editForm.location || undefined,
      website: editForm.website || undefined,
      theme_color: editForm.theme_color,
      genres: editForm.genres,
      // Social links
      instagram: editForm.instagram || undefined,
      twitter: editForm.twitter || undefined,
      youtube: editForm.youtube || undefined,
      spotify: editForm.spotify || undefined,
      soundcloud: editForm.soundcloud || undefined,
      bandcamp: editForm.bandcamp || undefined,
      tiktok: editForm.tiktok || undefined,
    })
    if (updated) {
      emit('saved', updated)
    }
    toast.add({ title: 'Settings saved', color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (e: any) {
    toast.add({ title: 'Save failed', description: e.message || 'Failed to save settings', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    saving.value = false
  }
}
</script>
