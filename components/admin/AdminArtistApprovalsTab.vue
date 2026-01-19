<template>
  <div class="py-6 space-y-6">
    <!-- Stats - Clickable Filters on Desktop -->
    <div class="hidden md:grid grid-cols-4 gap-4">
      <button
        class="text-left transition-all rounded-lg"
        :class="artistApprovalsStatusFilter === 'all' ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="artistApprovalsStatusFilter = 'all'; loadArtistApprovals()"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-zinc-100">{{ pendingArtists.length }}</p>
            <p class="text-sm text-zinc-400">Total</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="artistApprovalsStatusFilter === 'pending' ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="artistApprovalsStatusFilter = 'pending'; loadArtistApprovals()"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-orange-400">{{ pendingArtistCount }}</p>
            <p class="text-sm text-zinc-400">Pending Approval</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="artistApprovalsStatusFilter === 'active' ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="artistApprovalsStatusFilter = 'active'; loadArtistApprovals()"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-green-400">{{ artistApprovalsStats.active }}</p>
            <p class="text-sm text-zinc-400">Active Artists</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="artistApprovalsStatusFilter === 'removed' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="artistApprovalsStatusFilter = 'removed'; loadArtistApprovals()"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-red-400">{{ artistApprovalsStats.rejected }}</p>
            <p class="text-sm text-zinc-400">Rejected</p>
          </div>
        </UCard>
      </button>
    </div>

    <!-- Mobile Stats (non-clickable) -->
    <div class="md:hidden grid grid-cols-2 gap-4">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-2xl font-bold text-orange-400">{{ pendingArtistCount }}</p>
          <p class="text-xs text-zinc-400">Pending</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-2xl font-bold text-green-400">{{ artistApprovalsStats.active }}</p>
          <p class="text-xs text-zinc-400">Active</p>
        </div>
      </UCard>
    </div>

    <!-- Filters - Always visible -->
    <div class="flex flex-wrap gap-4">
      <USelectMenu
        v-model="artistApprovalsStatusFilter"
        :options="artistApprovalsStatusOptions"
        value-attribute="value"
        option-attribute="label"
        size="lg"
        class="w-40"
        @update:model-value="loadArtistApprovals"
      />
      <UButton color="gray" @click="loadArtistApprovals">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- Artist Approvals Table -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div v-if="artistApprovalsLoading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <div v-else-if="pendingArtists.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No artists to review</p>
        <p class="text-sm mt-1">{{ artistApprovalsStatusFilter === 'pending' ? 'All artist profiles have been reviewed!' : 'No artists found with this status.' }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Artist</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Bio</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Owner</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Created</th>
              <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="artist in pendingArtists"
              :key="artist.id"
              class="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
              @click="openArtistDetail(artist)"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div
                    v-if="artist.avatar_url"
                    class="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                    :style="{ backgroundImage: `url(${artist.avatar_url})` }"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0"
                  >
                    <UIcon name="i-heroicons-user" class="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p class="font-medium text-zinc-100">{{ artist.name }}</p>
                    <p v-if="artist.genres?.length" class="text-xs text-zinc-500">{{ artist.genres.slice(0, 2).join(', ') }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 max-w-xs">
                <p class="text-sm text-zinc-400 truncate" :title="artist.bio || 'No bio'">
                  {{ artist.bio || 'No bio provided' }}
                </p>
              </td>
              <td class="py-3 px-4">
                <p class="text-sm text-zinc-300">{{ artist.owner?.email || 'Unknown' }}</p>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="artist.status === 'pending' ? 'orange' : artist.status === 'active' ? 'green' : 'red'"
                  variant="subtle"
                  size="xs"
                >
                  {{ artist.status === 'removed' ? 'Rejected' : artist.status }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-sm text-zinc-400">
                {{ formatDate(artist.created_at) }}
              </td>
              <td class="py-3 px-4 text-right" @click.stop>
                <div v-if="artist.status === 'pending'" class="flex justify-end gap-2">
                  <UButton
                    color="green"
                    variant="ghost"
                    size="xs"
                    :loading="artistActionLoading"
                    @click="approveArtist(artist)"
                  >
                    <UIcon name="i-heroicons-check" class="w-4 h-4" />
                  </UButton>
                  <UButton
                    color="red"
                    variant="ghost"
                    size="xs"
                    @click="openRejectArtistModal(artist)"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Reject Artist Modal -->
    <UModal v-model="showRejectArtistModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-x-circle" class="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-zinc-100">Reject Artist</h3>
              <p class="text-sm text-zinc-400">{{ artistToReject?.name }}</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-zinc-300">
            Please provide a reason for rejecting this artist profile. This will be sent to the artist.
          </p>
          <UTextarea
            v-model="rejectArtistReason"
            placeholder="Enter reason for rejection..."
            :rows="3"
            autofocus
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="showRejectArtistModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="artistActionLoading"
              :disabled="!rejectArtistReason.trim()"
              @click="rejectArtist"
            >
              Reject Artist
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Artist Detail Modal -->
    <UModal v-model="showArtistDetailModal" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard v-if="selectedArtist">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                v-if="selectedArtist.avatar_url"
                class="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0"
                :style="{ backgroundImage: `url(${selectedArtist.avatar_url})` }"
              />
              <div
                v-else
                class="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0"
              >
                <UIcon name="i-heroicons-user" class="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-zinc-100">{{ selectedArtist.name }}</h3>
                <p class="text-sm text-zinc-400">{{ selectedArtist.slug }}</p>
              </div>
            </div>
            <UBadge
              :color="selectedArtist.status === 'pending' ? 'orange' : selectedArtist.status === 'active' ? 'green' : 'red'"
              variant="subtle"
            >
              {{ selectedArtist.status === 'removed' ? 'Rejected' : selectedArtist.status }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Bio -->
          <div>
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Bio</h4>
            <p class="text-zinc-200 whitespace-pre-wrap">{{ selectedArtist.bio || 'No bio provided' }}</p>
          </div>

          <!-- Details Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium text-zinc-400 mb-1">Location</h4>
              <p class="text-zinc-200">{{ selectedArtist.location || 'Not specified' }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-zinc-400 mb-1">Website</h4>
              <p v-if="selectedArtist.website" class="text-violet-400">
                <a :href="selectedArtist.website" target="_blank" rel="noopener" class="hover:underline">
                  {{ selectedArtist.website }}
                </a>
              </p>
              <p v-else class="text-zinc-500">Not specified</p>
            </div>
          </div>

          <!-- Genres -->
          <div v-if="selectedArtist.genres?.length">
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Genres</h4>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="genre in selectedArtist.genres"
                :key="genre"
                color="violet"
                variant="soft"
              >
                {{ genre }}
              </UBadge>
            </div>
          </div>

          <!-- Social Links -->
          <div v-if="hasAnySocialLink(selectedArtist)">
            <h4 class="text-sm font-medium text-zinc-400 mb-3">Social Links</h4>
            <div class="grid grid-cols-2 gap-3">
              <a
                v-if="selectedArtist.instagram"
                :href="formatSocialUrl(selectedArtist.instagram, 'instagram')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-instagram" class="w-5 h-5 text-pink-400" />
                <span class="text-sm text-zinc-200 truncate">{{ selectedArtist.instagram }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.spotify"
                :href="formatSocialUrl(selectedArtist.spotify, 'spotify')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-spotify" class="w-5 h-5 text-green-400" />
                <span class="text-sm text-zinc-200 truncate">Spotify</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.youtube"
                :href="formatSocialUrl(selectedArtist.youtube, 'youtube')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-youtube" class="w-5 h-5 text-red-500" />
                <span class="text-sm text-zinc-200 truncate">YouTube</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.soundcloud"
                :href="formatSocialUrl(selectedArtist.soundcloud, 'soundcloud')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-soundcloud" class="w-5 h-5 text-orange-400" />
                <span class="text-sm text-zinc-200 truncate">SoundCloud</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.bandcamp"
                :href="formatSocialUrl(selectedArtist.bandcamp, 'bandcamp')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-bandcamp" class="w-5 h-5 text-teal-400" />
                <span class="text-sm text-zinc-200 truncate">Bandcamp</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.twitter"
                :href="formatSocialUrl(selectedArtist.twitter, 'twitter')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-x" class="w-5 h-5 text-zinc-300" />
                <span class="text-sm text-zinc-200 truncate">{{ selectedArtist.twitter }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.tiktok"
                :href="formatSocialUrl(selectedArtist.tiktok, 'tiktok')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-tiktok" class="w-5 h-5 text-zinc-300" />
                <span class="text-sm text-zinc-200 truncate">{{ selectedArtist.tiktok }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.facebook"
                :href="formatSocialUrl(selectedArtist.facebook, 'facebook')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-facebook" class="w-5 h-5 text-blue-400" />
                <span class="text-sm text-zinc-200 truncate">Facebook</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
            </div>
          </div>

          <!-- No Social Links Warning -->
          <div v-else class="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-400" />
              <p class="text-sm text-yellow-200">No social links provided - verification may be difficult</p>
            </div>
          </div>

          <!-- Owner Info -->
          <div class="p-4 bg-zinc-800/50 rounded-lg">
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Submitted By</h4>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-zinc-200">{{ selectedArtist.owner?.display_name || selectedArtist.owner?.email || 'Unknown' }}</p>
                <p v-if="selectedArtist.owner?.display_name" class="text-sm text-zinc-500">{{ selectedArtist.owner?.email }}</p>
              </div>
              <p class="text-sm text-zinc-400">{{ formatDate(selectedArtist.created_at) }}</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton
              color="gray"
              variant="ghost"
              @click="showArtistDetailModal = false"
            >
              Close
            </UButton>
            <div v-if="selectedArtist.status === 'pending'" class="flex gap-2">
              <UButton
                color="red"
                variant="soft"
                @click="showArtistDetailModal = false; openRejectArtistModal(selectedArtist)"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 mr-1" />
                Reject
              </UButton>
              <UButton
                color="green"
                :loading="artistActionLoading"
                @click="approveArtist(selectedArtist); showArtistDetailModal = false"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
                Approve Artist
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { PendingArtist } from '~/types/admin'
import { artistApprovalsStatusOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'

const emit = defineEmits<{
  updatePendingCount: [count: number]
}>()

const { toast, formatDate, hasAnySocialLink, formatSocialUrl } = useAdminUtils()

// State
const pendingArtists = ref<PendingArtist[]>([])
const artistApprovalsLoading = ref(false)
const artistApprovalsStatusFilter = ref('pending')
const artistApprovalsStats = ref({
  total: 0,
  pending: 0,
  active: 0,
  rejected: 0,
})
const pendingArtistCount = ref(0)

// Reject modal
const showRejectArtistModal = ref(false)
const artistToReject = ref<PendingArtist | null>(null)
const rejectArtistReason = ref('')
const artistActionLoading = ref(false)

// Detail modal
const showArtistDetailModal = ref(false)
const selectedArtist = ref<PendingArtist | null>(null)

const loadArtistApprovals = async () => {
  artistApprovalsLoading.value = true
  try {
    const data = await $fetch<{
      bands: PendingArtist[]
      total: number
      pendingCount: number
      stats: typeof artistApprovalsStats.value
    }>('/api/admin/artist-approvals', {
      query: {
        status: artistApprovalsStatusFilter.value,
      },
    })

    pendingArtists.value = data.bands
    pendingArtistCount.value = data.pendingCount
    artistApprovalsStats.value = data.stats

    // Emit pending count for tab badge
    emit('updatePendingCount', data.pendingCount)
  } catch (e: any) {
    console.error('Failed to load artist approvals:', e)
    toast.add({
      title: 'Failed to load artist approvals',
      description: e.message,
      color: 'red',
    })
  } finally {
    artistApprovalsLoading.value = false
  }
}

const openArtistDetail = (artist: PendingArtist) => {
  selectedArtist.value = artist
  showArtistDetailModal.value = true
}

const openRejectArtistModal = (artist: PendingArtist) => {
  artistToReject.value = artist
  rejectArtistReason.value = ''
  showRejectArtistModal.value = true
}

const approveArtist = async (artist: PendingArtist) => {
  artistActionLoading.value = true
  try {
    await $fetch(`/api/admin/artist-approvals/${artist.id}/approve`, {
      method: 'POST',
    })

    toast.add({
      title: 'Artist Approved',
      description: `${artist.name} has been approved`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    // Reload the list
    await loadArtistApprovals()
  } catch (e: any) {
    console.error('Failed to approve artist:', e)
    toast.add({
      title: 'Failed to approve artist',
      description: e.message,
      color: 'red',
    })
  } finally {
    artistActionLoading.value = false
  }
}

const rejectArtist = async () => {
  if (!artistToReject.value || !rejectArtistReason.value.trim()) return

  artistActionLoading.value = true
  try {
    await $fetch(`/api/admin/artist-approvals/${artistToReject.value.id}/reject`, {
      method: 'POST',
      body: { reason: rejectArtistReason.value },
    })

    toast.add({
      title: 'Artist Rejected',
      description: `${artistToReject.value.name} has been rejected`,
      color: 'red',
      icon: 'i-heroicons-x-circle',
    })

    showRejectArtistModal.value = false
    artistToReject.value = null
    rejectArtistReason.value = ''

    // Reload the list
    await loadArtistApprovals()
  } catch (e: any) {
    console.error('Failed to reject artist:', e)
    toast.add({
      title: 'Failed to reject artist',
      description: e.message,
      color: 'red',
    })
  } finally {
    artistActionLoading.value = false
  }
}

onMounted(() => {
  loadArtistApprovals()
})
</script>
