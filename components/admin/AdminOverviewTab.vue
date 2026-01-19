<template>
  <div class="space-y-6">
    <!-- Platform Stats -->
    <div v-if="statsLoading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ formatNumber(stats.totalStreams) }}</p>
          <p class="text-sm text-zinc-400">Total Streams</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-violet-400">{{ stats.totalArtists }}</p>
          <p class="text-sm text-zinc-400">Artists</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-teal-400">{{ stats.totalTracks }}</p>
          <p class="text-sm text-zinc-400">Tracks</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-fuchsia-400">{{ stats.totalUsers }}</p>
          <p class="text-sm text-zinc-400">Users</p>
        </div>
      </UCard>
    </div>

    <!-- Platform Settings -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-zinc-100">Platform Settings</h2>
            <p class="text-sm text-zinc-400">Configure platform behavior</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Require Track Moderation -->
        <div class="flex items-center justify-between py-3 border-b border-zinc-800">
          <div>
            <p class="text-zinc-200 font-medium">Require Track Moderation</p>
            <p class="text-sm text-zinc-500">When enabled, only approved tracks are visible to users</p>
          </div>
          <UToggle
            v-model="platformSettings.requireTrackModeration"
            :loading="settingsLoading"
            @change="updateSetting('require_track_moderation', platformSettings.requireTrackModeration)"
          />
        </div>

        <!-- Info when moderation is disabled -->
        <div v-if="!platformSettings.requireTrackModeration" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div class="flex gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p class="text-sm text-yellow-200">
              Moderation is currently disabled. All uploaded tracks are immediately visible to users.
            </p>
          </div>
        </div>

        <!-- Info when moderation is enabled -->
        <div v-else class="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div class="flex gap-2">
            <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-green-500 flex-shrink-0" />
            <p class="text-sm text-green-200">
              Moderation is enabled. Only approved tracks are visible to users. Review pending tracks in the Track Moderation tab.
            </p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useAdminUtils } from '~/composables/useAdminUtils'

const { toast, formatNumber } = useAdminUtils()
const client = useSupabaseClient()

// Stats
const statsLoading = ref(true)
const stats = ref({
  totalStreams: 0,
  totalArtists: 0,
  totalTracks: 0,
  totalUsers: 0,
})

// Platform Settings
const settingsLoading = ref(false)
const platformSettings = ref({
  requireTrackModeration: false,
})

const loadStats = async () => {
  statsLoading.value = true
  try {
    const { count: streamCount } = await client
      .from('listening_history')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)

    const { count: artistCount } = await client
      .from('bands')
      .select('*', { count: 'exact', head: true })

    const { count: trackCount } = await client
      .from('tracks')
      .select('*', { count: 'exact', head: true })

    const { count: userCount } = await client
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    stats.value = {
      totalStreams: streamCount || 0,
      totalArtists: artistCount || 0,
      totalTracks: trackCount || 0,
      totalUsers: userCount || 0,
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  } finally {
    statsLoading.value = false
  }
}

const loadPlatformSettings = async () => {
  try {
    const data = await $fetch<Record<string, { value: any }>>('/api/admin/settings')
    platformSettings.value.requireTrackModeration = data.require_track_moderation?.value === true || data.require_track_moderation?.value === 'true'
  } catch (e: any) {
    console.error('Failed to load platform settings:', e)
  }
}

const updateSetting = async (key: string, value: any) => {
  settingsLoading.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PATCH',
      body: { key, value },
    })

    toast.add({
      title: 'Setting updated',
      description: key === 'require_track_moderation'
        ? (value ? 'Track moderation is now enabled' : 'Track moderation is now disabled')
        : 'Setting saved successfully',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Failed to update setting:', e)
    toast.add({
      title: 'Failed to update setting',
      description: e.message,
      color: 'red',
    })
    // Revert the toggle
    if (key === 'require_track_moderation') {
      platformSettings.value.requireTrackModeration = !value
    }
  } finally {
    settingsLoading.value = false
  }
}

onMounted(() => {
  loadStats()
  loadPlatformSettings()
})
</script>
