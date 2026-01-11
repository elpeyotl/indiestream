<template>
  <div v-if="band" class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Back to Dashboard
        </NuxtLink>
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div
            class="w-16 h-16 rounded-xl overflow-hidden shrink-0"
            :style="{ background: `linear-gradient(135deg, ${band.theme_color} 0%, #c026d3 100%)` }"
          >
            <img
              v-if="band.avatar_url"
              :src="band.avatar_url"
              :alt="band.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-2xl font-bold text-white">
                {{ band.name.charAt(0).toUpperCase() }}
              </span>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-zinc-100">{{ band.name }}</h1>
              <UIcon
                v-if="band.is_verified"
                name="i-heroicons-check-badge"
                class="w-6 h-6 text-violet-400"
              />
            </div>
            <NuxtLink
              :to="`/${band.slug}`"
              class="text-sm text-violet-400 hover:text-violet-300"
              target="_blank"
            >
              indiestream.art/{{ band.slug }}
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 inline" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <UButton color="violet" to="/dashboard/artist/upload">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
        Upload Music
      </UButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ formatNumber(band.total_streams) }}</p>
          <p class="text-sm text-zinc-400">Total Streams</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-teal-400">${{ (band.total_earnings_cents / 100).toFixed(2) }}</p>
          <p class="text-sm text-zinc-400">Total Earnings</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ albums.length }}</p>
          <p class="text-sm text-zinc-400">Releases</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">0</p>
          <p class="text-sm text-zinc-400">Followers</p>
        </div>
      </UCard>
    </div>

    <!-- Tabs -->
    <UTabs :items="tabs" class="w-full">
      <!-- Releases Tab -->
      <template #releases>
        <div class="py-6">
          <div v-if="albums.length === 0" class="text-center py-12">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-violet-400" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100 mb-2">No releases yet</h3>
            <p class="text-zinc-400 mb-6">Upload your first album or single to get started.</p>
            <UButton color="violet" to="/dashboard/artist/upload">
              <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
              Upload Music
            </UButton>
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div
              v-for="album in albums"
              :key="album.id"
              class="group relative"
            >
              <!-- Draft Badge -->
              <div v-if="!album.is_published" class="absolute top-2 left-2 z-10">
                <UBadge color="amber" variant="solid" size="xs">
                  <UIcon name="i-heroicons-pencil" class="w-3 h-3 mr-1" />
                  Draft
                </UBadge>
              </div>

              <!-- Album Link -->
              <NuxtLink
                :to="album.is_published ? `/${band?.slug}/${album.slug}` : undefined"
                :class="{ 'cursor-default': !album.is_published }"
              >
                <div class="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img
                    v-if="albumCovers[album.id]"
                    :src="albumCovers[album.id]"
                    :alt="album.title"
                    class="w-full h-full object-cover"
                    :class="{ 'opacity-60': !album.is_published }"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
                  </div>
                </div>
                <h3 class="font-medium text-zinc-100 truncate" :class="{ 'group-hover:text-violet-400': album.is_published }">
                  {{ album.title }}
                </h3>
                <p class="text-sm text-zinc-400">
                  {{ album.release_type === 'ep' ? 'EP' : album.release_type === 'single' ? 'Single' : 'Album' }}
                  · {{ album.tracks?.length || 0 }} tracks
                </p>
              </NuxtLink>

              <!-- Draft Actions -->
              <div v-if="!album.is_published" class="mt-2 flex gap-2">
                <UButton color="red" variant="ghost" size="xs" @click="handleDeleteAlbum(album)">
                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  Delete
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Analytics Tab -->
      <template #analytics>
        <div class="py-6">
          <div class="text-center py-12 text-zinc-400">
            <UIcon name="i-heroicons-chart-bar" class="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Analytics will be available once you have streams</p>
          </div>
        </div>
      </template>

      <!-- Settings Tab -->
      <template #settings>
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
                    variant="outline"
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
                    variant="outline"
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

            <!-- Bio -->
            <UFormGroup label="Bio">
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
              />
            </UFormGroup>

            <!-- Genres -->
            <UFormGroup label="Genres">
              <div class="flex gap-2 mb-2">
                <UInput
                  v-model="genreInput"
                  placeholder="Add a genre..."
                  size="lg"
                  :disabled="saving || editForm.genres.length >= 5"
                  @keydown.enter.prevent="addGenre"
                />
                <UButton
                  color="gray"
                  :disabled="!genreInput.trim() || editForm.genres.length >= 5"
                  @click="addGenre"
                >
                  Add
                </UButton>
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

            <!-- Success/Error Messages -->
            <UAlert
              v-if="saveSuccess"
              color="green"
              variant="soft"
              title="Settings saved successfully"
              icon="i-heroicons-check-circle"
            />
            <UAlert
              v-if="saveError"
              color="red"
              variant="soft"
              :title="saveError"
              icon="i-heroicons-exclamation-triangle"
            />

            <!-- Submit -->
            <div class="flex justify-between pt-4">
              <UButton
                color="red"
                variant="ghost"
                :disabled="saving"
                @click="confirmDelete"
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
    </UTabs>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Artist Profile</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ band.name }}</strong>? This will permanently delete all your releases, tracks, and analytics data.
        </p>
        <p class="text-red-400 text-sm mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="deleting" @click="handleDelete">
              Delete Forever
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="min-h-screen flex items-center justify-center">
    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
  </div>

  <!-- Not Found -->
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-zinc-100 mb-2">Artist Not Found</h1>
      <p class="text-zinc-400 mb-6">This artist profile doesn't exist or you don't have access.</p>
      <UButton color="violet" to="/dashboard">
        Back to Dashboard
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'
import type { Album } from '~/composables/useAlbum'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const { getBandById, updateBand, deleteBand } = useBand()
const { getBandAlbums, getStreamUrl, deleteAlbum } = useAlbum()

