<template>
  <div class="py-6 space-y-6">
    <!-- Search and Filters -->
    <div class="flex flex-wrap gap-4">
      <UInput
        v-model="bandSearch"
        placeholder="Search by name, slug, or location..."
        size="lg"
        class="flex-1 min-w-[300px]"
        :ui="{ icon: { trailing: { pointer: '' } } }"
        @keyup.enter="loadBands(1)"
      >
        <template #leading>
          <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
        </template>
      </UInput>

      <!-- Status Filter -->
      <USelectMenu
        v-model="bandStatusFilter"
        :options="statusFilterOptions"
        value-attribute="value"
        option-attribute="label"
        placeholder="Status"
        size="lg"
        class="w-40"
        @update:model-value="loadBands(1)"
      />

      <!-- Featured Filter -->
      <USelectMenu
        v-model="bandFeaturedFilter"
        :options="featuredFilterOptions"
        value-attribute="value"
        option-attribute="label"
        placeholder="Featured"
        size="lg"
        class="w-40"
        @update:model-value="loadBands(1)"
      />

      <!-- Verified Filter -->
      <USelectMenu
        v-model="bandVerifiedFilter"
        :options="verifiedFilterOptions"
        value-attribute="value"
        option-attribute="label"
        placeholder="Verified"
        size="lg"
        class="w-40"
        @update:model-value="loadBands(1)"
      />

      <UButton color="gray" @click="loadBands">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- Artists Table -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div v-if="bandsLoading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <div v-else-if="bands.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-musical-note" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No artists found</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Artist</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Owner</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Stats</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Badges</th>
              <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="band in bands"
              :key="band.id"
              class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0"
                  >
                    <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p class="font-medium text-zinc-100">{{ band.name }}</p>
                    <p class="text-sm text-zinc-400">@{{ band.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="text-sm">
                  <p class="text-zinc-300">{{ band.owner?.display_name || 'No name' }}</p>
                  <p class="text-zinc-500">{{ band.owner?.email }}</p>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="text-sm">
                  <span class="text-zinc-400">{{ band.album_count }} albums</span>
                  <span class="text-zinc-600 mx-1">|</span>
                  <span class="text-zinc-400">{{ band.track_count }} tracks</span>
                  <span class="text-zinc-600 mx-1">|</span>
                  <span class="text-zinc-400">{{ formatNumber(band.total_streams) }} streams</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="band.status === 'active' ? 'green' : band.status === 'suspended' ? 'yellow' : 'red'"
                  variant="subtle"
                  size="xs"
                >
                  {{ band.status }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <div class="flex gap-1">
                  <UBadge
                    v-if="band.is_verified"
                    color="blue"
                    variant="subtle"
                    size="xs"
                  >
                    <UIcon name="i-heroicons-check-badge" class="w-3 h-3 mr-1" />
                    Verified
                  </UBadge>
                  <UBadge
                    v-if="band.is_featured"
                    color="violet"
                    variant="subtle"
                    size="xs"
                  >
                    <UIcon name="i-heroicons-star" class="w-3 h-3 mr-1" />
                    Featured
                  </UBadge>
                </div>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex justify-end gap-2">
                  <UButton
                    color="violet"
                    variant="ghost"
                    size="xs"
                    @click="openEditBandModal(band)"
                  >
                    <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                  </UButton>
                  <UButton
                    color="red"
                    variant="ghost"
                    size="xs"
                    @click="confirmDeleteBand(band)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="bandsPagination.totalPages > 1" class="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
        <p class="text-sm text-zinc-400">
          Showing {{ (bandsPagination.page - 1) * bandsPagination.limit + 1 }} - {{ Math.min(bandsPagination.page * bandsPagination.limit, bandsPagination.total) }} of {{ bandsPagination.total }}
        </p>
        <div class="flex gap-2">
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            :disabled="bandsPagination.page <= 1"
            @click="loadBands(bandsPagination.page - 1)"
          >
            Previous
          </UButton>
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            :disabled="bandsPagination.page >= bandsPagination.totalPages"
            @click="loadBands(bandsPagination.page + 1)"
          >
            Next
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Edit Band Modal -->
    <UModal v-model="showEditBandModal" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-pencil" class="w-5 h-5 text-violet-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Edit Artist</h3>
          </div>
        </template>

        <div v-if="bandToEdit" class="space-y-4">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Name">
              <UInput v-model="editBandForm.name" />
            </UFormGroup>
            <UFormGroup label="Slug">
              <UInput v-model="editBandForm.slug" />
            </UFormGroup>
          </div>

          <UFormGroup label="Tagline" :hint="`${editBandForm.tagline?.length || 0}/150 characters`">
            <UInput v-model="editBandForm.tagline" :maxlength="150" />
          </UFormGroup>

          <UFormGroup label="Bio" hint="Full bio shown in About tab">
            <UTextarea v-model="editBandForm.bio" rows="3" />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Location">
              <UInput v-model="editBandForm.location" />
            </UFormGroup>
            <UFormGroup label="Website">
              <UInput v-model="editBandForm.website" type="url" />
            </UFormGroup>
          </div>

          <!-- Status Controls -->
          <div class="pt-4 border-t border-zinc-800">
            <h4 class="text-sm font-medium text-zinc-300 mb-3">Admin Controls</h4>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Status">
                <USelectMenu
                  v-model="editBandForm.status"
                  :options="statusOptions"
                  value-attribute="value"
                  option-attribute="label"
                />
              </UFormGroup>
              <UFormGroup label="Genres">
                <UInput v-model="editBandForm.genresInput" placeholder="rock, pop, indie" />
              </UFormGroup>
            </div>

            <div v-if="editBandForm.status === 'suspended'" class="mt-4">
              <UFormGroup label="Suspension Reason">
                <UTextarea v-model="editBandForm.suspension_reason" rows="2" />
              </UFormGroup>
            </div>

            <div class="flex gap-4 mt-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <UCheckbox v-model="editBandForm.is_verified" />
                <span class="text-sm text-zinc-300">
                  <UIcon name="i-heroicons-check-badge" class="w-4 h-4 inline text-blue-400" />
                  Verified Artist
                </span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <UCheckbox v-model="editBandForm.is_featured" />
                <span class="text-sm text-zinc-300">
                  <UIcon name="i-heroicons-star" class="w-4 h-4 inline text-violet-400" />
                  Featured on Homepage
                </span>
              </label>
            </div>
          </div>

          <!-- Stripe Info (readonly for now) -->
          <div class="pt-4 border-t border-zinc-800">
            <h4 class="text-sm font-medium text-zinc-300 mb-3">Payment Info</h4>
            <div class="text-sm text-zinc-400 space-y-1">
              <p>Stripe Account: {{ bandToEdit.stripe_account_id || 'Not connected' }}</p>
              <p>Onboarding Complete: {{ bandToEdit.stripe_onboarding_complete ? 'Yes' : 'No' }}</p>
              <p>Total Earnings: ${{ formatCents(bandToEdit.total_earnings_cents) }}</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showEditBandModal = false" :disabled="updatingBand">
              Cancel
            </UButton>
            <UButton color="violet" :loading="updatingBand" @click="handleUpdateBand">
              Save Changes
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Band Confirmation Modal -->
    <UModal v-model="showDeleteBandModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Artist</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ bandToDelete?.name }}</strong>?
        </p>
        <p class="text-zinc-400 text-sm mt-2">
          This will permanently delete:
        </p>
        <ul class="text-zinc-400 text-sm mt-1 list-disc list-inside">
          <li>{{ bandToDelete?.album_count || 0 }} album(s)</li>
          <li>{{ bandToDelete?.track_count || 0 }} track(s)</li>
          <li>All listening history and analytics</li>
          <li>All earnings and payout records</li>
        </ul>
        <p class="text-red-400 text-sm mt-3">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteBandModal = false" :disabled="deletingBand">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingBand" @click="handleDeleteBand">
              Delete Artist
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { AdminBand } from '~/types/admin'
import { statusFilterOptions, featuredFilterOptions, verifiedFilterOptions, statusOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'

const emit = defineEmits<{
  statsUpdated: []
}>()

const { toast, formatNumber, formatCents } = useAdminUtils()

// State
const bands = ref<AdminBand[]>([])
const bandsLoading = ref(false)
const bandSearch = ref('')
const bandStatusFilter = ref('all')
const bandFeaturedFilter = ref('all')
const bandVerifiedFilter = ref('all')
const bandsPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

// Edit band
const showEditBandModal = ref(false)
const updatingBand = ref(false)
const bandToEdit = ref<AdminBand | null>(null)
const editBandForm = ref({
  name: '',
  slug: '',
  tagline: '',
  bio: '',
  location: '',
  website: '',
  status: 'active',
  is_verified: false,
  is_featured: false,
  suspension_reason: '',
  genresInput: '',
})

// Delete band
const showDeleteBandModal = ref(false)
const deletingBand = ref(false)
const bandToDelete = ref<AdminBand | null>(null)

const loadBands = async (page = 1) => {
  bandsLoading.value = true
  try {
    const data = await $fetch('/api/admin/bands', {
      query: {
        page,
        limit: 50,
        search: bandSearch.value,
        status: bandStatusFilter.value,
        featured: bandFeaturedFilter.value,
        verified: bandVerifiedFilter.value,
      },
    })

    bands.value = data.bands as AdminBand[]
    bandsPagination.value = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }
  } catch (e: any) {
    console.error('Failed to load bands:', e)
    toast.add({
      title: 'Failed to load artists',
      description: e.message,
      color: 'red',
    })
  } finally {
    bandsLoading.value = false
  }
}

const openEditBandModal = (band: AdminBand) => {
  bandToEdit.value = band
  editBandForm.value = {
    name: band.name,
    slug: band.slug,
    tagline: band.tagline || '',
    bio: band.bio || '',
    location: band.location || '',
    website: band.website || '',
    status: band.status,
    is_verified: band.is_verified,
    is_featured: band.is_featured,
    suspension_reason: band.suspension_reason || '',
    genresInput: band.genres?.join(', ') || '',
  }
  showEditBandModal.value = true
}

const handleUpdateBand = async () => {
  if (!bandToEdit.value) return

  updatingBand.value = true
  try {
    // Parse genres from comma-separated string
    const genres = editBandForm.value.genresInput
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0)

    await $fetch(`/api/admin/bands/${bandToEdit.value.id}`, {
      method: 'PATCH',
      body: {
        name: editBandForm.value.name,
        slug: editBandForm.value.slug,
        tagline: editBandForm.value.tagline,
        bio: editBandForm.value.bio,
        location: editBandForm.value.location,
        website: editBandForm.value.website,
        status: editBandForm.value.status,
        is_verified: editBandForm.value.is_verified,
        is_featured: editBandForm.value.is_featured,
        suspension_reason: editBandForm.value.suspension_reason,
        genres,
      },
    })

    toast.add({
      title: 'Artist updated',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showEditBandModal.value = false

    // Reload bands
    loadBands(bandsPagination.value.page)
    emit('statsUpdated')
  } catch (e: any) {
    console.error('Failed to update band:', e)
    toast.add({
      title: 'Failed to update artist',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    updatingBand.value = false
  }
}

const confirmDeleteBand = (band: AdminBand) => {
  bandToDelete.value = band
  showDeleteBandModal.value = true
}

const handleDeleteBand = async () => {
  if (!bandToDelete.value) return

  deletingBand.value = true
  try {
    await $fetch(`/api/admin/bands/${bandToDelete.value.id}`, {
      method: 'DELETE',
    })

    // Remove from local state
    bands.value = bands.value.filter(b => b.id !== bandToDelete.value!.id)
    bandsPagination.value.total -= 1

    toast.add({
      title: 'Artist deleted',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showDeleteBandModal.value = false
    emit('statsUpdated')
  } catch (e: any) {
    console.error('Failed to delete band:', e)
    toast.add({
      title: 'Failed to delete artist',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    deletingBand.value = false
  }
}

onMounted(() => {
  loadBands()
})
</script>