const band = ref<Band | null>(null)
const albums = ref<Album[]>([])
const albumCovers = ref<Record<string, string>>({})
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')
const showDeleteModal = ref(false)
const genreInput = ref('')

// Avatar upload
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const uploadingAvatar = ref(false)

// Banner upload
const bannerInput = ref<HTMLInputElement | null>(null)
const bannerPreview = ref<string | null>(null)
const uploadingBanner = ref(false)

const editForm = reactive({
  name: '',
  bio: '',
  location: '',
  website: '',
  theme_color: '#8B5CF6',
  genres: [] as string[],
})

const tabs = [
  { label: 'Releases', slot: 'releases' },
  { label: 'Analytics', slot: 'analytics' },
  { label: 'Settings', slot: 'settings' },
]

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const addGenre = () => {
  const genre = genreInput.value.trim()
  if (genre && editForm.genres.length < 5 && !editForm.genres.includes(genre)) {
    editForm.genres.push(genre)
    genreInput.value = ''
  }
}

const removeGenre = (index: number) => {
  editForm.genres.splice(index, 1)
}

const handleAvatarSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !band.value) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    saveError.value = 'Please upload a JPEG, PNG, or WebP image'
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    saveError.value = 'Image must be smaller than 5MB'
    return
  }

  uploadingAvatar.value = true
  saveError.value = ''

  try {
    // Create preview
    avatarPreview.value = URL.createObjectURL(file)

    // Get presigned URL for upload
    const { uploadUrl, key } = await $fetch('/api/upload/presign', {
      method: 'POST',
      body: {
        type: 'avatar',
        bandId: band.value.id,
        filename: file.name,
        contentType: file.type,
      },
    })

    // Upload to R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })

    if (!uploadResponse.ok) {
      throw new Error('Upload failed')
    }

    // Store the key (not the signed URL) so we can generate fresh URLs later
    await updateBand(band.value.id, { avatar_key: key })

    // Update local state with fresh URL for display
    band.value.avatar_key = key
    band.value.avatar_url = await getStreamUrl(key)

    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) {
    console.error('Avatar upload failed:', e)
    saveError.value = e.message || 'Failed to upload avatar'
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
  if (!file || !band.value) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    saveError.value = 'Please upload a JPEG, PNG, or WebP image'
    return
  }

  // Validate file size (max 10MB for banners)
  if (file.size > 10 * 1024 * 1024) {
    saveError.value = 'Banner image must be smaller than 10MB'
    return
  }

  uploadingBanner.value = true
  saveError.value = ''

  try {
    // Create preview
    bannerPreview.value = URL.createObjectURL(file)

    // Get presigned URL for upload
    const { uploadUrl, key } = await $fetch('/api/upload/presign', {
      method: 'POST',
      body: {
        type: 'banner',
        bandId: band.value.id,
        filename: file.name,
        contentType: file.type,
      },
    })

    // Upload to R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })

    if (!uploadResponse.ok) {
      throw new Error('Upload failed')
    }

    // Store the key (not the signed URL) so we can generate fresh URLs later
    await updateBand(band.value.id, { banner_key: key })

    // Update local state with fresh URL for display
    band.value.banner_key = key
    band.value.banner_url = await getStreamUrl(key)

    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) {
    console.error('Banner upload failed:', e)
    saveError.value = e.message || 'Failed to upload banner'
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
  if (!band.value) return

  saving.value = true
  saveSuccess.value = false
  saveError.value = ''

  try {
    const updated = await updateBand(band.value.id, {
      name: editForm.name,
      bio: editForm.bio || undefined,
      location: editForm.location || undefined,
      website: editForm.website || undefined,
      theme_color: editForm.theme_color,
      genres: editForm.genres,
    })
    band.value = updated
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) {
    saveError.value = e.message || 'Failed to save settings'
  } finally {
    saving.value = false
  }
}

const confirmDelete = () => {
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!band.value) return

  deleting.value = true
  try {
    await deleteBand(band.value.id)
    router.push('/dashboard')
  } catch (e: any) {
    saveError.value = e.message || 'Failed to delete artist profile'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

const handleDeleteAlbum = async (album: Album) => {
  if (!confirm(`Delete "${album.title}"? This action cannot be undone.`)) return

  try {
    await deleteAlbum(album.id)
    albums.value = albums.value.filter(a => a.id !== album.id)
  } catch (e: any) {
    saveError.value = e.message || 'Failed to delete album'
  }
}

onMounted(async () => {
  try {
    const id = route.params.id as string
    band.value = await getBandById(id)

    if (band.value) {
      // Populate edit form
      editForm.name = band.value.name
      editForm.bio = band.value.bio || ''
      editForm.location = band.value.location || ''
      editForm.website = band.value.website || ''
      editForm.theme_color = band.value.theme_color || '#8B5CF6'
      editForm.genres = [...(band.value.genres || [])]

      // Load avatar URL from key if available
      if (band.value.avatar_key) {
        try {
          band.value.avatar_url = await getStreamUrl(band.value.avatar_key)
        } catch (e) {
          console.error('Failed to load avatar:', e)
        }
      }

      // Load banner URL from key if available
      if (band.value.banner_key) {
        try {
          band.value.banner_url = await getStreamUrl(band.value.banner_key)
        } catch (e) {
          console.error('Failed to load banner:', e)
        }
      }

      // Load albums (including unpublished drafts)
      albums.value = await getBandAlbums(band.value.id, true)

      // Load cover URLs
      for (const album of albums.value) {
        if (album.cover_key) {
          try {
            albumCovers.value[album.id] = await getStreamUrl(album.cover_key)
          } catch (e) {
            console.error('Failed to load cover:', e)
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to load band:', e)
  } finally {
    loading.value = false
  }
})
</script>
